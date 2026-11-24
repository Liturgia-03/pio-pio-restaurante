"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Zap,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  Layers,
  Settings,
  Flame,
  Check,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatters";

interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  categoryName?: string;
  imageUrl?: string;
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
    "Consomé de Menudencias",
    "Arroz con Pollo Campesino",
    "Costillas BBQ a la Brasa",
    "Churrasco 350g",
  ],
};

const BILL_CONFIG: Record<
  number,
  { bg: string; border: string; text: string; badgeBg: string; badgeColor: string; emoji: string }
> = {
  100000: { bg: "bg-[#181c2e]", border: "border-indigo-500/50", text: "text-indigo-300", badgeBg: "bg-indigo-950", badgeColor: "text-indigo-200 border-indigo-500", emoji: "🟣" },
  50000: { bg: "bg-[#12261e]", border: "border-emerald-500/50", text: "text-emerald-300", badgeBg: "bg-emerald-950", badgeColor: "text-emerald-200 border-emerald-500", emoji: "🟢" },
  20000: { bg: "bg-[#2b1b11]", border: "border-orange-500/50", text: "text-orange-300", badgeBg: "bg-orange-950", badgeColor: "text-orange-200 border-orange-500", emoji: "🟠" },
  10000: { bg: "bg-[#11232e]", border: "border-cyan-500/50", text: "text-cyan-300", badgeBg: "bg-cyan-950", badgeColor: "text-cyan-200 border-cyan-500", emoji: "🔵" },
  5000: { bg: "bg-[#261e14]", border: "border-amber-600/50", text: "text-amber-300", badgeBg: "bg-amber-950", badgeColor: "text-amber-200 border-amber-600", emoji: "🟤" },
  2000: { bg: "bg-[#1a1e24]", border: "border-gray-600/50", text: "text-gray-300", badgeBg: "bg-gray-900", badgeColor: "text-gray-200 border-gray-600", emoji: "🔘" },
  1000: { bg: "bg-[#161a20]", border: "border-gray-700/50", text: "text-gray-400", badgeBg: "bg-gray-900", badgeColor: "text-gray-300 border-gray-700", emoji: "🪙" },
};

