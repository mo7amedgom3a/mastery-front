/**
 * Where to go after signing in: the `?next=` value when it is a path on this site, else home.
 * Anything that could leave the site (`//host`, `/\host`, a scheme, control characters) is dropped,
 * so a crafted link can't use the sign-in page to send someone elsewhere.
 */
export function safeNextPath(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || path.length > 2048) return "/";
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  // Backslashes are read as slashes by browsers; control characters are stripped by them.
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return "/";
  // Signed in already: the auth pages would only bounce them back.
  if (/^\/(login|register)(?:[/?#]|$)/.test(path)) return "/";
  return path;
}
