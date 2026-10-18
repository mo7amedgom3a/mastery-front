"use client";

import "@excalidraw/excalidraw/index.css";

import { Camera, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CaptureUpdateAction, Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  AppState,
  BinaryFileData,
  BinaryFiles,
  Collaborator,
  ExcalidrawImperativeAPI,
  SceneData,
} from "@excalidraw/excalidraw/types";
import { ConnectionState, RoomEvent, type RemoteParticipant } from "livekit-client";

import { SESSION_ASSET_MAX_BYTES, uploadSessionAsset } from "@/lib/api/consultations";

import { PRESENCE_TOPIC, presencePacket, type PresencePacket, type WhiteboardMessage } from "./protocol";
import { mergeRemoteElements } from "./scene";
import { useWhiteboard } from "./whiteboard-provider";

type BoardElement = OrderedExcalidrawElement;
type CollaboratorsMap = NonNullable<SceneData["collaborators"]>;
type StoredScene = { elements: BoardElement[]; files: Record<string, string> };
type SaveState = "idle" | "saving" | "saved" | "failed";

const FLUSH_MS = 50;
const PRESENCE_MS = 100;
// How often an open board re-broadcasts its whole scene for listeners that missed earlier changes.
const SNAPSHOT_BEACON_MS = 30_000;
// Lossy packets above this are dropped by LiveKit; a cursor update is far smaller.
const PRESENCE_MAX_BYTES = 12_000;
const STORAGE_PREFIX = "consultation-whiteboard";
// Keep the local copy well under the ~5 MB localStorage quota so a big board can't wedge the tab.
const PERSIST_MAX_CHARS = 3_500_000;
const COLORS = {
  expert: { background: "#dbeafe", stroke: "#2563eb" },
  customer: { background: "#ffedd5", stroke: "#ea580c" },
} as const;

// The scene lives here (not in the panel) so it survives the board being closed and reopened.
const sceneCache = new Map<string, StoredScene>();

function storageKey(bookingId: string) {
  return `${STORAGE_PREFIX}:${bookingId}`;
}

function loadScene(bookingId: string): StoredScene {
  const cached = sceneCache.get(bookingId);
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(storageKey(bookingId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredScene>;
      if (Array.isArray(parsed.elements)) return { elements: parsed.elements, files: parsed.files ?? {} };
    }
  } catch {
    // No saved copy (private mode, blocked storage or an outdated format): start empty.
  }
  return { elements: [], files: {} };
}

