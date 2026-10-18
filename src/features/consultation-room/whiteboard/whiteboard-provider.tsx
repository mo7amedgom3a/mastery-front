"use client";

import { useRoomContext } from "@livekit/components-react";
import { ConnectionState, type Room } from "livekit-client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { parseWhiteboardMessage, WHITEBOARD_TOPIC, type WhiteboardMessage } from "./protocol";

const VISIBILITY_BEACON_MS = 10_000;

type Notice = "peer-snapshot" | null;

type WhiteboardMessageHandler = (message: WhiteboardMessage, from: string) => void;

type WhiteboardContextValue = {
  room: Room;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** The other participant opened the board while this one had it closed. */
  peerOpened: boolean;
  /** Something the other participant did that is worth a short message. */
  notice: Notice;
  dismissNotice: () => void;
  /** Tells the other participant a snapshot was just saved. */
  announceSnapshot: () => void;
  /** Ordered, queued send over the LiveKit text stream. */
  send: (message: WhiteboardMessage) => void;
  /** Subscribe to board-scene messages (diff, snapshot, file, sync-request). */
  subscribe: (handler: WhiteboardMessageHandler) => () => void;
};

const WhiteboardContext = createContext<WhiteboardContextValue | null>(null);

export function useWhiteboard(): WhiteboardContextValue {
  const value = useContext(WhiteboardContext);
  if (!value) throw new Error("useWhiteboard must be used inside <WhiteboardProvider>");
  return value;
}

/** Sends messages one after another so the other side applies them in order. */
function createSender(room: Room) {
  let queue: Promise<unknown> = Promise.resolve();
  return (message: WhiteboardMessage) => {
    queue = queue
      .then(() => {
        if (room.state !== ConnectionState.Connected || room.remoteParticipants.size === 0) return;
        return room.localParticipant.sendText(JSON.stringify(message), { topic: WHITEBOARD_TOPIC });
      })
      .catch((error: unknown) => console.warn("[whiteboard] send failed", error));
  };
}

/**
 * Owns the board's LiveKit channel and its open/closed state. Deliberately free of the drawing
 * library: the editor itself is loaded on demand by <WhiteboardPanel>, which subscribes here.
 *
 * Mounted once inside <LiveKitRoom> so "the other side opened the board" is noticed even when this
 * side's board is closed. The scene itself only syncs while the board is open; opening it asks the
 * other side for the current board (`sync-request`).
 */
export function WhiteboardProvider({ children }: { children: ReactNode }) {
  const room = useRoomContext();
  const [isOpen, setIsOpen] = useState(false);
  const [peerOpened, setPeerOpened] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const handlersRef = useRef(new Set<WhiteboardMessageHandler>());
  const isOpenRef = useRef(false);

  const send = useMemo(() => createSender(room), [room]);

  useEffect(() => {
    room.registerTextStreamHandler(WHITEBOARD_TOPIC, (reader, { identity }) => {
      // Applied in arrival order even when a large message takes longer to download.
      void reader
        .readAll()
        .then((text) => {
          const message = parseWhiteboardMessage(text);
          if (!message) return;
          if (message.t === "opened") setPeerOpened(true);
          else if (message.t === "snapshot-saved") setNotice("peer-snapshot");
          // A joiner (e.g. the session recorder) asks what is on screen: say whether this board is open.
          else if (message.t === "sync-request" && isOpenRef.current) send({ t: "visibility", open: true });
          for (const handler of handlersRef.current) handler(message, identity);
        })
        .catch((error: unknown) => console.warn("[whiteboard] receive failed", error));
    });
    return () => room.unregisterTextStreamHandler(WHITEBOARD_TOPIC);
  }, [room, send]);

  // Hidden listeners (the session recorder) are never announced to this side, so an open board keeps
  // saying so; the recorder lays out its video from it.
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => send({ t: "visibility", open: true }), VISIBILITY_BEACON_MS);
    return () => clearInterval(timer);
  }, [isOpen, send]);

  const subscribe = useCallback((handler: WhiteboardMessageHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const open = useCallback(() => {
    isOpenRef.current = true;
    setIsOpen(true);
    setPeerOpened(false);
    send({ t: "opened" });
    send({ t: "visibility", open: true });
  }, [send]);
  const close = useCallback(() => {
    isOpenRef.current = false;
    setIsOpen(false);
    send({ t: "visibility", open: false });
  }, [send]);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const announceSnapshot = useCallback(() => send({ t: "snapshot-saved" }), [send]);

  const value = useMemo<WhiteboardContextValue>(
    () => ({
      room,
      isOpen,
      open,
      close,
      peerOpened: peerOpened && !isOpen,
      notice,
      dismissNotice,
      announceSnapshot,
      send,
      subscribe,
    }),
    [room, isOpen, open, close, peerOpened, notice, dismissNotice, announceSnapshot, send, subscribe],
  );
  return <WhiteboardContext.Provider value={value}>{children}</WhiteboardContext.Provider>;
}
