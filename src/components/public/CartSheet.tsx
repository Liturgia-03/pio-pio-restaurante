"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/formatters";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Table,
  Bike,
  Send,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

interface CartSheetProps {
  initialMesa?: string | null;
  restaurantWhatsapp?: string;
}

export function CartSheet({
  initialMesa,
  restaurantWhatsapp = "573001234567",
}: CartSheetProps) {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    totalPrice,
    totalItems,
  } = useCart();

  const [orderType, setOrderType] = useState<"mesa" | "domicilio">(
    initialMesa ? "mesa" : "mesa"
  );
  const [tableNumber, setTableNumber] = useState(initialMesa || "");
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isCartOpen && !isClosing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen, isClosing]);

  // Sincronizar mesa desde parámetro URL o almacenamiento de sesión
  useEffect(() => {
    if (initialMesa) {
      setTableNumber(initialMesa);
      setOrderType("mesa");
    } else {
      try {
        const stored = sessionStorage.getItem("piopio_mesa");
        if (stored) {
          setTableNumber(stored);
          setOrderType("mesa");
        }
      } catch {}
    }
  }, [initialMesa]);

  // Manejar el botón atrás del celular para cerrar el carrito suavemente
  useEffect(() => {
    if (!isCartOpen) return;

    const onPopState = () => {
      setIsClosing(true);
      setTimeout(() => {
        setIsCartOpen(false);
        setIsClosing(false);
      }, 240);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleSmoothClose = () => {
    if (typeof window !== "undefined" && window.history.state?.pioView === "cart") {
      window.history.back();
      return;
    }
    setIsClosing(true);
    setTimeout(() => {
      setIsCartOpen(false);
      setIsClosing(false);
    }, 260);
  };

  const handleSendWhatsapp = () => {
    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    if (orderType === "mesa" && !tableNumber.trim()) {
      toast.error("Por favor ingresa el número de mesa");
      return;
    }

    if (orderType === "domicilio" && !deliveryAddress.trim()) {
      toast.error("Por favor ingresa la dirección de entrega");
      return;
    }

    // Construcción del mensaje elegante de WhatsApp
    let message = `🍗 *NUEVO PEDIDO - PÍO PÍO ASADERO Y RESTAURANTE*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;

    if (orderType === "mesa") {
      message += `📍 *Ubicación:* Mesa #${tableNumber.trim()}\n`;
    } else {
      message += `🛵 *Tipo:* Domicilio / Para Llevar\n`;
      if (customerName.trim()) message += `👤 *Cliente:* ${customerName.trim()}\n`;
      message += `🏠 *Dirección:* ${deliveryAddress.trim()}\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📝 *DETALLE DEL PEDIDO:*\n`;

    items.forEach((item) => {
      const portionText = item.portionLabel ? ` (${item.portionLabel})` : "";
      message += `• ${item.quantity}x ${item.name}${portionText} - ${formatPrice(
        item.price * item.quantity
      )}\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 *TOTAL A PAGAR:* ${formatPrice(totalPrice)} COP\n`;

    if (notes.trim()) {
      message += `📌 *Observaciones:* ${notes.trim()}\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `_Enviado desde la Carta Digital Móvil Pío Pío_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${restaurantWhatsapp}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
    toast.success("¡Abriendo WhatsApp para confirmar tu pedido!");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md transition-all duration-300 ease-out ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100 animate-in fade-in"
      }`}
      onClick={handleSmoothClose}
    >
      <div
        className={`relative w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar bg-[#181b20] border-t sm:border border-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col transform transition-all duration-300 ease-out ${
          isClosing
            ? "translate-y-full sm:translate-y-6 sm:scale-95 opacity-0"
            : "translate-y-0 sm:scale-100 opacity-100 animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Carrito */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-[#181b20]/95 backdrop-blur-md border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white leading-tight">
                Tu Pedido Pío Pío
              </h3>
              <span className="text-[10px] text-gray-400 font-medium">
                {totalItems} {totalItems === 1 ? "producto" : "productos"} seleccionados
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-semibold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-950/30 transition-colors"
              >
                Vaciar
              </button>
            )}
            <button
              onClick={handleSmoothClose}
              aria-label="Cerrar carrito"
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 active:scale-95 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lista de Ítems */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto text-gray-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-gray-300">
                Tu carrito está vacío
              </p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Explora el menú y agrega los deliciosos pollos asados, combos o asados a la brasa.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-[#14161a] border border-gray-800 rounded-2xl gap-3"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-800"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {item.name}
                  </h4>
                  {item.portionLabel && (
                    <span className="text-[10px] text-amber-400 font-semibold block">
                      {item.portionLabel}
                    </span>
                  )}
                  <span className="text-xs font-black text-gray-300 block mt-0.5">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>

                {/* Controles de Cantidad */}
                <div className="flex items-center gap-1.5 bg-[#181b20] border border-gray-800 rounded-xl p-1">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-white w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}

          {items.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-gray-800/80">
              {/* Selector de Tipo de Pedido */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  ¿Dónde te encuentras?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType("mesa")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      orderType === "mesa"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400 ring-1 ring-amber-500"
                        : "bg-[#14161a] border-gray-800 text-gray-400"
                    }`}
                  >
                    <Table className="w-4 h-4" />
                    <span>En Mesa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderType("domicilio")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      orderType === "domicilio"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400 ring-1 ring-amber-500"
                        : "bg-[#14161a] border-gray-800 text-gray-400"
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Domicilio</span>
                  </button>
                </div>
              </div>

              {/* Campos según el tipo de pedido */}
              {orderType === "mesa" ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400">
                    Número de Mesa *
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ej: Mesa 4"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400">
                      Nombre de quien recibe
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400">
                      Dirección y Barrio de Entrega *
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ej: Carrera 15 # 24-30 Barrio Centro"
                      className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Observaciones adicionales */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-amber-400" />
                  <span>Notas especiales para cocina (Opcional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Pollo bien dorado, ensalada sin cebolla..."
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer con Total y Botón WhatsApp */}
        {items.length > 0 && (
          <div className="p-4 bg-[#14161a] border-t border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Total del Pedido
              </span>
              <span className="text-xl font-black text-amber-400">
                {formatPrice(totalPrice)}
              </span>
            </div>

            <button
              onClick={handleSendWhatsapp}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-xs transition-all min-h-[48px]"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Pedido por WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

