"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      // Synchronize with the document class that was set by the anti-flash script
      const isLight = document.documentElement.classList.contains("light");
      const currentTheme = isLight ? "light" : "dark";
      setThemeState(currentTheme);
      applyTheme(currentTheme);
    } catch {
      applyTheme("dark");
    }
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("timett-theme", newTheme);
    } catch {}
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex size-8.5 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
      aria-label="Toggle theme"
    >
      <span className="relative size-4 flex items-center justify-center">
        <Sun className="absolute size-4 rotate-0 scale-100 text-amber-500 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 text-blue-400 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
      </span>
    </button>
  );
}
