import "server-only";

import QRCode from "qrcode";

import type { QrMatrix } from "../model/qr";

export type { QrMatrix } from "../model/qr";

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
