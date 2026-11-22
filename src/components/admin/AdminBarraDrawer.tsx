"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Zap,
  ShoppingBag,
  Clock,
  CheckCircle2,
  X,
  ChevronRight,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  Layers,
  Settings,
  Star,
  Flame,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatters";

interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  categoryName?: string;
  portions?: { label: string; price: number }[];
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

interface BarraConfig {
  activeBills: number[];
  paymentMethods: {
    cash: boolean;
    nequi: boolean;
    daviplata: boolean;
    card: boolean;
    mixed: boolean;
  };
  favoriteDishNames: string[];
}

const DEFAULT_CONFIG: BarraConfig = {
  activeBills: [100000, 50000, 20000, 10000, 5000, 2000],
  paymentMethods: {
    cash: true,
    nequi: true,
    daviplata: true,
    card: true,
    mixed: true,
  },
  favoriteDishNames: [
    "Pollo Asado Entero",
    "Medio Pollo Asado",
    "Cuarto de Pollo Asado",
    "Pollo Apanado Entero",
    "Medio Pollo Apanado",
    "Porción de Papa Salada",
    "Porción de Yuca al Vapor",
    "Gaseosa 1.5 Litros",
  ],
};

const BILL_COLORS: Record<number, { bg: string; text: string; border: string; badge: string; emoji: string }> = {
  100000: { bg: "bg-indigo-950/70 hover:bg-indigo-900", text: "text-indigo-300", border: "border-indigo-500/50", badge: "bg-indigo-950 text-indigo-200 border-indigo-500", emoji: "🟣" },
  50000: { bg: "bg-emerald-950/70 hover:bg-emerald-900", text: "text-emerald-300", border: "border-emerald-500/50", badge: "bg-emerald-950 text-emerald-200 border-emerald-500", emoji: "🟢" },
  20000: { bg: "bg-orange-950/70 hover:bg-orange-900", text: "text-orange-300", border: "border-orange-500/50", badge: "bg-orange-950 text-orange-200 border-orange-500", emoji: "🟠" },
  10000: { bg: "bg-cyan-950/70 hover:bg-cyan-900", text: "text-cyan-300", border: "border-cyan-500/50", badge: "bg-cyan-950 text-cyan-200 border-cyan-500", emoji: "🔵" },
  5000: { bg: "bg-amber-950/70 hover:bg-amber-900", text: "text-amber-300", border: "border-amber-600/50", badge: "bg-amber-950 text-amber-200 border-amber-600", emoji: "🟤" },
  2000: { bg: "bg-gray-900 hover:bg-gray-800", text: "text-gray-300", border: "border-gray-600/50", badge: "bg-gray-900 text-gray-200 border-gray-600", emoji: "🔘" },
  1000: { bg: "bg-gray-900 hover:bg-gray-800", text: "text-gray-400", border: "border-gray-700/50", badge: "bg-gray-900 text-gray-300 border-gray-700", emoji: "🪙" },
};

