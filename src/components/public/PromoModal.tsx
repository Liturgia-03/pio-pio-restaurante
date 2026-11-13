"use client";

import { useState, useEffect } from "react";
import { X, Flame, Tag, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { PromoModalData } from "@/types";

interface PromoModalProps {
  promo: PromoModalData | null;
  onNavigateToDish?: (dishId: string) => void;
}

export function PromoModal({ promo, onNavigateToDish }: PromoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!promo || !promo.isActive) return;

    if (promo.showOncePerSession) {
      const alreadySeen = sessionStorage.getItem("hasSeenPromoModal");
      if (alreadySeen) return;
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
      if (promo.showOncePerSession) {
        sessionStorage.setItem("hasSeenPromoModal", "true");
      }
    }, promo.autoShowDelayMs || 800);

    return () => clearTimeout(timer);
  }, [promo]);

  if (!isOpen || !promo) return null;

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCtaClick = () => {
    setIsOpen(false);
    if (promo.targetDishId) {
      if (onNavigateToDish) {
        onNavigateToDish(promo.targetDishId);
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
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden bg-[#181b20] border border-orange-500/30 rounded-3xl shadow-2xl shadow-orange-950/40 transform transition-all duration-300 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar (touch target >= 44x44px) */}
        <button
          onClick={handleClose}
          aria-label="Cerrar modal promocional"
          className="absolute top-3 right-3 z-20 flex items-center justify-center w-11 h-11 text-gray-200 bg-black/60 rounded-full hover:bg-black/80 active:scale-95 transition-transform"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Imagen con Badge de descuento */}
        <div className="relative w-full h-48 bg-gray-900">
          <img
            src={promo.imageUrl}
            alt={promo.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181b20] via-transparent to-black/30" />
          {promo.badgeText && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-black tracking-wider uppercase px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {promo.badgeText}
            </div>
          )}
        </div>

        {/* Contenido del Modal */}
        <div className="p-5 pt-3 space-y-3">
          <div className="flex items-center gap-1.5 text-orange-500 text-xs font-bold tracking-wide uppercase">
            <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
            <span>Recomendación Especial</span>
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

          {/* Botón CTA Principal */}
          <button
            onClick={handleCtaClick}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all min-h-[48px]"
          >
            <span>{promo.ctaText || "Ver en el Menú"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

