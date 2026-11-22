"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Zap,
  ShoppingBag,
  Clock,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  Layers,
  UtensilsCrossed,
  AlertCircle,
  Check,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatters";

interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  categoryName?: string;
  portionLabel?: string;
}

interface CartItem {
  dishId?: string;
  dishName: string;
  portionLabel?: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

interface BarraOrder {
  id: string;
  tableNumber: string;
  status: string;
  total: number;
  createdAt: string;
  closedBy?: string | null;
  items: {
    id: string;
    dishName: string;
    portionLabel?: string | null;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    notes?: string | null;
  }[];
}

// Platos de alta rotación en mostrador (Favoritos rápidos de 1 toque)
const QUICK_FAVORITES: { name: string; price: number }[] = [
  { name: "Pollo Asado Entero", price: 45000 },
  { name: "Medio Pollo Asado", price: 25000 },
  { name: "Cuarto de Pollo Asado", price: 14000 },
  { name: "Pollo Apanado Entero", price: 46000 },
  { name: "Medio Pollo Apanado", price: 25000 },
  { name: "Cuarto de Pollo Apanado", price: 15000 },
  { name: "Combo Doble Presa", price: 22000 },
  { name: "Gaseosa 1.5 Litros", price: 8000 },
];

export function AdminBarraDrawer() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"new" | "queue">("new");

