"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ChevronLeft, ChevronRight, Flame } from "lucide-react";

interface PublicHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  mesaNumber?: string | null;
  headerImages?: string[];
  headerTagline?: string;
  headerDescription?: string;
  // Mantenemos por retrocompatibilidad
  isSearching?: boolean;
  onToggleSearch?: () => void;
}

const DEFAULT_HEADER_IMAGES = [
  "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
];

export function PublicHeader({
  searchQuery,
  onSearchChange,
  mesaNumber,
  headerImages = [],
  headerTagline = "Asadero & Restaurante Tradicional",
  headerDescription = "El auténtico sabor a la brasa, broaster y platos típicos",
}: PublicHeaderProps) {
  const images = headerImages && headerImages.length > 0 ? headerImages : DEFAULT_HEADER_IMAGES;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Rotación automática cada 4.5 segundos
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [images.length, isPaused]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 6000);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 6000);
  };

  // Soporte de Swipe táctil en el carrusel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff < 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <header className="relative w-full bg-[#0f1115] border-b border-gray-800/80 pb-4">
      {/* ============================================================== */}
      {/* 1. CARRUSEL DE FOTOS HORIZONTALES (HERO CAROUSEL)              */}
      {/* ============================================================== */}
      <div
        className="relative w-full h-48 sm:h-56 bg-gray-950 overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides de Fotos */}
        {images.map((imgUrl, index) => (
          <div
            key={`${imgUrl}-${index}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
            }`}
          >
            <img
              src={imgUrl}
              alt={`Portada Pío Pío ${index + 1}`}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
            {/* Degradados cinemáticos para legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/40 to-black/50" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
          </div>
        ))}

        {/* Badges Flotantes Superiores */}
        <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/70 backdrop-blur-md text-amber-400 text-[10px] sm:text-xs font-black rounded-full border border-amber-500/30 shadow-lg">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>PÍO PÍO • CARTA DIGITAL</span>
          </span>

          {mesaNumber && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] sm:text-xs font-black rounded-full shadow-lg shadow-orange-500/30">
              📍 Mesa #{mesaNumber}
            </span>
          )}
        </div>

        {/* Flechas de Navegación del Carrusel (Visibles en Hover / Tablet) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all opacity-70 hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Siguiente foto"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all opacity-70 hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Indicadores de Puntos (Dots) del Carrusel */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlide(idx);
                  setIsPaused(true);
                  setTimeout(() => setIsPaused(false), 6000);
                }}
                aria-label={`Ir a foto ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentSlide
                    ? "w-5 h-2 bg-amber-400 shadow-sm shadow-amber-400"
                    : "w-2 h-2 bg-gray-400/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. IDENTIDAD DE MARCA (OPCIÓN 3: PERFIL GOURMET)              */}
      {/* ============================================================== */}
      <div className="max-w-2xl mx-auto px-4 -mt-10 sm:-mt-12 relative z-20 space-y-3.5">
        <div className="flex items-end gap-3.5 sm:gap-4">
          {/* Logo Oficial Grande de Pío Pío (80×80px) */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl shadow-black bg-amber-950 flex-shrink-0 p-1 group">
            <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-tr from-[#1b0903] via-[#2d1105] to-[#120601] flex items-center justify-center">
              <img
                src="/logo-pio-pio.png"
                alt="Pío Pío Asadero y Restaurante"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {/* Resplandor sutil dorado */}
            <div className="absolute -inset-0.5 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 blur pointer-events-none" />
          </div>

          {/* Nombre, Subtítulo y Estado */}
          <div className="min-w-0 pb-1 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
                Pío Pío
              </h1>
              <span className="hidden sm:inline-block bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                🟢 Abierto hoy
              </span>
            </div>

            <p className="text-xs sm:text-sm font-extrabold text-amber-400 tracking-wide uppercase mt-1 leading-snug truncate">
              {headerTagline}
            </p>

            <p className="text-[11px] sm:text-xs text-gray-400 line-clamp-1 mt-0.5">
              {headerDescription}
            </p>

            <div className="flex items-center gap-2 mt-1 sm:hidden">
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                🟢 Abierto hoy
              </span>
              <span className="text-[10px] text-gray-400">
                10:00 AM - 9:00 PM
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. BUSCADOR INTEGRADO AMPLIO (SIN MINI LUPA)                  */}
        {/* ============================================================== */}
        <div className="pt-1">
          <div className="relative w-full bg-[#181b20] border border-gray-800 hover:border-amber-500/40 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-2xl shadow-xl transition-all duration-300 flex items-center px-3.5 py-2.5">
            <Search className="w-4 h-4 text-amber-400 flex-shrink-0 mr-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="¿Qué se te antoja hoy? (pollo, asado, bebida...)"
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Limpiar búsqueda"
                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white active:scale-90 transition-all flex-shrink-0 ml-1.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
