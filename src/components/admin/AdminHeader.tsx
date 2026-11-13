"use client";

import { Menu, ExternalLink } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  title: string;
  onOpenDrawer: () => void;
}

export function AdminHeader({ title, onOpenDrawer }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#14161a]/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      {/* Botón Hamburguesa Móvil (min touch target >= 44x44px) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDrawer}
          aria-label="Abrir menú de navegación"
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-gray-800/80 text-gray-200 hover:text-white border border-gray-700/60 active:scale-95 transition-transform"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 bg-amber-950 md:hidden flex-shrink-0">
            <img
              src="/logo-pio-pio.png"
              alt="Pío Pío"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-base font-extrabold text-white truncate max-w-[200px] sm:max-w-xs">
            {title}
          </h1>
        </div>
      </div>

      {/* Botón Ver Carta */}
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors min-h-[36px]"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Carta Clientes</span>
      </Link>
    </header>
  );
}
