import { reconcileElements, restoreElements } from "@excalidraw/excalidraw";
import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState } from "@excalidraw/excalidraw/types";

/**
 * The scene after applying a peer's elements to the local ones, or `null` when an element isn't
 * accepted (the whole batch is skipped rather than breaking the board). Shared by the live panel and
 * the read-only session recorder so both converge on the same scene.
 */
export function mergeRemoteElements(
  local: readonly OrderedExcalidrawElement[],
  remote: OrderedExcalidrawElement[],
  appState: AppState,
): OrderedExcalidrawElement[] | null {
  try {
    const restored = restoreElements(remote, local) as unknown as RemoteExcalidrawElement[];
    return reconcileElements(local, restored, appState) as unknown as OrderedExcalidrawElement[];
  } catch (error) {
    console.error("[whiteboard] could not apply remote changes", error);
    return null;
  }
}
