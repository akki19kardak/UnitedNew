import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const ThemeToggle = ({ className = "" }) => {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50
        ${dark ? "bg-primary/20 border border-primary/30" : "bg-slate-200 border border-slate-300"}
        ${className}`}
    >
      {/* Track */}
      <span
        className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all duration-300
          ${dark ? "translate-x-7 bg-primary" : "translate-x-0 bg-white"}`}
      >
        {dark
          ? <Moon className="w-3 h-3 text-background-dark" />
          : <Sun  className="w-3 h-3 text-amber-500" />}
      </span>
    </button>
  );
};

export default ThemeToggle;
