"use client";

import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/formatters";
import { ShoppingBag, Clock, Flame, CreditCard, ChevronRight } from "lucide-react";

export function CartFloatingButton() {
  const { totalItems, totalPrice, setIsCartOpen, customerSession } = useCart();

  // Caso 1: Hay nuevos platos en el carrito (incluso si ya hay una comanda activa, para pedir adiciones)
  if (totalItems > 0) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]">
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-2xl shadow-orange-500/40 flex items-center justify-between border border-amber-300/30 transition-all duration-300 ease-out min-h-[52px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black/30 flex items-center justify-center font-black text-xs text-amber-200">
              {totalItems}
            </div>
            <span className="text-xs uppercase tracking-wider font-black">
              {customerSession?.hasActiveSession
                ? `Adición Mesa #${customerSession.tableNumber}`
                : "Ver Pedido Pío Pío"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-black">{formatPrice(totalPrice)}</span>
            <ShoppingBag className="w-4 h-4 text-amber-200" />
          </div>
        </button>
      </div>
    );
  }

  // Caso 2: El carrito está vacío pero la mesa tiene una comanda activa en el backend
  if (customerSession?.hasActiveSession) {
    const isPending = customerSession.status === "PENDING_CONFIRMATION";
    const isBillReq = customerSession.status === "BILL_REQUESTED";

    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]">
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className={`w-full py-3.5 px-4 rounded-2xl shadow-2xl flex items-center justify-between border transition-all duration-300 active:scale-[0.98] min-h-[52px] ${
            isPending
              ? "bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 border-amber-400/50 text-white shadow-amber-500/25"
              : isBillReq
              ? "bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 border-purple-400/50 text-white shadow-purple-600/30"
              : "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 border-emerald-400/50 text-white shadow-emerald-600/30"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black/30 flex items-center justify-center font-black text-sm">
              {isPending ? (
                <Clock className="w-4 h-4 text-amber-200 animate-spin" />
              ) : isBillReq ? (
                <CreditCard className="w-4 h-4 text-purple-200" />
              ) : (
                <Flame className="w-4 h-4 text-emerald-200 animate-pulse" />
              )}
            </div>
            <div className="text-left">
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-black uppercase tracking-wider block w-fit">
                Mesa #{customerSession.tableNumber}
              </span>
              <span className="text-xs font-black block leading-tight">
                {isPending
                  ? "Pedido Pendiente de Aprobación"
                  : isBillReq
                  ? `Cuenta Solicitada • ${formatPrice(customerSession.total || 0)}`
                  : `En Cocina • ${formatPrice(customerSession.total || 0)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-black opacity-90">
            <span>Ver Comanda</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    );
  }

  return null;
}

