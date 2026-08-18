"use client";

import * as React from "react";
import { Sun, Moon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="relative h-8 gap-1.5 rounded-xl border border-border bg-card/60 backdrop-blur-md px-2.5 text-xs font-semibold text-foreground transition-all duration-300 hover:border-[#4C1D95]/40 dark:hover:border-[#8B5CF6]/40 hover:bg-card/90 cursor-pointer"
      aria-label="Toggle theme"
    >
      <div className="relative size-4">
        <Sun className="absolute inset-0 size-4 rotate-0 scale-100 text-amber-500 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute inset-0 size-4 rotate-90 scale-0 text-violet-400 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
      </div>
      <span className="hidden sm:inline capitalize font-mono text-[11px] text-muted-foreground">
        {theme}
      </span>
    </Button>
  );
}
