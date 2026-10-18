"use client";

import { ParticipantTile, useTracks, type TrackReferenceOrPlaceholder } from "@livekit/components-react";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState } from "@excalidraw/excalidraw/types";
import { RoomEvent, Track } from "livekit-client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import type { WhiteboardMessage } from "@/features/consultation-room/whiteboard/protocol";
import { mergeRemoteElements } from "@/features/consultation-room/whiteboard/scene";
import { useWhiteboard } from "@/features/consultation-room/whiteboard/whiteboard-provider";

// Excalidraw is heavy: it loads only once the board is actually in use.
const RecorderBoard = dynamic(() => import("./recorder-board"), { ssr: false });

/** LiveKit's egress starts recording when the page logs this. */
export const START_RECORDING = "START_RECORDING";

/**
 * Which participants currently have the shared board open. Newer clients announce `visibility`; for
 * older ones any board traffic counts as "in use" until a `visibility` message has been seen.
 */
function useBoardOpen(): boolean {
  const { room, subscribe } = useWhiteboard();
  const [openBy, setOpenBy] = useState<Record<string, boolean>>({});
  const [legacyActive, setLegacyActive] = useState(false);
  const [sawVisibility, setSawVisibility] = useState(false);

  useEffect(
    () =>
      subscribe((message: WhiteboardMessage, from: string) => {
        if (message.t === "visibility") {
          setSawVisibility(true);
          setOpenBy((prev) => (prev[from] === message.open ? prev : { ...prev, [from]: message.open }));
        } else if (message.t === "opened" || message.t === "diff" || message.t === "snapshot") {
          setLegacyActive(true);
        }
      }),
    [subscribe],
  );

  useEffect(() => {
    const onLeft = (participant: { identity: string }) =>
      setOpenBy((prev) => {
        if (!(participant.identity in prev)) return prev;
        return Object.fromEntries(Object.entries(prev).filter(([identity]) => identity !== participant.identity));
      });
    room.on(RoomEvent.ParticipantDisconnected, onLeft);
    return () => {
      room.off(RoomEvent.ParticipantDisconnected, onLeft);
    };
  }, [room]);

  return Object.values(openBy).some(Boolean) || (!sawVisibility && legacyActive);
}

/**
 * The board's elements, kept for as long as the page lives. It subscribes from the first moment so
 * nothing the participants draw is lost while the editor itself is still being loaded.
 */
function useRecorderScene(): { elements: readonly OrderedExcalidrawElement[]; files: Readonly<Record<string, string>> } {
  const { subscribe } = useWhiteboard();
  const [elements, setElements] = useState<readonly OrderedExcalidrawElement[]>([]);
  // fileId -> the session-asset URL of an image dropped on the board.
  const [files, setFiles] = useState<Readonly<Record<string, string>>>({});
  useEffect(
    () =>
      subscribe((message: WhiteboardMessage) => {
        if (message.t === "file") {
          setFiles((previous) => (previous[message.fileId] === message.src ? previous : { ...previous, [message.fileId]: message.src }));
        } else if (message.t === "diff" || message.t === "snapshot") {
          const remote = message.elements as unknown as OrderedExcalidrawElement[];
          setElements((previous) => mergeRemoteElements(previous, remote, {} as AppState) ?? previous);
        }
      }),
    [subscribe],
  );
  return { elements, files };
}

function Tile({ trackRef, className }: { trackRef: TrackReferenceOrPlaceholder; className?: string }) {
  return <ParticipantTile trackRef={trackRef} className={className} disableSpeakingIndicator />;
}

/**
 * The picture that gets recorded (a 16:9 page, no controls). Plain grid of the two people; when a
 * board is open it takes the large area with the camera tiles in a strip beside it; a screen share
 * takes the large area when there is no board.
 */
export function RecorderStage() {
  const boardOpen = useBoardOpen();
  const { elements, files } = useRecorderScene();
  const cameras = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]).filter((t) => !t.participant.isLocal);
  const shares = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]).filter((t) => !t.participant.isLocal);

  // The page is ready as soon as the room is joined and a first frame has been laid out. Egress
  // finalizes the file on END_RECORDING, which the root logs when the room disconnects.
  useEffect(() => {
    const timer = setTimeout(() => console.log(START_RECORDING), 1_000);
    return () => clearTimeout(timer);
  }, []);

  const share = shares[0];
  if (boardOpen) {
    const strip = share ? [...cameras, share] : cameras;
    return (
      <div className="grid size-full grid-cols-[1fr_22%] gap-2 bg-neutral-900 p-2">
        <div className="min-h-0 overflow-hidden rounded-lg bg-white">
          <RecorderBoard elements={elements} files={files} />
        </div>
        <div className="flex min-h-0 flex-col gap-2">
          {strip.map((trackRef) => (
            <Tile key={`${trackRef.participant.identity}-${trackRef.source}`} trackRef={trackRef} className="min-h-0 flex-1 overflow-hidden rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  if (share) {
    return (
      <div className="grid size-full grid-cols-[1fr_22%] gap-2 bg-neutral-900 p-2">
        <Tile trackRef={share} className="min-h-0 overflow-hidden rounded-lg" />
        <div className="flex min-h-0 flex-col gap-2">
          {cameras.map((trackRef) => (
            <Tile key={trackRef.participant.identity} trackRef={trackRef} className="min-h-0 flex-1 overflow-hidden rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="grid size-full grid-cols-2 gap-2 bg-neutral-900 p-2">
      {cameras.map((trackRef) => (
        <Tile key={trackRef.participant.identity} trackRef={trackRef} className="min-h-0 overflow-hidden rounded-lg" />
      ))}
    </div>
  );
}
