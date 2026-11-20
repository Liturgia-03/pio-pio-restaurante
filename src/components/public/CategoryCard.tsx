"use client";

import { ChevronRight } from "lucide-react";
import { IconRenderer } from "@/components/common/IconRenderer";
import { CategoryWithDishes } from "@/types";

interface CategoryCardProps {
  category: CategoryWithDishes;
  onSelect: (categoryId: string) => void;
}

const fallbackCategoryImages: Record<string, string> = {
  "pollo-completo":
    "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
  "combos-pollo":
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
  "asados-brasa":
    "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop",
  "platos-tipicos":
    "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop",
  bandejas:
    "https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=800&auto=format&fit=crop",
  "sopa-y-porciones":
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
  desayunos:
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
  "menu-infantil":
    "https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=800&auto=format&fit=crop",
  bebidas:
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop",
};

export function CategoryCard({ category, onSelect }: CategoryCardProps) {
  const imageUrl =
    category.imageUrl ||
    category.dishes?.[0]?.imageUrl ||
    fallbackCategoryImages[category.slug] ||
    "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop";

  const availableDishesCount = category.dishes?.filter((d) => d.isAvailable).length || 0;

  return (
    <div
      onClick={() => onSelect(category.id)}
      className="group relative w-full h-36 sm:h-44 rounded-3xl overflow-hidden cursor-pointer border border-gray-800/80 hover:border-amber-500/50 shadow-xl transition-all duration-300 active:scale-[0.98] select-none"
    >
      {/* Imagen de Fondo de Alta Calidad */}
      <img
        src={imageUrl}
        alt={category.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Degradado Cinematográfico Oscuro para máxima legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/75 to-black/30" />

      {/* Contenido de la Tarjeta */}
      <div className="relative h-full p-4 sm:p-5 flex flex-col justify-between z-10">
        {/* Barra superior de la tarjeta */}
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-lg">
            <IconRenderer name={category.iconName} className="w-5 h-5" />
          </div>

          <span className="text-[11px] font-black text-amber-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/30 shadow-md">
            {availableDishesCount} {availableDishesCount === 1 ? "plato" : "platos"}
          </span>
        </div>

        {/* Textos y Flecha de Navegación */}
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1 min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-black text-white leading-tight group-hover:text-amber-400 transition-colors drop-shadow-md">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-xs text-gray-300 font-medium line-clamp-1 drop-shadow">
                {category.description}
              </p>
            )}
          </div>

          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30 group-hover:bg-amber-400 group-hover:translate-x-1 transition-all">
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>
    </div>
  );
}

