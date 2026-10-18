"use client";

import "@excalidraw/excalidraw/index.css";

import { CaptureUpdateAction, Excalidraw } from "@excalidraw/excalidraw";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { BinaryFileData, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ConnectionState, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

import { useWhiteboard } from "@/features/consultation-room/whiteboard/whiteboard-provider";

import { SESSION_ASSET_PATH } from "./session-asset-path";

const FIT_DEBOUNCE_MS = 300;

// A recording has no use for the editor's own chrome (menu, zoom, hints).
const HIDE_CHROME = `
  .excalidraw .main-menu-trigger,
  .excalidraw .layer-ui__wrapper__footer,
  .excalidraw .layer-ui__wrapper__top-right,
  .excalidraw .welcome-screen-center,
  .excalidraw .help-icon { display: none !important; }
`;

/**
 * The shared board as the session recorder sees it: read-only, no UI, always zoomed to fit the whole
 * drawing (the participants' own viewports differ, the recording needs one stable view). The scene is
 * kept by the always-mounted stage and handed in, so nothing is lost while Excalidraw is still loading.
 */
export default function RecorderBoard({
  elements,
  files,
}: {
  elements: readonly OrderedExcalidrawElement[];
  files: Readonly<Record<string, string>>;
}) {
  const { room, send } = useWhiteboard();
  const loadedFilesRef = useRef(new Set<string>());
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  // Excalidraw loads `initialData` asynchronously and resets the scene when it is done, which would erase an
  // `updateScene` made earlier. Its first `onChange` marks the end of that, so later updates wait for it.
  const [ready, setReady] = useState(false);
  const [initialElements] = useState(elements);
  const fitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleApi = useCallback((next: ExcalidrawImperativeAPI) => setApi(next), []);
  const handleChange = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!api || !ready) return;
    api.updateScene({ elements, captureUpdate: CaptureUpdateAction.NEVER });
    if (fitTimerRef.current) clearTimeout(fitTimerRef.current);
    fitTimerRef.current = setTimeout(() => {
      const live = elements.filter((element) => !element.isDeleted);
      if (live.length) api.scrollToContent(live, { fitToViewport: true, viewportZoomFactor: 0.9, animate: false });
    }, FIT_DEBOUNCE_MS);
    return () => {
      if (fitTimerRef.current) clearTimeout(fitTimerRef.current);
    };
  }, [api, ready, elements]);

  // Images dropped on the board: the recorder has no session cookie, so the URL carries the signed `rt` link the
  // backend issued at upload. Only this app's session-asset path is requested, so a crafted message cannot make
  // the recorder fetch from anywhere else.
  useEffect(() => {
    if (!api || !ready) return;
    for (const [fileId, src] of Object.entries(files)) {
      if (loadedFilesRef.current.has(fileId) || !SESSION_ASSET_PATH.test(src)) continue;
      loadedFilesRef.current.add(fileId);
      void (async () => {
        try {
          const response = await fetch(src);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          const dataURL = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error ?? new Error("read failed"));
            reader.readAsDataURL(blob);
          });
          const file: BinaryFileData = {
            id: fileId as BinaryFileData["id"],
            mimeType: blob.type as BinaryFileData["mimeType"],
            dataURL: dataURL as BinaryFileData["dataURL"],
            created: Date.now(),
          };
          api.addFiles([file]);
        } catch (error) {
          loadedFilesRef.current.delete(fileId);
          console.error("[recorder] board image failed", error);
        }
      })();
    }
  }, [api, ready, files]);

  // Ask the participants for the current board when joining late or reconnecting (best effort: a
  // recorder may not be allowed to publish, in which case their periodic snapshots cover it).
  useEffect(() => {
    const requestSync = () => {
      if (room.state === ConnectionState.Connected) send({ t: "sync-request" });
    };
    requestSync();
    room.on(RoomEvent.Reconnected, requestSync);
    return () => {
      room.off(RoomEvent.Reconnected, requestSync);
    };
  }, [room, send]);

  return (
    <div dir="ltr" className="relative size-full bg-white">
      <style>{HIDE_CHROME}</style>
      <Excalidraw
        excalidrawAPI={handleApi}
        onChange={handleChange}
        viewModeEnabled
        zenModeEnabled
        autoFocus={false}
        langCode="ar-SA"
        theme="light"
        initialData={{ elements: initialElements, appState: { viewBackgroundColor: "#ffffff" } }}
        UIOptions={{
          canvasActions: { export: false, loadScene: false, saveToActiveFile: false, saveAsImage: false, toggleTheme: false, changeViewBackgroundColor: false, clearCanvas: false },
        }}
      />
    </div>
  );
}
