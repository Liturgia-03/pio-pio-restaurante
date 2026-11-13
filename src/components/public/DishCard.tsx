"use client";

import { Flame, Star, Sparkles, Tag, Users } from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { DishItem } from "@/types";

interface DishCardProps {
  dish: DishItem;
  onSelect: (dish: DishItem) => void;
}

export function DishCard({ dish, onSelect }: DishCardProps) {
  const isAvailable = dish.isAvailable;
  const hasDiscount = dish.discountPrice !== null && dish.discountPrice !== undefined && dish.discountPrice > 0;
  const currentPrice = hasDiscount ? dish.discountPrice : dish.basePrice;

  const renderBadge = () => {
    if (!isAvailable) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-950/80 border border-red-500/40 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
          Agotado por hoy
        </span>
      );
    }

    switch (dish.badge) {
      case "POPULAR":
        return (
          <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Flame className="w-3 h-3 fill-orange-400" />
            Más Vendido
          </span>
        );
      case "CHEFS_SPECIAL":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-amber-300" />
            Recomendado
          </span>
        );
      case "NEW":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" />
            Nuevo
          </span>
        );
      case "PROMO":
        return (
          <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Tag className="w-3 h-3" />
            Oferta
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id={`dish-${dish.id}`}
      onClick={() => onSelect(dish)}
      className={`group relative flex gap-3 p-3 bg-[#181b20] border rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.99] ${
        isAvailable
          ? "border-gray-800/80 hover:border-orange-500/40 shadow-sm"
          : "border-gray-800/40 bg-[#14161a] opacity-65"
      }`}
    >
      {/* Contenido Texto */}
      <div className="flex-1 flex flex-col justify-between min-w-0 pr-1">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {renderBadge()}
            {dish.servings && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                <Users className="w-2.5 h-2.5 text-gray-500" />
                {dish.servings}
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-gray-100 group-hover:text-orange-400 transition-colors line-clamp-1 leading-tight">
            {dish.name}
          </h4>

          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {dish.description}
          </p>
        </div>

        {/* Precios y Porciones */}
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className={`text-base font-extrabold ${isAvailable ? "text-orange-400" : "text-gray-400"}`}>
            {formatPrice(currentPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-500 line-through">
              {formatPrice(dish.basePrice)}
            </span>
          )}
          {dish.portions && dish.portions.length > 1 && (
            <span className="text-[10px] text-gray-500 font-medium">
              ({dish.portions.length} tamaños)
            </span>
          )}
        </div>
      </div>

      {/* Imagen */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-900 border border-gray-800">
        <img
          src={dish.imageUrl}
          alt={dish.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            !isAvailable ? "grayscale contrast-75" : ""
          }`}
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center">
            <span className="text-[10px] font-black text-red-300 uppercase tracking-wider">
              Agotado
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

