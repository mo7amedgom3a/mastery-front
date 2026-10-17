/**
 * A QR code as a square grid of modules: `cells[y * size + x] === "1"` is a dark module.
 *
 * Kept in its own client-safe module so presentational components can take a precomputed matrix as a
 * prop without importing the server-only QR encoder (`api/share-qr.ts`).
 */
export type QrMatrix = { size: number; cells: string };