function saveScene(bookingId: string, scene: StoredScene) {
  sceneCache.set(bookingId, scene);
  try {
    const data = JSON.stringify(scene);
    if (data.length <= PERSIST_MAX_CHARS) window.localStorage.setItem(storageKey(bookingId), data);
  } catch {
    // Storage full or blocked: the in-memory copy still covers a close/reopen.
  }
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * The shared board (Excalidraw), synchronised over the LiveKit room itself (no extra server).
 * Loaded on demand so Excalidraw stays out of the room's first bundle.
 *
 * - Scene changes are batched every 50 ms and sent as `diff` text streams of the elements whose
 *   version increased; received elements are reconciled with the local scene.
 * - Images are uploaded to the session files; only the resulting same-origin URL travels.
 * - Cursors travel as lossy data packets; the board is also kept in this browser's localStorage.
 */
export default function WhiteboardPanel({ bookingId }: { bookingId: string }) {
  const { room, send, subscribe, close, notice, dismissNotice, announceSnapshot } = useWhiteboard();

  const identity = room.localParticipant.identity || "guest";
  const role = identity.startsWith("expert:") ? "expert" : "customer";

  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const sceneRef = useRef<readonly BoardElement[]>([]);
  const filesRef = useRef<Record<string, string>>({});
  const lastSentRef = useRef(new Map<string, number>());
  const pendingRef = useRef(new Map<string, BoardElement>());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceRef = useRef<{ pointer: { x: number; y: number; tool: "pointer" | "laser" }; button: "down" | "up" } | null>(null);
  const uploadedRef = useRef(new Set<string>());
  const loadedRef = useRef(new Set<string>());
  const firstChangeRef = useRef(true);

  const [initial] = useState<StoredScene>(() => loadScene(bookingId));
  const [collaborators, setCollaborators] = useState(() => new Map<string, Collaborator>());
  const [hasShapes, setHasShapes] = useState(() => initial.elements.some((element) => !element.isDeleted));
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Seed the working copies from the stored board once the component is mounted.
  useEffect(() => {
    sceneRef.current = initial.elements;
    filesRef.current = initial.files;
    for (const element of initial.elements) lastSentRef.current.set(element.id, element.version);
  }, [initial]);

  // --------------------------------------------------------------- outgoing edits
  const flush = useCallback(() => {
    flushTimerRef.current = null;
    if (!pendingRef.current.size) return;
    const elements = [...pendingRef.current.values()];
    pendingRef.current.clear();
    for (const element of elements) lastSentRef.current.set(element.id, element.version);
    send({ t: "diff", elements });
  }, [send]);

  // ------------------------------------------------------------ outgoing images
  const uploadImage = useCallback(
    async (fileId: string, dataURL: string) => {
      try {
        const blob = await (await fetch(dataURL)).blob();
        const { src } = await uploadSessionAsset(bookingId, blob, "board_image");
        filesRef.current = { ...filesRef.current, [fileId]: src };
        send({ t: "file", fileId, src });
      } catch (error) {
        uploadedRef.current.delete(fileId);
        console.error("[whiteboard] image upload failed", error);
      }
    },
    [bookingId, send],
  );

  const maybeUploadFiles = useCallback(
    (elements: readonly BoardElement[], files: BinaryFiles) => {
      for (const element of elements) {
        if (element.type !== "image" || element.isDeleted) continue;
        const fileId = element.fileId;
        if (!fileId || uploadedRef.current.has(fileId)) continue;
        const file = files[fileId];
        if (!file || typeof file.dataURL !== "string" || !file.dataURL.startsWith("data:")) continue;
        uploadedRef.current.add(fileId);
        void uploadImage(fileId, file.dataURL);
      }
    },
    [uploadImage],
  );

  const handleChange = useCallback(
    (elements: readonly OrderedExcalidrawElement[], _appState: AppState, files: BinaryFiles) => {
      sceneRef.current = elements;
      const first = firstChangeRef.current;
      firstChangeRef.current = false;
      for (const element of elements) {
        const last = lastSentRef.current.get(element.id);
        if (first) lastSentRef.current.set(element.id, element.version);
        else if (last === undefined || element.version > last) pendingRef.current.set(element.id, element);
      }
      if (pendingRef.current.size && flushTimerRef.current === null) flushTimerRef.current = setTimeout(flush, FLUSH_MS);
      const any = elements.some((element) => !element.isDeleted);
      setHasShapes((prev) => (prev === any ? prev : any));
      maybeUploadFiles(elements, files);
    },
    [flush, maybeUploadFiles],
  );

  // ------------------------------------------------------------ incoming scenes
  const applyRemote = useCallback((remote: BoardElement[]) => {
    const local = sceneRef.current;
    const next = mergeRemoteElements(local, remote, (apiRef.current?.getAppState() ?? {}) as AppState);
    if (!next) return;
    for (const element of next) lastSentRef.current.set(element.id, element.version);
    sceneRef.current = next;
    apiRef.current?.updateScene({ elements: next, captureUpdate: CaptureUpdateAction.NEVER });
  }, []);

  // ------------------------------------------------------------ incoming images
  const loadRemoteFile = useCallback(async (fileId: string, src: string) => {
    filesRef.current = { ...filesRef.current, [fileId]: src };
    if (loadedRef.current.has(fileId)) return;
    loadedRef.current.add(fileId);
    try {
      const blob = await (await fetch(src)).blob();
      const dataURL = await blobToDataURL(blob);
      const file: BinaryFileData = {
        id: fileId as BinaryFileData["id"],
        mimeType: blob.type as BinaryFileData["mimeType"],
        dataURL: dataURL as BinaryFileData["dataURL"],
        created: Date.now(),
      };
      apiRef.current?.addFiles([file]);
    } catch (error) {
      loadedRef.current.delete(fileId);
      console.error("[whiteboard] image load failed", error);
    }
  }, []);

  const handleAPI = useCallback(
    (next: ExcalidrawImperativeAPI) => {
      apiRef.current = next;
      for (const [fileId, src] of Object.entries(filesRef.current)) void loadRemoteFile(fileId, src);
    },
    [loadRemoteFile],
  );

  // ------------------------------------------------------------------ presence
  const handlePointerUpdate = useCallback(
    (payload: { pointer: { x: number; y: number; tool: "pointer" | "laser" }; button: "down" | "up" }) => {
      presenceRef.current = { pointer: payload.pointer, button: payload.button };
      if (presenceTimerRef.current !== null) return;
      presenceTimerRef.current = setTimeout(() => {
        presenceTimerRef.current = null;
        const latest = presenceRef.current;
        if (!latest) return;
        if (room.state !== ConnectionState.Connected || room.remoteParticipants.size === 0) return;
        const packet: PresencePacket = {
          id: identity,
          username: room.localParticipant.name || (role === "expert" ? "الخبير" : "العميل"),
          color: COLORS[role],
          pointer: latest.pointer,
          button: latest.button,
        };
        const bytes = new TextEncoder().encode(JSON.stringify(packet));
        if (bytes.byteLength > PRESENCE_MAX_BYTES) return;
        room.localParticipant.publishData(bytes, { reliable: false, topic: PRESENCE_TOPIC }).catch(() => {});
      }, PRESENCE_MS);
    },
    [room, identity, role],
  );

  const handleData = useCallback((payload: Uint8Array, participant?: RemoteParticipant, _kind?: unknown, topic?: string) => {
    if (topic !== PRESENCE_TOPIC || !participant) return;
    try {
      const parsed = presencePacket.safeParse(JSON.parse(new TextDecoder().decode(payload)));
      if (!parsed.success) return;
      const packet = parsed.data;
      setCollaborators((prev) => {
        const next = new Map(prev);
        next.set(participant.identity, {
          pointer: packet.pointer,
          button: packet.button,
          username: packet.username,
          color: packet.color,
          id: packet.id,
        });
        return next;
      });
    } catch {
      // Not a presence record: ignore.
    }
  }, []);

  // ------------------------------------------------- scene messages and lifecycle
  useEffect(() => {
    return subscribe((message: WhiteboardMessage) => {
      switch (message.t) {
        case "diff":
        case "snapshot":
          applyRemote(message.elements as unknown as BoardElement[]);
          break;
        case "file":
          void loadRemoteFile(message.fileId, message.src);
          break;
        case "sync-request":
          if (sceneRef.current.length) send({ t: "snapshot", elements: [...sceneRef.current] });
          for (const [fileId, src] of Object.entries(filesRef.current)) send({ t: "file", fileId, src });
          break;
        case "opened":
          // The other side just opened its board: pull whatever it has.
          send({ t: "sync-request" });
          break;
      }
    });
  }, [subscribe, send, applyRemote, loadRemoteFile]);

  useEffect(() => {
    const requestSync = () => send({ t: "sync-request" });
    const onParticipantConnected = () => requestSync();
    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      setCollaborators((prev) => {
        if (!prev.has(participant.identity)) return prev;
        const next = new Map(prev);
        next.delete(participant.identity);
        return next;
      });
    };
    requestSync();
    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.Reconnected, requestSync);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.Reconnected, requestSync);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    };
  }, [room, send, handleData]);

  // A hidden listener (the session recorder) is never announced to this side and may not be allowed to
  // ask for the board, so an open board re-sends its whole scene now and then; reconciling is idempotent.
  useEffect(() => {
    const timer = setInterval(() => {
      if (!sceneRef.current.length) return;
      send({ t: "snapshot", elements: [...sceneRef.current] });
      for (const [fileId, src] of Object.entries(filesRef.current)) send({ t: "file", fileId, src });
    }, SNAPSHOT_BEACON_MS);
    return () => clearInterval(timer);
  }, [send]);

  // ------------------------------------------------------- persistence and status
  useEffect(() => {
    const persist = () => saveScene(bookingId, { elements: [...sceneRef.current], files: filesRef.current });
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") persist();
    };
    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (presenceTimerRef.current) clearTimeout(presenceTimerRef.current);
      persist();
    };
  }, [bookingId]);

  useEffect(() => {
    apiRef.current?.updateScene({ collaborators: collaborators as CollaboratorsMap });
  }, [collaborators]);

  useEffect(() => {
    if (saveState !== "saved" && saveState !== "failed") return;
    const timer = setTimeout(() => setSaveState("idle"), 4_000);
    return () => clearTimeout(timer);
  }, [saveState]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismissNotice, 4_000);
    return () => clearTimeout(timer);
  }, [notice, dismissNotice]);

  const saveSnapshot = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;
    setSaveState("saving");
    try {
      const elements = api.getSceneElementsIncludingDeleted().filter((element) => !element.isDeleted);
      if (!elements.length) throw new Error("Nothing to save");
      const blob = await exportToBlob({
        elements,
        appState: { ...api.getAppState(), exportBackground: true, viewBackgroundColor: "#ffffff", exportWithDarkMode: false },
        files: api.getFiles(),
        mimeType: "image/png",
        quality: 1,
        exportPadding: 32,
        getDimensions: (width: number, height: number) => {
          const scale = Math.min(1, 2048 / Math.max(width, height));
          return { width: width * scale, height: height * scale };
        },
      });
      if (blob.size > SESSION_ASSET_MAX_BYTES) throw new Error("Snapshot too large");
      await uploadSessionAsset(bookingId, blob, "snapshot");
      announceSnapshot();
      setSaveState("saved");
    } catch (error) {
      console.error("[whiteboard] snapshot failed", error);
      setSaveState("failed");
    }
  }, [announceSnapshot, bookingId]);

  const status =
    saveState === "saved"
      ? "حُفظت اللقطة في ملفات الجلسة."
      : saveState === "failed"
        ? "تعذّر حفظ اللقطة. حاول مجدداً."
        : notice === "peer-snapshot"
          ? "حفظ الطرف الآخر لقطة من السبورة."
          : null;

  return (
    <section aria-label="السبورة المشتركة" className="flex h-full min-h-0 flex-col bg-white" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-strong px-3 py-2 text-sm">
        <div className="flex items-center gap-3">
          <span className="font-bold">السبورة المشتركة</span>
          <span role="status" aria-live="polite" className="text-xs text-fg-muted">
            {status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveSnapshot}
            disabled={!hasShapes || saveState === "saving"}
            className="ma-btn ma-btn--soft gap-2 disabled:opacity-50"
          >
            <Camera aria-hidden="true" className="size-4" />
            {saveState === "saving" ? "جارٍ الحفظ…" : "حفظ لقطة من السبورة"}
          </button>
          <button type="button" onClick={close} aria-label="إغلاق السبورة" className="ma-btn ma-btn--soft px-2">
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
      {/* Excalidraw lays itself out left-to-right and handles the Arabic UI itself. */}
      <div dir="ltr" className="relative min-h-0 flex-1">
        <Excalidraw
          excalidrawAPI={handleAPI}
          onChange={handleChange}
          onPointerUpdate={handlePointerUpdate}
          isCollaborating
          autoFocus={false}
          langCode="ar-SA"
          theme="light"
          initialData={{ elements: initial.elements, appState: { viewBackgroundColor: "#ffffff" } }}
          UIOptions={{
            canvasActions: { export: false, loadScene: false, saveToActiveFile: false, saveAsImage: false, toggleTheme: false },
          }}
        />
      </div>
    </section>
  );
}
