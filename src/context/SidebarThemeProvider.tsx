import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type SidebarTheme = "light" | "dark";
type SidebarThemeContextValue = { 
  sidebarTheme: SidebarTheme; 
  setSidebarTheme: (t: SidebarTheme) => void; 
  toggleSidebarTheme: () => void; 
};

const SidebarThemeContext = createContext<SidebarThemeContextValue | null>(null);

export const SidebarThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [sidebarTheme, setSidebarTheme] = useState<SidebarTheme>(() => {
    const stored = localStorage.getItem("dovita:sidebar-theme") as SidebarTheme | null;
    return stored || "dark";
  });

  useEffect(() => {
    localStorage.setItem("dovita:sidebar-theme", sidebarTheme);
  }, [sidebarTheme]);

  const value = useMemo(
    () => ({ 
      sidebarTheme, 
      setSidebarTheme, 
      toggleSidebarTheme: () => setSidebarTheme(sidebarTheme === "dark" ? "light" : "dark") 
    }), 
    [sidebarTheme]
  );

  return <SidebarThemeContext.Provider value={value}>{children}</SidebarThemeContext.Provider>;
};

export const useSidebarTheme = () => {
  const ctx = useContext(SidebarThemeContext);
  if (!ctx) throw new Error("useSidebarTheme must be used within SidebarThemeProvider");
  return ctx;
};
