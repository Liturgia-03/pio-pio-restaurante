"use client";

import { useState, useEffect } from "react";
import { X, Clock, Users, Flame, Check, Plus, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { DishItem, Portion } from "@/types";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

interface DishDetailSheetProps {
  dish: DishItem | null;
  onClose: () => void;
}

export function DishDetailSheet({ dish, onClose }: DishDetailSheetProps) {
  const { addItem, setIsCartOpen } = useCart();
  const [selectedPortion, setSelectedPortion] = useState<Portion | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (dish && dish.portions && dish.portions.length > 0) {
      const defaultPortion = dish.portions.find((p) => p.isDefault) || dish.portions[0];
      setSelectedPortion(defaultPortion);
    } else {
      setSelectedPortion(null);
    }
  }, [dish]);

  if (!dish) return null;

  const handleSmoothClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const currentPrice = selectedPortion
    ? selectedPortion.price
    : dish.discountPrice || dish.basePrice;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200 overflow-y-auto ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100 animate-in fade-in"
      }`}
      onClick={handleSmoothClose}
    >
      <div
        className={`relative w-full max-w-md max-h-[88vh] overflow-y-auto no-scrollbar bg-[#181b20] border border-gray-800 rounded-3xl shadow-2xl transition-all duration-200 my-auto ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100 animate-in zoom-in-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-[#181b20]/95 backdrop-blur-md border-b border-gray-800/80">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4 fill-amber-400" />
            Detalle del Plato
          </span>
          <button
            onClick={handleSmoothClose}
            aria-label="Cerrar detalle"
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-full active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Imagen Principal */}
        <div className="relative w-full h-56 sm:h-64 bg-gray-900">
          <img
            src={dish.imageUrl}
            alt={dish.name}
            className={`w-full h-full object-cover ${!dish.isAvailable ? "grayscale opacity-70" : ""}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181b20] via-transparent to-black/20" />
          {!dish.isAvailable && (
            <div className="absolute top-4 left-4 bg-red-600/90 text-white text-xs font-black uppercase px-3 py-1.5 rounded-full shadow-lg">
              Agotado por hoy
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {dish.name}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              {dish.servings && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-orange-400" />
                  {dish.servings}
                </span>
              )}
              {dish.preparationTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  ~{dish.preparationTime} minutos
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line border-t border-gray-800/80 pt-3">
            {dish.description}
          </p>

          {/* Selector de Porciones si aplica */}
          {dish.portions && dish.portions.length > 1 && (
            <div className="border-t border-gray-800/80 pt-4 space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Selecciona el tamaño o porción:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dish.portions.map((portion, idx) => {
                  const isSelected = selectedPortion?.label === portion.label;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPortion(portion)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500"
                          : "border-gray-800 bg-[#14161a] text-gray-300 hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-amber-500 bg-amber-500 text-white"
                              : "border-gray-600"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span>{portion.label}</span>
                      </div>
                      <span className="font-bold text-amber-400">
                        {formatPrice(portion.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer del Sheet con Precio y Botón */}
          <div className="border-t border-gray-800 pt-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-400 block uppercase font-semibold">
                Precio
              </span>
              <span className="text-2xl font-black text-amber-400">
                {formatPrice(currentPrice)}
              </span>
            </div>

            {dish.isAvailable ? (
              <button
                onClick={() => {
                  addItem(dish, selectedPortion);
                  toast.success(`"${dish.name}" agregado al pedido`);
                  handleSmoothClose();
                }}
                className="py-3 px-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg shadow-amber-500/25 transition-all text-xs flex items-center gap-1.5 min-h-[46px]"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar al Pedido</span>
              </button>
            ) : (
              <button
                disabled
                className="py-3 px-5 bg-gray-800 text-gray-500 font-bold rounded-2xl text-xs cursor-not-allowed"
              >
                Agotado por hoy
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

