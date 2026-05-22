// src/contexts/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("ui-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    // Tailwind v4 uses class on <html>
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("ui-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
