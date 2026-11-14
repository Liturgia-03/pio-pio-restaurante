"use client";

import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/formatters";
import { ShoppingBag } from "lucide-react";

export function CartFloatingButton() {
  const { totalItems, totalPrice, setIsCartOpen } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]">
      <button
        onClick={() => setIsCartOpen(true)}
        className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-2xl shadow-orange-500/40 flex items-center justify-between border border-amber-300/30 transition-all duration-300 ease-out min-h-[52px]"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-black/30 flex items-center justify-center font-black text-xs text-amber-200">
            {totalItems}
          </div>
          <span className="text-xs uppercase tracking-wider font-black">
            Ver Pedido Pío Pío
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-black">
            {formatPrice(totalPrice)}
          </span>
          <ShoppingBag className="w-4 h-4 text-amber-200" />
        </div>
      </button>
    </div>
  );
}

