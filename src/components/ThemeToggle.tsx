import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    setIsAnimating(true);
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");

    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full hover:bg-violet-100 dark:hover:bg-violet-950/30 transition-all duration-300 group relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/10 group-hover:to-purple-500/10 dark:group-hover:from-violet-500/20 dark:group-hover:to-purple-500/20 transition-all duration-300 rounded-full" />
      <div className={`relative transition-transform duration-300 ${isAnimating ? 'rotate-180 scale-110' : ''}`}>
        {theme === "light" ? (
          <Moon className="h-5 w-5 text-gray-700 group-hover:text-violet-600 transition-colors" />
        ) : (
          <Sun className="h-5 w-5 text-gray-300 group-hover:text-violet-400 transition-colors" />
        )}
      </div>
    </Button>
  );
};
