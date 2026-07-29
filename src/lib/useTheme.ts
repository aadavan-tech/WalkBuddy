import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "walkbuddy_theme";

/**
 * App-wide light/dark theme.
 *
 * The theme is written to `<html data-theme="...">`; index.css remaps the
 * hardcoded dark palette under `:root[data-theme="light"]`. Shared by the
 * dashboard and the onboarding flow so the toggle works on every screen.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme) || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return [theme, toggle];
}
