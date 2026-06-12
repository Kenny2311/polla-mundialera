"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 lg:px-6 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="flex items-baseline gap-3">
        <span className="font-label text-xs tracking-[0.12em] uppercase text-faint">
          Quiniela Mundialera · Piso 12
        </span>
        <span className="font-body text-xs italic text-flesan-red opacity-80">powered by FGIEO</span>
      </div>

      <div className="flex-1" />

      <ThemeToggle />
    </header>
  );
}
