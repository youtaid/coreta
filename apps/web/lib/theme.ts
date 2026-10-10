export const THEME_STORAGE_KEY = "coreta-theme";

export type Theme = "light" | "dark";

/**
 * Runs before first paint (inlined in <head> by the root layout) so the page never
 * flashes the wrong theme. A stored choice wins; otherwise follow the OS setting,
 * including live changes.
 */
export const themeInitScript = `(function () {
  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");
  function stored() {
    try {
      var value = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
      return value === "light" || value === "dark" ? value : null;
    } catch (error) {
      return null;
    }
  }
  function apply(theme) {
    root.classList.toggle("dark", theme === "dark");
  }
  apply(stored() || (media.matches ? "dark" : "light"));
  media.addEventListener("change", function (event) {
    if (!stored()) apply(event.matches ? "dark" : "light");
  });
})();`;

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked (private mode); the choice then lasts for this page view only.
  }
}
