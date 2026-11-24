"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronLeft, Zap } from "lucide-react";
import { AdminBarraView } from "@/components/admin/AdminBarraView";

export function AdminBarraDrawer() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

  // Consultar pedidos activos para el contador del badge en la franja
  const fetchBarraCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/barra");
      const json = await res.json();
      if (json.success && json.data?.activeOrders) {
        setPendingOrdersCount(json.data.activeOrders.length);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchBarraCount();
    const interval = setInterval(fetchBarraCount, 12000);
    return () => clearInterval(interval);
  }, [fetchBarraCount]);

  // Si estamos en la página dedicada de Barra, no mostrar el drawer deslizante duplicado
  if (pathname === "/admin/barra") {
    return null;
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FRANJA VERTICAL FIJA Y PANEL DESPLEGABLE (EXCLUSIVO ESCRITORIO MD+)    */}
      {/* ========================================================================= */}
      <div
        className={`hidden md:flex fixed left-64 top-0 bottom-0 z-40 items-stretch select-none pointer-events-none ${
          isOpen ? "pointer-events-auto" : ""
        }`}
      >
        {/* ======================================================================= */}
        {/* PANEL DESPLEGADO HACIA LA DERECHA (IMAGEN 02)                           */}
        {/* ======================================================================= */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto h-full bg-[#101217] border-r border-gray-800/80 flex shadow-2xl transition-all duration-300 overflow-hidden ${
            isOpen
              ? "w-[960px] max-w-[calc(100vw-54px)] opacity-100"
              : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          {isOpen && (
            <AdminBarraView isDrawer onClose={() => setIsOpen(false)} />
          )}
        </div>

        {/* ======================================================================= */}
        {/* FRANJA VERTICAL TÁCTIL (DISEÑO EXACTO DE IMÁGENES 01 Y 02)              */}
        {/* ======================================================================= */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="pointer-events-auto w-12 bg-gradient-to-b from-[#f59e0b] via-[#f97316] to-[#ea580c] hover:from-[#fbbf24] hover:to-[#f97316] text-black cursor-pointer flex flex-col items-center justify-between py-6 shadow-2xl rounded-r-3xl border-r-2 border-amber-300/40 transition-all active:scale-98 group"
          title={isOpen ? "Ocultar barra" : "Desplegar Barra Rápida hacia la derecha"}
        >
          {/* Badge superior: contador de pedidos pendientes */}
          <div className="w-6 h-6 rounded-full bg-[#7c2d12] text-amber-300 border border-amber-400/80 font-black text-[11px] flex items-center justify-center shadow">
            {pendingOrdersCount}
          </div>

          {/* Texto vertical: B A R R A */}
          <div className="flex flex-col items-center gap-1.5 font-black text-xs text-black/95 tracking-widest font-mono italic select-none">
            <span>B</span>
            <span>A</span>
            <span>R</span>
            <span>R</span>
            <span>A</span>
          </div>

          {/* Botón Central Circular con Flecha */}
          <div className="w-9 h-9 rounded-full bg-black text-[#f97316] border-2 border-[#ea580c] flex items-center justify-center font-black text-sm shadow-xl group-hover:scale-110 transition-transform">
            {isOpen ? <ChevronLeft className="w-5 h-5 stroke-[3]" /> : <ChevronRight className="w-5 h-5 stroke-[3]" />}
          </div>

          {/* Texto vertical: R A P I D A */}
          <div className="flex flex-col items-center gap-1.5 font-black text-xs text-black/95 tracking-widest font-mono italic select-none">
            <span>R</span>
            <span>A</span>
            <span>P</span>
            <span>I</span>
            <span>D</span>
            <span>A</span>
          </div>

          {/* Icono inferior: Rayo ⚡ */}
          <div className="w-6 h-6 rounded-full bg-black/25 flex items-center justify-center font-black text-xs shadow-inner">
            <Zap className="w-3.5 h-3.5 fill-black" />
          </div>
        </div>
      </div>

      {/* Backdrop oscuro cuando el drawer está expandido */}
      {isOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="hidden md:block fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 transition-opacity"
        />
      )}
    </>
  );
}