  // Datos del pedido nuevo
  const [customerName, setCustomerName] = useState<string>("");
  const [destination, setDestination] = useState<"LLEVAR" | "BARRA">("LLEVAR");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentTiming, setPaymentTiming] = useState<"NOW" | "ON_DELIVERY">("NOW");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "NEQUI" | "CARD" | "MIXED">("CASH");

  // Cálculos de efectivo y pago mixto
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [mixedCash, setMixedCash] = useState<number>(0);
  const [mixedTransfer, setMixedTransfer] = useState<number>(0);

  // Estados de catálogo y búsqueda
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [allDishes, setAllDishes] = useState<MenuItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Pedidos activos en cola de barra
  const [activeOrders, setActiveOrders] = useState<BarraOrder[]>([]);
  const [nextTicket, setNextTicket] = useState<string>("#01");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal para cobrar un pedido que pagaba al entregar
  const [deliveringOrder, setDeliveringOrder] = useState<BarraOrder | null>(null);
  const [deliverPayMethod, setDeliverPayMethod] = useState<"CASH" | "NEQUI" | "CARD" | "MIXED">("CASH");
  const [deliverCashGiven, setDeliverCashGiven] = useState<number>(0);
  const [deliverMixedCash, setDeliverMixedCash] = useState<number>(0);

  // Total de la canasta
  const cartTotal = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  }, [cart]);

  // Cargar catálogo de platos y pedidos activos de barra
  const fetchBarraData = async () => {
    try {
      const res = await fetch("/api/admin/barra");
      const json = await res.json();
      if (json.success && json.data) {
        setActiveOrders(json.data.activeOrders || []);
        if (json.data.nextTicketNumber) {
          setNextTicket(json.data.nextTicketNumber);
        }
      }
    } catch {
      // Silencioso en caso de reconexión
    }
  };

  const fetchMenuDishes = async () => {
    try {
      const res = await fetch("/api/public/menu");
      const json = await res.json();
      if (json.success && json.data?.categories) {
        const list: MenuItem[] = [];
        json.data.categories.forEach((cat: any) => {
          cat.dishes.forEach((d: any) => {
            if (d.isAvailable) {
              list.push({
                id: d.id,
                name: d.name,
                basePrice: d.basePrice,
                categoryName: cat.name,
              });
            }
          });
        });
        setAllDishes(list);
      }
    } catch {
      // Ignorar
    }
  };

  useEffect(() => {
    fetchBarraData();
    fetchMenuDishes();
    const interval = setInterval(fetchBarraData, 12000);
    return () => clearInterval(interval);
  }, []);

  // Ajustar valores de pago mixto cuando cambia el total
  useEffect(() => {
    if (cartTotal > 0) {
      const half = Math.floor(cartTotal / 2000) * 1000;
      setMixedCash(half);
      setMixedTransfer(cartTotal - half);
      setCashGiven(cartTotal);
    }
  }, [cartTotal]);

  // Platos filtrados por buscador
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allDishes.filter(
      (d) => d.name.toLowerCase().includes(q) || (d.categoryName && d.categoryName.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [searchQuery, allDishes]);

  // Operaciones de Canasta
  const addToCart = (name: string, price: number, dishId?: string, portionLabel?: string) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.dishName === name && i.portionLabel === portionLabel);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { dishId, dishName: name, portionLabel, unitPrice: price, quantity: 1 }];
    });
    setSearchQuery("");
    setIsSearching(false);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index].quantity = newQty;
      return copy;
    });
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
  };

  // Enviar Pedido
  const handleCreateOrder = async (isDeliveredImmediately: boolean) => {
    if (cart.length === 0) {
      toast.error("Agrega al menos un plato a la comanda");
      return;
    }

    setIsSubmitting(true);
    try {
      const cashChange = Math.max(0, cashGiven - (paymentMethod === "MIXED" ? mixedCash : cartTotal));

      const payload = {
        customerName: customerName.trim() || "Cliente Mostrador",
        destination,
        items: cart,
        paymentTiming,
        paymentMethod,
        cashPaidAmount: cashGiven,
        cashChange,
        mixedCash,
        mixedTransfer,
        isDeliveredImmediately,
      };

      const res = await fetch("/api/admin/barra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Error al procesar pedido");
      }

      toast.success(json.message || "Pedido registrado en barra con éxito");
      clearCart();

      // Refrescar pedidos de barra y notificar al salón de mesas
      await fetchBarraData();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refresh-tables"));
      }

      if (!isDeliveredImmediately) {
        setActiveTab("queue");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al guardar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Marcar entregado (o cobrar al entregar)
  const handleDeliverOrder = async (order: BarraOrder) => {
    const isPendingPayment = order.closedBy === "PENDIENTE_PAGO" || !order.closedBy?.startsWith("PAGADO_PREVIO");

    if (isPendingPayment) {
      // Abrir modal de cobro previo a la entrega
      setDeliveringOrder(order);
      setDeliverPayMethod("CASH");
      setDeliverCashGiven(order.total);
      setDeliverMixedCash(Math.floor(order.total / 2));
      return;
    }

    // Si ya estaba pagado, marcar entregado directamente
    executeDeliver(order.id, {});
  };

  const executeDeliver = async (sessionId: string, paymentData: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/barra/${sessionId}/deliver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Error al entregar pedido");
      }

      toast.success(json.message || "Pedido entregado con éxito");
      setDeliveringOrder(null);
      await fetchBarraData();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refresh-tables"));
      }
    } catch (err: any) {
      toast.error(err.message || "Error al finalizar entrega");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FRANJA VERTICAL ANCLADA AL BORDE DEL SIDEBAR (POSICIÓN EXACTA DE FOTO)  */}
      {/* ========================================================================= */}
      <div
        className={`fixed left-0 md:left-64 top-0 bottom-0 z-40 flex items-stretch select-none pointer-events-none ${
          isOpen ? "pointer-events-auto" : ""
        }`}
      >
        {/* Pestaña Vertical Táctil / Desplegable hacia la derecha */}
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="pointer-events-auto w-11 bg-gradient-to-b from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black cursor-pointer flex flex-col items-center justify-between py-4 shadow-2xl border-r border-amber-300/40 transition-all active:scale-98 group"
          title={isOpen ? "Ocultar barra" : "Desplegar Barra & Pedidos Rápidos hacia la derecha"}
        >
          {/* Icono Superior */}
          <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center font-black text-xs shadow-inner">
            ⚡
          </div>

          {/* Badge pulsante si hay clientes esperando entrega en barra */}
          {activeOrders.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-orange-950 text-orange-200 border border-orange-400 text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
              {activeOrders.length}
            </span>
          )}

          {/* Texto vertical con orientación rotada */}
          <div
            className="font-black text-[11px] tracking-widest uppercase py-3 flex items-center gap-1.5"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            <span>BARRA & PEDIDOS RÁPIDOS</span>
          </div>

          {/* Botón Circular con la Flecha de la imagen (apunta a la derecha al estar cerrado) */}
          <div className="w-7 h-7 rounded-full bg-black text-amber-400 flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
            {isOpen ? "<" : ">"}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PANEL INTERIOR DESPLEGABLE HACIA LA DERECHA                             */}
        {/* ========================================================================= */}
        <div
          className={`pointer-events-auto h-full bg-[#14161a] border-r border-gray-800 flex flex-col justify-between shadow-2xl transition-all duration-300 overflow-hidden ${
            isOpen
              ? "w-[440px] max-w-[calc(100vw-44px)] opacity-100"
              : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          {/* Cabecera del Panel de Barra */}
          <div className="p-3.5 bg-[#101216] border-b border-gray-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                ⚡
              </span>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Caja de Barra & Mostrador
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-amber-400 font-bold">Ticket {nextTicket}</span>
                  <span className="text-[9px] text-gray-500">•</span>
                  <span className="text-[10px] text-emerald-400 font-bold">En Línea</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
            >
              <span>Replegar</span>
              <span className="font-black">&lt;</span>
            </button>
          </div>

          {/* Pestañas Superiores de la Barra: Nuevo Pedido vs Esperando Entrega */}
          <div className="p-2 bg-[#121418] border-b border-gray-800 shrink-0">
            <div className="grid grid-cols-2 p-1 bg-[#181b20] rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => setActiveTab("new")}
                className={`py-1.5 font-black text-xs rounded-lg transition-all ${
                  activeTab === "new"
                    ? "bg-amber-500 text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                + Tomar Pedido
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className={`py-1.5 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "queue"
                    ? "bg-amber-500 text-black shadow-md font-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span>Esperando Entrega</span>
                {activeOrders.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                      activeTab === "queue" ? "bg-black text-amber-400" : "bg-orange-500 text-white"
                    }`}
                  >
                    {activeOrders.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* SUBPANTALLA 1: TOMAR NUEVO PEDIDO RÁPIDO                             */}
          {/* ===================================================================== */}
          {activeTab === "new" && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
              {/* Cliente y Modalidad */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Cliente / Referencia
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Don Carlos, Mostrador..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full mt-1 bg-[#181b20] border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Modalidad
                  </label>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setDestination("LLEVAR")}
                      className={`py-1.5 text-[10px] font-black rounded-lg transition-all ${
                        destination === "LLEVAR"
                          ? "bg-amber-500 text-black shadow-sm"
                          : "bg-[#181b20] text-gray-400 hover:text-white"
                      }`}
                    >
                      🥡 Llevar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestination("BARRA")}
                      className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        destination === "BARRA"
                          ? "bg-amber-500 text-black shadow-sm font-black"
                          : "bg-[#181b20] text-gray-400 hover:text-white"
                      }`}
                    >
                      🍽️ Barra
                    </button>
                  </div>
                </div>
              </div>

              {/* Favoritos Rápidos en 1 Toque */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Favoritos de Mostrador</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSearching((prev) => !prev)}
                    className="text-[10px] text-amber-400 hover:underline font-bold"
                  >
                    {isSearching ? "Ocultar Buscador" : "🔍 Buscar Platos"}
                  </button>
                </div>

                {/* Buscador predictivo expandible */}
                {isSearching && (
                  <div className="mb-2 relative">
                    <Search className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre (ej: Churrasco, Sopa, Arroz)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#181b20] border border-gray-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 shadow-inner"
                    />
                    {searchResults.length > 0 && (
                      <div className="mt-1 bg-[#181b20] border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800/80 shadow-xl">
                        {searchResults.map((dish) => (
                          <div
                            key={dish.id}
                            onClick={() => addToCart(dish.name, dish.basePrice, dish.id)}
                            className="p-2 hover:bg-gray-800/80 cursor-pointer flex justify-between items-center transition-all"
                          >
                            <span className="font-bold text-white text-xs">{dish.name}</span>
                            <span className="font-black text-amber-400 text-xs">
                              {formatPrice(dish.basePrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Grilla 2 columnas de favoritos */}
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_FAVORITES.map((fav) => (
                    <button
                      key={fav.name}
                      type="button"
                      onClick={() => addToCart(fav.name, fav.price)}
                      className="p-2 bg-[#181b20] hover:bg-gray-800 border border-gray-800 hover:border-amber-500/40 rounded-xl text-left active:scale-95 transition-all"
                    >
                      <p className="font-bold text-white text-xs truncate">{fav.name}</p>
                      <p className="text-amber-400 font-black text-[11px] mt-0.5">
                        {formatPrice(fav.price)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Canasta de Artículos */}
              <div className="bg-[#101216] border border-gray-800 rounded-2xl p-3 space-y-2">
                <div className="flex justify-between items-center border-b border-gray-800/80 pb-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Canasta ({cart.length})
                  </span>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[10px] text-red-400 hover:underline"
                    >
                      Vaciar
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <p className="text-center py-4 text-gray-500 text-[11px]">
                    Canasta vacía. Pulsa cualquier plato arriba para agregar.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 py-1 border-b border-gray-800/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-xs truncate">{item.dishName}</p>
                          <span className="text-[10px] text-amber-400 font-bold block">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(idx, -1)}
                            className="w-6 h-6 rounded-lg bg-gray-800 text-gray-300 hover:text-white flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-bold text-xs text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(idx, 1)}
                            className="w-6 h-6 rounded-lg bg-gray-800 text-gray-300 hover:text-white flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCartItem(idx)}
                            className="w-6 h-6 rounded-lg text-gray-500 hover:text-red-400 flex items-center justify-center ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selector de Momento de Pago: ¿Paga Ahora o al Recibir? */}
              <div className="bg-[#181b20] border border-gray-800 rounded-2xl p-2.5 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  Momento del Pago
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentTiming("NOW")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                      paymentTiming === "NOW"
                        ? "bg-amber-500 text-black font-black shadow-md"
                        : "bg-[#121418] text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>⚡ Paga Ahora</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTiming("ON_DELIVERY")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                      paymentTiming === "ON_DELIVERY"
                        ? "bg-amber-500 text-black font-black shadow-md"
                        : "bg-[#121418] text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>⏳ Paga al Entregar</span>
                  </button>
                </div>
              </div>

              {/* Si Paga Ahora: Selector de Métodos de Pago y Calculadora de Cambio */}
              {paymentTiming === "NOW" && (
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                    Forma de Pago
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH")}
                      className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        paymentMethod === "CASH"
                          ? "bg-amber-500 text-black font-black shadow-sm"
                          : "bg-[#181b20] text-gray-300 border border-gray-800"
                      }`}
                    >
                      💵 Efec.
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("NEQUI")}
                      className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        paymentMethod === "NEQUI"
                          ? "bg-amber-500 text-black font-black shadow-sm"
                          : "bg-[#181b20] text-gray-300 border border-gray-800"
                      }`}
                    >
                      📱 Nequi
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CARD")}
                      className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        paymentMethod === "CARD"
                          ? "bg-amber-500 text-black font-black shadow-sm"
                          : "bg-[#181b20] text-gray-300 border border-gray-800"
                      }`}
                    >
                      💳 Tarjeta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("MIXED")}
                      className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        paymentMethod === "MIXED"
                          ? "bg-amber-500 text-black font-black shadow-sm"
                          : "bg-[#181b20] text-gray-300 border border-gray-800"
                      }`}
                    >
                      🔀 Mixto
                    </button>
                  </div>

                  {/* Pago Mixto: Desglose Efectivo + Nequi */}
                  {paymentMethod === "MIXED" && (
                    <div className="p-2.5 bg-[#171a1f] border border-amber-500/30 rounded-xl space-y-2">
                      <span className="text-[10px] font-black text-amber-400 uppercase block">
                        Desglose de Pago Combinado
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold block">💵 Efectivo:</label>
                          <input
                            type="number"
                            value={mixedCash || ""}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setMixedCash(val);
                              setMixedTransfer(Math.max(0, cartTotal - val));
                            }}
                            className="w-full mt-0.5 bg-[#111317] border border-gray-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold block">📱 Nequi/Tarjeta:</label>
                          <input
                            type="number"
                            value={mixedTransfer || ""}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setMixedTransfer(val);
                              setMixedCash(Math.max(0, cartTotal - val));
                            }}
                            className="w-full mt-0.5 bg-[#111317] border border-gray-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calculadora de Vueltas (para Efectivo o la parte en efectivo del pago Mixto) */}
                  {(paymentMethod === "CASH" || paymentMethod === "MIXED") && (
                    <div className="bg-[#171a1f] p-2.5 rounded-xl border border-gray-800 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                        <span>Paga con billete:</span>
                        <span className="text-emerald-400 font-black text-xs">
                          Devuelta:{" "}
                          {formatPrice(
                            Math.max(0, cashGiven - (paymentMethod === "MIXED" ? mixedCash : cartTotal))
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => setCashGiven(paymentMethod === "MIXED" ? mixedCash : cartTotal)}
                          className="py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold rounded-lg"
                        >
                          Exacto
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashGiven(20000)}
                          className="py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold rounded-lg"
                        >
                          $20k
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashGiven(50000)}
                          className="py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold rounded-lg"
                        >
                          $50k
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashGiven(100000)}
                          className="py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold rounded-lg"
                        >
                          $100k
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUBPANTALLA 2: COLA DE ESPERA EN MOSTRADOR                           */}
          {/* ===================================================================== */}
          {activeTab === "queue" && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Pedidos en Barra ({activeOrders.length})
                </span>
                <button
                  type="button"
                  onClick={fetchBarraData}
                  className="text-[10px] text-amber-400 hover:underline font-bold"
                >
                  🔄 Actualizar
                </button>
              </div>

              {activeOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto" />
                  <p className="text-xs font-bold text-gray-400">No hay clientes esperando en barra</p>
                  <p className="text-[10px]">Todos los pedidos para llevar han sido entregados.</p>
                </div>
              ) : (
                activeOrders.map((ord) => {
                  const isPaidPrev = ord.closedBy?.startsWith("PAGADO_PREVIO");
                  const waitMinutes = Math.max(
                    0,
                    Math.floor((Date.now() - new Date(ord.createdAt).getTime()) / 60000)
                  );

                  return (
                    <div
                      key={ord.id}
                      className={`p-3 rounded-2xl border space-y-2 shadow-md transition-all ${
                        isPaidPrev
                          ? "bg-[#181b20] border-emerald-500/50"
                          : "bg-[#181b20] border-amber-500/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                isPaidPrev
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                              }`}
                            >
                              {isPaidPrev ? "🟢 PAGADO" : "🟡 PENDIENTE DE COBRO"}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              Hace {waitMinutes} min
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-white mt-1">
                            {ord.tableNumber} • {ord.items[0]?.notes?.split("•")[1] || "Cliente Mostrador"}
                          </h4>
                        </div>
                        <span className="font-black text-amber-400 text-xs">
                          {formatPrice(ord.total)}
                        </span>
                      </div>

                      {/* Resumen de platos */}
                      <p className="text-[11px] text-gray-300 line-clamp-2">
                        {ord.items.map((it) => `${it.quantity}x ${it.dishName}`).join(", ")}
                      </p>

                      <div className="pt-2 border-t border-gray-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeliverOrder(ord)}
                          className={`px-3.5 py-1.5 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 ${
                            isPaidPrev
                              ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                              : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
                          }`}
                        >
                          {isPaidPrev ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Marcar Entregado</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Cobrar y Entregar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* PIE DE ACCIONES: TOTAL Y BOTÓN DE DISPARO */}
          {activeTab === "new" && (
            <div className="p-3.5 bg-[#101216] border-t border-gray-800 space-y-2.5 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Total Comanda:</span>
                <span className="text-xl font-black text-amber-400">{formatPrice(cartTotal)}</span>
              </div>

              {paymentTiming === "NOW" ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting || cart.length === 0}
                    onClick={() => handleCreateOrder(false)}
                    className="py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all"
                  >
                    <span>🍳 Pagado • A Cocina</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || cart.length === 0}
                    onClick={() => handleCreateOrder(true)}
                    className="py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <span>⚡ Cobrar y Entregar</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting || cart.length === 0}
                  onClick={() => handleCreateOrder(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <span>🍳 Enviar a Cocina (Paga al Retirar)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop oscuro cuando el drawer está expandido (permite cerrar al tocar afuera) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 transition-opacity"
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL PARA COBRAR AL ENTREGAR (CASO CLIENTES QUE PAGAN AL RETIRAR)        */}
      {/* ========================================================================= */}
      {deliveringOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setDeliveringOrder(null)}
        >
          <div
            className="w-full max-w-sm bg-[#14161a] border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Cobro al Retirar • {deliveringOrder.tableNumber}</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeliveringOrder(null)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="text-center py-1 bg-[#101216] rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Total a Cobrar</span>
              <span className="text-xl font-black text-amber-400">{formatPrice(deliveringOrder.total)}</span>
            </div>

            {/* Medios de Pago */}
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => setDeliverPayMethod("CASH")}
                className={`py-1.5 rounded-lg text-xs font-bold ${
                  deliverPayMethod === "CASH" ? "bg-amber-500 text-black font-black" : "bg-gray-800 text-gray-300"
                }`}
              >
                💵 Efec.
              </button>
              <button
                type="button"
                onClick={() => setDeliverPayMethod("NEQUI")}
                className={`py-1.5 rounded-lg text-xs font-bold ${
                  deliverPayMethod === "NEQUI" ? "bg-amber-500 text-black font-black" : "bg-gray-800 text-gray-300"
                }`}
              >
                📱 Nequi
              </button>
              <button
                type="button"
                onClick={() => setDeliverPayMethod("CARD")}
                className={`py-1.5 rounded-lg text-xs font-bold ${
                  deliverPayMethod === "CARD" ? "bg-amber-500 text-black font-black" : "bg-gray-800 text-gray-300"
                }`}
              >
                💳 Tarjeta
              </button>
              <button
                type="button"
                onClick={() => setDeliverPayMethod("MIXED")}
                className={`py-1.5 rounded-lg text-xs font-bold ${
                  deliverPayMethod === "MIXED" ? "bg-amber-500 text-black font-black" : "bg-gray-800 text-gray-300"
                }`}
              >
                🔀 Mixto
              </button>
            </div>

            {/* Pago Mixto en Entrega */}
            {deliverPayMethod === "MIXED" && (
              <div className="p-2.5 bg-[#171a1f] border border-amber-500/30 rounded-xl space-y-1.5">
                <span className="text-[10px] font-black text-amber-400 uppercase block">Desglose Mixto</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-gray-400 block">Efectivo:</label>
                    <input
                      type="number"
                      value={deliverMixedCash || ""}
                      onChange={(e) => setDeliverMixedCash(Number(e.target.value))}
                      className="w-full bg-[#111317] border border-gray-700 rounded-lg px-2 py-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block">Nequi:</label>
                    <input
                      type="number"
                      value={Math.max(0, deliveringOrder.total - deliverMixedCash)}
                      readOnly
                      className="w-full bg-[#111317] border border-gray-700 rounded-lg px-2 py-1 text-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Calculadora de Vueltas */}
            {(deliverPayMethod === "CASH" || deliverPayMethod === "MIXED") && (
              <div className="bg-[#171a1f] p-2.5 rounded-xl border border-gray-800 space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                  <span>Paga con billete:</span>
                  <span className="text-emerald-400 font-black text-xs">
                    Devuelta:{" "}
                    {formatPrice(
                      Math.max(
                        0,
                        deliverCashGiven -
                          (deliverPayMethod === "MIXED" ? deliverMixedCash : deliveringOrder.total)
                      )
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setDeliverCashGiven(
                        deliverPayMethod === "MIXED" ? deliverMixedCash : deliveringOrder.total
                      )
                    }
                    className="py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold rounded-lg"
                  >
                    Exacto
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliverCashGiven(50000)}
                    className="py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold rounded-lg"
                  >
                    $50k
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliverCashGiven(100000)}
                    className="py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold rounded-lg"
                  >
                    $100k
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliverCashGiven(20000)}
                    className="py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold rounded-lg"
                  >
                    $20k
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                const mixedRemaining = Math.max(0, deliveringOrder.total - deliverMixedCash);
                const cashChange = Math.max(
                  0,
                  deliverCashGiven -
                    (deliverPayMethod === "MIXED" ? deliverMixedCash : deliveringOrder.total)
                );
                executeDeliver(deliveringOrder.id, {
                  paymentMethod: deliverPayMethod,
                  cashPaidAmount: deliverCashGiven,
                  cashChange,
                  mixedCash: deliverMixedCash,
                  mixedTransfer: mixedRemaining,
                });
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-black font-black text-xs rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Cobro y Entregar Pedido</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
