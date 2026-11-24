"use client";

import { Menu, ExternalLink } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  title: string;
  onOpenDrawer: () => void;
}

export function AdminHeader({ title, onOpenDrawer }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#14161a]/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between relative">
      {/* Botón Hamburguesa y Logo Móvil */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDrawer}
          aria-label="Abrir menú de navegación"
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-200 hover:text-white border border-gray-700/60 active:scale-90 transition-all duration-200 ease-out"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 bg-amber-950 md:hidden flex-shrink-0 shadow-sm">
          <img
            src="/logo-pio-pio.png"
            alt="Pío Pío"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Título de la Sección Centrado Horizontalmente y en Mayúsculas (Inmune a la Barra Rápida) */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none px-4 max-w-[calc(100%-180px)] sm:max-w-[calc(100%-240px)]">
        <h1 className="text-base sm:text-lg md:text-xl font-black tracking-widest text-white uppercase truncate text-center pointer-events-auto select-none">
          {title.toUpperCase()}
        </h1>
      </div>

      {/* Botón Ver Carta */}
      <Link
        href="/menu"
        target="_blank"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold active:scale-95 transition-all duration-300 ease-out min-h-[36px]"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Carta Clientes</span>
      </Link>
    </header>
  );
}
