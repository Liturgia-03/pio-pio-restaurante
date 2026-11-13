"use client";

import { Search, X } from "lucide-react";

interface PublicHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearching: boolean;
  onToggleSearch: () => void;
}

export function PublicHeader({
  searchQuery,
  onSearchChange,
  isSearching,
  onToggleSearch,
}: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#0f1115]/95 backdrop-blur-md border-b border-gray-800/80 px-4 py-3">
      <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto">
        {/* Brand / Logo Oficial Pío Pío */}
        {!isSearching ? (
          <div className="flex items-center gap-2.5">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400 shadow-lg shadow-amber-500/20 bg-amber-950 flex-shrink-0">
              <img
                src="/logo-pio-pio.png"
                alt="Pío Pío Asadero y Restaurante"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-none">
                Pío Pío
              </h1>
              <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                Asadero y Restaurante
              </span>
            </div>
          </div>
        ) : (
          <div className="relative flex-1 animate-in fade-in zoom-in-95 duration-200">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar pollo, bandeja, asado, bebida..."
              className="w-full bg-[#181b20] border border-amber-500/50 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Botón Lupa / Cerrar Búsqueda */}
        <button
          onClick={onToggleSearch}
          aria-label={isSearching ? "Cerrar búsqueda" : "Buscar platos"}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#181b20] border border-gray-800 text-gray-300 hover:text-white hover:border-amber-500/50 active:scale-95 transition-all"
        >
          {isSearching ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
