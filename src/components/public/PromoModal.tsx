"use client";

import { useState, useEffect } from "react";
import { X, Flame, Tag, ArrowRight, ArrowLeft, Sparkles, Utensils, Heart } from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { PromoModalData } from "@/types";

interface PromoModalProps {
  promo: PromoModalData | null;
  onNavigateToDish?: (dishId: string) => void;
}

export function PromoModal({ promo, onNavigateToDish }: PromoModalProps) {
  // Inicializa activo en true si existe promo activa para que en SSR aparezca de inmediato
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (!promo || !promo.isActive) return false;
    return true;
  });

  // Paso activo: 1 = Bienvenida y Presentación, 2 = Promoción Especial del Día
  const [step, setStep] = useState<1 | 2>(1);

  // Estados para transiciones fluidas de salida y cambio de paso
  const [isClosing, setIsClosing] = useState(false);
  const [isStepFading, setIsStepFading] = useState(false);

  useEffect(() => {
    if (!promo || !promo.isActive) {
      setIsOpen(false);
      return;
    }

    if (promo.showOncePerSession) {
      try {
        const alreadySeen = sessionStorage.getItem("hasSeenPromoModal");
        if (alreadySeen) {
          setIsOpen(false);
          return;
        }
      } catch {}
    }
  }, [promo]);

  if (!isOpen || !promo || !promo.isActive) return null;

  // Cierre con animación suave de salida
  const triggerClose = () => {
    setIsClosing(true);
    if (promo.showOncePerSession) {
      try {
        sessionStorage.setItem("hasSeenPromoModal", "true");
      } catch {}
    }
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 280);
  };

  // Transición suave entre Paso 1 y Paso 2
  const goToStep = (newStep: 1 | 2) => {
    setIsStepFading(true);
    setTimeout(() => {
      setStep(newStep);
      setIsStepFading(false);
    }, 160);
  };

  // Acción al pulsar el botón CTA del plato promocional
  const handleCtaClick = () => {
    triggerClose();
    if (promo.targetDishId) {
      setTimeout(() => {
        if (onNavigateToDish) {
          onNavigateToDish(promo.targetDishId!);
        } else {
          const element = document.getElementById(`dish-${promo.targetDishId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("highlight-dish");
            setTimeout(() => {
              element.classList.remove("highlight-dish");
            }, 2000);
          }
        }
      }, 300);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300 ease-out ${
        isClosing ? "opacity-0 pointer-events-none" : "animate-modal-backdrop"
      }`}
      onClick={triggerClose}
    >
      <div
        className={`relative w-full max-w-sm overflow-hidden bg-[#181b20] border border-amber-500/35 rounded-3xl shadow-2xl shadow-black/90 transform transition-all duration-300 ease-out ${
          isClosing ? "scale-90 opacity-0 pointer-events-none" : "animate-modal-card"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar Global (X) */}
        <button
          onClick={triggerClose}
          aria-label="Cerrar modal"
          className="absolute top-3.5 right-3.5 z-30 flex items-center justify-center w-10 h-10 text-gray-300 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/90 hover:text-white border border-white/10 active:scale-95 transition-all shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Indicador de Pasos Superior */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
          <button
            type="button"
            onClick={() => goToStep(1)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              step === 1 ? "w-5 bg-amber-400 shadow-sm shadow-amber-400" : "bg-gray-600 hover:bg-gray-400"
            }`}
            aria-label="Ir a Bienvenida"
          />
          <button
            type="button"
            onClick={() => goToStep(2)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              step === 2 ? "w-5 bg-orange-500 shadow-sm shadow-orange-500" : "bg-gray-600 hover:bg-gray-400"
            }`}
            aria-label="Ir a Promoción del Día"
          />
          <span className="text-[10px] font-bold text-gray-300 ml-1">
            {step === 1 ? "Bienvenida" : "Promo del Día"}
          </span>
        </div>

        {/* ======================================================== */}
        {/* CONTENEDOR CON TRANSICIÓN SUAVE ENTRE PASO 1 Y PASO 2     */}
        {/* ======================================================== */}
        <div
          className={`transition-all duration-200 ease-in-out ${
            isStepFading ? "opacity-0 translate-y-2 scale-[0.97]" : "opacity-100 translate-y-0 scale-100"
          }`}
        >
          {/* ======================================================== */}
          {/* PASO 1: TARJETA DE PRESENTACIÓN Y BIENVENIDA             */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="flex flex-col text-center p-6 pt-12 space-y-4 bg-gradient-to-b from-amber-950/35 via-[#181b20] to-[#14161a]">
              {/* Logo Oficial Central con Anillo Dorado y Resplandor Animado */}
              <div className="relative mx-auto mt-2">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full blur-md opacity-50 animate-logo-glow" />
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-3 border-amber-400 bg-amber-950 shadow-2xl flex items-center justify-center animate-logo-glow">
                  <img
                    src="/logo-pio-pio.png"
                    alt="Pío Pío Asadero y Restaurante"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Títulos de Bienvenida */}
              <div className="space-y-1 animate-fade-in-up-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-[11px] font-extrabold text-amber-400 uppercase tracking-widest shadow-sm">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 animate-flame-wiggle" />
                  <span>{promo.welcomeBadge || "El Sabor Que Nos Une"}</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight leading-tight pt-1">
                  {promo.welcomeTitle || "¡Bienvenidos a Pío Pío!"}
                </h3>
                <span className="text-xs font-extrabold text-amber-500 uppercase tracking-wider block">
                  {promo.welcomeSubtitle || "Asadero & Restaurante Tradicional"}
                </span>
              </div>

              {/* Mensaje de Presentación y Especialidades */}
              <div className="space-y-3 animate-fade-in-up-2">
                <p className="text-xs text-gray-300 leading-relaxed px-1">
                  {promo.welcomeDescription ||
                    "Disfruta de nuestros auténticos pollos asados al carbón y apanados crocantes, jugosos cortes a la brasa y las recetas típicas más queridas de nuestra tierra."}
                </p>

                {/* Píldoras de Especialidades */}
                <div className="grid grid-cols-3 gap-2 py-1">
                  <div className="bg-[#14161a] border border-gray-800 rounded-xl p-2 text-center hover:border-amber-500/40 transition-colors">
                    <span className="text-[10px] font-bold text-gray-300 block">
                      {promo.welcomeTag1 || "Pollos"}
                    </span>
                    <span className="text-[9px] text-amber-400 font-medium">
                      {promo.welcomeTag1Sub || "Asado & Broaster"}
                    </span>
                  </div>
                  <div className="bg-[#14161a] border border-gray-800 rounded-xl p-2 text-center hover:border-orange-500/40 transition-colors">
                    <span className="text-[10px] font-bold text-gray-300 block">
                      {promo.welcomeTag2 || "Parrilla"}
                    </span>
                    <span className="text-[9px] text-orange-400 font-medium">
                      {promo.welcomeTag2Sub || "A la Brasa"}
                    </span>
                  </div>
                  <div className="bg-[#14161a] border border-gray-800 rounded-xl p-2 text-center hover:border-emerald-500/40 transition-colors">
                    <span className="text-[10px] font-bold text-gray-300 block">
                      {promo.welcomeTag3 || "Típicos"}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-medium">
                      {promo.welcomeTag3Sub || "Bandejas & Sopas"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón Siguiente (Ver Promo) y Botón Omitir */}
              <div className="space-y-2 pt-2 animate-fade-in-up-3">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 text-xs transition-all min-h-[46px] group"
                >
                  <Sparkles className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform" />
                  <span>{promo.welcomeButtonText || "Ver Oferta Especial de Hoy"}</span>
                  <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={triggerClose}
                  className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Ir directo a la carta
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 2: MODAL DE PROMOCIÓN DEL PLATO ESTRELLA            */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="flex flex-col animate-fade-in-up-1">
              {/* Imagen con Badge de Descuento */}
              <div className="relative w-full h-48 bg-gray-900">
                <img
                  src={promo.imageUrl}
                  alt={promo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181b20] via-transparent to-black/30" />
                {promo.badgeText && (
                  <div className="absolute top-12 left-3 bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-black tracking-wider uppercase px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    {promo.badgeText}
                  </div>
                )}
              </div>

              {/* Contenido de la Promoción */}
              <div className="p-5 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-orange-500 text-xs font-bold tracking-wide uppercase">
                    <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
                    <span>Recomendación Especial</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-[11px] font-bold text-gray-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver</span>
                  </button>
                </div>

                <h3 className="text-xl font-extrabold text-white leading-tight">
                  {promo.title}
                </h3>

                {promo.subtitle && (
                  <p className="text-sm font-medium text-orange-200/90 leading-snug">
                    {promo.subtitle}
                  </p>
                )}

                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                  {promo.description}
                </p>

                {/* Precios de Promoción */}
                {(promo.promoPrice || promo.regularPrice) && (
                  <div className="flex items-baseline gap-2.5 pt-1">
                    {promo.promoPrice && (
                      <span className="text-2xl font-black text-orange-400">
                        {formatPrice(promo.promoPrice)}
                      </span>
                    )}
                    {promo.regularPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(promo.regularPrice)}
                      </span>
                    )}
                  </div>
                )}

                {/* Botón CTA y Botón Ver Menú Completo */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCtaClick}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all min-h-[46px] text-xs"
                  >
                    <span>{promo.ctaText || "Ver en el Menú"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={triggerClose}
                    className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Ver toda la carta
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
