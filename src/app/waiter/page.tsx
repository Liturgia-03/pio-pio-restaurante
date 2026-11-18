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
  ShoppingBag,
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
    "all" | "pending" | "order" | "active" | "menu" | "profile"
  >("all");

  // Filtro de alcance del salón: Salón Completo vs Mis Mesas Asignadas
  const [tableScope, setTableScope] = useState<"all" | "mine">("all");

  // Datos de mesas y menú
  const [tablesData, setTablesData] = useState<TableCardData[]>([]);
  const [counts, setCounts] = useState({ open: 0, pending: 0, billRequested: 0, free: 0 });
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(true);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Estado del modal de mesa seleccionada e inspección
  const [selectedTable, setSelectedTable] = useState<TableCardData | null>(null);
  const [showTableDetailModal, setShowTableDetailModal] = useState<boolean>(false);
  const [orderTableNumber, setOrderTableNumber] = useState<string>("");
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

  // Estado de montaje en cliente (elimina hydration mismatch por extensiones del navegador)
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Cargar sesión guardada de mesero
  useEffect(() => {
    setIsMounted(true);
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

      // Polling inteligente: solo consulta si la pestaña está activa y visible en pantalla
      const interval = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          fetchTables(true);
        }
      }, 6000);

      // Refresco inmediato al desbloquear el teléfono o volver a la app
      const handleResume = () => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          fetchTables(true);
        }
      };

      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", handleResume);
        window.addEventListener("focus", handleResume);
      }

      return () => {
        clearInterval(interval);
        if (typeof document !== "undefined") {
          document.removeEventListener("visibilitychange", handleResume);
          window.removeEventListener("focus", handleResume);
        }
      };
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
  const handleBottomNavClick = (tab: "all" | "pending" | "order" | "active" | "menu" | "profile") => {
    setActiveBottomNav(tab);
    setShowTableDetailModal(false);
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

  // Asignarse / Tomar una mesa a cargo
  const handleClaimTable = async (sessionId: string) => {
    if (!waiter) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tables/${sessionId}/assign-waiter`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waiterId: waiter.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success("¡Mesa asignada a tu turno exitosamente!");
      await fetchTables(true);
    } catch (err: any) {
      toast.error(err.message || "Error al asignarte la mesa");
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
    const tableToOrder = orderTableNumber || selectedTable?.tableNumber;
    if (!tableToOrder) {
      toast.error("Por favor selecciona a qué mesa pertenece este pedido");
      return;
    }
    if (stagedItems.length === 0) {
      toast.error("La comanda está vacía. Agrega al menos un plato antes de confirmar");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/tables/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: tableToOrder,
          waiterId: waiter?.id,
          waiterName: waiter?.name,
          addedBy: "WAITER",
          items: stagedItems,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success(
        `¡Pedido confirmado y marchado a cocina para Mesa #${tableToOrder}! Los productos han quedado fijados en la cuenta.`
      );
      setStagedItems([]);
      setOrderTableNumber("");
      setShowAddDishModal(false);
      setShowTableDetailModal(false);
      setIsStagingExpanded(false);
      await fetchTables(true);
      setActiveBottomNav("all");
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
      const q = searchDishQuery.toLowerCase().trim();
      list = list.filter(
        (it) =>
          it.dish.name.toLowerCase().includes(q) ||
          it.categoryName.toLowerCase().includes(q)
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

  // Cantidad de mesas asignadas actualmente a este mesero
  const myAssignedTablesCount = useMemo(() => {
    if (!waiter) return 0;
    return tablesData.filter(
      (t) => t.session && t.session.waiterId === waiter.id && t.status !== "CLOSED"
    ).length;
  }, [tablesData, waiter]);

  // Mesas filtradas según la pestaña de navegación activa y el alcance (Todas vs Mis Mesas)
  const visibleTables = useMemo(() => {
    let list = tablesData;

    // Si el mesero tiene activado el filtro de ver exclusivamente "Mis Mesas"
    if (tableScope === "mine") {
      list = list.filter((t) => t.session && t.session.waiterId === waiter?.id);
    }

    if (activeBottomNav === "pending") {
      return list.filter((t) => t.status === "PENDING_CONFIRMATION");
    }
    if (activeBottomNav === "active") {
      return list.filter((t) => t.status === "OPEN" || t.status === "BILL_REQUESTED");
    }
    return list;
  }, [tablesData, activeBottomNav, tableScope, waiter]);

  // Esperar a que monte en el cliente para evitar discrepancias de SSR y atributos inyectados por extensiones
  if (!isMounted) {
    return null;
  }

  // Si no ha iniciado sesión, mostrar pantalla de PIN gourmet institucional
  if (!waiter) {
    return (
      <div
        suppressHydrationWarning
        className="min-h-screen bg-[#0b0c0e] text-white flex flex-col justify-center items-center p-4"
      >
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
    <div
      suppressHydrationWarning
      className="min-h-screen bg-[#0b0c0e] text-white flex flex-col pb-24"
    >
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

            {/* Selector de Alcance del Salón: Salón Completo vs Mis Mesas Asignadas */}
            <div className="flex items-center gap-2 p-1.5 bg-[#14161a] border border-gray-800 rounded-2xl shadow-sm">
              <button
                type="button"
                onClick={() => setTableScope("all")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  tableScope === "all"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-md shadow-amber-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Salón Completo ({tablesData.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTableScope("mine")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  tableScope === "mine"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-md shadow-amber-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Mis Mesas ({myAssignedTablesCount})</span>
              </button>
            </div>

            {/* Cabecera del filtro activo */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                {tableScope === "mine" ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mis Mesas Asignadas ({myAssignedTablesCount})</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {activeBottomNav === "all"
                        ? "Salón Completo (Todas las Mesas)"
                        : activeBottomNav === "pending"
                        ? "Mesas con Pedidos QR por Confirmar"
                        : "Mesas Ocupadas con Cuenta Activa"}
                    </span>
                  </>
                )}
              </h2>
              <span className="text-[11px] text-gray-500 font-bold">
                {visibleTables.length} mesas visibles
              </span>
            </div>

            {visibleTables.length === 0 ? (
              <div className="text-center py-12 bg-[#14161a] border border-gray-800 rounded-3xl p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-xl">
                  {tableScope === "mine" ? (
                    <UserCheck className="w-6 h-6" />
                  ) : (
                    <Utensils className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-200">
                    {tableScope === "mine"
                      ? "No tienes mesas asignadas en este momento."
                      : activeBottomNav === "pending"
                      ? "No hay pedidos QR pendientes por confirmar en este momento."
                      : "No hay mesas con cuentas activas en este momento."}
                  </p>
                  {tableScope === "mine" && (
                    <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                      Abre una mesa libre o confirma pedidos QR para asignártelos a tu turno.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTableScope("all");
                    handleBottomNavClick("all");
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs text-amber-400 font-bold rounded-xl transition-all"
                >
                  Ver Salón Completo
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
                          if (orderTableNumber !== table.tableNumber) {
                            setOrderTableNumber(table.tableNumber);
                            setStagedItems([]);
                          }
                          setShowTableDetailModal(false);
                          setShowAddDishModal(true);
                        } else {
                          setShowTableDetailModal(true);
                        }
                      }}
                      className={`relative p-3 rounded-2xl border text-left flex flex-col justify-between min-h-[82px] sm:min-h-[88px] transition-all duration-200 active:scale-95 shadow-sm ${
                        isFree
                          ? "bg-emerald-950/25 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/35 text-gray-200"
                          : isPending
                          ? "bg-amber-950/40 border-2 border-amber-500/80 text-amber-200 animate-pulse shadow-md shadow-amber-500/10"
                          : isOpen
                          ? "bg-blue-950/30 border-blue-500/40 hover:border-blue-500/70 hover:bg-blue-950/40 text-gray-200"
                          : "bg-purple-950/35 border-2 border-purple-500/70 hover:border-purple-400 text-purple-200 animate-pulse shadow-md shadow-purple-950/30"
                      }`}
                    >
                      {/* Fila Superior: Número de Mesa + Indicador Mesero + Tiempo / Pulso Semafórico */}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs sm:text-sm font-bold tracking-tight text-white flex-shrink-0">
                            MESA #{table.tableNumber}
                          </span>
                          {table.session && (
                            table.session.waiterId === waiter?.id ? (
                              <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/25 text-emerald-300 rounded-md border border-emerald-500/40 flex-shrink-0">
                                Tu Mesa
                              </span>
                            ) : table.session.waiter?.name ? (
                              <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded-md border border-gray-700 truncate max-w-[55px] sm:max-w-[70px] block">
                                {table.session.waiter.name}
                              </span>
                            ) : null
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {table.minutesOpen !== null && (
                            <span className="text-[10px] text-gray-400 font-mono flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {table.minutesOpen}m
                            </span>
                          )}
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isFree
                                ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                                : isPending
                                ? "bg-amber-400 animate-ping"
                                : isOpen
                                ? "bg-blue-400 shadow-sm shadow-blue-400/50"
                                : "bg-purple-400 animate-ping"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Fila Inferior: Estado / Total acumulado en formato apaisado rectangular */}
                      <div className="flex items-center justify-between w-full mt-1.5 pt-1.5 border-t border-gray-800/80">
                        {isFree && (
                          <>
                            <span className="text-xs font-semibold text-emerald-400">
                              🟢 Libre
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              Abrir &rarr;
                            </span>
                          </>
                        )}

                        {isPending && (
                          <>
                            <span className="text-xs font-black text-amber-300 animate-pulse">
                              🟡 Pedido QR
                            </span>
                            <span className="text-[10px] text-amber-400 font-black">
                              Confirmar &rarr;
                            </span>
                          </>
                        )}

                        {isOpen && table.session && (
                          <>
                            <span className="text-xs sm:text-sm font-black text-amber-400">
                              {formatPrice(table.session.total)}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
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
                            <span className="text-[11px] font-black text-purple-300">
                              🟣 Por Pagar
                            </span>
                            <span className="text-xs font-black text-amber-400">
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

        {/* VISTA 6: PEDIDO EN PANTALLA COMPLETA (ESTILO CARRITO DEL MENÚ CON DETALLE TOTAL) */}
        {activeBottomNav === "order" && (() => {
          const currentTableNumber = orderTableNumber || selectedTable?.tableNumber || "";

          return (
            <div className="max-w-2xl mx-auto space-y-4 pt-2">
              {/* Header del Pedido */}
              <div className="bg-[#14161a] border border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/10">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white">
                        {currentTableNumber ? `Comanda • Mesa #${currentTableNumber}` : "Comanda de Pedido"}
                      </h2>
                      {stagedCount > 0 && (
                        <span className="text-[10px] bg-amber-500 text-black font-black px-2 py-0.5 rounded-full">
                          {stagedCount} plato(s)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Mesero: <span className="text-amber-400 font-semibold">{waiter.name}</span>
                    </p>
                  </div>
                </div>

                {/* Botón superior Agregar Platos (Siempre visible) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowTableDetailModal(false);
                    setShowAddDishModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar platos</span>
                </button>
              </div>

              {/* Selector interactivo de mesa para la comanda */}
              <div className="bg-[#14161a] border border-gray-800 rounded-2xl p-3.5 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300 font-bold flex items-center gap-1.5">
                    <span className="text-amber-400">📍 Mesa asignada:</span>
                    <span className="font-black text-white text-xs sm:text-sm">
                      {currentTableNumber ? `Mesa #${currentTableNumber}` : "⚠️ Selecciona una mesa"}
                    </span>
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Toca para cambiar de mesa
                  </span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {tablesData.map((t) => {
                    const isSelected = String(currentTableNumber) === String(t.tableNumber);
                    return (
                      <button
                        key={t.tableNumber}
                        type="button"
                        onClick={() => {
                          setOrderTableNumber(t.tableNumber);
                          setSelectedTable(t);
                          toast.info(`Comanda asignada a Mesa #${t.tableNumber}`);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          isSelected
                            ? "bg-amber-500 text-black font-black ring-2 ring-amber-400 shadow-md scale-105"
                            : t.status === "FREE"
                            ? "bg-[#181b20] border border-emerald-500/40 text-emerald-300 hover:border-emerald-400"
                            : "bg-[#181b20] border border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        #{t.tableNumber} {t.status === "FREE" ? "🟢" : "🔵"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Si no hay platos en el pedido */}
              {stagedItems.length === 0 ? (
                <div className="text-center py-16 bg-[#14161a] border border-gray-800 rounded-3xl p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-800/80 flex items-center justify-center mx-auto text-gray-500">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white">Tu comanda de pedido está vacía</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      {currentTableNumber
                        ? `Selecciona platos del menú para la Mesa #${currentTableNumber}.`
                        : "Selecciona una mesa en el salón y agrega los platos que pidan los comensales."}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTableDetailModal(false);
                        setShowAddDishModal(true);
                      }}
                      className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Abrir Catálogo de Platos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBottomNavClick("all")}
                      className="w-full sm:w-auto px-5 py-3 bg-[#181b20] hover:bg-gray-800 border border-gray-700 text-gray-300 font-bold text-xs rounded-2xl active:scale-95 transition-all"
                    >
                      Ver Salón de Mesas
                    </button>
                  </div>
                </div>
              ) : (
                /* Si hay platos en el pedido: Pantalla Completa con todos los detalles */
                <div className="space-y-3">
                  {/* Cabecera con selector o alerta de mesa */}
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-amber-400" />
                      <span>Platos en este pedido ({stagedItems.length}):</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setStagedItems([]);
                        toast.info("Se vació el pedido");
                      }}
                      className="text-red-400 hover:text-red-300 font-bold text-xs flex items-center gap-1 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Vaciar comanda</span>
                    </button>
                  </div>

                  {/* Lista de Platos en Pantalla Completa */}
                  <div className="space-y-2.5">
                    {stagedItems.map((item, idx) => {
                      const dishObj = categories
                        .flatMap((c) => c.dishes)
                        .find((d) => d.id === item.dishId);

                      return (
                        <div
                          key={idx}
                          className="p-3.5 bg-[#14161a] border border-gray-800 rounded-2xl space-y-3 shadow-md hover:border-gray-700/80 transition-all"
                        >
                          {/* Fila del Plato: Foto, Nombre, Porción, Quitar y Cantidad */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Botón explícito para QUITAR PLATO */}
                              <button
                                type="button"
                                onClick={() => handleRemoveStagedItem(idx)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl active:scale-90 transition-all flex-shrink-0"
                                title="Quitar este plato"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              {/* Foto del plato */}
                              {dishObj?.imageUrl ? (
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 border border-gray-800">
                                  <img
                                    src={dishObj.imageUrl}
                                    alt={item.dishName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black flex-shrink-0 border border-amber-500/20 text-lg">
                                  🍗
                                </div>
                              )}

                              {/* Nombre y Precio */}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                  {item.dishName}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {item.portionLabel && (
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                      {item.portionLabel}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-gray-400 font-mono">
                                    {formatPrice(item.unitPrice)} c/u
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Control ergonómico de cantidad [+] / [-] y Subtotal */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex items-center bg-[#181b20] border border-gray-800 rounded-xl p-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStagedQuantity(idx, -1)}
                                  className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/30 flex items-center justify-center active:scale-90 transition-all"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 text-center text-xs font-black text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStagedQuantity(idx, 1)}
                                  className="w-7 h-7 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-950/30 flex items-center justify-center active:scale-90 transition-all"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <span className="text-xs sm:text-sm font-black text-amber-400 min-w-[70px] text-right">
                                {formatPrice(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          </div>

                          {/* Chips de Notas Rápidas de Cocina */}
                          <div className="space-y-1.5 pt-1 border-t border-gray-800/60">
                            <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-amber-400" />
                              <span>Instrucciones rápidas para cocina:</span>
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
                                  className="px-2.5 py-1 bg-[#181b20] hover:bg-gray-800 active:scale-95 text-gray-300 hover:text-white rounded-lg text-[10px] font-semibold border border-gray-700/60 transition-colors"
                                >
                                  + {chip}
                                </button>
                              ))}
                            </div>

                            <input
                              type="text"
                              placeholder="Nota especial (ej. pechuga dorada, sin hielo, salsa aparte)..."
                              value={item.notes}
                              onChange={(e) => handleUpdateStagedNotes(idx, e.target.value)}
                              className="w-full bg-[#181b20] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botón para Seguir Agregando Platos (Siempre visible y accesible) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowTableDetailModal(false);
                      setShowAddDishModal(true);
                    }}
                    className="w-full py-3.5 bg-[#14161a] hover:bg-[#1a1d22] border-2 border-dashed border-amber-500/40 hover:border-amber-400 text-amber-400 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Seguir agregando más platos a esta comanda {currentTableNumber ? `(Mesa #${currentTableNumber})` : ""}</span>
                  </button>

                  {/* Resumen Financiero y Confirmación Definitiva */}
                  <div className="bg-[#14161a] border border-gray-800 rounded-3xl p-5 space-y-4 shadow-2xl">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-400">
                        <span>Cantidad total de platos:</span>
                        <span className="font-bold text-white">{stagedCount} unidades</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Mesa asignada:</span>
                        <span className="font-bold text-amber-400">
                          {currentTableNumber ? `Mesa #${currentTableNumber}` : "⚠️ Sin mesa asignada"}
                        </span>
                      </div>
                      <div className="flex justify-between text-base pt-2 border-t border-gray-800">
                        <span className="font-bold text-white">Total a Confirmar:</span>
                        <span className="text-xl font-black text-amber-400">
                          {formatPrice(stagedTotal)}
                        </span>
                      </div>
                    </div>

                    {/* BOTÓN EXPLÍCITO: CONFIRMAR PEDIDO */}
                    <button
                      type="button"
                      onClick={handleSaveStagedOrder}
                      disabled={actionLoading || !currentTableNumber}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:opacity-95 disabled:opacity-50 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-98 transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>
                        {actionLoading
                          ? "Confirmando y marchando a cocina..."
                          : `Confirmar Pedido • ${formatPrice(stagedTotal)}`}
                      </span>
                    </button>

                    <p className="text-[10px] text-gray-400 text-center font-semibold">
                      ⚠️ Al pulsar "Confirmar Pedido" los platos se marcharán a cocina y quedarán fijados en la comanda de la mesa.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </main>

      {/* ========================================================================= */}
      {/* BARRA DE NAVEGACIÓN INFERIOR (PERMANENTEMENTE VISIBLE CON Z-INDEX 50) */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 inset-x-0 z-50 h-16 bg-[#14161a]/98 backdrop-blur-md border-t border-gray-800 py-1 px-1.5 sm:px-3 flex justify-around items-center shadow-2xl">
        {/* 1. Salón */}
        <button
          type="button"
          onClick={() => handleBottomNavClick("all")}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl transition-all ${
            activeBottomNav === "all"
              ? "text-amber-400 font-black scale-105"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[9px] sm:text-[10px]">Salón</span>
        </button>

        {/* 2. Por Confirmar */}
        <button
          type="button"
          onClick={() => handleBottomNavClick("pending")}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl transition-all ${
            activeBottomNav === "pending"
              ? "text-amber-400 font-black scale-105"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          <span className="text-[9px] sm:text-[10px]">Pendientes</span>
          {(counts?.pending || 0) > 0 && (
            <span className="absolute -top-1 right-0.5 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center animate-bounce shadow-md">
              {counts.pending}
            </span>
          )}
        </button>

        {/* 3. BOTÓN PEDIDO (CON COMPORTAMIENTO IDÉNTICO AL CARRITO DEL MENÚ) */}
        <button
          type="button"
          onClick={() => handleBottomNavClick("order")}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-2xl transition-all ${
            activeBottomNav === "order"
              ? "text-amber-400 font-black scale-105"
              : stagedCount > 0
              ? "text-amber-300 font-bold"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {stagedCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[9px] font-black flex items-center justify-center animate-bounce shadow-md shadow-amber-500/50">
                {stagedCount}
              </span>
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold">Pedido</span>
        </button>

        {/* 4. Ocupadas */}
        <button
          type="button"
          onClick={() => handleBottomNavClick("active")}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl transition-all ${
            activeBottomNav === "active"
              ? "text-blue-400 font-black scale-105"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[9px] sm:text-[10px]">Ocupadas</span>
        </button>

        {/* 5. Carta */}
        <button
          type="button"
          onClick={() => handleBottomNavClick("menu")}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl transition-all ${
            activeBottomNav === "menu"
              ? "text-amber-400 font-black scale-105"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] sm:text-[10px]">Carta</span>
        </button>

        {/* 6. Mi Turno */}
        <button
          type="button"
          onClick={() => handleBottomNavClick("profile")}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl transition-all ${
            activeBottomNav === "profile"
              ? "text-amber-400 font-black scale-105"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[9px] sm:text-[10px]">Turno</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE MESA OCUPADA (RESPETA BOTTOM-16 PARA DEJAR LA BARRA VISIBLE) */}
      {/* ========================================================================= */}
      {showTableDetailModal && selectedTable && (
        <div
          className="fixed inset-x-0 top-0 bottom-16 z-40 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
          onClick={() => setShowTableDetailModal(false)}
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-400 font-semibold">
                      {selectedTable.status === "FREE"
                        ? "Mesa Libre"
                        : selectedTable.status === "PENDING_CONFIRMATION"
                        ? "🟡 Pedido QR por confirmar"
                        : selectedTable.status === "BILL_REQUESTED"
                        ? "🟣 Cliente pasando a pagar a Caja"
                        : "🔵 Ocupada / Consumiendo"}
                    </span>
                    {selectedTable.session && (
                      <span className="text-[11px]">
                        • {selectedTable.session.waiterId === waiter?.id ? (
                          <strong className="text-emerald-400 font-black">👤 Asignada a ti</strong>
                        ) : selectedTable.session.waiter?.name ? (
                          <span className="text-gray-300">👤 {selectedTable.session.waiter.name}</span>
                        ) : (
                          <span className="text-amber-400 font-bold">⚠️ Sin mesero asignado</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTableDetailModal(false)}
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
                    setOrderTableNumber(selectedTable.tableNumber);
                    if (orderTableNumber !== selectedTable.tableNumber) {
                      setStagedItems([]);
                    }
                    setShowTableDetailModal(false);
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
                {/* Opción de autoasignarse la mesa si está huérfana (abierta desde caja o enviada por QR) */}
                {!selectedTable.session.waiterId && (
                  <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-xs text-amber-200 font-bold">
                        Esta mesa no tiene un mesero asignado.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleClaimTable(selectedTable.session!.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex-shrink-0"
                    >
                      Asignármela
                    </button>
                  </div>
                )}
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
                      setOrderTableNumber(selectedTable.tableNumber);
                      if (orderTableNumber !== selectedTable.tableNumber) {
                        setStagedItems([]);
                      }
                      setShowTableDetailModal(false);
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
      {showAddDishModal && (
        <div className="fixed inset-x-0 top-0 bottom-16 z-40 bg-[#0b0c0e] text-white flex flex-col animate-in fade-in">
          {/* Header Superior del Catálogo */}
          <header className="sticky top-0 z-20 bg-[#14161a] border-b border-gray-800 px-4 py-3 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowAddDishModal(false);
                  setShowTableDetailModal(false);
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
                    {orderTableNumber || selectedTable?.tableNumber
                      ? `Tomar Pedido • Mesa #${orderTableNumber || selectedTable?.tableNumber}`
                      : "Tomar Pedido"}
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

            <div className="flex items-center gap-2">
              {stagedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDishModal(false);
                    setShowTableDetailModal(false);
                    setActiveBottomNav("order");
                  }}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Ver Pedido ({stagedCount})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowAddDishModal(false);
                  setShowTableDetailModal(false);
                  setIsStagingExpanded(false);
                }}
                className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
          {/* BOTÓN FLOTANTE RESUMEN (COMPORTAMIENTO IDÉNTICO AL CARRITO DEL MENÚ DIGITAL) */}
          {/* ========================================================================= */}
          {stagedItems.length > 0 && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-45 w-full max-w-sm px-4 animate-in fade-in slide-in-from-bottom-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddDishModal(false);
                  setShowTableDetailModal(false);
                  setActiveBottomNav("order");
                }}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-extrabold rounded-2xl shadow-2xl shadow-orange-500/40 flex items-center justify-between border border-amber-300/30 transition-all min-h-[52px]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-black/30 flex items-center justify-center font-black text-xs text-amber-200">
                    {stagedCount}
                  </div>
                  <span className="text-xs uppercase tracking-wider font-black">
                    Ver Pedido Completo
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">
                    {formatPrice(stagedTotal)}
                  </span>
                  <ShoppingBag className="w-4 h-4 text-amber-200" />
                </div>
              </button>
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