export function AdminBarraDrawer() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"new" | "queue">("new");

  // Configuración editable de la barra
  const [barraConfig, setBarraConfig] = useState<BarraConfig>(DEFAULT_CONFIG);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // Datos del nuevo pedido
  const [customerName, setCustomerName] = useState<string>("");
  const [destination, setDestination] = useState<"LLEVAR" | "BARRA">("LLEVAR");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentTiming, setPaymentTiming] = useState<"NOW" | "ON_DELIVERY">("NOW");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "NEQUI" | "DAVIPLATA" | "CARD" | "MIXED">("CASH");

  // Billetes acumulables seleccionados por el cajero
  const [selectedBills, setSelectedBills] = useState<number[]>([]);
  const [mixedCash, setMixedCash] = useState<number>(0);
  const [mixedTransfer, setMixedTransfer] = useState<number>(0);

  // Estados de catálogo y búsqueda
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [allDishes, setAllDishes] = useState<MenuItem[]>([]);

  // Pedidos activos en cola de barra
  const [activeOrders, setActiveOrders] = useState<BarraOrder[]>([]);
  const [nextTicket, setNextTicket] = useState<string>("#01");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal para entregar/cobrar al entregar
  const [deliveringOrder, setDeliveringOrder] = useState<BarraOrder | null>(null);
  const [deliverPayMethod, setDeliverPayMethod] = useState<"CASH" | "NEQUI" | "CARD" | "MIXED">("CASH");
  const [deliverBills, setDeliverBills] = useState<number[]>([]);

  // Total de la canasta
  const cartTotal = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  }, [cart]);

  // Total de efectivo recibido sumando todos los billetes seleccionados
  const totalCashReceived = useMemo(() => {
    return selectedBills.reduce((acc, curr) => acc + curr, 0);
  }, [selectedBills]);

  // Vueltas o cambio a entregar
  const cashChange = useMemo(() => {
    const amountToCover = paymentMethod === "MIXED" ? mixedCash : cartTotal;
    return Math.max(0, totalCashReceived - amountToCover);
  }, [totalCashReceived, cartTotal, paymentMethod, mixedCash]);

  // Cargar configuración de barra, platos y pedidos activos
  const loadConfig = async () => {
    try {
      const res = await fetch("/api/admin/barra/config");
      const json = await res.json();
      if (json.success && json.data) {
        setBarraConfig(json.data);
      }
    } catch {
      try {
        const local = localStorage.getItem("pio_barra_config");
        if (local) setBarraConfig(JSON.parse(local));
      } catch {}
    }
  };

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
    } catch {}
  };

  const fetchMenuDishes = async () => {
    try {
      const res = await fetch("/api/public/menu");
      const json = await res.json();
      if (json.success && json.data?.categories) {
        const dishList: MenuItem[] = [];
        json.data.categories.forEach((cat: any) => {
          cat.dishes.forEach((d: any) => {
            if (d.isAvailable) {
              dishList.push({
                id: d.id,
                name: d.name,
                basePrice: d.basePrice,
                categoryName: cat.name,
                portions: d.portions?.map((p: any) => ({ label: p.label, price: p.price })) || [],
              });
            }
          });
        });
        setAllDishes(dishList);
      }
    } catch {}
  };

  useEffect(() => {
    loadConfig();
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
    }
  }, [cartTotal]);

  // Manejador de billetes acumulables
  const handleAddBill = (amount: number) => {
    setSelectedBills((prev) => [...prev, amount]);
  };

  const handleRemoveBillAt = (index: number) => {
    setSelectedBills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetBills = () => {
    setSelectedBills([]);
  };

  const handleSetExactCash = () => {
    const target = paymentMethod === "MIXED" ? mixedCash : cartTotal;
    if (target > 0) {
      setSelectedBills([target]);
    }
  };

  // Carrito de compras
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
    setSelectedBills([]);
  };

  // Platos filtrados en vivo por el buscador persistente
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allDishes
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.categoryName && d.categoryName.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [searchQuery, allDishes]);

  // Platos favoritos configurados por el Administrador
  const favoriteDishes = useMemo(() => {
    if (!barraConfig.favoriteDishNames || barraConfig.favoriteDishNames.length === 0) {
      return allDishes.slice(0, 8);
    }
    return allDishes.filter((d) => barraConfig.favoriteDishNames.includes(d.name));
  }, [allDishes, barraConfig.favoriteDishNames]);

  // Guardar configuración del Administrador
  const handleSaveConfig = async (newConfig: BarraConfig) => {
    try {
      setBarraConfig(newConfig);
      localStorage.setItem("pio_barra_config", JSON.stringify(newConfig));
      const res = await fetch("/api/admin/barra/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Configuración de barra guardada con éxito");
      }
    } catch {
      toast.success("Configuración guardada localmente");
    } finally {
      setShowConfigModal(false);
    }
  };

  // Crear y Enviar Pedido
  const handleCreateOrder = async (isDeliveredImmediately: boolean) => {
    if (cart.length === 0) {
      toast.error("Agrega al menos un plato a la comanda");
      return;
    }

    if (paymentTiming === "NOW" && paymentMethod === "CASH" && totalCashReceived < cartTotal) {
      toast.error(`El efectivo entregado (${formatPrice(totalCashReceived)}) es menor a la cuenta (${formatPrice(cartTotal)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim() || "Cliente Mostrador",
        destination,
        items: cart,
        paymentTiming,
        paymentMethod: paymentMethod === "DAVIPLATA" ? "NEQUI" : paymentMethod,
        cashPaidAmount: totalCashReceived,
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

      toast.success(json.message || "Pedido de barra registrado con éxito");
      clearCart();

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

  // Entrega y cobro en cola
  const handleDeliverOrder = async (order: BarraOrder) => {
    const isPendingPayment = order.closedBy === "PENDIENTE_PAGO" || !order.closedBy?.startsWith("PAGADO_PREVIO");

    if (isPendingPayment) {
      setDeliveringOrder(order);
      setDeliverPayMethod("CASH");
      setDeliverBills([order.total]);
      return;
    }

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
            <Zap className="w-4 h-4 fill-black" />
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
        {/* 2. PANEL INTERIOR DESPLEGABLE HACIA LA DERECHA (CAJÓN LATERAL DE 460PX)    */}
        {/* ========================================================================= */}
        <div
          className={`pointer-events-auto h-full bg-[#14161a] border-r border-gray-800 flex flex-col justify-between shadow-2xl transition-all duration-300 overflow-hidden ${
            isOpen
              ? "w-[460px] max-w-[calc(100vw-44px)] opacity-100"
              : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          {/* Cabecera del Panel de Barra */}
          <div className="p-3.5 bg-[#101216] border-b border-gray-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                <Zap className="w-4 h-4 fill-amber-400" />
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

            <div className="flex items-center gap-1.5">
              {/* Botón de Configuración de Barra para el Admin */}
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="p-1.5 bg-[#181b20] hover:bg-gray-800 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                title="Configurar barra (favoritos, formas de pago y billetes)"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="text-[10px]">Ajustes</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                title="Replegar panel"
              >
                <span>&lt;</span>
              </button>
            </div>
          </div>

          {/* Pestañas Superiores: Nuevo Pedido vs Esperando Entrega */}
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
              
              {/* BARRA DE BÚSQUEDA PERMANENTE (SIEMPRE VISIBLE STICKY TOP) */}
              <div className="sticky top-0 z-10 bg-[#14161a] pb-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar plato en barra (siempre visible)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#181b20] border-2 border-amber-500/40 focus:border-amber-400 rounded-xl pl-9 pr-7 py-2 text-xs text-white placeholder-gray-500 focus:outline-none shadow-md transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Despliegue de resultados de búsqueda rápida */}
                {searchResults.length > 0 && (
                  <div className="mt-1 bg-[#181b20] border border-amber-500/40 rounded-xl overflow-hidden divide-y divide-gray-800 shadow-2xl max-h-48 overflow-y-auto">
                    {searchResults.map((dish) => (
                      <div
                        key={dish.id}
                        onClick={() => {
                          addToCart(dish.name, dish.basePrice, dish.id);
                          setSearchQuery("");
                        }}
                        className="p-2 hover:bg-gray-800/90 cursor-pointer flex justify-between items-center transition-all group"
                      >
                        <div>
                          <span className="font-bold text-white text-xs group-hover:text-amber-400">{dish.name}</span>
                          <span className="text-[10px] text-gray-500 ml-1.5 uppercase">{dish.categoryName}</span>
                        </div>
                        <span className="font-black text-amber-400 text-xs">{formatPrice(dish.basePrice)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

              {/* Favoritos de Mostrador Configurables por el Admin */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Favoritos de Mostrador</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className="text-[10px] text-amber-400 hover:underline font-bold"
                  >
                    Editar Favoritos
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {favoriteDishes.slice(0, 8).map((fav) => (
                    <button
                      key={fav.id || fav.name}
                      type="button"
                      onClick={() => addToCart(fav.name, fav.basePrice, fav.id)}
                      className="p-2 bg-[#181b20] hover:bg-gray-800 border border-gray-800 hover:border-amber-500/40 rounded-xl text-left active:scale-95 transition-all group shadow-sm"
                    >
                      <p className="font-bold text-white text-xs truncate group-hover:text-amber-400">{fav.name}</p>
                      <p className="text-amber-400 font-black text-[11px] mt-0.5">{formatPrice(fav.basePrice)}</p>
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
                      className="text-[10px] text-red-400 hover:underline font-bold"
                    >
                      Vaciar
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <p className="text-center py-4 text-gray-500 text-[11px]">
                    Canasta vacía. Pulsa favoritos o busca platos arriba para agregar.
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
                          {item.portionLabel && (
                            <span className="text-[10px] text-amber-400 font-semibold">{item.portionLabel}</span>
                          )}
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
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-xs text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(idx, 1)}
                            className="w-6 h-6 rounded-lg bg-gray-800 text-gray-300 hover:text-white flex items-center justify-center text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCartItem(idx)}
                            className="w-6 h-6 rounded-lg text-gray-500 hover:text-red-400 flex items-center justify-center ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selector de Momento de Pago */}
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

              {/* Si Paga Ahora: Formas de Pago y Calculadora de Billetes Acumulables */}
              {paymentTiming === "NOW" && (
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                    Forma de Pago
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {barraConfig.paymentMethods.cash && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("CASH")}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          paymentMethod === "CASH"
                            ? "bg-amber-500 text-black font-black shadow-sm"
                            : "bg-[#181b20] text-gray-300 border border-gray-800"
                        }`}
                      >
                        💵 Efectivo
                      </button>
                    )}
                    {barraConfig.paymentMethods.nequi && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("NEQUI")}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          paymentMethod === "NEQUI"
                            ? "bg-purple-600 text-white font-black shadow-sm"
                            : "bg-[#181b20] text-gray-300 border border-gray-800"
                        }`}
                      >
                        🟣 Nequi
                      </button>
                    )}
                    {barraConfig.paymentMethods.card && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("CARD")}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          paymentMethod === "CARD"
                            ? "bg-blue-600 text-white font-black shadow-sm"
                            : "bg-[#181b20] text-gray-300 border border-gray-800"
                        }`}
                      >
                        💳 Tarjeta
                      </button>
                    )}
                    {barraConfig.paymentMethods.mixed && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("MIXED")}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          paymentMethod === "MIXED"
                            ? "bg-orange-500 text-black font-black shadow-sm"
                            : "bg-[#181b20] text-gray-300 border border-gray-800"
                        }`}
                      >
                        🔀 Mixto
                      </button>
                    )}
                  </div>

                  {/* Desglose de Pago Mixto */}
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
                          <label className="text-[10px] text-gray-400 font-bold block">📱 Transferencia:</label>
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

                  {/* CALCULADORA DE BILLETES ACUMULABLES Y DESELECCIONABLES */}
                  {(paymentMethod === "CASH" || paymentMethod === "MIXED") && (
                    <div className="bg-[#171a1f] p-2.5 rounded-xl border border-gray-800 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                        <span>Billetes Entregados (Auto-Suma):</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleSetExactCash}
                            className="text-amber-400 hover:underline font-bold"
                          >
                            Exacto
                          </button>
                          <button
                            type="button"
                            onClick={handleResetBills}
                            className="text-gray-400 hover:text-white"
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>

                      {/* Botonera de Billetes Activos configurados por el Admin */}
                      <div className="grid grid-cols-3 gap-1">
                        {barraConfig.activeBills.map((bill) => {
                          const style = BILL_COLORS[bill] || {
                            bg: "bg-gray-800 hover:bg-gray-700",
                            text: "text-gray-200",
                            border: "border-gray-700",
                            emoji: "💵",
                          };
                          return (
                            <button
                              key={bill}
                              type="button"
                              onClick={() => handleAddBill(bill)}
                              className={`py-1.5 px-1.5 rounded-lg ${style.bg} border ${style.border} ${style.text} font-black text-xs flex items-center justify-between shadow-sm active:scale-95 transition-all`}
                            >
                              <span>{formatPrice(bill)}</span>
                              <span className="text-[10px]">{style.emoji}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Bandeja de billetes seleccionados (Chips interactivos con botón ✕) */}
                      <div className="bg-[#0e1116] border border-gray-800 rounded-lg p-1.5 min-h-[38px] flex flex-wrap items-center gap-1">
                        {selectedBills.length === 0 ? (
                          <span className="text-[10px] text-gray-500 italic">
                            Toca los billetes arriba para ingresar el pago...
                          </span>
                        ) : (
                          selectedBills.map((bill, idx) => {
                            const style = BILL_COLORS[bill] || {
                              badge: "bg-gray-800 text-gray-200 border-gray-700",
                            };
                            return (
                              <div
                                key={idx}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-black shadow-sm ${style.badge}`}
                              >
                                <span>{formatPrice(bill)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBillAt(idx)}
                                  className="w-3.5 h-3.5 rounded-full bg-black/40 hover:bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold"
                                  title="Quitar billete"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Total entregado y Vueltas en verde fluorescente */}
                      <div className="pt-1.5 border-t border-gray-800 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-bold">Total Recibido:</span>
                          <span className="font-bold text-white">{formatPrice(totalCashReceived)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-400 block font-extrabold uppercase">
                            Vueltas / Cambio:
                          </span>
                          <span className="text-base font-black text-emerald-400">
                            {formatPrice(cashChange)}
                          </span>
                        </div>
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
                <div className="space-y-2.5">
                  {activeOrders.map((order) => {
                    const isPrepaid = order.closedBy?.startsWith("PAGADO_PREVIO");
                    return (
                      <div
                        key={order.id}
                        className="p-3 bg-[#181b20] border border-gray-800 rounded-2xl space-y-2 hover:border-gray-700 transition-all shadow-md"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-white text-xs block">
                              {order.tableNumber}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {order.items[0]?.notes?.replace("LLEVAR - ", "") || "Cliente"}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                              isPrepaid
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            }`}
                          >
                            {isPrepaid ? "✓ Pagado" : "⏳ Pendiente Pago"}
                          </span>
                        </div>

                        {/* Items del pedido */}
                        <div className="p-2 bg-[#101216] rounded-xl space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-gray-300">
                              <span>
                                {it.quantity}x {it.dishName}
                              </span>
                              <span className="font-bold text-gray-400">{formatPrice(it.subtotal)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Total y botón de entrega */}
                        <div className="flex justify-between items-center pt-1 border-t border-gray-800/80">
                          <div>
                            <span className="text-[9px] text-gray-500 uppercase block font-bold">Total</span>
                            <span className="font-black text-amber-400 text-xs">
                              {formatPrice(order.total)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeliverOrder(order)}
                            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 ${
                              isPrepaid
                                ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                                : "bg-amber-500 hover:bg-amber-400 text-black"
                            }`}
                          >
                            {isPrepaid ? "Entregar" : "Cobrar al Entregar"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pie de Panel: Total y Botón Maestro de Cobro */}
          {activeTab === "new" && (
            <div className="p-3.5 bg-[#101216] border-t border-gray-800 shrink-0 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">TOTAL A COBRAR:</span>
                <span className="text-base font-black text-amber-400">{formatPrice(cartTotal)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isSubmitting || cart.length === 0}
                  onClick={() => handleCreateOrder(true)}
                  className="py-2.5 px-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-black font-black text-[11px] rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cobrar Vitrina</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || cart.length === 0}
                  onClick={() => handleCreateOrder(false)}
                  className="py-2.5 px-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-black font-black text-[11px] rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Enviar a Cocina</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Backdrop oscuro cuando el drawer está expandido */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 transition-opacity"
        />
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL DE CONFIGURACIÓN DEL ADMIN (EDITAR FAVORITOS, PAGOS Y BILLETES)  */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowConfigModal(false)}
        >
          <div
            className="bg-[#14171e] border border-gray-800 rounded-3xl w-full max-w-xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-black text-white">CONFIGURACIÓN DE BARRA & PEDIDOS RÁPIDOS</h2>
                  <p className="text-[11px] text-gray-400">Personaliza los accesos y denominaciones para el mostrador</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-black text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Ajuste 1: Billetes Activos */}
            <div className="space-y-2 bg-[#181b22] p-3 rounded-2xl border border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  1. Billetes y Monedas Disponibles
                </h3>
                <span className="text-[10px] text-gray-400">Calculadora de Vueltas</span>
              </div>
              <p className="text-[11px] text-gray-400">Selecciona qué billetes aparecen en la botonera acumulable.</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {[100000, 50000, 20000, 10000, 5000, 2000, 1000].map((bill) => {
                  const isChecked = barraConfig.activeBills.includes(bill);
                  return (
                    <label
                      key={bill}
                      className="flex items-center gap-2 p-2 rounded-xl bg-[#20252e] border border-gray-700 text-xs font-bold cursor-pointer hover:border-amber-500/50 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...barraConfig.activeBills, bill].sort((a, b) => b - a)
                            : barraConfig.activeBills.filter((b) => b !== bill);
                          setBarraConfig((prev) => ({ ...prev, activeBills: updated }));
                        }}
                        className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                      />
                      <span>{formatPrice(bill)} COP</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Ajuste 2: Formas de Pago */}
            <div className="space-y-2 bg-[#181b22] p-3 rounded-2xl border border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  2. Formas de Pago Habilitadas en Barra
                </h3>
                <span className="text-[10px] text-gray-400">Canales de Cobro</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {[
                  { key: "cash", label: "💵 Efectivo" },
                  { key: "nequi", label: "🟣 Nequi" },
                  { key: "daviplata", label: "🔴 Daviplata" },
                  { key: "card", label: "💳 Tarjeta / Datáfono" },
                  { key: "mixed", label: "🔀 Pago Mixto" },
                ].map((method) => {
                  const isChecked = (barraConfig.paymentMethods as any)[method.key] ?? true;
                  return (
                    <label
                      key={method.key}
                      className="flex items-center gap-2 p-2 rounded-xl bg-[#20252e] border border-gray-700 text-xs font-bold cursor-pointer hover:border-amber-500/50 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          setBarraConfig((prev) => ({
                            ...prev,
                            paymentMethods: {
                              ...prev.paymentMethods,
                              [method.key]: e.target.checked,
                            },
                          }));
                        }}
                        className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                      />
                      <span>{method.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Ajuste 3: Platos Favoritos de Mostrador */}
            <div className="space-y-2 bg-[#181b22] p-3 rounded-2xl border border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  3. Platos Favoritos de Mostrador (Botonera Rápida)
                </h3>
                <span className="text-[10px] text-gray-400">
                  {barraConfig.favoriteDishNames.length} seleccionados
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Marca los platos que quieres ver en la lista de favoritos.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-44 overflow-y-auto pr-1">
                {allDishes.map((dish) => {
                  const isFav = barraConfig.favoriteDishNames.includes(dish.name);
                  return (
                    <label
                      key={dish.id}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        isFav
                          ? "bg-[#20252e] border-amber-500/40 text-white"
                          : "bg-[#181b22] border-gray-800 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isFav}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...barraConfig.favoriteDishNames, dish.name]
                              : barraConfig.favoriteDishNames.filter((n) => n !== dish.name);
                            setBarraConfig((prev) => ({ ...prev, favoriteDishNames: updated }));
                          }}
                          className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                        />
                        <span className="line-clamp-1">{dish.name}</span>
                      </div>
                      <span className="text-amber-400 font-black shrink-0">{formatPrice(dish.basePrice)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveConfig(barraConfig)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black shadow-lg hover:from-amber-400 hover:to-orange-400"
              >
                ✓ Guardar Cambios
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL PARA COBRAR AL ENTREGAR (CASO CLIENTES QUE PAGAN AL RETIRAR)     */}
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
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#181b22] p-3 rounded-2xl border border-gray-800 flex justify-between items-center text-xs">
              <span className="text-gray-400">Total a Pagar:</span>
              <span className="text-base font-black text-amber-400">{formatPrice(deliveringOrder.total)}</span>
            </div>

            {/* Método de Pago */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDeliverPayMethod("CASH")}
                  className={`py-2 rounded-xl font-bold border ${
                    deliverPayMethod === "CASH"
                      ? "bg-amber-500 text-black font-black border-amber-400"
                      : "bg-[#181b22] text-gray-300 border-gray-800"
                  }`}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setDeliverPayMethod("NEQUI")}
                  className={`py-2 rounded-xl font-bold border ${
                    deliverPayMethod === "NEQUI"
                      ? "bg-purple-600 text-white font-black border-purple-400"
                      : "bg-[#181b22] text-gray-300 border-gray-800"
                  }`}
                >
                  Nequi
                </button>
                <button
                  type="button"
                  onClick={() => setDeliverPayMethod("CARD")}
                  className={`py-2 rounded-xl font-bold border ${
                    deliverPayMethod === "CARD"
                      ? "bg-blue-600 text-white font-black border-blue-400"
                      : "bg-[#181b22] text-gray-300 border-gray-800"
                  }`}
                >
                  Tarjeta
                </button>
              </div>
            </div>

            {/* Billetes en entrega si es efectivo */}
            {deliverPayMethod === "CASH" && (
              <div className="space-y-2 bg-[#181b22] p-2.5 rounded-2xl border border-gray-800">
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span>Billetes Entregados:</span>
                  <button
                    type="button"
                    onClick={() => setDeliverBills([deliveringOrder.total])}
                    className="text-amber-400 font-bold hover:underline"
                  >
                    Exacto
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {barraConfig.activeBills.slice(0, 6).map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setDeliverBills((prev) => [...prev, bill])}
                      className="py-1 px-1 rounded-lg bg-[#20252e] hover:bg-gray-700 text-[10px] font-bold text-gray-200 border border-gray-700"
                    >
                      {formatPrice(bill)}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Recibido</span>
                    <span className="font-bold text-white">
                      {formatPrice(deliverBills.reduce((a, b) => a + b, 0))}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 block font-bold">Vueltas</span>
                    <span className="text-sm font-black text-emerald-400">
                      {formatPrice(Math.max(0, deliverBills.reduce((a, b) => a + b, 0) - deliveringOrder.total))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                const totalGiven = deliverBills.reduce((a, b) => a + b, 0);
                const change = Math.max(0, totalGiven - deliveringOrder.total);
                executeDeliver(deliveringOrder.id, {
                  paymentMethod: deliverPayMethod,
                  cashPaidAmount: totalGiven,
                  cashChange: change,
                });
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider shadow-xl transition-all"
            >
              ✓ Confirmar Cobro y Despachar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
