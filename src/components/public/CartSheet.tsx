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
  Utensils,
  CheckCircle2,
  Clock,
  Flame,
  CreditCard,
  Bell,
  Receipt,
  Sparkles,
  ChefHat,
  ChevronRight,
  Info,
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
    customerSession,
    activeTableNumber,
    setActiveTableNumber,
    refreshTableSession,
    clearCustomerSession,
  } = useCart();

  const [orderType, setOrderType] = useState<"mesa" | "domicilio">(
    initialMesa ? "mesa" : "mesa"
  );
  const [tableNumber, setTableNumber] = useState(
    customerSession?.tableNumber || initialMesa || activeTableNumber || ""
  );
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmittingTableOrder, setIsSubmittingTableOrder] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [showConfirmedComandaView, setShowConfirmedComandaView] = useState(false);

  // Bloqueo de scroll cuando el modal está abierto
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

  // Sincronizar mesa desde parámetro URL, contexto o storage
  useEffect(() => {
    const effectiveTable = customerSession?.tableNumber || initialMesa || activeTableNumber;
    if (effectiveTable) {
      const parsed = parseInt(effectiveTable.replace(/\D/g, "") || "0", 10);
      const cleanTable = parsed > 0 ? String(parsed) : effectiveTable;
      setTableNumber(cleanTable);
      setOrderType("mesa");
      if (setActiveTableNumber) setActiveTableNumber(cleanTable);
    }
  }, [initialMesa, activeTableNumber, customerSession, setActiveTableNumber]);

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
    setIsClosing(true);
    setTimeout(() => {
      setIsCartOpen(false);
      setIsClosing(false);
    }, 260);
  };

  // Enviar pedido por WhatsApp (para domicilios o respaldo)
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

  // Enviar pedido directo a la mesa (QR Digital)
  const handleSubmitTableOrder = async () => {
    if (isSubmittingTableOrder) return;
    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    const table = (customerSession?.tableNumber || tableNumber || "").trim();
    if (!table) {
      toast.error("Por favor ingresa o confirma el número de mesa");
      return;
    }

    setIsSubmittingTableOrder(true);
    try {
      const res = await fetch("/api/tables/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: table,
          addedBy: "CUSTOMER_QR",
          addedByName: "Cliente QR",
          items: items.map((item) => ({
            dishId: item.dishId,
            dishName: item.name,
            portionLabel: item.portionLabel || null,
            unitPrice: item.price,
            quantity: item.quantity,
            notes: notes.trim() || undefined,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Error al enviar el pedido a la mesa");
      }

      clearCart();
      setNotes("");
      setActiveTableNumber(table);
      await refreshTableSession();
      toast.success("¡Pedido enviado a tu mesa con éxito! En espera de aprobación.");
    } catch (err: any) {
      toast.error(err.message || "No se pudo enviar el pedido");
    } finally {
      setIsSubmittingTableOrder(false);
    }
  };

  // Solicitar cuenta a caja
  const handleRequestBill = async () => {
    const sessionId = customerSession?.sessionId;
    if (!sessionId) {
      toast.error("No hay una sesión activa para solicitar la cuenta");
      return;
    }
    setIsRequestingBill(true);
    try {
      const res = await fetch(`/api/tables/${sessionId}/bill-request`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success("¡Solicitud enviada a Caja! Ya saben que vas a pagar.");
      await refreshTableSession();
    } catch (err: any) {
      toast.error(err.message || "No se pudo solicitar la cuenta");
    } finally {
      setIsRequestingBill(false);
    }
  };

  // Llamar al mesero
  const handleCallWaiter = async () => {
    const table = customerSession?.tableNumber || tableNumber;
    if (!table) return;
    setIsCallingWaiter(true);
    try {
      const res = await fetch("/api/public/call-waiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: table,
          sessionId: customerSession?.sessionId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success(`¡Mesero notificado para la Mesa #${table}! En breve se acercarán.`);
      await refreshTableSession();
    } catch (err: any) {
      toast.error(err.message || "No se pudo notificar al mesero");
    } finally {
      setIsCallingWaiter(false);
    }
  };

  const isPendingApproval = customerSession?.hasActiveSession && customerSession.status === "PENDING_CONFIRMATION";
  const isOpenInKitchen = customerSession?.hasActiveSession && customerSession.status === "OPEN";
  const isBillRequested = customerSession?.hasActiveSession && customerSession.status === "BILL_REQUESTED";
  const isTableClosed = customerSession?.status === "CLOSED";

  // Determinar si debemos mostrar la vista de comanda activa
  const showActiveOrderView =
    (customerSession?.hasActiveSession || isTableClosed) &&
    (items.length === 0 || showConfirmedComandaView);

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
        {/* Header del Modal */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-[#181b20]/95 backdrop-blur-md border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black ${
                isPendingApproval
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : isOpenInKitchen
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : isBillRequested
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : isTableClosed
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {isPendingApproval ? (
                <Clock className="w-5 h-5 animate-spin" />
              ) : isOpenInKitchen ? (
                <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
              ) : isBillRequested ? (
                <CreditCard className="w-5 h-5 text-purple-400" />
              ) : isTableClosed ? (
                <Sparkles className="w-5 h-5 text-blue-400" />
              ) : (
                <ShoppingBag className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white leading-tight">
                  {showActiveOrderView
                    ? isPendingApproval
                      ? "Pedido Pendiente de Aprobación"
                      : isOpenInKitchen
                      ? "Pedido Aprobado y en Marcha"
                      : isBillRequested
                      ? "Cuenta Solicitada a Caja"
                      : isTableClosed
                      ? "Cuenta Pagada y Mesa Cerrada"
                      : "Comanda de tu Mesa"
                    : "Tu Pedido Pío Pío"}
                </h3>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">
                {customerSession?.tableNumber
                  ? `Mesa #${customerSession.tableNumber}`
                  : tableNumber
                  ? `Mesa #${tableNumber}`
                  : "Carta Digital Móvil"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && !showActiveOrderView && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] font-semibold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-950/30 transition-colors"
              >
                Vaciar
              </button>
            )}

            <button
              type="button"
              onClick={handleSmoothClose}
              aria-label="Cerrar pedido"
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 active:scale-95 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pestaña de Navegación Rápida si hay Comanda Activa Y nuevos platos en borrador */}
        {customerSession?.hasActiveSession && items.length > 0 && (
          <div className="flex bg-[#14161a] p-1.5 border-b border-gray-800 gap-1.5">
            <button
              type="button"
              onClick={() => setShowConfirmedComandaView(false)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                !showConfirmedComandaView
                  ? "bg-amber-500 text-black font-black shadow-md shadow-amber-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevos Platos ({totalItems})</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmedComandaView(true)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                showConfirmedComandaView
                  ? "bg-gray-800 text-amber-400 font-black border border-amber-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Comanda Activa</span>
            </button>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* ========================================================================= */}
          {/* CASO A: VISTA DE COMANDA EN VIVO (ESTADOS SOLICITADOS POR EL USUARIO)     */}
          {/* ========================================================================= */}
          {showActiveOrderView ? (
            <div className="space-y-4 animate-in fade-in">
              {/* 1. ESTADO: PENDIENTE POR APROBAR */}
              {isPendingApproval && (
                <div className="p-5 bg-[#14161a] border border-amber-500/40 rounded-3xl space-y-4 text-center relative overflow-hidden shadow-xl shadow-amber-500/10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber-500/15 blur-2xl pointer-events-none" />

                  <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-500/50 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 animate-pulse">
                    <Clock className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black rounded-full uppercase tracking-wider">
                      Mesa #{customerSession.tableNumber} • Pendiente por Aprobar
                    </span>
                    <h4 className="text-lg font-black text-white">
                      ¡Tu Pedido ha sido Enviado!
                    </h4>
                    <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                      El mesero o el administrador verificará tu comanda en unos instantes y la
                      marchará directamente a la cocina.
                    </p>
                  </div>

                  {/* Indicador de comprobación automática en tiempo real */}
                  <div className="p-3 bg-black/40 border border-gray-800 rounded-2xl flex items-center justify-center gap-2.5 text-xs text-amber-300/90 font-semibold">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Comprobando aprobación automáticamente en tiempo real...</span>
                  </div>

                  {/* Botones de acción mientras espera aprobación */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCallWaiter}
                      disabled={isCallingWaiter}
                      className="py-3 px-3 bg-[#181b20] hover:bg-gray-800 border border-gray-700/80 text-gray-200 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                    >
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span>{isCallingWaiter ? "Llamando..." : "Llamar Mesero"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSmoothClose}
                      className="py-3 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-amber-500/20"
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Ver Más Platos</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. ESTADO: PEDIDO RECIBIDO Y APROBADO EN COCINA */}
              {isOpenInKitchen && (
                <div className="p-5 bg-[#14161a] border border-emerald-500/40 rounded-3xl space-y-4 text-center relative overflow-hidden shadow-xl shadow-emerald-500/10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-emerald-500/15 blur-2xl pointer-events-none" />

                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black rounded-full uppercase tracking-wider">
                      Mesa #{customerSession.tableNumber} • Pedido Aprobado
                    </span>
                    <h4 className="text-lg font-black text-white">
                      ¡Tu Pedido está en Cocina!
                    </h4>
                    <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                      El pedido fue recibido con éxito. Nuestros cocineros ya están preparando tus
                      platos con el toque gourmet de Pío Pío.
                    </p>
                    {customerSession.waiterName && (
                      <span className="text-xs font-semibold text-amber-400 block pt-0.5">
                        Mesero a cargo: {customerSession.waiterName}
                      </span>
                    )}
                  </div>

                  {/* Acciones del Cliente en Mesa */}
                  <div className="space-y-2 pt-2 text-left">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block px-1">
                      Opciones disponibles en tu mesa:
                    </span>

                    {/* Botón: Agregar otros productos (Pedir algo más) */}
                    <button
                      type="button"
                      onClick={handleSmoothClose}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-extrabold text-xs rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/25 active:scale-98 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>➕ Agregar Otros Productos (Pedir Algo Más)</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Botón: Llamar mesero */}
                      <button
                        type="button"
                        onClick={handleCallWaiter}
                        disabled={isCallingWaiter}
                        className="py-3 px-3 bg-[#181b20] hover:bg-gray-800 border border-gray-700/80 text-gray-200 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                      >
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span>{isCallingWaiter ? "Llamando..." : "Llamar Mesero"}</span>
                      </button>

                      {/* Botón: Pedir la cuenta */}
                      <button
                        type="button"
                        onClick={handleRequestBill}
                        disabled={isRequestingBill}
                        className="py-3 px-3 bg-purple-900/60 hover:bg-purple-800 border border-purple-600/60 text-purple-200 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-purple-900/20"
                      >
                        <CreditCard className="w-4 h-4 text-purple-300" />
                        <span>{isRequestingBill ? "Notificando..." : "Pedir Cuenta"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ESTADO: CUENTA SOLICITADA A CAJA */}
              {isBillRequested && (
                <div className="p-5 bg-[#14161a] border border-purple-500/40 rounded-3xl space-y-4 text-center relative overflow-hidden shadow-xl shadow-purple-900/20">
                  <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border-2 border-purple-500/50 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-600/20 animate-pulse">
                    <CreditCard className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-block px-3 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-black rounded-full uppercase tracking-wider">
                      Mesa #{customerSession.tableNumber} • Cuenta Solicitada
                    </span>
                    <h4 className="text-lg font-black text-white">
                      ¡Solicitud de Cuenta Notificada!
                    </h4>
                    <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                      El administrador en Caja Central ya fue notificado. Puedes acercarte a la
                      Caja cuando desees para cancelar tu cuenta en Efectivo, Nequi o Tarjeta.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSmoothClose}
                      className="py-3 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>Pedir Adición</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCallWaiter}
                      disabled={isCallingWaiter}
                      className="py-3 px-3 bg-[#181b20] hover:bg-gray-800 border border-gray-700 text-gray-200 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span>Llamar Mesero</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. ESTADO: CUENTA PAGADA Y MESA LIBERADA POR EL ADMIN */}
              {isTableClosed && (
                <div className="p-6 bg-[#14161a] border border-blue-500/40 rounded-3xl space-y-4 text-center relative overflow-hidden shadow-2xl">
                  <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border-2 border-blue-500/50 text-blue-400 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                    <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black rounded-full uppercase tracking-wider">
                      Mesa Liberada • Pago Completado
                    </span>
                    <h4 className="text-xl font-black text-white">
                      ¡Muchas Gracias por tu Visita!
                    </h4>
                    <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                      Tu cuenta ha sido cancelada exitosamente y la mesa ha sido liberada en Caja.
                      Esperamos que hayas disfrutado de nuestros platos. ¡Vuelve pronto a Pío Pío!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      clearCustomerSession();
                      handleSmoothClose();
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-black text-xs rounded-2xl shadow-lg active:scale-95 transition-all"
                  >
                    Aceptar y Volver a la Carta
                  </button>
                </div>
              )}

              {/* Detalle Desglosado de Productos de la Comanda Activa */}
              {customerSession?.items && customerSession.items.length > 0 && !isTableClosed && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <span>Comanda Acumulada en Mesa:</span>
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      {customerSession.itemsCount || customerSession.items.length} platos
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {customerSession.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-[#14161a] border border-gray-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-400 font-extrabold text-xs">
                              {item.quantity}x
                            </span>
                            <span className="text-white font-bold text-xs truncate">
                              {item.dishName}
                            </span>
                            {item.portionLabel && (
                              <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-semibold">
                                {item.portionLabel}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <span className="text-[10px] text-amber-300/90 block italic mt-0.5">
                              "{item.notes}"
                            </span>
                          )}
                          <span className="text-[9px] text-gray-500 block mt-0.5">
                            Ronda {item.round}
                          </span>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-amber-400 block">
                            {formatPrice(item.subtotal)}
                          </span>
                          <span
                            className={`text-[9px] font-bold ${
                              item.status === "PENDING_CONFIRMATION"
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {item.status === "PENDING_CONFIRMATION" ? "⏳ Por confirmar" : "✓ En cocina"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen Total Acumulado */}
                  <div className="p-4 bg-[#14161a] border border-gray-800 rounded-2xl flex items-center justify-between shadow-inner">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Total Acumulado en Mesa
                    </span>
                    <span className="text-xl font-black text-amber-400">
                      {formatPrice(customerSession.total || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* CASO B: CARRITO DE ELECCIÓN DE PLATOS (NUEVO PEDIDO O ADICIÓN)            */
            /* ========================================================================= */
            items.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto text-gray-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-gray-300">Tu carrito está vacío</p>
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
                    <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
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
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-gray-800"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-gray-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )
          )}

          {/* Formulario de Ubicación y Notas si hay ítems por pedir */}
          {items.length > 0 && !showActiveOrderView && (
            <div className="space-y-4 pt-2 border-t border-gray-800/80">
              {/* Selector de Tipo de Pedido */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">¿Dónde te encuentras?</label>
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
                  <label className="text-[11px] font-bold text-gray-400">Número de Mesa *</label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ej: 4"
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

        {/* Footer con Total y Botones de Acción para ítems en carrito */}
        {items.length > 0 && !showActiveOrderView && (
          <div className="p-4 bg-[#14161a] border-t border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase">
                {customerSession?.hasActiveSession ? "Total de esta Adición" : "Total del Pedido"}
              </span>
              <span className="text-xl font-black text-amber-400">
                {formatPrice(totalPrice)}
              </span>
            </div>

            {orderType === "mesa" ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSubmitTableOrder}
                  disabled={isSubmittingTableOrder}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 text-xs transition-all min-h-[48px] disabled:opacity-50"
                >
                  <Utensils className="w-4 h-4" />
                  <span>
                    {isSubmittingTableOrder
                      ? "Enviando pedido a mesa..."
                      : customerSession?.hasActiveSession
                      ? `🍽️ Enviar Adición a Mesa #${customerSession.tableNumber}`
                      : `🍽️ Enviar Pedido a ${tableNumber ? `Mesa #${tableNumber}` : "Mesa"}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsapp}
                  className="w-full py-2 text-[11px] font-semibold text-gray-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>O enviar copia por WhatsApp</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendWhatsapp}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-xs transition-all min-h-[48px]"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Pedido por WhatsApp</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
