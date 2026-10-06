"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getTheme, setTheme } from "@/lib/theme";

export function ThemeToggle() {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Ganti tema terang/gelap"
      title="Ganti tema terang/gelap"
      onClick={() => setTheme(getTheme() === "dark" ? "light" : "dark")}
    >
      {/* Icons switch via CSS so server and client markup always match. */}
      <Sun className="dark:hidden" aria-hidden />
      <Moon className="hidden dark:block" aria-hidden />
    </Button>
  );
}
