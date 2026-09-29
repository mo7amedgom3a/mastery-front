import type { QrMatrix } from "../api/share-qr";

/** Blank modules around the code; scanners need a quiet zone to find it. */
const QUIET_ZONE = 2;

/** One SVG path for every dark module: crisp at any size, and printable. */
export function qrPath({ size, cells }: QrMatrix): string {
  let path = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (cells[y * size + x] === "1") path += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`;
    }
  }
  return path;
}

/** Standalone SVG markup, for downloading the code as a file. */
export function qrSvgMarkup(matrix: QrMatrix): string {
  const box = matrix.size + QUIET_ZONE * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" width="${box * 10}" height="${box * 10}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${qrPath(matrix)}" fill="#000"/></svg>`;
}

/** Always black on white, whatever the theme: inverted codes fail on many scanners. */
export function QrCode({ matrix, label, className }: { matrix: QrMatrix; label: string; className?: string }) {
  const box = matrix.size + QUIET_ZONE * 2;
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${box} ${box}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={box} height={box} fill="#fff" />
      <path d={qrPath(matrix)} fill="#000" />
    </svg>
  );
}
