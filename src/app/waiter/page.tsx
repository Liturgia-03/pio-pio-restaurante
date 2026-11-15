"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Utensils,
  Plus,
  Minus,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  CreditCard,
  X,
  PlusCircle,
  MinusCircle,
  Hash,
  Flame,
  Star,
  Sparkles,
  Tag,
  ChevronDown,
  ChevronUp,
  Layers,
  MessageSquare,
  LayoutGrid,
  BookOpen,
  Trash2,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { IconRenderer } from "@/components/common/IconRenderer";
import { toast } from "sonner";
import { TableCardData, TableStatus } from "@/types";

interface WaiterUser {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  discountPrice?: number | null;
  badge?: string | null;
  isAvailable: boolean;
  categoryId: string;
  portions?: { id: string; label: string; price: number }[];
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  iconName?: string | null;
  sortOrder?: number;
  dishes: MenuItem[];
}

const QUICK_KITCHEN_NOTES = [
  "Sin ensalada",
  "Bien dorado",
  "Papas doradas",
  "Para llevar",
  "Sin sal",
  "Salsa aparte",
  "Gaseosa fría",
  "Sopa caliente",
];

export default function WaiterApp() {
  // Estado de autenticación
  const [waiter, setWaiter] = useState<WaiterUser | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Pestaña de navegación inferior (Bottom Navigation Bar Fija Permanente)
  const [activeBottomNav, setActiveBottomNav] = useState<
    "all" | "pending" | "active" | "menu" | "profile"
  >("all");

  // Datos de mesas y menú
  const [tablesData, setTablesData] = useState<TableCardData[]>([]);
  const [counts, setCounts] = useState({ open: 0, pending: 0, billRequested: 0, free: 0 });
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(true);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Estado del modal de mesa seleccionada
  const [selectedTable, setSelectedTable] = useState<TableCardData | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Estados para catálogo y adición de platos (Gourmet UX)
  const [showAddDishModal, setShowAddDishModal] = useState<boolean>(false);
  const [searchDishQuery, setSearchDishQuery] = useState<string>("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("all");
  const [isStagingExpanded, setIsStagingExpanded] = useState<boolean>(false);
  const [stagedItems, setStagedItems] = useState<
    {
      dishId: string;
      dishName: string;
      portionLabel?: string;
      unitPrice: number;
      quantity: number;
      notes: string;
    }[]
  >([]);

  // Referencia para auto-scroll centrado de categorías
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Estados para transferencia de mesa
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [targetTableNumber, setTargetTableNumber] = useState<string>("");

  // Cargar sesión guardada de mesero
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pio_waiter_session");
      if (saved) {
        setWaiter(JSON.parse(saved));
      }
    } catch {
      // Ignorar error de parsing
    }
  }, []);

  // Cargar mesas
  const fetchTables = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingTables(true);
    try {
      const res = await fetch("/api/tables");
      const json = await res.json();
      if (json.success && json.data) {
        setTablesData(json.data.tables || []);
        if (json.data.counts) {
          setCounts(json.data.counts);
        }
        setLastUpdated(new Date());

        // Actualizar la mesa seleccionada si sigue abierta
        setSelectedTable((prev) => {
          if (!prev) return null;
          const updated = (json.data.tables || []).find(
            (t: TableCardData) => t.tableNumber === prev.tableNumber
          );
          return updated || null;
        });
      }
    } catch (err) {
      console.error("Error al cargar mesas:", err);
    } finally {
      if (!silent) setIsLoadingTables(false);
    }
  }, []);

  // Cargar catálogo de menú para tomar pedidos
  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch("/api/public/menu");
      const json = await res.json();
      if (json.success && json.data?.categories) {
        setCategories(json.data.categories);
      }
    } catch (err) {
      console.error("Error al cargar menú:", err);
    }
  }, []);

  useEffect(() => {
    if (waiter) {
      fetchTables();
      fetchMenu();
      const interval = setInterval(() => {
        fetchTables(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [waiter, fetchTables, fetchMenu]);

  // Auto-scroll del chip activo en la barra de categorías
  useEffect(() => {
    if (!categoryScrollRef.current) return;
    const activeBtn = categoryScrollRef.current.querySelector<HTMLButtonElement>(
      `[data-category-tab="${selectedCategoryTab}"]`
    );
    if (activeBtn) {
      const container = categoryScrollRef.current;
      const targetLeft =
        activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
    }
  }, [selectedCategoryTab]);

  // Manejador centralizado para la barra inferior (siempre disponible para cambiar de vista)
  const handleBottomNavClick = (tab: "all" | "pending" | "active" | "menu" | "profile") => {
    setActiveBottomNav(tab);
    setSelectedTable(null);
    setShowAddDishModal(false);
    setIsStagingExpanded(false);
    setShowTransferModal(false);
  };

  // Manejo del PIN táctil
  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      if (newPin.length === 4) {
        submitPin(newPin);
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const submitPin = async (pinToVerify: string) => {
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/waiter/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToVerify }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "PIN inválido");
        setPinInput("");
        return;
      }

      const waiterData = json.data;
      setWaiter(waiterData);
      localStorage.setItem("pio_waiter_session", JSON.stringify(waiterData));
      toast.success(`¡Bienvenido(a), ${waiterData.name}!`);
    } catch (err: any) {
      toast.error(err.message || "Error al conectar con el servidor");
      setPinInput("");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setWaiter(null);
    setPinInput("");
    localStorage.removeItem("pio_waiter_session");
    toast.info("Turno cerrado exitosamente");
  };

  // Formateador de moneda en pesos colombianos
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Confirmar o rechazar pedido QR
  const handleConfirmOrder = async (sessionId: string, action: "CONFIRM" | "REJECT") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tables/${sessionId}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, waiterId: waiter?.id, waiterName: waiter?.name }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success(
        action === "CONFIRM"
          ? "¡Pedido confirmado y marchado a cocina!"
          : "Pedido QR rechazado"
      );
      await fetchTables(true);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar pedido");
    } finally {
      setActionLoading(false);
    }
  };

  // Solicitar cuenta a caja
  const handleBillRequest = async (sessionId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tables/${sessionId}/bill-request`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success("Mesa marcada: Cliente pasando a pagar a Caja");
      await fetchTables(true);
    } catch (err: any) {
      toast.error(err.message || "Error al notificar cuenta");
    } finally {
      setActionLoading(false);
    }
  };

  // Transferir mesa
  const handleTransferTable = async () => {
    if (!selectedTable?.session || !targetTableNumber) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tables/${selectedTable.session.id}/transfer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newTableNumber: targetTableNumber }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success(`Cuenta transferida a Mesa #${targetTableNumber}`);
      setShowTransferModal(false);
      setTargetTableNumber("");
      setSelectedTable(null);
      await fetchTables(true);
    } catch (err: any) {
      toast.error(err.message || "Error al transferir mesa");
    } finally {
      setActionLoading(false);
    }
  };

  // Adición de platos a la comanda en borrador
  const handleAddDishToStaging = (
    dish: MenuItem,
    portion?: { label: string; price: number }
  ) => {
    const unitPrice = portion
      ? portion.price
      : dish.discountPrice && dish.discountPrice > 0
      ? dish.discountPrice
      : dish.basePrice;
    const portionLabel = portion ? portion.label : undefined;

    setStagedItems((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.dishId === dish.id && it.portionLabel === portionLabel
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          dishId: dish.id,
          dishName: dish.name,
          portionLabel,
          unitPrice,
          quantity: 1,
          notes: "",
        },
      ];
    });

    toast.success(`+1 ${dish.name} ${portionLabel ? `(${portionLabel})` : ""}`, {
      duration: 1200,
    });
  };

  // Restar un plato de la comanda en borrador (directamente desde la tarjeta o carrito)
  const handleSubtractDishFromStaging = (
    dishId: string,
    portionLabel?: string
  ) => {
    setStagedItems((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.dishId === dishId && it.portionLabel === portionLabel
      );
      if (existingIdx < 0) return prev;

      const copy = [...prev];
      if (copy[existingIdx].quantity > 1) {
        copy[existingIdx].quantity -= 1;
      } else {
        copy.splice(existingIdx, 1);
        toast.info("Plato quitado del pedido");
      }
      return copy;
    });
  };

  // Modificar cantidad en comanda en borrador
  const handleUpdateStagedQuantity = (index: number, delta: number) => {
    setStagedItems((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        const removed = copy.splice(index, 1);
        if (removed.length > 0) {
          toast.info(`Se quitó ${removed[0].dishName} del pedido`);
        }
      } else {
        copy[index].quantity = newQty;
      }
      return copy;
    });
  };

  // Quitar plato del carrito de pedido por completo
  const handleRemoveStagedItem = (index: number) => {
    setStagedItems((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1);
      if (removed.length > 0) {
        toast.info(`Se quitó ${removed[0].dishName} del pedido`);
      }
      return copy;
    });
  };

  // Actualizar nota de cocina para un ítem
  const handleUpdateStagedNotes = (index: number, notes: string) => {
    setStagedItems((prev) => {
      const copy = [...prev];
      copy[index].notes = notes;
      return copy;
    });
  };

  // Confirmar Pedido: Se marcha a cocina y YA NO se puede quitar por el mesero
  const handleSaveStagedOrder = async () => {
    if (!selectedTable || stagedItems.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/tables/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: selectedTable.tableNumber,
          waiterId: waiter?.id,
          waiterName: waiter?.name,
          addedBy: "WAITER",
          items: stagedItems,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success("¡Pedido confirmado y marchado a cocina! Los productos han quedado fijados en la cuenta.");
      setStagedItems([]);
      setShowAddDishModal(false);
      setIsStagingExpanded(false);
      await fetchTables(true);
    } catch (err: any) {
      toast.error(err.message || "Error al confirmar pedido");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrado de platos para búsqueda en selector tipo menú público
  const filteredDishes = useMemo(() => {
    let list: { dish: MenuItem; categoryName: string }[] = [];
    categories.forEach((cat) => {
      if (selectedCategoryTab === "all" || selectedCategoryTab === cat.id) {
        cat.dishes.forEach((d) => {
          if (d.isAvailable) {
            list.push({ dish: d, categoryName: cat.name });
          }
        });
      }
    });

    if (searchDishQuery.trim()) {
      const q = searchDishQuery.toLowerCase();
      list = list.filter(
        (it) =>
          it.dish.name.toLowerCase().includes(q) ||
          it.categoryName.toLowerCase().includes(q) ||
          (it.dish.description && it.dish.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [categories, selectedCategoryTab, searchDishQuery]);

  // Total acumulado de la comanda en preparación
  const stagedTotal = useMemo(() => {
    return stagedItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  }, [stagedItems]);

  const stagedCount = useMemo(() => {
    return stagedItems.reduce((acc, it) => acc + it.quantity, 0);
  }, [stagedItems]);

  // Mesas filtradas según la pestaña de navegación activa
  const visibleTables = useMemo(() => {
    if (activeBottomNav === "pending") {
      return tablesData.filter((t) => t.status === "PENDING_CONFIRMATION");
    }
    if (activeBottomNav === "active") {
      return tablesData.filter((t) => t.status === "OPEN" || t.status === "BILL_REQUESTED");
    }
    return tablesData;
  }, [tablesData, activeBottomNav]);

  // Si no ha iniciado sesión, mostrar pantalla de PIN gourmet institucional
  if (!waiter) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] text-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-sm bg-[#14161a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6 text-center relative overflow-hidden">
          {/* Resplandor decorativo ámbar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-amber-500/20 to-transparent blur-2xl pointer-events-none" />

          {/* Logo Oficial de Pío Pío */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-lg shadow-amber-500/20 bg-amber-950/40 p-1 mb-3">
              <img
                src="/logo-pio-pio.png"
                alt="Pío Pío Asadero"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <h1 className="text-xl font-black text-white tracking-wide">Pío Pío</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-0.5">
              Comandero de Salón
            </span>
            <p className="text-xs text-gray-400 mt-2">
              Ingresa tu PIN de 4 dígitos para comenzar tu turno
            </p>
          </div>

          {/* Círculos del PIN */}
          <div className="flex justify-center gap-3.5 my-3">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  pinInput.length > idx
                    ? "bg-amber-400 border-amber-400 scale-110 shadow-md shadow-amber-400/50"
                    : "border-gray-700 bg-[#0f1115]"
                }`}
              />
            ))}
          </div>

          {/* Teclado Numérico Ergonómico */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinDigit(num)}
                disabled={isLoggingIn}
                className="h-13 py-3 rounded-2xl bg-[#181b20] hover:bg-[#20252c] active:scale-95 text-xl font-bold text-white border border-gray-800/80 transition-all flex items-center justify-center shadow-sm"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handlePinDigit("0")}
              disabled={isLoggingIn}
              className="h-13 py-3 rounded-2xl bg-[#181b20] hover:bg-[#20252c] active:scale-95 text-xl font-bold text-white border border-gray-800/80 transition-all flex items-center justify-center shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handlePinDelete}
              disabled={isLoggingIn}
              className="h-13 py-3 rounded-2xl bg-[#231a1a] hover:bg-[#322020] active:scale-95 text-xs font-bold text-red-400 border border-red-900/40 transition-all flex items-center justify-center"
            >
              Borrar
            </button>
          </div>

          <p className="text-[10px] text-gray-500 pt-1">
            ¿No tienes o no recuerdas tu PIN? Solicítalo al administrador en la Caja.
          </p>
        </div>
      </div>
    );
  }

  // Vista principal del mesero
  return (
    <div className="min-h-screen bg-[#0b0c0e] text-white flex flex-col pb-24">
      {/* Barra superior de estado */}
      <header className="sticky top-0 z-30 bg-[#14161a]/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-amber-500/50 bg-amber-950/40 flex-shrink-0 shadow-md shadow-amber-500/10">
              <img
                src="/logo-pio-pio.png"
                alt="Pío Pío"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white">Pío Pío</span>
                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Salón
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-white font-bold">{waiter.name}</span>
                <span className="text-[10px] text-gray-500 ml-1">
                  • {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTables(false)}
              disabled={isLoadingTables}
              className="p-2.5 bg-gray-800/80 hover:bg-gray-700 active:scale-95 rounded-xl text-gray-300 transition-all border border-gray-700/60"
              title="Refrescar mesas"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingTables ? "animate-spin text-amber-400" : ""}`}
              />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 rounded-xl text-red-300 text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Contadores rápidos en semáforo */}
        <div className="max-w-6xl mx-auto mt-3 grid grid-cols-4 gap-2 text-center text-xs">
          <button
            type="button"
            onClick={() => handleBottomNavClick("all")}
            className={`p-2 rounded-2xl border transition-all ${
              activeBottomNav === "all"
                ? "bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50"
                : "bg-emerald-950/20 border-emerald-800/40"
            }`}
          >
            <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Libres
            </span>
            <span className="text-lg font-black text-emerald-300">{counts?.free || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => handleBottomNavClick("active")}
            className={`p-2 rounded-2xl border transition-all ${
              activeBottomNav === "active"
                ? "bg-blue-950/50 border-blue-500 ring-1 ring-blue-500/50"
                : "bg-blue-950/20 border-blue-800/40"
            }`}
          >
            <span className="block text-[10px] text-blue-400 font-bold uppercase tracking-wider">
              Ocupadas
            </span>
            <span className="text-lg font-black text-blue-300">{counts?.open || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => handleBottomNavClick("pending")}
            className={`p-2 rounded-2xl border transition-all ${
              (counts?.pending || 0) > 0
                ? "bg-amber-950/70 border-2 border-amber-500 animate-pulse text-amber-300 shadow-md shadow-amber-500/20"
                : activeBottomNav === "pending"
                ? "bg-amber-950/50 border-amber-500"
                : "bg-amber-950/20 border-amber-800/30 text-amber-400"
            }`}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wider">
              Por Confirmar
            </span>
            <span className="text-lg font-black">{counts?.pending || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => handleBottomNavClick("active")}
            className={`p-2 rounded-2xl border transition-all ${
              activeBottomNav === "active"
                ? "bg-purple-950/50 border-purple-500 ring-1 ring-purple-500/50"
                : "bg-purple-950/20 border-purple-800/40"
            }`}
          >
            <span className="block text-[10px] text-purple-400 font-bold uppercase tracking-wider">
              Pidieron Cuenta
            </span>
            <span className="text-lg font-black text-purple-300">
              {counts?.billRequested || 0}
            </span>
          </button>
        </div>
      </header>

      {/* Contenido Principal según Pestaña Inferior */}
      <main className="max-w-6xl mx-auto p-3 sm:p-4 w-full flex-1 pb-24">
        {/* VISTA 1, 2 Y 3: SALÓN DE MESAS (Tarjetas Rectangulares Compactas) */}
        {(activeBottomNav === "all" ||
          activeBottomNav === "pending" ||
          activeBottomNav === "active") && (
          <div className="space-y-3.5">
            {/* Aviso reactivo si hay pedidos QR esperando */}
            {(counts?.pending || 0) > 0 && activeBottomNav !== "pending" && (
              <div
                onClick={() => handleBottomNavClick("pending")}
                className="p-3 bg-amber-500/20 border-2 border-amber-500 rounded-2xl flex items-center justify-between text-amber-300 text-xs font-bold animate-pulse cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    ¡Atención! Hay {counts?.pending || 0} pedido(s) QR esperando confirmación.
                  </span>
                </div>
                <span className="text-[10px] bg-amber-500 text-black px-2 py-1 rounded-lg font-black">
                  Ver Pedidos &rarr;
                </span>
              </div>
            )}

            {/* Cabecera del filtro activo */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {activeBottomNav === "all"
                    ? "Salón Completo (Todas las Mesas)"
                    : activeBottomNav === "pending"
                    ? "Mesas con Pedidos QR por Confirmar"
                    : "Mesas Ocupadas con Cuenta Activa"}
                </span>
              </h2>
              <span className="text-[11px] text-gray-500 font-bold">
                {visibleTables.length} mesas
              </span>
            </div>

            {visibleTables.length === 0 ? (
              <div className="text-center py-12 bg-[#14161a] border border-gray-800 rounded-3xl p-6 space-y-2">
                <Utensils className="w-10 h-10 text-gray-600 mx-auto" />
                <p className="text-xs font-bold text-gray-300">
                  {activeBottomNav === "pending"
                    ? "No hay pedidos QR pendientes por confirmar en este momento."
                    : "No hay mesas con cuentas activas en este momento."}
                </p>
                <button
                  type="button"
                  onClick={() => handleBottomNavClick("all")}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs text-amber-400 font-bold rounded-xl"
                >
                  Ver Todas las Mesas
                </button>
              </div>
            ) : (
              /* Cuadrícula de Mesas Rectangulares y Compactas (Diseño Apaisado Ergonómico) */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
                {visibleTables.map((table) => {
                  const isFree = table.status === "FREE";
                  const isPending = table.status === "PENDING_CONFIRMATION";
                  const isOpen = table.status === "OPEN";
                  const isBillReq = table.status === "BILL_REQUESTED";

                  return (
                    <button
                      key={table.tableNumber}
                      type="button"
                      onClick={() => {
                        setSelectedTable(table);
                        if (isFree) {
                          setStagedItems([]);
                          setShowAddDishModal(true);
                        }
                      }}
                      className={`relative p-3 rounded-2xl border text-left flex flex-col justify-between min-h-[82px] sm:min-h-[88px] transition-all duration-200 active:scale-95 shadow-md ${
                        isFree
                          ? "bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 border-2 border-emerald-400/80 hover:border-emerald-300 text-emerald-50 shadow-emerald-950/50"
                          : isPending
                          ? "bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 border-2 border-amber-300 text-amber-50 shadow-amber-500/30 animate-pulse"
                          : isOpen
                          ? "bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 border-2 border-blue-400/80 hover:border-blue-300 text-blue-50 shadow-blue-950/60"
                          : "bg-gradient-to-br from-purple-700 via-purple-800 to-purple-950 border-2 border-purple-400 hover:border-purple-300 text-purple-50 shadow-purple-950/60 animate-pulse"
                      }`}
                    >
                      {/* Fila Superior: Número de Mesa + Tiempo / Pulso Semafórico */}
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs sm:text-sm font-black tracking-tight text-white drop-shadow-sm">
                          MESA #{table.tableNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {table.minutesOpen !== null && (
                            <span className="text-[10px] text-white/90 font-mono flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {table.minutesOpen}m
                            </span>
                          )}
                          <span
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              isFree
                                ? "bg-emerald-300 ring-2 ring-emerald-200/50"
                                : isPending
                                ? "bg-yellow-300 ring-2 ring-yellow-200 animate-ping"
                                : isOpen
                                ? "bg-cyan-300 ring-2 ring-cyan-200/50"
                                : "bg-purple-300 ring-2 ring-purple-200 animate-ping"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Fila Inferior: Estado / Total acumulado en formato apaisado rectangular */}
                      <div className="flex items-center justify-between w-full mt-1.5 pt-1.5 border-t border-white/20">
                        {isFree && (
                          <>
                            <span className="text-xs font-black text-emerald-200">
                              🟢 Libre
                            </span>
                            <span className="text-[10px] text-emerald-100 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-400/40">
                              Abrir +
                            </span>
                          </>
                        )}

                        {isPending && (
                          <>
                            <span className="text-xs font-black text-amber-100 animate-pulse">
                              🟡 Pedido QR
                            </span>
                            <span className="text-[10px] text-black font-black bg-amber-300 px-2 py-0.5 rounded-lg shadow-sm">
                              Confirmar &rarr;
                            </span>
                          </>
                        )}

                        {isOpen && table.session && (
                          <>
                            <span className="text-xs sm:text-sm font-black text-white">
                              {formatPrice(table.session.total)}
                            </span>
                            <span className="text-[10px] text-blue-100 font-bold bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-400/40">
                              {
                                table.session.items.filter((it: any) => it.status !== "CANCELLED")
                                  .length
                              }{" "}
                              prod
                            </span>
                          </>
                        )}

                        {isBillReq && table.session && (
                          <>
                            <span className="text-[11px] font-black text-purple-200">
                              🟣 Por Pagar
                            </span>
                            <span className="text-xs font-black text-amber-300">
                              {formatPrice(table.session.total)}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VISTA 4: CONSULTA DE CARTA DIGITAL (Menú Completo para el Mesero) */}
        {activeBottomNav === "menu" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>Carta y Precios de Salón</span>
              </h2>
              <p className="text-xs text-gray-400">
                Consulta de platos, fotos, precios y porciones oficiales del restaurante
              </p>
            </div>

            <div className="space-y-6">
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                    <IconRenderer name={cat.iconName} className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {cat.name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {cat.dishes.map((dish) => (
                      <div
                        key={dish.id}
                        className="bg-[#14161a] border border-gray-800 rounded-2xl p-3 flex gap-3 shadow-sm"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0">
                          <img
                            src={dish.imageUrl || "/logo-pio-pio.png"}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{dish.name}</h4>
                          <span className="text-xs font-black text-amber-400 block mt-0.5">
                            {formatPrice(dish.basePrice)}
                          </span>
                          {dish.portions && dish.portions.length > 0 && (
                            <span className="text-[10px] text-gray-400 block mt-1">
                              {dish.portions.map((p) => `${p.label}: ${formatPrice(p.price)}`).join(" • ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA 5: MI TURNO / PERFIL DEL MESERO */}
        {activeBottomNav === "profile" && (
          <div className="max-w-md mx-auto space-y-4 pt-4">
            <div className="bg-[#14161a] border border-gray-800 rounded-3xl p-6 shadow-xl text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 p-1 mx-auto shadow-lg shadow-amber-500/25">
                <div className="w-full h-full rounded-full bg-[#181b20] flex items-center justify-center text-amber-400 text-2xl font-black">
                  {waiter.name.charAt(0)}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">{waiter.name}</h3>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 inline-block mt-1">
                  Mesero de Salón Activo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left pt-2 border-t border-gray-800">
                <div className="p-3 bg-[#181b20] rounded-2xl border border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">
                    Mesas Activas
                  </span>
                  <span className="text-base font-black text-white">
                    {tablesData.filter((t) => t.session && t.session.waiterId === waiter.id).length} asignadas
                  </span>
                </div>
                <div className="p-3 bg-[#181b20] rounded-2xl border border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">
                    Estado Turno
                  </span>
                  <span className="text-base font-black text-emerald-400">
                    🟢 En Servicio
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Mi Turno</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BARRA DE NAVEGACIÓN INFERIOR (PERMANENTEMENTE VISIBLE CON Z-INDEX 50) */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 inset-x-0 z-50 h-16 bg-[#14161a]/98 backdrop-blur-md border-t border-gray-800 py-1.5 px-3 flex justify-around items-center shadow-2xl">
        <button
          type="button"
          onClick={() => handleBottomNavClick("all")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeBottomNav === "all"
              ? "text-amber-400 font-black scale-105"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px]">Salón</span>
        </button>

        <button
          type="button"
          onClick={() => handleBottomNavClick("pending")}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeBottomNav === "pending"
              ? "text-amber-400 font-black scale-105"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          <span className="text-[10px]">Por Confirmar</span>
          {(counts?.pending || 0) > 0 && (
            <span className="absolute top-0 right-3 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center animate-bounce shadow-md">
              {counts.pending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleBottomNavClick("active")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeBottomNav === "active"
              ? "text-blue-400 font-black scale-105"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px]">Ocupadas</span>
        </button>

        <button
          type="button"
          onClick={() => handleBottomNavClick("menu")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeBottomNav === "menu"
              ? "text-amber-400 font-black scale-105"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px]">Carta</span>
        </button>

        <button
          type="button"
          onClick={() => handleBottomNavClick("profile")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeBottomNav === "profile"
              ? "text-amber-400 font-black scale-105"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px]">Mi Turno</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE MESA OCUPADA (RESPETA BOTTOM-16 PARA DEJAR LA BARRA VISIBLE) */}
      {/* ========================================================================= */}
      {selectedTable && !showAddDishModal && (
        <div
          className="fixed inset-x-0 top-0 bottom-16 z-40 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
          onClick={() => setSelectedTable(null)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#14161a] border border-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                  #{selectedTable.tableNumber}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Mesa #{selectedTable.tableNumber}
                  </h3>
                  <span className="text-xs text-gray-400 font-semibold">
                    {selectedTable.status === "FREE"
                      ? "Mesa Libre"
                      : selectedTable.status === "PENDING_CONFIRMATION"
                      ? "🟡 Pedido QR por confirmar"
                      : selectedTable.status === "BILL_REQUESTED"
                      ? "🟣 Cliente pasando a pagar a Caja"
                      : "🔵 Ocupada / Consumiendo"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTable(null)}
                className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Si está libre */}
            {selectedTable.status === "FREE" && (
              <div className="text-center py-6 space-y-4">
                <p className="text-xs text-gray-400">
                  Esta mesa está libre. ¿Deseas abrirla y tomar el pedido de los comensales?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStagedItems([]);
                    setShowAddDishModal(true);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Abrir Mesa y Tomar Pedido</span>
                </button>
              </div>
            )}

            {/* Si tiene sesión activa */}
            {selectedTable.session && (
              <div className="space-y-4">
                {/* Alerta si es PENDING_CONFIRMATION */}
                {selectedTable.status === "PENDING_CONFIRMATION" && (
                  <div className="p-3.5 bg-amber-500/20 border border-amber-500/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-black">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>El cliente envió este pedido por QR desde la mesa</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Verifica con los comensales y confirma para marchar inmediatamente a la cocina:
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleConfirmOrder(selectedTable.session!.id, "CONFIRM")}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar Pedido</span>
                      </button>
                      <button
                        onClick={() => handleConfirmOrder(selectedTable.session!.id, "REJECT")}
                        disabled={actionLoading}
                        className="py-2.5 px-3 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs rounded-xl active:scale-95 transition-all"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                )}

                {/* Comanda organizada por Rondas con CANDADO DE SEGURIDAD (No se puede quitar productos confirmados) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Comanda Confirmada en Cocina
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Fijada en Caja</span>
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedTable.session.items
                      .filter((item: any) => item.status !== "CANCELLED")
                      .map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3 bg-[#181b20] border border-gray-800 rounded-2xl flex items-center justify-between gap-2 shadow-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-amber-400 text-xs">
                                {item.quantity}x
                              </span>
                              <span className="font-bold text-white text-xs truncate">
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
                              Ronda {item.round} • {item.addedByName || item.addedBy}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-amber-400 text-xs block">
                              {formatPrice(item.subtotal)}
                            </span>
                            <span className="text-[9px] text-emerald-400/90 font-bold">
                              ✓ En marcha
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Advertencia de candado de anulación */}
                  <div className="p-2.5 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center gap-2 text-[10px] text-gray-400">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>
                      Los productos confirmados quedan fijados en la cuenta. Para cualquier anulación acude a la Caja Central.
                    </span>
                  </div>
                </div>

                {/* Resumen Total */}
                <div className="p-4 bg-[#181b20] border border-gray-800 rounded-2xl flex items-center justify-between shadow-inner">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Total Acumulado
                  </span>
                  <span className="text-xl font-black text-amber-400">
                    {formatPrice(selectedTable.session.total)}
                  </span>
                </div>

                {/* Acciones del Mesero */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => {
                      setStagedItems([]);
                      setShowAddDishModal(true);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Agregar Más Platos (Nueva Ronda)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="py-2.5 px-3 bg-[#181b20] hover:bg-gray-800 border border-gray-700/60 text-gray-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                      <span>Cambiar de Mesa</span>
                    </button>

                    <button
                      onClick={() => handleBillRequest(selectedTable.session!.id)}
                      disabled={actionLoading || selectedTable.status === "BILL_REQUESTED"}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        selectedTable.status === "BILL_REQUESTED"
                          ? "bg-purple-950/40 text-purple-300 border border-purple-800/40 cursor-default"
                          : "bg-purple-900/60 hover:bg-purple-800/80 text-white border border-purple-700/50"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-purple-300" />
                      <span>
                        {selectedTable.status === "BILL_REQUESTED"
                          ? "Cuenta Notificada"
                          : "Va a Pagar a Caja"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANTALLA GOURMET DE TOMA DE PEDIDOS (RESPETA BOTTOM-16 PARA DEJAR LA BARRA VISIBLE) */}
      {/* ========================================================================= */}
      {showAddDishModal && selectedTable && (
        <div className="fixed inset-x-0 top-0 bottom-16 z-40 bg-[#0b0c0e] text-white flex flex-col animate-in fade-in">
          {/* Header Superior del Catálogo */}
          <header className="sticky top-0 z-20 bg-[#14161a] border-b border-gray-800 px-4 py-3 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowAddDishModal(false);
                  setIsStagingExpanded(false);
                }}
                className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center active:scale-95 transition-all"
                title="Volver"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white">
                    Tomar Pedido • Mesa #{selectedTable.tableNumber}
                  </h2>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded">
                    Mesero: {waiter.name}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Selecciona y quita platos a gusto antes de confirmar
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddDishModal(false);
                setIsStagingExpanded(false);
              }}
              className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Barra de Búsqueda Gourmet */}
          <div className="bg-[#14161a] px-4 pt-3 pb-2 border-b border-gray-800/80">
            <div className="relative">
              <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre, porción o descripción (ej. Pollo, Sopa, Gaseosa)..."
                value={searchDishQuery}
                onChange={(e) => setSearchDishQuery(e.target.value)}
                className="w-full bg-[#181b20] border border-gray-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              {searchDishQuery && (
                <button
                  type="button"
                  onClick={() => setSearchDishQuery("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Carrusel Horizontal de Categorías (Auto-Scroll Centrado) */}
          <div className="sticky top-[57px] z-10 bg-[#0f1115]/95 backdrop-blur-md border-b border-gray-800/80 py-2.5 px-3 shadow-md">
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
            >
              <button
                type="button"
                data-category-tab="all"
                onClick={() => setSelectedCategoryTab("all")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 min-h-[36px] active:scale-95 ${
                  selectedCategoryTab === "all"
                    ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 scale-[1.02]"
                    : "bg-[#181b20] text-gray-400 hover:text-gray-200 border border-gray-800"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Todos los Platos</span>
              </button>

              {categories.map((cat) => {
                const isActive = selectedCategoryTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    data-category-tab={cat.id}
                    onClick={() => setSelectedCategoryTab(cat.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 min-h-[36px] active:scale-95 ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 scale-[1.02]"
                        : "bg-[#181b20] text-gray-400 hover:text-gray-200 border border-gray-800"
                    }`}
                  >
                    <IconRenderer name={cat.iconName} className="w-3.5 h-3.5" />
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      ({cat.dishes.filter((d) => d.isAvailable).length})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listado de Platos Resumidos con Fotos y Controles Directos de Agregar/Quitar */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-36">
            {filteredDishes.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Utensils className="w-10 h-10 text-gray-600 mx-auto" />
                <p className="text-xs font-bold text-gray-400">
                  No se encontraron platos disponibles
                </p>
                <p className="text-[11px] text-gray-500">
                  Prueba buscando con otro término o seleccionando otra categoría.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-5xl mx-auto">
                {filteredDishes.map(({ dish, categoryName }) => {
                  const totalStagedForDish = stagedItems
                    .filter((it) => it.dishId === dish.id)
                    .reduce((acc, it) => acc + it.quantity, 0);

                  const hasDiscount =
                    dish.discountPrice !== null &&
                    dish.discountPrice !== undefined &&
                    dish.discountPrice > 0;
                  const currentPrice = hasDiscount ? dish.discountPrice : dish.basePrice;

                  return (
                    <div
                      key={dish.id}
                      className={`group bg-[#181b20] border rounded-2xl p-3 flex gap-3 shadow-md transition-all duration-200 ${
                        totalStagedForDish > 0
                          ? "border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/30"
                          : "border-gray-800/80 hover:border-gray-700"
                      }`}
                    >
                      {/* Foto Gastronómica del Plato */}
                      <div className="relative w-22 h-22 sm:w-24 sm:h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-sm">
                        <img
                          src={
                            dish.imageUrl ||
                            "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=300&auto=format&fit=crop"
                          }
                          alt={dish.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {totalStagedForDish > 0 && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">
                            x{totalStagedForDish}
                          </div>
                        )}
                      </div>

                      {/* Información y Controles de Adición / Quitar */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="space-y-1">
                          {/* Badges del Plato */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                              {categoryName}
                            </span>
                            {dish.badge === "POPULAR" && (
                              <span className="inline-flex items-center gap-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                <Flame className="w-2.5 h-2.5 fill-orange-400" />
                                Más Vendido
                              </span>
                            )}
                            {dish.badge === "CHEFS_SPECIAL" && (
                              <span className="inline-flex items-center gap-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                <Star className="w-2.5 h-2.5 fill-amber-300" />
                                Recomendado
                              </span>
                            )}
                            {dish.badge === "NEW" && (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                <Sparkles className="w-2.5 h-2.5" />
                                Nuevo
                              </span>
                            )}
                          </div>

                          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
                            {dish.name}
                          </h3>

                          {dish.description && (
                            <p className="text-[11px] text-gray-400 line-clamp-1 leading-tight">
                              {dish.description}
                            </p>
                          )}
                        </div>

                        {/* Precios y Botones Táctiles de Porciones */}
                        <div className="mt-2 pt-1 border-t border-gray-800/60">
                          {dish.portions && dish.portions.length > 0 ? (
                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-400 font-semibold block">
                                Tamaño / Porción:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {dish.portions.map((p) => {
                                  const countForPortion =
                                    stagedItems.find(
                                      (it) => it.dishId === dish.id && it.portionLabel === p.label
                                    )?.quantity || 0;

                                  return (
                                    <div
                                      key={p.id}
                                      className="flex items-center rounded-xl overflow-hidden border border-gray-700/80 bg-[#14161a]"
                                    >
                                      {countForPortion > 0 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSubtractDishFromStaging(dish.id, p.label)
                                          }
                                          className="p-1 px-1.5 bg-red-950/60 text-red-300 hover:bg-red-900 border-r border-gray-800 active:scale-90 transition-all"
                                          title="Restar o quitar"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleAddDishToStaging(dish, p)}
                                        className={`px-2 py-1 text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 ${
                                          countForPortion > 0
                                            ? "bg-amber-500/20 text-amber-300 font-black"
                                            : "text-gray-200 hover:text-amber-400"
                                        }`}
                                      >
                                        <span>{p.label}</span>
                                        <span className="text-amber-400 font-black">
                                          {formatPrice(p.price)}
                                        </span>
                                        {countForPortion > 0 ? (
                                          <span className="bg-amber-500 text-black px-1 rounded text-[9px] font-black ml-0.5">
                                            {countForPortion}
                                          </span>
                                        ) : (
                                          <Plus className="w-3 h-3 text-amber-400 ml-0.5" />
                                        )}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-black text-amber-400">
                                  {formatPrice(currentPrice!)}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[10px] text-gray-500 line-through">
                                    {formatPrice(dish.basePrice)}
                                  </span>
                                )}
                              </div>

                              {totalStagedForDish > 0 ? (
                                <div className="flex items-center gap-1.5 bg-[#14161a] border border-amber-500/50 rounded-xl p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSubtractDishFromStaging(dish.id)}
                                    className="w-7 h-7 rounded-lg bg-red-950/60 text-red-300 hover:bg-red-900 flex items-center justify-center active:scale-90 transition-all"
                                    title="Quitar uno"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-xs font-black text-white w-5 text-center">
                                    {totalStagedForDish}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddDishToStaging(dish)}
                                    className="w-7 h-7 rounded-lg bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 flex items-center justify-center active:scale-90 transition-all"
                                    title="Agregar uno más"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddDishToStaging(dish)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Agregar</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* BARRA FLOTANTE DEL CARRITO (POSICIONADA JUSTO ENCIMA DE LA BARRA INFERIOR: BOTTOM-16) */}
          {/* ========================================================================= */}
          {stagedItems.length > 0 && (
            <div className="fixed bottom-16 inset-x-0 z-45 bg-[#14161a]/98 backdrop-blur-md border-t-2 border-amber-500/50 p-3 sm:p-4 shadow-2xl transition-all">
              <div className="max-w-3xl mx-auto space-y-3">
                {/* Cabecera de la barra de comanda */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsStagingExpanded(!isStagingExpanded)}
                    className="flex items-center gap-2 text-left active:scale-98 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-md shadow-amber-500/30">
                      {stagedCount}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs font-black text-white">
                        <span>Carrito de Pedido</span>
                        {isStagingExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 block">
                        {isStagingExpanded
                          ? "Toca para ocultar detalle"
                          : "Toca para revisar, quitar platos o agregar notas"}
                      </span>
                    </div>
                  </button>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Total a Confirmar
                    </span>
                    <span className="text-lg font-black text-amber-400">
                      {formatPrice(stagedTotal)}
                    </span>
                  </div>
                </div>

                {/* Vista Expandida de los ítems con botón para QUITAR PLATOS y Notas Rápidas */}
                {isStagingExpanded && (
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1 border-t border-gray-800 pt-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pb-1">
                      <span>Platos seleccionados en el carrito:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setStagedItems([]);
                          toast.info("Se vació el carrito de pedido");
                        }}
                        className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 text-[10px]"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Vaciar todo</span>
                      </button>
                    </div>

                    {stagedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#181b20] border border-gray-800 rounded-2xl space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* Botón explícito para QUITAR PLATO */}
                            <button
                              type="button"
                              onClick={() => handleRemoveStagedItem(idx)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg active:scale-90 transition-all flex-shrink-0"
                              title="Quitar este plato del pedido"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <span className="font-bold text-white text-xs truncate">
                              {item.dishName}{" "}
                              {item.portionLabel ? `(${item.portionLabel})` : ""}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateStagedQuantity(idx, -1)}
                              className="text-gray-400 hover:text-red-400 p-0.5"
                              title="Restar uno"
                            >
                              <MinusCircle className="w-4 h-4" />
                            </button>
                            <span className="font-black text-white w-5 text-center text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateStagedQuantity(idx, 1)}
                              className="text-gray-400 hover:text-green-400 p-0.5"
                              title="Sumar uno"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-amber-400 ml-2">
                              {formatPrice(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>

                        {/* Chips de Notas Rápidas para Cocina */}
                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-500 font-semibold flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5 text-amber-400" />
                            <span>Notas de cocina rápidas:</span>
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {QUICK_KITCHEN_NOTES.map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => {
                                  const curr = item.notes
                                    ? `${item.notes}, ${chip}`
                                    : chip;
                                  handleUpdateStagedNotes(idx, curr);
                                }}
                                className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 active:scale-95 text-gray-300 hover:text-white rounded-lg text-[10px] font-semibold border border-gray-700/60"
                              >
                                + {chip}
                              </button>
                            ))}
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Otra nota especial (ej. sin cebolla, pechuga)..."
                          value={item.notes}
                          onChange={(e) => handleUpdateStagedNotes(idx, e.target.value)}
                          className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* BOTÓN EXPLÍCITO: CONFIRMAR PEDIDO */}
                <button
                  type="button"
                  onClick={handleSaveStagedOrder}
                  disabled={actionLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:opacity-95 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-98 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {actionLoading
                      ? "Confirmando y marchando a cocina..."
                      : `Confirmar Pedido • ${formatPrice(stagedTotal)}`}
                  </span>
                </button>

                <p className="text-[10px] text-gray-400 text-center font-semibold">
                  ⚠️ Al pulsar "Confirmar Pedido" los platos se fijan en la comanda de la mesa y ya no podrán ser quitados por el mesero.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL TRANSFERIR MESA (RESPETA BOTTOM-16) */}
      {showTransferModal && selectedTable && (
        <div
          className="fixed inset-x-0 top-0 bottom-16 z-45 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowTransferModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#14161a] border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                <span>Cambiar Mesa #{selectedTable.tableNumber}</span>
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Selecciona una mesa libre a la cual trasladar la comanda actual:
            </p>

            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
              {tablesData
                .filter((t) => t.status === "FREE")
                .map((freeTable) => (
                  <button
                    key={freeTable.tableNumber}
                    type="button"
                    onClick={() => setTargetTableNumber(freeTable.tableNumber)}
                    className={`p-2.5 rounded-xl border text-xs font-black transition-all ${
                      targetTableNumber === freeTable.tableNumber
                        ? "bg-blue-600 border-blue-400 text-white ring-2 ring-blue-500/50"
                        : "bg-[#181b20] border-gray-800 text-gray-300 hover:border-gray-700"
                    }`}
                  >
                    #{freeTable.tableNumber}
                  </button>
                ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleTransferTable}
                disabled={!targetTableNumber || actionLoading}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30"
              >
                {actionLoading ? "Transfiriendo..." : "Confirmar Cambio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
