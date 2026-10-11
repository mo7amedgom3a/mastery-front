/** Profile pictures the upload accepts (checked in the browser first, then by `/api/me/avatar`). */
export const AVATAR_TYPES: ReadonlySet<string> = new Set(["image/png", "image/jpeg", "image/webp"]);
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
