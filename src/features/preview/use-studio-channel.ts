"use client";

import { useEffect, useRef } from "react";

/** A message from the admin that frames a `/preview/*` page. */
export type StudioMessage = { source: "mastery-studio"; type: string } & Record<string, unknown>;

/**
 * The handshake every `/preview/*` page shares with the admin that frames it: announce `ready` until the first
 * render arrives, and pass on only messages from that parent (the framing itself is limited by `frame-ancestors`
 * in next.config.ts).
 */
export function useStudioChannel(onMessage: (message: StudioMessage) => void) {
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    // The admin that frames this page: Chrome lists its origin, otherwise the referrer names it.
    const referrer = document.referrer ? new URL(document.referrer).origin : null;
    const parentOrigin = window.location.ancestorOrigins?.[0] ?? referrer ?? "*";
    const sendReady = () => {
      window.parent?.postMessage({ source: "mastery-preview", type: "ready" }, parentOrigin);
    };

    // Announce quickly at first, then slowly, until the admin's first render arrives: an admin that loads its
    // data late (or remounts its frame) must still get the handshake.
    sendReady();
    let interval = setInterval(sendReady, 600);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      interval = setInterval(sendReady, 2000);
    }, 6000);

    const listener = (event: MessageEvent) => {
      // Only the framing admin may drive the preview.
      if (event.source !== window.parent || event.data?.source !== "mastery-studio") return;
      if (parentOrigin !== "*" && event.origin !== parentOrigin) return;
      if (event.data.type === "render") {
        clearTimeout(timeout);
        clearInterval(interval);
      }
      handler.current(event.data as StudioMessage);
    };

    window.addEventListener("message", listener);
    return () => {
      window.removeEventListener("message", listener);
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);
}
