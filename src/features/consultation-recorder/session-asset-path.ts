/** Board images are only ever fetched from this app's own session-asset route (with its signed `rt` link). */
export const SESSION_ASSET_PATH = /^\/api\/consultations\/[A-Za-z0-9-]{1,64}\/assets\/[A-Za-z0-9-]{1,64}(\?rt=[A-Za-z0-9._%~-]{1,200})?$/;
