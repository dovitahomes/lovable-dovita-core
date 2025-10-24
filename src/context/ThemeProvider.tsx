import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type ThemeContextValue = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void; };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("dovita:theme") as Theme | null;
    if (stored) return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("dovita:theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