export function AdminBarraDrawer() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"pos" | "queue">("pos");

  // Configuración editable de la barra
  const [barraConfig, setBarraConfig] = useState<BarraConfig>(DEFAULT_CONFIG);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // Datos del nuevo pedido
  const [customerName, setCustomerName] = useState<string>("");
  const [destination, setDestination] = useState<"LLEVAR" | "BARRA">("LLEVAR");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentTiming, setPaymentTiming] = useState<"NOW" | "ON_DELIVERY">("NOW");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "NEQUI" | "CARD" | "MIXED">("CASH");

  // Billetes acumulables seleccionados por el cajero
  const [selectedBills, setSelectedBills] = useState<number[]>([]);
  const [mixedCash, setMixedCash] = useState<number>(0);
  const [mixedTransfer, setMixedTransfer] = useState<number>(0);

  // Estados de catálogo, categorías y búsqueda
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
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
  const loadConfig = useCallback(async () => {
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
  }, []);

  const fetchBarraData = useCallback(async () => {
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
  }, []);

  const fetchMenuDishes = useCallback(async () => {
    try {
      const res = await fetch("/api/public/menu");
      const json = await res.json();
      if (json.success && json.data?.categories) {
        const catList: { id: string; name: string }[] = [];
        const dishList: MenuItem[] = [];

        json.data.categories.forEach((cat: any) => {
          catList.push({ id: cat.id, name: cat.name });
          cat.dishes.forEach((d: any) => {
            if (d.isAvailable) {
              dishList.push({
                id: d.id,
                name: d.name,
                basePrice: d.basePrice,
                categoryName: cat.name,
                imageUrl: d.imageUrl || "/logo-pio-pio.png",
                portions: d.portions?.map((p: any) => ({ label: p.label, price: p.price })) || [],
              });
            }
          });
        });

        setAllCategories(catList);
        setAllDishes(dishList);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadConfig();
    fetchBarraData();
    fetchMenuDishes();
    const interval = setInterval(fetchBarraData, 12000);
    return () => clearInterval(interval);
  }, [loadConfig, fetchBarraData, fetchMenuDishes]);

  // Ajustar valores de pago mixto cuando cambia el total
  useEffect(() => {
    if (cartTotal > 0) {
      const half = Math.floor(cartTotal / 2000) * 1000;
      setMixedCash(half);
      setMixedTransfer(cartTotal - half);
    }
  }, [cartTotal]);

  // Manejo de billetes acumulables
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

  // Platos filtrados en la cuadrícula de 4 columnas (búsqueda + categoría + favoritos)
  const displayedDishes = useMemo(() => {
    let result = allDishes;
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.categoryName && d.categoryName.toLowerCase().includes(q))
      );
    } else if (selectedCategory !== "TODAS") {
      result = result.filter((d) => d.categoryName === selectedCategory);
    } else if (barraConfig.favoriteDishNames && barraConfig.favoriteDishNames.length > 0) {
      // Priorizar los favoritos de mostrador en la vista inicial
      const favs = allDishes.filter((d) => barraConfig.favoriteDishNames.includes(d.name));
      const rest = allDishes.filter((d) => !barraConfig.favoriteDishNames.includes(d.name));
      result = [...favs, ...rest];
    }

    return result.slice(0, 16);
  }, [allDishes, searchQuery, selectedCategory, barraConfig.favoriteDishNames]);

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
        toast.success("Configuración de barra guardada");
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
        paymentMethod,
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
      {/* 1. FRANJA VERTICAL FIJA (IDÉNTICA A LA IMAGEN 01 Y 02)                    */}
      {/* ========================================================================= */}
      <div
        className={`fixed left-0 md:left-64 top-0 bottom-0 z-40 flex items-stretch select-none pointer-events-none ${
          isOpen ? "pointer-events-auto" : ""
        }`}
      >
        {/* ======================================================================= */}
        {/* PANEL DESPLEGADO HACIA LA DERECHA (IMAGEN 02)                           */}
        {/* ======================================================================= */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto h-full bg-[#101217] border-r border-gray-800/80 flex shadow-2xl transition-all duration-300 overflow-hidden ${
            isOpen
              ? "w-[960px] max-w-[calc(100vw-54px)] opacity-100"
              : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          {activeTab === "pos" ? (
            <div className="flex-1 flex overflow-hidden">
              
              {/* ----------------------------------------------------------------- */}
              {/* COLUMNA IZQUIERDA: CATÁLOGO, BUSCADOR Y FOTOS (4 COLUMNAS)         */}
              {/* ----------------------------------------------------------------- */}
              <div className="w-[52%] border-r border-gray-800/80 p-3.5 flex flex-col justify-between overflow-hidden bg-[#0d0f14]">
                <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                  
                  {/* Fila 1: Buscador + Carrusel de Categorías + Botón + morado */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Buscador compacto con icono de lupa */}
                    <div className="relative w-36 sm:w-44 shrink-0">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#181b22] border border-gray-700/60 rounded-xl pl-8 pr-2 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 shadow-inner"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-2 text-gray-400 hover:text-white text-[10px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Carrusel de Categorías (texto: 'categorias del menu') */}
                    <div className="flex-1 flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("TODAS")}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
                          selectedCategory === "TODAS"
                            ? "bg-amber-500 text-black font-black"
                            : "bg-[#181b22] text-gray-400 hover:text-white"
                        }`}
                      >
                        Todas
                      </button>
                      {allCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
                            selectedCategory === cat.name
                              ? "bg-amber-500 text-black font-black"
                              : "bg-[#181b22] text-gray-400 hover:text-white"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    {/* Botón Circular Morado '+' de la imagen 02 (Ajustes y Favoritos) */}
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(true)}
                      className="w-7 h-7 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white flex items-center justify-center font-black text-sm shadow-md transition-transform active:scale-90 shrink-0"
                      title="Configurar favoritos de mostrador y formas de pago"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>

                  {/* Subtítulo: 'favoritos mostrador' */}
                  <div className="flex items-center justify-between shrink-0 px-0.5">
                    <span className="text-xs font-black italic text-gray-200 tracking-wide">
                      favoritos mostrador
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                      Ticket {nextTicket}
                    </span>
                  </div>

                  {/* Cuadrícula Táctil: 4 Columnas x Filas con Fotos Reales de Platos */}
                  <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-4 gap-2 custom-scrollbar">
                    {displayedDishes.map((dish) => {
                      const countInCart = cart
                        .filter((c) => c.dishName === dish.name)
                        .reduce((a, b) => a + b.quantity, 0);

                      return (
                        <div
                          key={dish.id}
                          onClick={() => addToCart(dish.name, dish.basePrice, dish.id)}
                          className="bg-[#181b22] border border-gray-800 hover:border-amber-500/60 rounded-xl overflow-hidden cursor-pointer transition-all active:scale-95 group relative shadow-md flex flex-col justify-between"
                        >
                          {/* Badge de cantidad si ya está en canasta */}
                          {countInCart > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#8b5cf6] text-white font-black text-[10px] flex items-center justify-center shadow-lg z-10 animate-scale-in">
                              {countInCart}
                            </span>
                          )}

                          {/* Foto del plato */}
                          <div className="h-16 w-full bg-[#101216] overflow-hidden relative">
                            <img
                              src={dish.imageUrl || "/logo-pio-pio.png"}
                              alt={dish.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>

                          {/* Pie de la tarjeta con nombre y precio */}
                          <div className="p-1 bg-[#14161d] text-center border-t border-gray-800/80">
                            <p className="text-[10px] font-bold text-white group-hover:text-amber-400 truncate leading-tight">
                              {dish.name}
                            </p>
                            <p className="text-[10px] font-black text-amber-400">
                              {formatPrice(dish.basePrice)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Switch inferior para cambiar a pedidos en espera */}
                <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">Modalidad:</span>
                    <button
                      type="button"
                      onClick={() => setDestination("LLEVAR")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        destination === "LLEVAR" ? "bg-amber-500 text-black font-black" : "text-gray-400"
                      }`}
                    >
                      Llevar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestination("BARRA")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        destination === "BARRA" ? "bg-amber-500 text-black font-black" : "text-gray-400"
                      }`}
                    >
                      Barra
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("queue")}
                    className="text-[10px] text-amber-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Ver Cola de Espera ({activeOrders.length})</span>
                  </button>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* COLUMNA DERECHA: PANEL DE COBRO Y DESPACHO                         */}
              {/* ----------------------------------------------------------------- */}
              <div className="w-[48%] bg-[#12141a] p-3.5 flex flex-col justify-between overflow-y-auto space-y-3">
                <div className="space-y-3">
                  
                  {/* 1. MOMENTO DEL PAGO */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                      MOMENTO DEL PAGO
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentTiming("NOW")}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${
                          paymentTiming === "NOW"
                            ? "bg-[#f97316] text-black font-black"
                            : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Paga Ahora</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentTiming("ON_DELIVERY")}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${
                          paymentTiming === "ON_DELIVERY"
                            ? "bg-[#f97316] text-black font-black"
                            : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Paga al Entregar</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. FORMA DE PAGO */}
                  {paymentTiming === "NOW" && (
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                        FORMA DE PAGO
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("CASH")}
                          className={`py-1.5 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                            paymentMethod === "CASH"
                              ? "bg-[#f59e0b] text-black shadow-md border border-amber-300"
                              : "bg-[#181b22] text-gray-300 border border-gray-800 hover:border-gray-700"
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Efectivo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("NEQUI")}
                          className={`py-1.5 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                            paymentMethod === "NEQUI"
                              ? "bg-purple-600 text-white shadow-md border border-purple-400"
                              : "bg-[#181b22] text-gray-300 border border-gray-800 hover:border-gray-700"
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Nequi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("CARD")}
                          className={`py-1.5 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                            paymentMethod === "CARD"
                              ? "bg-blue-600 text-white shadow-md border border-blue-400"
                              : "bg-[#181b22] text-gray-300 border border-gray-800 hover:border-gray-700"
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Tarjeta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("MIXED")}
                          className={`py-1.5 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                            paymentMethod === "MIXED"
                              ? "bg-orange-500 text-black shadow-md border border-orange-400"
                              : "bg-[#181b22] text-gray-300 border border-gray-800 hover:border-gray-700"
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Mixto</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. BILLETES ENTREGADOS (AUTO-SUMA) */}
                  {paymentTiming === "NOW" && (paymentMethod === "CASH" || paymentMethod === "MIXED") && (
                    <div className="bg-[#181b22] p-2.5 rounded-2xl border border-gray-800 space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-black text-gray-300">Billetes Entregados (Auto-Suma):</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSetExactCash}
                            className="text-amber-400 font-black hover:underline"
                          >
                            Exacto
                          </button>
                          <button
                            type="button"
                            onClick={handleResetBills}
                            className="text-gray-400 hover:text-white font-bold"
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>

                      {/* Botonera de 6 Billetes (3 columnas x 2 filas) */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {barraConfig.activeBills.slice(0, 6).map((bill) => {
                          const conf = BILL_CONFIG[bill] || {
                            bg: "bg-[#1a1e24]",
                            border: "border-gray-700",
                            text: "text-gray-200",
                            emoji: "💵",
                          };

                          return (
                            <button
                              key={bill}
                              type="button"
                              onClick={() => handleAddBill(bill)}
                              className={`py-1.5 px-2 rounded-xl ${conf.bg} border ${conf.border} ${conf.text} font-black text-xs flex items-center justify-between shadow-sm active:scale-95 transition-all`}
                            >
                              <span>{formatPrice(bill)}</span>
                              <span className="text-[10px]">{conf.emoji}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Bandeja de Billetes Seleccionados con botón ✕ */}
                      <div className="bg-[#0e1015] border border-gray-800 rounded-xl p-1.5 min-h-[38px] flex flex-wrap items-center gap-1">
                        {selectedBills.length === 0 ? (
                          <span className="text-[10px] text-gray-500 italic">
                            Toca los billetes arriba para ingresar el pago...
                          </span>
                        ) : (
                          selectedBills.map((bill, idx) => {
                            const conf = BILL_CONFIG[bill] || {
                              badgeBg: "bg-gray-800",
                              badgeColor: "text-gray-200 border-gray-700",
                            };
                            return (
                              <div
                                key={idx}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black shadow-sm ${conf.badgeBg} ${conf.badgeColor}`}
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

                      {/* Resumen Financiero: Total Recibido vs Vueltas en verde fluorescente */}
                      <div className="pt-1.5 border-t border-gray-800 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-bold">Total Recibido:</span>
                          <span className="font-bold text-white">{formatPrice(totalCashReceived)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-400 block font-extrabold uppercase">
                            VUELTAS / CAMBIO:
                          </span>
                          <span className="text-base font-black text-emerald-400">
                            {formatPrice(cashChange)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resumen de Comanda Compacta */}
                  {cart.length > 0 && (
                    <div className="bg-[#181b22] p-2 rounded-xl border border-gray-800 max-h-24 overflow-y-auto space-y-1 text-xs">
                      {cart.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] text-gray-300">
                          <span className="truncate flex-1 pr-2">
                            {it.quantity}x {it.dishName}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-amber-400">
                              {formatPrice(it.unitPrice * it.quantity)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeCartItem(idx)}
                              className="text-gray-500 hover:text-rose-400 text-xs px-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

                {/* 4. TOTAL A COBRAR Y BOTONES INFERIORES */}
                <div className="pt-2 border-t border-gray-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 tracking-wider">TOTAL A COBRAR:</span>
                    <span className="text-lg font-black text-amber-400">{formatPrice(cartTotal)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting || cart.length === 0}
                      onClick={() => handleCreateOrder(true)}
                      className="py-3 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Cobrar Vitrina</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting || cart.length === 0}
                      onClick={() => handleCreateOrder(false)}
                      className="py-3 px-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Enviar a Cocina</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* ----------------------------------------------------------------- */
            /* PESTAÑA: ESPERANDO ENTREGA (COLA DE MOSTRADOR)                     */
            /* ----------------------------------------------------------------- */
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0d0f14]">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Pedidos en Barra Esperando Entrega ({activeOrders.length})</span>
                  </h3>
                  <p className="text-xs text-gray-400">Despacha o cobra a los clientes que retiran su pedido</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("pos")}
                  className="px-3 py-1 bg-amber-500 text-black font-black text-xs rounded-lg shadow"
                >
                  + Nuevo Pedido
                </button>
              </div>

              {activeOrders.length === 0 ? (
                <div className="text-center py-16 text-gray-500 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto" />
                  <p className="text-xs font-bold text-gray-300">No hay clientes esperando en barra</p>
                  <p className="text-[10px]">Todos los pedidos para llevar han sido despachados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {activeOrders.map((order) => {
                    const isPrepaid = order.closedBy?.startsWith("PAGADO_PREVIO");
                    return (
                      <div
                        key={order.id}
                        className="bg-[#181b22] border border-gray-800 rounded-2xl p-3 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-white text-xs block">{order.tableNumber}</span>
                            <span className="text-[10px] text-gray-400">
                              {order.items[0]?.notes?.replace("LLEVAR - ", "") || "Cliente Mostrador"}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              isPrepaid
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            }`}
                          >
                            {isPrepaid ? "✓ Pagado" : "⏳ Por Cobrar"}
                          </span>
                        </div>

                        <div className="bg-[#101216] p-2 rounded-xl space-y-1 text-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-gray-300 text-[11px]">
                              <span>{it.quantity}x {it.dishName}</span>
                              <span className="font-bold text-gray-400">{formatPrice(it.subtotal)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-gray-800">
                          <span className="text-xs font-black text-amber-400">{formatPrice(order.total)}</span>
                          <button
                            type="button"
                            onClick={() => handleDeliverOrder(order)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-md ${
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
        </div>

        {/* ======================================================================= */}
        {/* FRANJA VERTICAL TÁCTIL (DISEÑO EXACTO DE IMÁGENES 01 Y 02)              */}
        {/* ======================================================================= */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="pointer-events-auto w-12 bg-gradient-to-b from-[#f59e0b] via-[#f97316] to-[#ea580c] hover:from-[#fbbf24] hover:to-[#f97316] text-black cursor-pointer flex flex-col items-center justify-between py-6 shadow-2xl rounded-r-3xl border-r-2 border-amber-300/40 transition-all active:scale-98 group"
          title={isOpen ? "Ocultar barra" : "Desplegar Barra Rápida hacia la derecha"}
        >
          {/* Badge superior: contador de pedidos pendientes */}
          <div className="w-6 h-6 rounded-full bg-[#7c2d12] text-amber-300 border border-amber-400/80 font-black text-[11px] flex items-center justify-center shadow">
            {activeOrders.length}
          </div>

          {/* Texto vertical: B A R R A */}
          <div className="flex flex-col items-center gap-1.5 font-black text-xs text-black/95 tracking-widest font-mono italic select-none">
            <span>B</span>
            <span>A</span>
            <span>R</span>
            <span>R</span>
            <span>A</span>
          </div>

          {/* Botón Central Circular con Flecha (apunta a la derecha al estar cerrado, izquierda al estar abierto) */}
          <div className="w-9 h-9 rounded-full bg-black text-[#f97316] border-2 border-[#ea580c] flex items-center justify-center font-black text-sm shadow-xl group-hover:scale-110 transition-transform">
            {isOpen ? <ChevronLeft className="w-5 h-5 stroke-[3]" /> : <ChevronRight className="w-5 h-5 stroke-[3]" />}
          </div>

          {/* Texto vertical: R A P I D A */}
          <div className="flex flex-col items-center gap-1.5 font-black text-xs text-black/95 tracking-widest font-mono italic select-none">
            <span>R</span>
            <span>A</span>
            <span>P</span>
            <span>I</span>
            <span>D</span>
            <span>A</span>
          </div>

          {/* Icono inferior: Rayo ⚡ */}
          <div className="w-6 h-6 rounded-full bg-black/25 flex items-center justify-center font-black text-xs shadow-inner">
            <Zap className="w-3.5 h-3.5 fill-black" />
          </div>
        </div>

      </div>

      {/* Backdrop oscuro cuando el drawer está expandido */}
      {isOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 transition-opacity"
        />
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL DE CONFIGURACIÓN DEL ADMIN (ACTIVADO CON BOTÓN '+' MORADO)        */}
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
                  <h2 className="text-sm font-black text-white">CONFIGURACIÓN DE BARRA & FAVORITOS</h2>
                  <p className="text-[11px] text-gray-400">Personaliza los platos rápidos y opciones de cobro</p>
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

            {/* Ajuste 1: Favoritos de Mostrador */}
            <div className="space-y-2 bg-[#181b22] p-3 rounded-2xl border border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  1. Platos Favoritos de Mostrador
                </h3>
                <span className="text-[10px] text-gray-400">
                  {barraConfig.favoriteDishNames.length} seleccionados
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Los platos marcados aparecerán primero en la botonera con foto.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
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

            {/* Ajuste 2: Billetes Activos */}
            <div className="space-y-2 bg-[#181b22] p-3 rounded-2xl border border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  2. Billetes Disponibles para Pago
                </h3>
                <span className="text-[10px] text-gray-400">Auto-Suma</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[100000, 50000, 20000, 10000, 5000, 2000].map((bill) => {
                  const isChecked = barraConfig.activeBills.includes(bill);
                  return (
                    <label
                      key={bill}
                      className="flex items-center gap-2 p-2 rounded-xl bg-[#20252e] border border-gray-700 text-xs font-bold cursor-pointer hover:border-amber-500/50"
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
                      <span>{formatPrice(bill)}</span>
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
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black shadow-lg"
              >
                ✓ Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL PARA COBRAR AL ENTREGAR                                          */}
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

            {/* Billetes en entrega si es efectivo */}
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
