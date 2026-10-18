"use client";

import "@livekit/components-styles";

import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { useState } from "react";

import { WhiteboardProvider } from "@/features/consultation-room/whiteboard/whiteboard-provider";

import { RecorderStage } from "./recorder-stage";

/** LiveKit's egress finalizes the recording when the page logs this. */
const END_RECORDING = "END_RECORDING";

type Params = { url: string | null; token: string | null };

function readParams(): Params {
  const query = new URLSearchParams(window.location.search);
  return { url: query.get("url"), token: query.get("token") };
}

/**
 * LiveKit egress opens this page in headless Chrome as `?url=<server>&token=<hidden recorder token>
 * &layout=<name>`, records what it renders, and mixes in the room's audio. The recorder is subscribe-only
 * and hidden, so participants never see it. With no token (someone opening the URL by hand) it renders nothing.
 */
export default function RecorderRoot() {
  const [{ url, token }] = useState(readParams);
  if (!url || !token) return null;
  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect
      audio={false}
      video={false}
      data-lk-theme="default"
      style={{ width: "100vw", height: "100vh" }}
      onDisconnected={() => console.log(END_RECORDING)}
      translate="no"
    >
      {/* The recording must show only the session: no browser "translate" bubble (Arabic page language), and no
          Next.js dev badge when this runs against `next dev`. */}
      <style>{"nextjs-portal { display: none !important; }"}</style>
      <RoomAudioRenderer />
      <WhiteboardProvider>
        <RecorderStage />
      </WhiteboardProvider>
    </LiveKitRoom>
  );
}
