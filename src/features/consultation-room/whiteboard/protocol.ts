import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { z } from "zod";

/** LiveKit text-stream topic for board changes (separate from the server's `consultation` topic). */
export const WHITEBOARD_TOPIC = "whiteboard";
/** Lossy data-packet topic for live cursors: frequent, small, fine to drop. */
export const PRESENCE_TOPIC = "whiteboard-presence";

// Only the shape is checked here; restoreElements/reconcileElements validate each element when the
// scene is applied.
const element = z.custom<ExcalidrawElement>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { type?: unknown }).type === "string" &&
    typeof (value as { version?: unknown }).version === "number",
);

/** Messages between the two participants' boards. */
export const whiteboardMessage = z.discriminatedUnion("t", [
  // Elements changed by the sender since its last message.
  z.object({ t: z.literal("diff"), elements: z.array(element) }),
  // "Send me your board": when the board is opened, or after a reconnect.
  z.object({ t: z.literal("sync-request") }),
  // The sender's whole board, in answer to a sync request.
  z.object({ t: z.literal("snapshot"), elements: z.array(element) }),
  // An image the sender saved to the session files; the bytes are fetched from `src`.
  z.object({ t: z.literal("file"), fileId: z.string(), src: z.string() }),
  // The sender opened the board: offer it to the other participant.
  z.object({ t: z.literal("opened") }),
  // The sender saved a snapshot to the session files.
  z.object({ t: z.literal("snapshot-saved") }),
  // The sender's board is now open or closed. The session recorder follows this to lay out its video.
  z.object({ t: z.literal("visibility"), open: z.boolean() }),
]);

export type WhiteboardMessage = z.infer<typeof whiteboardMessage>;

export function parseWhiteboardMessage(text: string): WhiteboardMessage | null {
  try {
    const parsed = whiteboardMessage.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** A collaborator's live cursor, sent as a lossy data packet. */
export const presencePacket = z.object({
  id: z.string(),
  username: z.string(),
  color: z.object({ background: z.string(), stroke: z.string() }),
  pointer: z.object({ x: z.number(), y: z.number(), tool: z.enum(["pointer", "laser"]) }),
  button: z.enum(["down", "up"]),
});

export type PresencePacket = z.infer<typeof presencePacket>;
