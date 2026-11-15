"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Utensils,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Trash2,
  X,
  CreditCard,
  History,
  Users,
  ShieldAlert,
  ArrowRightLeft,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { TableCardData, TableSessionData, WaiterItem } from "@/types";

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
  dishes: MenuItem[];
}

export default function AdminTablesCashierPage() {
  const [activeTab, setActiveTab] = useState<"tables" | "history" | "waiters">("tables");

  // Datos del backend
  const [tablesData, setTablesData] = useState<TableCardData[]>([]);
  const [counts, setCounts] = useState({ open: 0, pending: 0, billRequested: 0, free: 0 });
  const [todaySessions, setTodaySessions] = useState<TableSessionData[]>([]);
  const [waiters, setWaiters] = useState<WaiterItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Mesa seleccionada en caja
  const [selectedTable, setSelectedTable] = useState<TableCardData | null>(null);

  // Modal para agregar producto desde caja
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [searchProductQuery, setSearchProductQuery] = useState<string>("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("all");
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

  // Modal para anular ítem (exclusivo caja)
  const [itemToCancel, setItemToCancel] = useState<{ id: string; name: string } | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");

  // Modal para nuevo mesero
  const [showNewWaiterModal, setShowNewWaiterModal] = useState<boolean>(false);
  const [newWaiterName, setNewWaiterName] = useState<string>("");
  const [newWaiterPin, setNewWaiterPin] = useState<string>("");

  // Filtro de mesas en caja
  const [tableFilter, setTableFilter] = useState<"all" | "free" | "pending" | "open" | "billRequested">("all");

  const filteredTables = useMemo(() => {
    if (tableFilter === "free") return tablesData.filter((t) => t.status === "FREE");
    if (tableFilter === "pending") return tablesData.filter((t) => t.status === "PENDING_CONFIRMATION");
    if (tableFilter === "open") return tablesData.filter((t) => t.status === "OPEN");
    if (tableFilter === "billRequested") return tablesData.filter((t) => t.status === "BILL_REQUESTED");
    return tablesData;
  }, [tablesData, tableFilter]);

  // Formato COP
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Cargar datos de mesas
  const loadTables = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/tables");
      const json = await res.json();
      if (json.success && json.data) {
        setTablesData(json.data.tables || []);
        if (json.data.counts) {
          setCounts(json.data.counts);
        }
        setTodaySessions(json.data.todaySessions || json.data.closedSessionsToday || []);

        setSelectedTable((prev) => {
          if (!prev) return null;
          const up = (json.data.tables || []).find((t: TableCardData) => t.tableNumber === prev.tableNumber);
          return up || null;
        });
      }
    } catch (err) {
      console.error("Error al cargar mesas:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Cargar meseros
  const loadWaiters = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/waiters");
      const json = await res.json();
      if (json.success && json.data) {
        setWaiters(json.data);
      }
    } catch (err) {
      console.error("Error al cargar meseros:", err);
    }
  }, []);

  // Cargar catálogo de menú para adiciones de caja
  const loadMenu = useCallback(async () => {
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
    loadTables();
    loadWaiters();
    loadMenu();

    const interval = setInterval(() => {
      loadTables(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadTables, loadWaiters, loadMenu]);

  // Total acumulado en mesas en este momento
  const totalInTables = useMemo(() => {
    return tablesData.reduce((acc, t) => {
      if (t.session && t.status !== "CLOSED") {
        return acc + t.session.total;
      }
      return acc;
    }, 0);
  }, [tablesData]);

  // Total cobrado hoy en cuentas cerradas
  const totalCollectedToday = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + s.total, 0);
  }, [todaySessions]);

  // Acción de Cobro de 1 Clic
  const handleCheckoutAndFreeTable = async (sessionId: string, tableNumber: string) => {
    if (!confirm(`¿Confirmas el pago y liberación inmediata de la Mesa #${tableNumber}?`)) {
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/tables/${sessionId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closedBy: "Admin / Caja" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success(`¡Mesa #${tableNumber} cobrada exitosamente y liberada!`);
      setSelectedTable(null);
      await loadTables(true);
    } catch (err: any) {
      toast.error(err.message || "Error al procesar cobro");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirmar o rechazar pedido QR desde la caja
  const handleConfirmOrder = async (sessionId: string, action: "CONFIRM" | "REJECT") => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/tables/${sessionId}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, waiterName: "Caja Central" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success(action === "CONFIRM" ? "Pedido QR confirmado y marchado" : "Pedido QR rechazado");
      await loadTables(true);
    } catch (err: any) {
      toast.error(err.message || "Error al procesar pedido");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Anulación de ítem con motivo auditado
  const handleCancelItem = async () => {
    if (!itemToCancel) return;
    if (!cancelReason.trim()) {
      toast.error("Por favor ingresa el motivo de la anulación");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/tables/items/${itemToCancel.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success("Ítem anulado y total de la cuenta actualizado");
      setItemToCancel(null);
      setCancelReason("");
      await loadTables(true);
    } catch (err: any) {
      toast.error(err.message || "Error al anular ítem");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Guardar adición desde la caja
  const handleSaveCashierOrder = async () => {
    if (!selectedTable || stagedItems.length === 0) return;
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/tables/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: selectedTable.tableNumber,
          addedBy: "ADMIN_CASHIER",
          waiterName: "Caja Central",
          items: stagedItems,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success("Productos agregados exitosamente a la cuenta");
      setStagedItems([]);
      setShowAddProductModal(false);
      await loadTables(true);
    } catch (err: any) {
      toast.error(err.message || "Error al agregar productos");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Crear nuevo mesero
  const handleCreateWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaiterName.trim() || newWaiterPin.length !== 4) {
      toast.error("El nombre es requerido y el PIN debe ser exactamente de 4 dígitos");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/waiters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWaiterName.trim(), pin: newWaiterPin.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success(`Mesero ${newWaiterName} registrado exitosamente`);
      setNewWaiterName("");
      setNewWaiterPin("");
      setShowNewWaiterModal(false);
      await loadWaiters();
    } catch (err: any) {
      toast.error(err.message || "Error al crear mesero");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Alternar estado de mesero
  const handleToggleWaiterStatus = async (waiterId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/waiters/${waiterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success(currentActive ? "Mesero desactivado" : "Mesero activado");
      await loadWaiters();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar mesero");
    }
  };

  // Filtrado de platos para adiciones
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

    if (searchProductQuery.trim()) {
      const q = searchProductQuery.toLowerCase();
      list = list.filter(
        (it) =>
          it.dish.name.toLowerCase().includes(q) ||
          it.categoryName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [categories, selectedCategoryTab, searchProductQuery]);

  return (
    <div className="space-y-6">
      {/* Encabezado y Pestañas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#14161a] p-5 rounded-3xl border border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl text-lg font-black">
              🍽️
            </span>
            <div>
              <h1 className="text-xl font-black text-white">
                Control de Mesas y Caja
              </h1>
              <p className="text-xs text-gray-400">
                Pío Pío • Sincronización en tiempo real entre Salón, QR y Caja
              </p>
            </div>
          </div>
        </div>

        {/* Selector de pestañas */}
        <div className="flex items-center gap-1.5 bg-[#0f1115] p-1.5 rounded-2xl border border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab("tables")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "tables"
                ? "bg-amber-500 text-black shadow-md font-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Mesas Activas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-amber-500 text-black shadow-md font-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Cuentas Cerradas Hoy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("waiters")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "waiters"
                ? "bg-amber-500 text-black shadow-md font-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Meseros ({waiters.length})</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: MESAS ACTIVAS Y CAJA */}
      {activeTab === "tables" && (
        <div className="space-y-6">
          {/* Tarjetas métricas superiores interactivas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setTableFilter((prev) => (prev === "open" ? "all" : "open"))}
              className={`p-4 rounded-2xl space-y-1 text-left border transition-all ${
                tableFilter === "open"
                  ? "bg-blue-900/60 border-2 border-blue-400 ring-2 ring-blue-500/40"
                  : "bg-[#14161a] border-blue-900/40 hover:border-blue-700/60"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-blue-400 block">
                Total por Cobrar en Mesas
              </span>
              <span className="text-xl font-black text-amber-400">
                {formatPrice(totalInTables)}
              </span>
              <span className="text-[11px] text-gray-400 block">
                {(counts?.open || 0) + (counts?.billRequested || 0)} mesa(s) con cuenta abierta
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTableFilter((prev) => (prev === "billRequested" ? "all" : "billRequested"))}
              className={`p-4 rounded-2xl space-y-1 text-left border transition-all ${
                tableFilter === "billRequested"
                  ? "bg-purple-900/60 border-2 border-purple-400 ring-2 ring-purple-500/40"
                  : "bg-[#14161a] border-purple-900/40 hover:border-purple-700/60"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-purple-400 block">
                Pidiendo Cuenta a Caja
              </span>
              <span className="text-xl font-black text-purple-300">
                {counts?.billRequested || 0}
              </span>
              <span className="text-[11px] text-gray-400 block">
                Clientes listos para pagar
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTableFilter((prev) => (prev === "pending" ? "all" : "pending"))}
              className={`p-4 rounded-2xl space-y-1 text-left border transition-all ${
                (counts?.pending || 0) > 0
                  ? tableFilter === "pending"
                    ? "bg-amber-600 border-2 border-white ring-2 ring-amber-400 text-white"
                    : "bg-amber-950/60 border-amber-500 animate-pulse text-amber-200"
                  : tableFilter === "pending"
                  ? "bg-amber-900/40 border-2 border-amber-400 text-amber-300"
                  : "bg-[#14161a] border-amber-900/30 text-gray-400"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-amber-400 block">
                Pedidos QR Pendientes
              </span>
              <span className="text-xl font-black text-amber-400">
                {counts?.pending || 0}
              </span>
              <span className="text-[11px] block">
                Esperando confirmación
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTableFilter((prev) => (prev === "free" ? "all" : "free"))}
              className={`p-4 rounded-2xl space-y-1 text-left border transition-all ${
                tableFilter === "free"
                  ? "bg-emerald-900/60 border-2 border-emerald-400 ring-2 ring-emerald-500/40"
                  : "bg-[#14161a] border-emerald-900/40 hover:border-emerald-700/60"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                Mesas Libres
              </span>
              <span className="text-xl font-black text-emerald-400">
                {counts?.free || 0}
              </span>
              <span className="text-[11px] text-gray-400 block">
                Disponibles para comensales
              </span>
            </button>
          </div>

          {/* Filtros rápidos por estado y contador */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                type="button"
                onClick={() => setTableFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  tableFilter === "all"
                    ? "bg-white text-black font-black shadow"
                    : "bg-gray-800/80 text-gray-400 hover:text-white border border-gray-700/50"
                }`}
              >
                Todas ({tablesData.length})
              </button>
              <button
                type="button"
                onClick={() => setTableFilter("free")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tableFilter === "free"
                    ? "bg-emerald-500 text-black font-black shadow"
                    : "bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-800/50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Libres ({counts?.free || 0})
              </button>
              <button
                type="button"
                onClick={() => setTableFilter("pending")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tableFilter === "pending"
                    ? "bg-amber-400 text-black font-black shadow"
                    : "bg-amber-950/40 text-amber-400 hover:bg-amber-900/40 border border-amber-800/50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                QR x Confirmar ({counts?.pending || 0})
              </button>
              <button
                type="button"
                onClick={() => setTableFilter("open")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tableFilter === "open"
                    ? "bg-blue-500 text-white font-black shadow"
                    : "bg-blue-950/40 text-blue-400 hover:bg-blue-900/40 border border-blue-800/50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Ocupadas ({counts?.open || 0})
              </button>
              <button
                type="button"
                onClick={() => setTableFilter("billRequested")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tableFilter === "billRequested"
                    ? "bg-purple-500 text-white font-black shadow"
                    : "bg-purple-950/40 text-purple-400 hover:bg-purple-900/40 border border-purple-800/50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                Pidiendo Cuenta ({counts?.billRequested || 0})
              </button>
            </div>

            <span className="text-xs text-gray-400 font-bold">
              {filteredTables.length} mesas visibles
            </span>
          </div>

          {/* Cuadrícula de Mesas Rectangulares Compactas a Color Completo */}
          {filteredTables.length === 0 ? (
            <div className="text-center py-10 bg-[#14161a] border border-gray-800 rounded-3xl p-6 space-y-2">
              <Utensils className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-xs font-bold text-gray-300">
                No hay mesas en esta categoría actualmente.
              </p>
              <button
                type="button"
                onClick={() => setTableFilter("all")}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs text-amber-400 font-bold rounded-xl"
              >
                Ver Todas las Mesas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {filteredTables.map((table) => {
                const isFree = table.status === "FREE";
                const isPending = table.status === "PENDING_CONFIRMATION";
                const isOpen = table.status === "OPEN";
                const isBillReq = table.status === "BILL_REQUESTED";
                const isSelected = selectedTable?.tableNumber === table.tableNumber;

                return (
                  <button
                    key={table.tableNumber}
                    type="button"
                    onClick={() => setSelectedTable(table)}
                    className={`relative flex flex-col justify-between p-3 rounded-2xl border text-left transition-all active:scale-95 min-h-[82px] sm:min-h-[88px] shadow-sm ${
                      isSelected
                        ? "ring-2 ring-amber-400 border-amber-400 shadow-lg scale-[1.02] z-10"
                        : ""
                    } ${
                      isFree
                        ? "bg-emerald-950/25 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/35 text-gray-200"
                        : isPending
                        ? "bg-amber-950/40 border-2 border-amber-500/80 text-amber-200 animate-pulse shadow-md shadow-amber-500/10"
                        : isBillReq
                        ? "bg-purple-950/35 border-2 border-purple-500/70 hover:border-purple-400 text-purple-200 animate-pulse shadow-md shadow-purple-950/30"
                        : "bg-blue-950/30 border-blue-500/40 hover:border-blue-500/70 hover:bg-blue-950/40 text-gray-200"
                    }`}
                  >
                    {/* Fila Superior: Número de Mesa + Tiempo / Pulso Semafórico */}
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs sm:text-sm font-bold tracking-tight text-white">
                        Mesa #{table.tableNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
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
                            Disponible
                          </span>
                        </>
                      )}

                      {isPending && (
                        <>
                          <span className="text-xs font-black text-amber-300 animate-pulse">
                            🟡 QR x Confirmar
                          </span>
                          <span className="text-[10px] text-amber-400 font-black">
                            Revisar &rarr;
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
                            ítems
                          </span>
                        </>
                      )}

                      {isOpen && !table.session && (
                        <>
                          <span className="text-xs font-semibold text-blue-400">
                            🔵 Ocupada
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            Sin comanda
                          </span>
                        </>
                      )}

                      {isBillReq && table.session && (
                        <>
                          <span className="text-[11px] font-black text-purple-300">
                            🟣 Pidió Cuenta
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

          {/* DETALLE Y LIQUIDACIÓN DE LA MESA SELECCIONADA */}
          {selectedTable && (
            <div className="bg-[#14161a] border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl border border-amber-500/30">
                    #{selectedTable.tableNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">
                        Cuenta Mesa #{selectedTable.tableNumber}
                      </h3>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          selectedTable.status === "FREE"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                            : selectedTable.status === "PENDING_CONFIRMATION"
                            ? "bg-amber-950 text-amber-300 border border-amber-600"
                            : selectedTable.status === "BILL_REQUESTED"
                            ? "bg-purple-950 text-purple-300 border border-purple-600"
                            : "bg-blue-950 text-blue-300 border border-blue-600"
                        }`}
                      >
                        {selectedTable.status}
                      </span>
                    </div>
                    {selectedTable.session && (
                      <span className="text-xs text-gray-400">
                        Atendido por: {selectedTable.session.waiter?.name || "Sin asignar"} • Ronda actual: {Math.max(...selectedTable.session.items.map((i) => i.round), 1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botones de acción superior */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStagedItems([]);
                      setShowAddProductModal(true);
                    }}
                    className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Agregar Producto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTable(null)}
                    className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Si tiene un pedido QR por confirmar */}
              {selectedTable.status === "PENDING_CONFIRMATION" && selectedTable.session && (
                <div className="p-4 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-amber-200">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <span>
                      Hay un pedido realizado por el cliente vía QR pendiente de confirmación.
                    </span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleConfirmOrder(selectedTable.session!.id, "CONFIRM")}
                      disabled={isActionLoading}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl"
                    >
                      Confirmar y Pasar a Cocina
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmOrder(selectedTable.session!.id, "REJECT")}
                      disabled={isActionLoading}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-red-950 hover:bg-red-900 text-red-300 font-bold text-xs rounded-xl border border-red-800"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              )}

              {/* Desglose de Ítems de la Comanda por Ronda */}
              {selectedTable.session && selectedTable.session.items.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-400 uppercase block">
                    Detalle de la Comanda (Trazabilidad por Rondas y Origen)
                  </span>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {selectedTable.session.items.map((item) => {
                      const isCancelled = item.status === "CANCELLED";
                      const itemDate = new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                            isCancelled
                              ? "bg-red-950/20 border-red-900/30 opacity-60 line-through"
                              : "bg-[#181b20] border-gray-800"
                          }`}
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white text-sm">
                                {item.quantity}x {item.dishName}
                              </span>
                              {item.portionLabel && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-bold">
                                  {item.portionLabel}
                                </span>
                              )}
                              {isCancelled && (
                                <span className="text-[10px] text-red-400 font-bold no-underline">
                                  [ANULADO: {item.cancelledReason || "Sin motivo"}]
                                </span>
                              )}
                            </div>

                            {item.notes && (
                              <span className="text-[10px] text-gray-400 italic block">
                                Nota: "{item.notes}"
                              </span>
                            )}

                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              <span>🕒 {itemDate}</span>
                              <span>•</span>
                              <span>Ronda {item.round}</span>
                              <span>•</span>
                              <span>Origen: {item.addedByName || item.addedBy}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`text-sm font-black ${
                                isCancelled ? "text-gray-500" : "text-amber-400"
                              }`}
                            >
                              {formatPrice(item.subtotal)}
                            </span>

                            {/* Botón de anular exclusivo de caja */}
                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() =>
                                  setItemToCancel({ id: item.id, name: item.dishName })
                                }
                                title="Anular este ítem de la comanda"
                                className="w-7 h-7 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 flex items-center justify-center transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumen Final de Cobro de 1 Clic */}
                  <div className="p-4 bg-[#181b20] border border-gray-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase block">
                        Total a Cobrar
                      </span>
                      <span className="text-2xl font-black text-amber-400">
                        {formatPrice(selectedTable.session.total)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleCheckoutAndFreeTable(
                          selectedTable.session!.id,
                          selectedTable.tableNumber
                        )
                      }
                      disabled={isActionLoading}
                      className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all min-h-[48px]"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>✅ Cobrar y Liberar Mesa #{selectedTable.tableNumber}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-500">
                  Esta mesa está libre y no tiene consumos acumulados.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: CUENTAS COBRADAS HOY (HISTORIAL DE TRANSACCIONES) */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#14161a] p-4 rounded-2xl border border-gray-800">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Total Recaudado Hoy en Mesas
              </span>
              <h2 className="text-2xl font-black text-amber-400">
                {formatPrice(totalCollectedToday)}
              </h2>
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-800/80 px-3 py-1.5 rounded-xl">
              {todaySessions.length} cuentas cobradas
            </span>
          </div>

          <div className="bg-[#14161a] border border-gray-800 rounded-3xl overflow-hidden">
            {todaySessions.length === 0 ? (
              <p className="p-8 text-center text-xs text-gray-500">
                No se han registrado pagos de mesas el día de hoy.
              </p>
            ) : (
              <div className="divide-y divide-gray-800">
                {todaySessions.map((session) => {
                  const closeTime = session.closedAt
                    ? new Date(session.closedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--";

                  return (
                    <div
                      key={session.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-900/30 transition-all text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">
                            Mesa #{session.tableNumber}
                          </span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            PAGADA
                          </span>
                          <span className="text-gray-400">🕒 {closeTime}</span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Cobrado por: {session.closedBy || "Caja"} • Atendido: {session.waiter?.name || "Sin asignar"}
                        </p>
                        <div className="text-[10px] text-gray-500">
                          {session.items
                            .filter((i) => i.status !== "CANCELLED")
                            .map((i) => `${i.quantity}x ${i.dishName}`)
                            .join(", ")}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-amber-400 block">
                          {formatPrice(session.total)}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {session.items.filter((i) => i.status !== "CANCELLED").length} productos
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: GESTIÓN DE MESEROS */}
      {activeTab === "waiters" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white">
              Equipo de Meseros ({waiters.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowNewWaiterModal(true)}
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Mesero</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {waiters.map((w) => (
              <div
                key={w.id}
                className="p-4 bg-[#14161a] border border-gray-800 rounded-2xl flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">
                      {w.name}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        w.isActive
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-red-950 text-red-300 border border-red-800"
                      }`}
                    >
                      {w.isActive ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 block">
                    PIN: <span className="font-mono text-amber-400 font-bold">{w.pin}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleWaiterStatus(w.id, w.isActive)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    w.isActive
                      ? "bg-red-950/30 hover:bg-red-900/50 border-red-800/40 text-red-300"
                      : "bg-emerald-950/30 hover:bg-emerald-900/50 border-emerald-800/40 text-emerald-300"
                  }`}
                >
                  {w.isActive ? "Desactivar" : "Activar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL AGREGAR PRODUCTO DESDE CAJA */}
      {showAddProductModal && selectedTable && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
          onClick={() => setShowAddProductModal(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-hidden bg-[#14161a] border border-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#14161a] border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  Agregar a Cuenta - Mesa #{selectedTable.tableNumber}
                </h3>
                <span className="text-xs text-gray-400">
                  Adición directa desde la Caja Central
                </span>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Buscador */}
            <div className="p-3 bg-[#181b20] border-b border-gray-800 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategoryTab === "all"
                      ? "bg-amber-500 text-black font-black"
                      : "bg-[#14161a] text-gray-400 hover:text-white"
                  }`}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryTab(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategoryTab === cat.id
                        ? "bg-amber-500 text-black font-black"
                        : "bg-[#14161a] text-gray-400 hover:text-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Platos */}
            <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[40vh]">
              {filteredDishes.map(({ dish }) => (
                <div
                  key={dish.id}
                  className="p-2.5 bg-[#181b20] border border-gray-800 rounded-2xl flex items-center gap-3 shadow-sm"
                >
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
                    <img
                      src={
                        dish.imageUrl ||
                        "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=300&auto=format&fit=crop"
                      }
                      alt={dish.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-extrabold text-white block truncate">
                      {dish.name}
                    </span>
                    <span className="text-xs font-black text-amber-400 block mt-0.5">
                      {formatPrice(dish.discountPrice && dish.discountPrice > 0 ? dish.discountPrice : dish.basePrice)}
                    </span>
                  </div>

                  {dish.portions && dish.portions.length > 0 ? (
                    <div className="flex gap-1.5 flex-wrap">
                      {dish.portions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setStagedItems((prev) => [
                              ...prev,
                              {
                                dishId: dish.id,
                                dishName: dish.name,
                                portionLabel: p.label,
                                unitPrice: p.price,
                                quantity: 1,
                                notes: "",
                              },
                            ]);
                            toast.success(`+1 ${dish.name} (${p.label})`);
                          }}
                          className="px-2 py-1 bg-[#14161a] hover:bg-amber-500/20 border border-gray-700 rounded-lg text-[10px] font-bold text-gray-300 hover:text-amber-400 transition-all flex items-center gap-1 active:scale-95"
                        >
                          <span>{p.label}</span>
                          <span className="text-amber-400 font-extrabold">{formatPrice(p.price)}</span>
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setStagedItems((prev) => [
                          ...prev,
                          {
                            dishId: dish.id,
                            dishName: dish.name,
                            unitPrice: dish.discountPrice && dish.discountPrice > 0 ? dish.discountPrice : dish.basePrice,
                            quantity: 1,
                            notes: "",
                          },
                        ]);
                        toast.success(`+1 ${dish.name}`);
                      }}
                      className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 px-3 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Ítems por confirmar */}
            {stagedItems.length > 0 && (
              <div className="p-3 bg-[#181b20] border-t border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span>Productos a cargar a la cuenta ({stagedItems.length}):</span>
                  <span className="text-amber-400 font-black">
                    {formatPrice(
                      stagedItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0)
                    )}
                  </span>
                </div>

                <div className="max-h-28 overflow-y-auto space-y-1">
                  {stagedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#14161a] border border-gray-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white">
                        {item.dishName} {item.portionLabel ? `(${item.portionLabel})` : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-black">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setStagedItems((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSaveCashierOrder}
                  disabled={isActionLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-all"
                >
                  {isActionLoading ? "Guardando en cuenta..." : "Confirmar Adición a la Cuenta"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ANULAR ÍTEM CON MOTIVO (EXCLUSIVO CAJA) */}
      {itemToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setItemToCancel(null)}
        >
          <div
            className="w-full max-w-sm bg-[#14161a] border border-red-900/50 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-sm font-black text-white">
                Anular Producto de la Cuenta
              </h3>
            </div>

            <p className="text-xs text-gray-300">
              Estás a punto de anular <strong className="text-white">"{itemToCancel.name}"</strong>.
              El total de la mesa se descontará automáticamente.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400">
                Motivo de la anulación (Requerido) *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej: Cliente canceló antes de servir, error de digitación..."
                rows={2}
                className="w-full bg-[#181b20] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToCancel(null)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCancelItem}
                disabled={isActionLoading || !cancelReason.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/30"
              >
                {isActionLoading ? "Anulando..." : "Confirmar Anulación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO MESERO */}
      {showNewWaiterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowNewWaiterModal(false)}
        >
          <form
            onSubmit={handleCreateWaiter}
            className="w-full max-w-sm bg-[#14161a] border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Registrar Nuevo Mesero</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewWaiterModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400">
                  Nombre del Mesero *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Andrés Gómez"
                  value={newWaiterName}
                  onChange={(e) => setNewWaiterName(e.target.value)}
                  className="w-full bg-[#181b20] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400">
                  PIN de Acceso (4 dígitos) *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="Ej: 4321"
                  value={newWaiterPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setNewWaiterPin(val);
                  }}
                  className="w-full bg-[#181b20] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewWaiterModal(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isActionLoading || newWaiterPin.length !== 4}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
              >
                {isActionLoading ? "Creando..." : "Guardar Mesero"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
