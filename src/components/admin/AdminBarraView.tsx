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
  User,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice, formatTime } from "@/lib/formatters";

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

interface AdminBarraViewProps {
  isDrawer?: boolean;
  onClose?: () => void;
}

export function AdminBarraView({ isDrawer = false, onClose }: AdminBarraViewProps) {
  const [activeTab, setActiveTab] = useState<"pos" | "queue">("pos");
  const [mobileSubTab, setMobileSubTab] = useState<"catalog" | "checkout">("catalog");

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
  const [deliverMixedCash, setDeliverMixedCash] = useState<number>(0);
  const [deliverMixedTransfer, setDeliverMixedTransfer] = useState<number>(0);

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
    if (cartTotal <= 0) {
      setMixedCash(0);
      setMixedTransfer(0);
      return;
    }
    setMixedCash((prev) => {
      if (prev <= 0 || prev > cartTotal) {
        const half = Math.floor(cartTotal / 2000) * 1000;
        return half > 0 ? half : cartTotal;
      }
      return prev;
    });
  }, [cartTotal]);

  useEffect(() => {
    setMixedTransfer(Math.max(0, cartTotal - mixedCash));
  }, [cartTotal, mixedCash]);

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

    if (paymentTiming === "NOW") {
      if (paymentMethod === "CASH" && totalCashReceived < cartTotal) {
        toast.error(
          `El efectivo entregado (${formatPrice(totalCashReceived)}) es menor a la cuenta (${formatPrice(cartTotal)}). Usa los billetes o presiona "Exacto".`
        );
        return;
      }
      if (paymentMethod === "MIXED" && mixedCash > 0 && totalCashReceived < mixedCash) {
        toast.error(
          `El efectivo entregado (${formatPrice(totalCashReceived)}) es menor a la parte en efectivo pactada (${formatPrice(mixedCash)}). Usa los billetes o presiona "Exacto".`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim() || undefined,
        destination,
        paymentTiming,
        paymentMethod,
        isDeliveredImmediately,
        items: cart.map((c) => ({
          dishName: c.dishName,
          portionLabel: c.portionLabel || null,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          notes: c.notes || null,
        })),
        cashPaidAmount: paymentMethod === "CASH" || paymentMethod === "MIXED" ? totalCashReceived : undefined,
        cashChange: paymentMethod === "CASH" || paymentMethod === "MIXED" ? cashChange : undefined,
        mixedCash: paymentMethod === "MIXED" ? mixedCash : undefined,
        mixedTransfer: paymentMethod === "MIXED" ? mixedTransfer : undefined,
      };

      const res = await fetch("/api/admin/barra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "No se pudo crear el pedido");
      }

      const ticketIdentifier = json.data?.session?.tableNumber || json.data?.ticketNumber || nextTicket;
      toast.success(`Pedido creado con éxito: ${ticketIdentifier}`);
      clearCart();
      fetchBarraData();

      if (!isDeliveredImmediately) {
        setActiveTab("queue");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar el pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Despachar pedido pendiente
  const executeDeliver = async (orderId: string, payData?: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/barra/${orderId}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payData || {}),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "No se pudo despachar el pedido");
      }
      toast.success("Pedido despachado y entregado");
      setDeliveringOrder(null);
      fetchBarraData();
    } catch (err: any) {
      toast.error(err.message || "Error al finalizar entrega");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full bg-[#101217] border border-gray-800/80 flex flex-col shadow-2xl transition-all duration-300 overflow-hidden ${isDrawer ? "h-full" : "rounded-3xl min-h-[calc(100vh-140px)]"}`}>
      {/* ======================================================================= */}
      {/* CABECERA PRINCIPAL DE BARRA RÁPIDA                                      */}
      {/* ======================================================================= */}
      <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 bg-[#14161f] border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {isDrawer && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800/90 hover:bg-gray-700 text-white font-bold text-xs active:scale-95 transition-all border border-gray-700/60 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-amber-400 stroke-[3]" />
              <span>Cerrar</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>Barra Rápida & Mostrador</span>
            </span>
            <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Ticket {nextTicket}
            </span>
          </div>
        </div>

        {/* Selector de Pestañas Principales (Nuevo Pedido vs Cola de Espera) + Botón Ajustes */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-[#0e1015] rounded-xl border border-gray-800/80">
            <button
              type="button"
              onClick={() => setActiveTab("pos")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "pos"
                  ? "bg-amber-500 text-black shadow-sm font-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Nuevo Pedido
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("queue")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === "queue"
                  ? "bg-amber-500 text-black shadow-sm font-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span>En Espera</span>
              {activeOrders.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#ea580c] text-white text-[10px] font-black flex items-center justify-center">
                  {activeOrders.length}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="w-8 h-8 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white flex items-center justify-center font-black text-sm shadow-md transition-transform active:scale-90 shrink-0"
            title="Ajustes de barra y favoritos"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Selector de Sub-Pestañas en Móvil (Catálogo vs Cobro) */}
      {activeTab === "pos" && (
        <div className="md:hidden flex items-center p-1.5 bg-[#0e1015] border-b border-gray-800/80 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setMobileSubTab("catalog")}
            className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              mobileSubTab === "catalog"
                ? "bg-amber-500 text-black shadow-md font-black"
                : "bg-[#181b22] text-gray-400 hover:text-white"
            }`}
          >
            <span>🍽️ Platos Favoritos</span>
            {cart.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-black text-[10px] font-black">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileSubTab("checkout")}
            className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              mobileSubTab === "checkout"
                ? "bg-amber-500 text-black shadow-md font-black"
                : "bg-[#181b22] text-gray-400 hover:text-white"
            }`}
          >
            <span>💵 Cobro / Caja</span>
            {cartTotal > 0 && (
              <span className="text-[10px] font-black">
                ({formatPrice(cartTotal)})
              </span>
            )}
          </button>
        </div>
      )}

      {/* ======================================================================= */}
      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA                                       */}
      {/* ======================================================================= */}
      {activeTab === "pos" ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* ----------------------------------------------------------------- */}
          {/* COLUMNA IZQUIERDA: CATÁLOGO, BUSCADOR Y FOTOS                     */}
          {/* ----------------------------------------------------------------- */}
          <div
            className={`w-full md:w-[52%] md:border-r border-gray-800/80 p-3 sm:p-4 flex-col justify-between overflow-hidden bg-[#0d0f14] ${
              mobileSubTab === "catalog" ? "flex flex-1" : "hidden md:flex"
            }`}
          >
            <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
              {/* Buscador + Carrusel de Categorías */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar platos rápidos..."
                    className="w-full bg-[#161820] border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-gray-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="w-8 h-8 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white flex items-center justify-center font-black text-sm shadow-md transition-transform active:scale-90 shrink-0"
                  title="Configurar platos favoritos y billetes"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              {/* Chips Horizontales de Categorías */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("TODAS")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === "TODAS"
                      ? "bg-amber-500 text-black shadow-md font-black"
                      : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                  }`}
                >
                  Todas
                </button>
                {allCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.name
                        ? "bg-amber-500 text-black shadow-md font-black"
                        : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Título de la sección */}
              <div className="flex items-center justify-between shrink-0">
                <span className="text-xs font-black italic tracking-wide text-gray-300">
                  favoritos mostrador
                </span>
                <span className="text-[10px] text-gray-500 font-mono font-bold">
                  TICKET {nextTicket}
                </span>
              </div>

              {/* Cuadrícula Táctil: 2 columnas en móvil, 4 en desktop (content-start y auto-rows-max para evitar deformaciones o estiramientos) */}
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 content-start auto-rows-max custom-scrollbar">
                {displayedDishes.map((dish) => {
                  const countInCart = cart
                    .filter((c) => c.dishName === dish.name)
                    .reduce((a, b) => a + b.quantity, 0);

                  return (
                    <div
                      key={dish.id}
                      onClick={() => addToCart(dish.name, dish.basePrice, dish.id)}
                      className="bg-[#181b22] border border-gray-800 hover:border-amber-500/60 rounded-xl overflow-hidden cursor-pointer transition-all active:scale-95 group relative shadow-md flex flex-col h-auto"
                    >
                      {countInCart > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#8b5cf6] text-white font-black text-[10px] flex items-center justify-center shadow-lg z-10 animate-scale-in">
                          {countInCart}
                        </span>
                      )}

                      <div className="h-20 sm:h-20 md:h-18 w-full bg-[#101216] overflow-hidden relative shrink-0">
                        <img
                          src={dish.imageUrl || "/logo-pio-pio.png"}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>

                      <div className="p-1.5 md:p-1.5 bg-[#14161d] text-center border-t border-gray-800/80 shrink-0">
                        <p className="text-[11px] md:text-[10px] font-bold text-white group-hover:text-amber-400 truncate leading-tight">
                          {dish.name}
                        </p>
                        <p className="text-xs md:text-[10px] font-black text-amber-400 mt-0.5">
                          {formatPrice(dish.basePrice)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Barra flotante inferior en móvil para pasar a pagar si hay platos */}
            {cart.length > 0 && (
              <div className="md:hidden mt-2 p-2.5 bg-[#141720] rounded-2xl border border-amber-500/40 flex items-center justify-between shadow-2xl shrink-0">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold">
                    {cart.reduce((a, b) => a + b.quantity, 0)} platos en comanda
                  </span>
                  <span className="text-sm font-black text-amber-400">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSubTab("checkout")}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs flex items-center gap-1 shadow-lg active:scale-95"
                >
                  <span>Ir a Cobro</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            )}

            {/* Switch inferior de modalidad */}
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
          <div
            className={`w-full md:w-[48%] bg-[#12141a] p-3 sm:p-4 flex-col justify-between overflow-y-auto space-y-3 ${
              mobileSubTab === "checkout" ? "flex flex-1" : "hidden md:flex"
            }`}
          >
            <div className="space-y-3">
              {/* Botón Móvil para regresar al catálogo de platos */}
              <button
                type="button"
                onClick={() => setMobileSubTab("catalog")}
                className="md:hidden w-full py-2 px-3 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-gray-700/60 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                <span>← Seguir agregando platos</span>
              </button>

              {/* REFERENCIA / NOMBRE DEL CLIENTE */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                  CLIENTE / REFERENCIA MOSTRADOR
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Carlos / Llevar / Moto..."
                    className="w-full bg-[#181b22] border border-gray-800 focus:border-amber-500/80 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* 1. MOMENTO DEL PAGO */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                  MOMENTO DEL PAGO
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentTiming("NOW")}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                      paymentTiming === "NOW"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg"
                        : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                    }`}
                  >
                    <span>⚡ Paga Ahora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentTiming("ON_DELIVERY")}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                      paymentTiming === "ON_DELIVERY"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg"
                        : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                    }`}
                  >
                    <span>⏳ Paga al Entregar</span>
                  </button>
                </div>
              </div>

              {/* Mensaje Informativo si es Pago al Entregar */}
              {paymentTiming === "ON_DELIVERY" && (
                <div className="bg-[#1f1912] border border-amber-600/40 rounded-2xl p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Cobro Programado al Entregar</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    El pedido pasará a <span className="text-rose-400 font-bold">PENDIENTE DE PAGO</span>. Al momento de la entrega en mostrador, podrás registrar el cobro en Efectivo, Nequi, Tarjeta o Mixto.
                  </p>
                </div>
              )}

              {/* 2. FORMA DE PAGO (CUANDO PAGA AHORA) */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                  FORMA DE PAGO
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("CASH");
                      setSelectedBills([]);
                    }}
                    className={`py-2 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                      paymentMethod === "CASH"
                        ? "bg-amber-500 text-black shadow-md ring-2 ring-amber-400/50"
                        : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                    }`}
                  >
                    <span>💵 Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("NEQUI")}
                    className={`py-2 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                      paymentMethod === "NEQUI"
                        ? "bg-[#6366f1] text-white shadow-md ring-2 ring-indigo-400/50"
                        : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                    }`}
                  >
                    <span>🟣 Nequi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`py-2 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                      paymentMethod === "CARD"
                        ? "bg-[#0284c7] text-white shadow-md ring-2 ring-sky-400/50"
                        : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                    }`}
                  >
                    <span>💳 Tarjeta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("MIXED");
                      setSelectedBills([]);
                    }}
                    className={`py-2 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                      paymentMethod === "MIXED"
                        ? "bg-indigo-600 text-white shadow-md ring-2 ring-purple-400/50"
                        : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                    }`}
                  >
                    <span>🔀 Mixto</span>
                  </button>
                </div>
              </div>

              {/* Panel Informativo Nequi / Transferencia */}
              {paymentTiming === "NOW" && paymentMethod === "NEQUI" && (
                <div className="bg-[#1a172e] border border-indigo-500/40 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                      Pago Digital Nequi / Daviplata
                    </span>
                    <span className="text-xs font-black text-indigo-200">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  <div className="bg-[#111022] rounded-xl p-2.5 text-[11px] text-gray-300 space-y-1 border border-indigo-500/20">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total a transferir:</span>
                      <span className="font-black text-emerald-400">{formatPrice(cartTotal)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 pt-1">
                      📱 Solicite al cliente el comprobante de transferencia y verifique la acreditación en la cuenta del asadero antes de despachar.
                    </p>
                  </div>
                </div>
              )}

              {/* Panel Informativo Datáfono / Tarjeta */}
              {paymentTiming === "NOW" && paymentMethod === "CARD" && (
                <div className="bg-[#0f1d2a] border border-sky-500/40 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-black text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                      Datáfono / Tarjeta
                    </span>
                    <span className="text-xs font-black text-sky-200">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  <div className="bg-[#0a151f] rounded-xl p-2.5 text-[11px] text-gray-300 space-y-1 border border-sky-500/20">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total a pasar por datáfono:</span>
                      <span className="font-black text-emerald-400">{formatPrice(cartTotal)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 pt-1">
                      💳 Ingrese el valor en el datáfono físico y confirme la aprobación del voucher.
                    </p>
                  </div>
                </div>
              )}

              {/* Configuración de Pago Mixto (Efectivo + Transferencia) */}
              {paymentTiming === "NOW" && paymentMethod === "MIXED" && (
                <div className="bg-[#161a29] border border-indigo-500/30 rounded-2xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      División de Pago Mixto
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const half = Math.floor(cartTotal / 2000) * 1000;
                        setMixedCash(half);
                        setMixedTransfer(cartTotal - half);
                      }}
                      className="text-[10px] font-bold text-amber-400 hover:underline"
                    >
                      Dividir 50% / 50%
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#0f121d] p-2 rounded-xl border border-gray-800">
                      <label className="text-[10px] text-gray-400 block font-bold mb-1">
                        💵 Parte Efectivo:
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 font-bold">$</span>
                        <input
                          type="number"
                          step={1000}
                          min={0}
                          max={cartTotal}
                          value={mixedCash || ""}
                          onChange={(e) => {
                            const val = Math.min(cartTotal, Math.max(0, Number(e.target.value) || 0));
                            setMixedCash(val);
                            setMixedTransfer(Math.max(0, cartTotal - val));
                          }}
                          className="w-full bg-transparent text-amber-400 font-black text-sm outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="bg-[#0f121d] p-2 rounded-xl border border-gray-800">
                      <label className="text-[10px] text-gray-400 block font-bold mb-1">
                        📱 Parte Digital (Nequi):
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 font-bold">$</span>
                        <input
                          type="number"
                          step={1000}
                          min={0}
                          max={cartTotal}
                          value={mixedTransfer || ""}
                          onChange={(e) => {
                            const val = Math.min(cartTotal, Math.max(0, Number(e.target.value) || 0));
                            setMixedTransfer(val);
                            setMixedCash(Math.max(0, cartTotal - val));
                          }}
                          className="w-full bg-transparent text-indigo-400 font-black text-sm outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. CALCULADORA DE EFECTIVO */}
              {paymentTiming === "NOW" && (paymentMethod === "CASH" || paymentMethod === "MIXED") && (
                <div className="bg-[#141720] border border-gray-800/80 rounded-2xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      {paymentMethod === "MIXED"
                        ? `Billetes para Efectivo (${formatPrice(mixedCash)}):`
                        : "Billetes Entregados (Auto-Suma):"}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
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

                  {/* Bandeja de Billetes Seleccionados */}
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

                  {/* Resumen Financiero: Total Recibido vs Vueltas */}
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
                  disabled={isSubmitting}
                  onClick={() => handleCreateOrder(true)}
                  className="py-3.5 px-2 bg-[#059669] hover:bg-[#10b981] text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-emerald-400/30"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Cobrar Vitrina</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCreateOrder(false)}
                  className="py-3.5 px-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-amber-400/30"
                >
                  <Flame className="w-4 h-4 fill-white" />
                  <span>Enviar a Cocina</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* PESTAÑA: ESPERANDO ENTREGA (COLA DE MOSTRADOR)                         */
        /* ===================================================================== */
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0d0f14]">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Pedidos Activos en Mostrador</span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Llamar a los clientes cuando cocina confirme la bandeja
              </p>
            </div>
            <button
              type="button"
              onClick={fetchBarraData}
              className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300"
              title="Refrescar lista"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {activeOrders.length === 0 ? (
            <div className="py-16 text-center text-gray-500 space-y-2">
              <Zap className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs font-bold">No hay pedidos pendientes en mostrador</p>
              <p className="text-[10px]">Todos los pedidos para llevar han sido despachados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeOrders.map((order) => {
                const isPrepaid = order.closedBy?.startsWith("PAGADO_PREVIO");
                return (
                  <div
                    key={order.id}
                    className="bg-[#181b22] border border-gray-800 rounded-2xl p-3.5 space-y-3 flex flex-col justify-between shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-500/30">
                          {order.tableNumber}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatTime(order.createdAt)}
                        </span>
                      </div>

                      {isPrepaid ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                          PAGADO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30">
                          PENDIENTE DE PAGO
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 bg-[#101216] p-2 rounded-xl text-xs border border-gray-800/80">
                      {order.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-center text-[11px] text-gray-300">
                          <span>{it.quantity}x {it.dishName}</span>
                          <span className="text-gray-400">{formatPrice(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-800/80">
                      <div>
                        <span className="text-[10px] text-gray-500 block">Total</span>
                        <span className="text-sm font-black text-amber-400">{formatPrice(order.total)}</span>
                      </div>

                      {isPrepaid ? (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => executeDeliver(order.id)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Despachar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            setDeliveringOrder(order);
                            setDeliverPayMethod("CASH");
                            setDeliverBills([order.total]);
                            const half = Math.floor(order.total / 2000) * 1000;
                            setDeliverMixedCash(half);
                            setDeliverMixedTransfer(order.total - half);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                        >
                          <DollarSign className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Cobrar y Despachar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIGURACIÓN DEL ADMIN (ACTIVADO CON BOTÓN '+' MORADO)          */}
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
      {/* MODAL PARA COBRAR AL ENTREGAR                                             */}
      {/* ========================================================================= */}
      {deliveringOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setDeliveringOrder(null)}
        >
          <div
            className="w-full max-w-md bg-[#14161a] border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
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
                className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#181b22] p-3 rounded-2xl border border-gray-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-gray-400 block font-bold">Total del Pedido:</span>
                <span className="text-lg font-black text-amber-400">{formatPrice(deliveringOrder.total)}</span>
              </div>
              <div className="text-right text-[11px] text-gray-400">
                <span>{deliveringOrder.items.length} productos</span>
              </div>
            </div>

            {/* Selector de Método de Pago al Entregar */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                MÉTODO DE PAGO
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDeliverPayMethod("CASH");
                    setDeliverBills([deliveringOrder.total]);
                  }}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                    deliverPayMethod === "CASH"
                      ? "bg-amber-500 text-black shadow-md ring-2 ring-amber-400/50"
                      : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                  }`}
                >
                  <span>💵 Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliverPayMethod("NEQUI")}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                    deliverPayMethod === "NEQUI"
                      ? "bg-[#6366f1] text-white shadow-md ring-2 ring-indigo-400/50"
                      : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                  }`}
                >
                  <span>🟣 Nequi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliverPayMethod("CARD")}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                    deliverPayMethod === "CARD"
                      ? "bg-[#0284c7] text-white shadow-md ring-2 ring-sky-400/50"
                      : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                  }`}
                >
                  <span>💳 Tarjeta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeliverPayMethod("MIXED");
                    const half = Math.floor(deliveringOrder.total / 2000) * 1000;
                    setDeliverMixedCash(half);
                    setDeliverMixedTransfer(deliveringOrder.total - half);
                    setDeliverBills([half]);
                  }}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all ${
                    deliverPayMethod === "MIXED"
                      ? "bg-indigo-600 text-white shadow-md ring-2 ring-purple-400/50"
                      : "bg-[#181b22] text-gray-400 hover:text-white border border-gray-800"
                  }`}
                >
                  <span>🔀 Mixto</span>
                </button>
              </div>
            </div>

            {/* PANEL NEQUI */}
            {deliverPayMethod === "NEQUI" && (
              <div className="bg-[#1a172e] border border-indigo-500/40 rounded-2xl p-3 text-xs space-y-1.5">
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider block">
                  Cobro por Transferencia Nequi / Daviplata
                </span>
                <div className="flex justify-between items-center bg-[#111022] p-2.5 rounded-xl border border-indigo-500/20">
                  <span className="text-gray-400">Total a transferir:</span>
                  <span className="font-black text-emerald-400 text-sm">{formatPrice(deliveringOrder.total)}</span>
                </div>
                <p className="text-[10px] text-gray-400">
                  📱 Verifique el comprobante digital en el teléfono antes de entregar el pedido.
                </p>
              </div>
            )}

            {/* PANEL TARJETA */}
            {deliverPayMethod === "CARD" && (
              <div className="bg-[#0f1d2a] border border-sky-500/40 rounded-2xl p-3 text-xs space-y-1.5">
                <span className="text-[10px] font-black text-sky-300 uppercase tracking-wider block">
                  Cobro por Datáfono / Tarjeta
                </span>
                <div className="flex justify-between items-center bg-[#0a151f] p-2.5 rounded-xl border border-sky-500/20">
                  <span className="text-gray-400">Total en Datáfono:</span>
                  <span className="font-black text-emerald-400 text-sm">{formatPrice(deliveringOrder.total)}</span>
                </div>
                <p className="text-[10px] text-gray-400">
                  💳 Pase la tarjeta por el datáfono físico y confirme la aprobación del voucher.
                </p>
              </div>
            )}

            {/* PANEL MIXTO */}
            {deliverPayMethod === "MIXED" && (
              <div className="bg-[#161a29] border border-indigo-500/30 rounded-2xl p-2.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">
                    División Mixta
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.floor(deliveringOrder.total / 2000) * 1000;
                      setDeliverMixedCash(half);
                      setDeliverMixedTransfer(deliveringOrder.total - half);
                      setDeliverBills([half]);
                    }}
                    className="text-[10px] font-bold text-amber-400 hover:underline"
                  >
                    50% / 50%
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0f121d] p-2 rounded-xl border border-gray-800">
                    <label className="text-[10px] text-gray-400 block font-bold mb-1">Efectivo:</label>
                    <input
                      type="number"
                      step={1000}
                      min={0}
                      max={deliveringOrder.total}
                      value={deliverMixedCash || ""}
                      onChange={(e) => {
                        const val = Math.min(deliveringOrder.total, Math.max(0, Number(e.target.value) || 0));
                        setDeliverMixedCash(val);
                        setDeliverMixedTransfer(Math.max(0, deliveringOrder.total - val));
                        setDeliverBills([val]);
                      }}
                      className="w-full bg-transparent text-amber-400 font-black text-sm outline-none"
                    />
                  </div>
                  <div className="bg-[#0f121d] p-2 rounded-xl border border-gray-800">
                    <label className="text-[10px] text-gray-400 block font-bold mb-1">Transferencia:</label>
                    <input
                      type="number"
                      step={1000}
                      min={0}
                      max={deliveringOrder.total}
                      value={deliverMixedTransfer || ""}
                      onChange={(e) => {
                        const val = Math.min(deliveringOrder.total, Math.max(0, Number(e.target.value) || 0));
                        setDeliverMixedTransfer(val);
                        setDeliverMixedCash(Math.max(0, deliveringOrder.total - val));
                        setDeliverBills([Math.max(0, deliveringOrder.total - val)]);
                      }}
                      className="w-full bg-transparent text-indigo-400 font-black text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Billetes en entrega si es efectivo o mixto */}
            {(deliverPayMethod === "CASH" || deliverPayMethod === "MIXED") && (
              <div className="space-y-2 bg-[#181b22] p-2.5 rounded-2xl border border-gray-800">
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span className="font-bold">
                    {deliverPayMethod === "MIXED"
                      ? `Billetes para Efectivo (${formatPrice(deliverMixedCash)}):`
                      : "Billetes Entregados:"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const target = deliverPayMethod === "MIXED" ? deliverMixedCash : deliveringOrder.total;
                        setDeliverBills([target]);
                      }}
                      className="text-amber-400 font-bold hover:underline"
                    >
                      Exacto
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliverBills([])}
                      className="text-gray-400 hover:text-white font-bold"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  {barraConfig.activeBills.slice(0, 6).map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setDeliverBills((prev) => [...prev, bill])}
                      className="py-1 px-1 rounded-lg bg-[#20252e] hover:bg-gray-700 text-[10px] font-bold text-gray-200 border border-gray-700 active:scale-95 transition-all"
                    >
                      {formatPrice(bill)}
                    </button>
                  ))}
                </div>

                {/* Bandeja de billetes seleccionados en entrega */}
                {deliverBills.length > 0 && (
                  <div className="bg-[#0e1015] border border-gray-800 rounded-xl p-1 flex flex-wrap gap-1">
                    {deliverBills.map((b, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-800 text-[9px] font-bold text-gray-300"
                      >
                        {formatPrice(b)}
                        <button
                          type="button"
                          onClick={() => setDeliverBills((prev) => prev.filter((_, i) => i !== idx))}
                          className="hover:text-rose-400"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">Total Recibido:</span>
                    <span className="font-bold text-white">
                      {formatPrice(deliverBills.reduce((a, b) => a + b, 0))}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 block font-bold">Vueltas / Cambio:</span>
                    <span className="text-sm font-black text-emerald-400">
                      {formatPrice(
                        Math.max(
                          0,
                          deliverBills.reduce((a, b) => a + b, 0) -
                            (deliverPayMethod === "MIXED" ? deliverMixedCash : deliveringOrder.total)
                        )
                      )}
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
                const targetCash = deliverPayMethod === "MIXED" ? deliverMixedCash : deliveringOrder.total;
                
                if (deliverPayMethod === "CASH" && totalGiven < deliveringOrder.total) {
                  toast.error(`El efectivo entregado (${formatPrice(totalGiven)}) es menor al total (${formatPrice(deliveringOrder.total)})`);
                  return;
                }
                if (deliverPayMethod === "MIXED" && deliverMixedCash > 0 && totalGiven < deliverMixedCash) {
                  toast.error(`El efectivo entregado (${formatPrice(totalGiven)}) es menor a la parte en efectivo pactada (${formatPrice(deliverMixedCash)})`);
                  return;
                }

                const change = Math.max(0, totalGiven - targetCash);
                executeDeliver(deliveringOrder.id, {
                  paymentMethod: deliverPayMethod,
                  cashPaidAmount: (deliverPayMethod === "CASH" || deliverPayMethod === "MIXED") ? totalGiven : undefined,
                  cashChange: (deliverPayMethod === "CASH" || deliverPayMethod === "MIXED") ? change : undefined,
                  mixedCash: deliverPayMethod === "MIXED" ? deliverMixedCash : undefined,
                  mixedTransfer: deliverPayMethod === "MIXED" ? deliverMixedTransfer : undefined,
                });
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider shadow-xl transition-all active:scale-95"
            >
              ✓ Confirmar Cobro y Despachar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
