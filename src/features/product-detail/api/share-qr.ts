import "server-only";

import QRCode from "qrcode";

/** A QR code as a square grid of modules: `cells[y * size + x] === "1"` is a dark module. */
export type QrMatrix = { size: number; cells: string };

/**
 * QR grid for a URL, computed on the server so the browser ships no QR library. Error-correction
 * level M survives a creased print or a slightly blurry phone photo.
 */
export function toQrMatrix(url: string): QrMatrix {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
  let cells = "";
  for (let index = 0; index < modules.size * modules.size; index++) cells += modules.data[index] ? "1" : "0";
  return { size: modules.size, cells };
}
