export const THEME_STORAGE_KEY = "ma-theme";
export type Theme = "light" | "dark";

/**
 * Runs before first paint and applies the saved theme, so a light-mode visitor never sees a dark
 * flash. With no saved choice the server-rendered default (dark, the brand look) stays.
 */
const script = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
