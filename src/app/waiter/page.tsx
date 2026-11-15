"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Utensils,
  Plus,
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
  UserCheck,
  CreditCard,
  X,
  PlusCircle,
  MinusCircle,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { TableCardData, TableStatus } from "@/types";

interface WaiterUser {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  isAvailable: boolean;
  categoryId: string;
  portions?: { id: string; label: string; price: number }[];
}

interface MenuCategory {
  id: string;
  name: string;
  dishes: MenuItem[];
}

export default function WaiterApp() {
  // Estado de autenticación
  const [waiter, setWaiter] = useState<WaiterUser | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Datos de mesas y menú
  const [tablesData, setTablesData] = useState<TableCardData[]>([]);
  const [counts, setCounts] = useState({ open: 0, pending: 0, billRequested: 0, free: 0 });
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(true);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Estado del modal de mesa seleccionada
  const [selectedTable, setSelectedTable] = useState<TableCardData | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Estados para adición de platos
  const [showAddDishModal, setShowAddDishModal] = useState<boolean>(false);
  const [searchDishQuery, setSearchDishQuery] = useState<string>("");
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
        setTablesData(json.data.tables);
        setCounts(json.data.counts);
        setLastUpdated(new Date());

        // Actualizar la mesa seleccionada si sigue abierta
        setSelectedTable((prev) => {
          if (!prev) return null;
          const updated = json.data.tables.find((t: TableCardData) => t.tableNumber === prev.tableNumber);
          return updated || null;
        });
      }
    } catch (err) {
      console.error("Error al cargar mesas:", err);
    } finally {
      if (!silent) setIsLoadingTables(false);
    }
  }, []);

  // Cargar carta de menú para tomar pedidos
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

  // Manejo del PIN
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

  // Formateador de moneda
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Helpers para confirmar o rechazar pedido QR
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

      toast.success(action === "CONFIRM" ? "¡Pedido confirmado y marchado a cocina!" : "Pedido QR rechazado");
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

  // Adición de ítems a la cuenta
  const handleAddDishToStaging = (dish: MenuItem, portion?: { label: string; price: number }) => {
    const unitPrice = portion ? portion.price : dish.basePrice;
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
  };

  const handleUpdateStagedQuantity = (index: number, delta: number) => {
    setStagedItems((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        copy.splice(index, 1);
      } else {
        copy[index].quantity = newQty;
      }
      return copy;
    });
  };

  const handleUpdateStagedNotes = (index: number, notes: string) => {
    setStagedItems((prev) => {
      const copy = [...prev];
      copy[index].notes = notes;
      return copy;
    });
  };

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

      toast.success("¡Pedido añadido y marchado a cocina!");
      setStagedItems([]);
      setShowAddDishModal(false);
      await fetchTables(true);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar comanda");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrado de platos para búsqueda en selector
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
          it.categoryName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [categories, selectedCategoryTab, searchDishQuery]);

  // Si no ha iniciado sesión, mostrar pantalla de PIN
  if (!waiter) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] text-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-sm bg-[#14161a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Utensils className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-black text-white">Comandero Meseros</h1>
            <p className="text-xs text-gray-400 mt-1">Pío Pío Asadero y Restaurante</p>
            <p className="text-[11px] text-amber-400 font-semibold mt-2">
              Ingresa tu PIN de 4 dígitos para comenzar
            </p>
          </div>

          {/* Círculos del PIN */}
          <div className="flex justify-center gap-3 my-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  pinInput.length > idx
                    ? "bg-amber-400 border-amber-400 scale-110 shadow-md shadow-amber-400/50"
                    : "border-gray-700 bg-transparent"
                }`}
              />
            ))}
          </div>

          {/* Teclado Numérico */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinDigit(num)}
                disabled={isLoggingIn}
                className="h-14 rounded-2xl bg-[#1c1f24] hover:bg-[#252a32] active:scale-95 text-xl font-bold text-white border border-gray-800/80 transition-all flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handlePinDigit("0")}
              disabled={isLoggingIn}
              className="h-14 rounded-2xl bg-[#1c1f24] hover:bg-[#252a32] active:scale-95 text-xl font-bold text-white border border-gray-800/80 transition-all flex items-center justify-center"
            >
              0
            </button>
            <button
              type="button"
              onClick={handlePinDelete}
              disabled={isLoggingIn}
              className="h-14 rounded-2xl bg-[#231a1a] hover:bg-[#322020] active:scale-95 text-sm font-bold text-red-400 border border-red-900/40 transition-all flex items-center justify-center"
            >
              Borrar
            </button>
          </div>

          <p className="text-[10px] text-gray-500 pt-2">
            ¿Olvidaste tu PIN? Solicítalo al administrador en la Caja.
          </p>
        </div>
      </div>
    );
  }

  // Vista principal del mesero
  return (
    <div className="min-h-screen bg-[#0b0c0e] text-white flex flex-col pb-12">
      {/* Barra superior de estado */}
      <header className="sticky top-0 z-30 bg-[#14161a]/95 backdrop-blur-md border-b border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black">
              🍽️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white">Pío Pío</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded">
                  SALÓN
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-white font-bold">{waiter.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTables(false)}
              disabled={isLoadingTables}
              className="p-2 bg-gray-800/80 hover:bg-gray-700 active:scale-95 rounded-xl text-gray-300 transition-all"
              title="Refrescar mesas"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingTables ? "animate-spin text-amber-400" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 rounded-xl text-red-300 text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Contadores rápidos en semáforo */}
        <div className="max-w-6xl mx-auto mt-3 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
            <span className="block text-[10px] text-emerald-400 font-bold uppercase">Libres</span>
            <span className="text-base font-black text-emerald-300">{counts.free}</span>
          </div>
          <div className="p-2 bg-blue-950/30 border border-blue-800/40 rounded-xl">
            <span className="block text-[10px] text-blue-400 font-bold uppercase">Ocupadas</span>
            <span className="text-base font-black text-blue-300">{counts.open}</span>
          </div>
          <div
            className={`p-2 rounded-xl transition-all ${
              counts.pending > 0
                ? "bg-amber-950/60 border-2 border-amber-500 animate-pulse text-amber-300"
                : "bg-amber-950/20 border border-amber-800/30 text-amber-400"
            }`}
          >
            <span className="block text-[10px] font-bold uppercase">Por Confirmar</span>
            <span className="text-base font-black">{counts.pending}</span>
          </div>
          <div className="p-2 bg-purple-950/30 border border-purple-800/40 rounded-xl">
            <span className="block text-[10px] text-purple-400 font-bold uppercase">Pidieron Cuenta</span>
            <span className="text-base font-black text-purple-300">{counts.billRequested}</span>
          </div>
        </div>
      </header>

      {/* Cuadrícula de Mesas */}
      <main className="max-w-6xl mx-auto p-4 w-full">
        {counts.pending > 0 && (
          <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500 rounded-2xl flex items-center justify-between text-amber-300 text-xs font-bold animate-pulse">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Hay {counts.pending} pedido(s) QR esperando confirmación para pasar a cocina</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {tablesData.map((table) => {
            const isFree = table.status === "FREE";
            const isPending = table.status === "PENDING_CONFIRMATION";
            const isOpen = table.status === "OPEN";
            const isBillReq = table.status === "BILL_REQUESTED";

            return (
              <button
                key={table.tableNumber}
                type="button"
                onClick={() => setSelectedTable(table)}
                className={`relative flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-98 min-h-[125px] shadow-lg ${
                  isPending
                    ? "bg-[#251e10] border-amber-500 ring-2 ring-amber-500/50 animate-pulse"
                    : isBillReq
                    ? "bg-[#20142b] border-purple-500 ring-1 ring-purple-500/40"
                    : isOpen
                    ? "bg-[#101b2a] border-blue-500/60 hover:border-blue-400"
                    : "bg-[#14161a] border-emerald-900/40 hover:border-emerald-600/60 opacity-85 hover:opacity-100"
                }`}
              >
                {/* Cabecera de la mesa */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg font-black text-white">
                    Mesa #{table.tableNumber}
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isPending
                        ? "bg-amber-400 animate-ping"
                        : isBillReq
                        ? "bg-purple-400"
                        : isOpen
                        ? "bg-blue-400"
                        : "bg-emerald-500"
                    }`}
                  />
                </div>

                {/* Estado y detalles */}
                <div className="my-1.5 space-y-0.5">
                  {isFree && (
                    <span className="inline-block text-[11px] font-bold text-emerald-400">
                      🟢 Libre
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-block text-[11px] font-black text-amber-300">
                      🟡 Pedido QR x Confirmar
                    </span>
                  )}
                  {isOpen && (
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-blue-300 block">
                        🔵 Ocupada
                      </span>
                      {table.minutesOpen !== null && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {table.minutesOpen} min
                        </span>
                      )}
                    </div>
                  )}
                  {isBillReq && (
                    <span className="inline-block text-[11px] font-black text-purple-300">
                      🟣 Pidiendo Cuenta
                    </span>
                  )}
                </div>

                {/* Pie con valor acumulado */}
                <div className="w-full pt-1.5 border-t border-gray-800/80 flex items-center justify-between">
                  {table.session ? (
                    <>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {table.session.items.filter((i) => i.status !== "CANCELLED").length} platos
                      </span>
                      <span className="text-xs font-black text-amber-400">
                        {formatPrice(table.session.total)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-medium">
                      Tocar para abrir
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* MODAL DETALLE DE MESA */}
      {selectedTable && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
          onClick={() => setSelectedTable(null)}
        >
          <div
            className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#14161a] border border-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[#14161a]/95 backdrop-blur-md border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white">
                  Mesa #{selectedTable.tableNumber}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    selectedTable.status === "FREE"
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50"
                      : selectedTable.status === "PENDING_CONFIRMATION"
                      ? "bg-amber-950/80 text-amber-300 border border-amber-600/50"
                      : selectedTable.status === "BILL_REQUESTED"
                      ? "bg-purple-950/80 text-purple-300 border border-purple-600/50"
                      : "bg-blue-950/80 text-blue-300 border border-blue-600/50"
                  }`}
                >
                  {selectedTable.status === "FREE" && "LIBRE"}
                  {selectedTable.status === "PENDING_CONFIRMATION" && "PEDIDO QR PENDIENTE"}
                  {selectedTable.status === "OPEN" && "OCUPADA"}
                  {selectedTable.status === "BILL_REQUESTED" && "PIDIENDO CUENTA"}
                </span>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-4 space-y-4 flex-1">
              {/* Si la mesa está libre */}
              {selectedTable.status === "FREE" && (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 flex items-center justify-center mx-auto">
                    <Utensils className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Mesa Disponible</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
                      Esta mesa no tiene comanda activa en este momento.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setStagedItems([]);
                      setShowAddDishModal(true);
                    }}
                    className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 font-extrabold text-white text-xs rounded-xl shadow-lg shadow-emerald-600/30 inline-flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Abrir Mesa y Tomar Pedido</span>
                  </button>
                </div>
              )}

              {/* Si la mesa tiene un pedido QR por confirmar */}
              {selectedTable.status === "PENDING_CONFIRMATION" && selectedTable.session && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-xs text-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Pedido enviado desde el celular del cliente</span>
                      Verifica con la mesa y presiona confirmar para marchar los platos inmediatamente a cocina.
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedTable.session.items
                      .filter((i) => i.status === "PENDING_CONFIRMATION")
                      .map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-[#181b20] border border-amber-900/30 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-extrabold text-white block">
                              {item.quantity}x {item.dishName}
                              {item.portionLabel ? ` (${item.portionLabel})` : ""}
                            </span>
                            {item.notes && (
                              <span className="text-[10px] text-amber-400 font-medium block">
                                Nota: "{item.notes}"
                              </span>
                            )}
                          </div>
                          <span className="font-black text-amber-300">
                            {formatPrice(item.subtotal)}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleConfirmOrder(selectedTable.session!.id, "CONFIRM")}
                      disabled={actionLoading}
                      className="py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar y Marchar</span>
                    </button>
                    <button
                      onClick={() => handleConfirmOrder(selectedTable.session!.id, "REJECT")}
                      disabled={actionLoading}
                      className="py-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Si la mesa está consumiendo o pidiendo cuenta */}
              {(selectedTable.status === "OPEN" || selectedTable.status === "BILL_REQUESTED") &&
                selectedTable.session && (
                  <div className="space-y-4">
                    {/* Lista de platos confirmados por Rondas */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-300 uppercase">
                          Comanda Activa
                        </span>
                        <span className="text-xs font-semibold text-gray-400">
                          {selectedTable.session.items.filter((i) => i.status !== "CANCELLED").length} productos
                        </span>
                      </div>

                      <div className="space-y-2">
                        {selectedTable.session.items
                          .filter((i) => i.status !== "CANCELLED")
                          .map((item) => (
                            <div
                              key={item.id}
                              className="p-3 bg-[#181b20] border border-gray-800 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-white">
                                    {item.quantity}x {item.dishName}
                                  </span>
                                  {item.portionLabel && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold">
                                      {item.portionLabel}
                                    </span>
                                  )}
                                </div>
                                {item.notes && (
                                  <span className="text-[10px] text-gray-400 italic block">
                                    "{item.notes}"
                                  </span>
                                )}
                                <span className="text-[9px] text-gray-500 block">
                                  Ronda {item.round} • {item.addedByName || item.addedBy}
                                </span>
                              </div>
                              <span className="font-black text-amber-400 text-sm">
                                {formatPrice(item.subtotal)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Resumen Total */}
                    <div className="p-3.5 bg-[#181b20] border border-gray-800 rounded-2xl flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        Total Cuenta
                      </span>
                      <span className="text-xl font-black text-amber-400">
                        {formatPrice(selectedTable.session.total)}
                      </span>
                    </div>

                    {/* Acciones de Mesero */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => {
                          setStagedItems([]);
                          setShowAddDishModal(true);
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Agregar Platos / Adiciones</span>
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

                      <p className="text-[10px] text-gray-500 text-center pt-1">
                        🔒 Las anulaciones y el cobro final se realizan únicamente en la Caja.
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR PLATOS / ADICIONES */}
      {showAddDishModal && selectedTable && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
          onClick={() => setShowAddDishModal(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-hidden bg-[#14161a] border border-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Selector */}
            <div className="p-4 bg-[#14161a] border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  Tomar Pedido - Mesa #{selectedTable.tableNumber}
                </h3>
                <span className="text-xs text-gray-400">
                  Selecciona los platos para marchar a cocina
                </span>
              </div>
              <button
                onClick={() => setShowAddDishModal(false)}
                className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Buscador y Categorías */}
            <div className="p-3 bg-[#181b20] border-b border-gray-800 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar pollo, gaseosa, porción..."
                  value={searchDishQuery}
                  onChange={(e) => setSearchDishQuery(e.target.value)}
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Categorías deslizables */}
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

            {/* Listado de Platos */}
            <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[40vh]">
              {filteredDishes.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">
                  No se encontraron platos con ese criterio
                </p>
              ) : (
                filteredDishes.map(({ dish }) => (
                  <div
                    key={dish.id}
                    className="p-2.5 bg-[#181b20] border border-gray-800/80 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-extrabold text-white block truncate">
                        {dish.name}
                      </span>
                      <span className="text-xs font-black text-amber-400">
                        {formatPrice(dish.basePrice)}
                      </span>
                    </div>

                    {/* Si tiene porciones */}
                    {dish.portions && dish.portions.length > 0 ? (
                      <div className="flex gap-1.5 flex-wrap">
                        {dish.portions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleAddDishToStaging(dish, p)}
                            className="px-2 py-1 bg-[#14161a] hover:bg-amber-500/20 hover:border-amber-500 border border-gray-700 rounded-lg text-[10px] font-bold text-gray-300 hover:text-amber-400 transition-all flex items-center gap-1"
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
                        onClick={() => handleAddDishToStaging(dish)}
                        className="p-1.5 bg-amber-500 hover:bg-amber-600 text-black rounded-lg font-bold text-xs flex items-center gap-1 px-3"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Previa de Ítems Seleccionados para Marchar */}
            {stagedItems.length > 0 && (
              <div className="p-3 bg-[#181b20] border-t border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span>Platos a marchar a cocina ({stagedItems.length}):</span>
                  <span className="text-amber-400 font-black">
                    {formatPrice(stagedItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0))}
                  </span>
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                  {stagedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#14161a] border border-gray-800 rounded-xl space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          {item.dishName} {item.portionLabel ? `(${item.portionLabel})` : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStagedQuantity(idx, -1)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <span className="font-extrabold text-white w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateStagedQuantity(idx, 1)}
                            className="text-gray-400 hover:text-green-400"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-amber-400 ml-2">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>

                      {/* Chips de notas rápidas */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {["Sin ensalada", "Bien dorado", "Para llevar", "Papas doradas"].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              const curr = item.notes ? `${item.notes}, ${chip}` : chip;
                              handleUpdateStagedNotes(idx, curr);
                            }}
                            className="px-1.5 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded text-[10px]"
                          >
                            +{chip}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        placeholder="Nota especial (ej: sin cebolla)..."
                        value={item.notes}
                        onChange={(e) => handleUpdateStagedNotes(idx, e.target.value)}
                        className="w-full bg-[#181b20] border border-gray-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSaveStagedOrder}
                  disabled={actionLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-98 transition-all"
                >
                  <Utensils className="w-4 h-4" />
                  <span>
                    {actionLoading ? "Marchando a cocina..." : "Confirmar y Marchar a Cocina"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL TRANSFERIR MESA */}
      {showTransferModal && selectedTable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
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
