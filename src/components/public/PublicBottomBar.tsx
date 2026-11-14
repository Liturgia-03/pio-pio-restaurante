"use client";

import { UtensilsCrossed, Flame, ShoppingBag, Info } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/formatters";

interface PublicBottomBarProps {
  activeTab: "menu" | "promos" | "info";
  onTabChange: (tab: "menu" | "promos" | "info") => void;
  onResetCategory?: () => void;
  onOpenCart?: () => void;
}

export function PublicBottomBar({
  activeTab,
  onTabChange,
  onResetCategory,
  onOpenCart,
}: PublicBottomBarProps) {
  const { totalItems, totalPrice, setIsCartOpen } = useCart();

  const handleMenuClick = () => {
    onTabChange("menu");
    if (onResetCategory) onResetCategory();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePromosClick = () => {
    onTabChange("promos");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInfoClick = () => {
    onTabChange("info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      setIsCartOpen(true);
    }
  };

  return (
    <nav
      aria-label="Navegación principal de la carta"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#14161a]/95 backdrop-blur-xl border-t border-gray-800/80 px-2 sm:px-4 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl transition-all duration-300"
    >
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto items-center">
        {/* 1. MENÚ */}
        <button
          type="button"
          onClick={handleMenuClick}
          aria-label="Ver Menú"
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl min-h-[50px] transition-all duration-300 ease-out active:scale-95 ${
            activeTab === "menu"
              ? "text-amber-400 bg-amber-500/10 border border-amber-500/30 font-bold shadow-md shadow-amber-500/10"
              : "text-gray-400 hover:text-gray-200 border border-transparent"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform duration-300 ${
              activeTab === "menu" ? "scale-110" : "scale-100"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black tracking-wide uppercase mt-0.5">
            Menú
          </span>
        </button>

        {/* 2. PROMOS */}
        <button
          type="button"
          onClick={handlePromosClick}
          aria-label="Ver Promociones"
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl min-h-[50px] transition-all duration-300 ease-out active:scale-95 ${
            activeTab === "promos"
              ? "text-orange-400 bg-orange-500/10 border border-orange-500/30 font-bold shadow-md shadow-orange-500/10"
              : "text-gray-400 hover:text-gray-200 border border-transparent"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform duration-300 ${
              activeTab === "promos" ? "scale-110" : "scale-100"
            }`}
          >
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black tracking-wide uppercase mt-0.5">
            Promos
          </span>
        </button>

        {/* 3. PEDIDO */}
        <button
          type="button"
          onClick={handleCartClick}
          aria-label="Ver Pedido y Carrito"
          className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl min-h-[50px] transition-all duration-300 ease-out active:scale-95 border ${
            totalItems > 0
              ? "bg-gradient-to-b from-amber-500/25 via-orange-500/15 to-transparent border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/20 font-bold"
              : "text-gray-400 hover:text-gray-200 border-transparent"
          }`}
        >
          <div className="relative w-6 h-6 rounded-lg flex items-center justify-center">
            <ShoppingBag className={`w-4 h-4 ${totalItems > 0 ? "text-amber-400" : ""}`} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black tracking-wide uppercase mt-0.5 truncate max-w-[80px]">
            {totalItems > 0 ? formatPrice(totalPrice) : "Pedido"}
          </span>
        </button>

        {/* 4. INFO */}
        <button
          type="button"
          onClick={handleInfoClick}
          aria-label="Ver Información"
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl min-h-[50px] transition-all duration-300 ease-out active:scale-95 ${
            activeTab === "info"
              ? "text-red-400 bg-red-500/10 border border-red-500/30 font-bold shadow-md shadow-red-500/10"
              : "text-gray-400 hover:text-gray-200 border border-transparent"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform duration-300 ${
              activeTab === "info" ? "scale-110" : "scale-100"
            }`}
          >
            <Info className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black tracking-wide uppercase mt-0.5">
            Info
          </span>
        </button>
      </div>
    </nav>
  );
}
