"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  WalletCards,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  RefreshCw,
  Printer,
  Trash2,
  Layers,
  FileText,
  ChevronRight,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Smartphone,
  Banknote,
  Utensils,
  Receipt,
  User,
  ShoppingBag,
  Flame,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatters";
import { EXPENSE_CATEGORIES } from "@/lib/caja-helpers";
import { AdminAuthModal } from "@/components/admin/AdminAuthModal";

interface CashShiftData {
  id: string;
  status: string;
  openedAt: string;
  closedAt?: string | null;
  openedBy: string;
  closedBy?: string | null;
  initialCash: number;
  expectedCash?: number | null;
  actualCash?: number | null;
  difference?: number | null;
  totalSalesCash: number;
  totalSalesDigital: number;
  totalSalesCard: number;
  totalExpensesCash: number;
  totalExpensesDigital: number;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  notes?: string | null;
}

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  responsible?: string | null;
  receiptNumber?: string | null;
  date: string;
}

interface ReportData {
  period: string;
  periodLabel?: string;
  startDate: string;
  endDate: string;
  summary: {
    totalSales: number;
    totalExpenses: number;
    netProfit: number;
    averageTicket: number;
    ordersCount: number;
    expensesCount: number;
    shiftsCount: number;
  };
  salesBreakdown: {
    cash: number;
    digital: number;
    card: number;
    mesas: number;
    barra: number;
  };
  expensesBreakdown: {
    cash: number;
    digital: number;
    byCategory: { category: string; label: string; amount: number; count: number }[];
  };
  topDishes: { name: string; quantity: number; revenue: number }[];
  recentShifts: CashShiftData[];
}

export function AdminCajaView() {
  const [activeTab, setActiveTab] = useState<"shift" | "expenses" | "reports" | "audit">("shift");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Datos del turno activo
  const [activeShift, setActiveShift] = useState<CashShiftData | null>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const [recentClosedShifts, setRecentClosedShifts] = useState<CashShiftData[]>([]);

  // Datos de auditoría
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");
  const [isAuditLoading, setIsAuditLoading] = useState<boolean>(false);

  // Modal para limpieza de historial
  const [showClearHistoryModal, setShowClearHistoryModal] = useState<boolean>(false);
  const [clearStartDate, setClearStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [clearEndDate, setClearEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [clearIncludeExpenses, setClearIncludeExpenses] = useState<boolean>(false);

  // Modal de autorización administrativa con PIN
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType:
      | "REACTIVATE_SESSION"
      | "EDIT_PAYMENT_METHOD"
      | "CANCEL_SESSION"
      | "DELETE_SESSION"
      | "REOPEN_SHIFT"
      | "CLEAR_HISTORY";
    payload: Record<string, any>;
    confirmButtonText?: string;
    confirmButtonColor?: "amber" | "rose" | "emerald" | "blue";
    detailsBadge?: string;
  } | null>(null);

  // Datos de gastos
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [selectedExpenseCat, setSelectedExpenseCat] = useState<string>("ALL");

  // Datos de reportes
  const [reportPeriod, setReportPeriod] = useState<"day" | "week" | "month" | "year" | "custom">("day");
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);

  // Modales
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [openInitialCash, setOpenInitialCash] = useState<number>(100000);
  const [openCajeroName, setOpenCajeroName] = useState<string>("Admin en Caja");
  const [openNotes, setOpenNotes] = useState<string>("");

  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [countedCash, setCountedCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState<string>("");

  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expCategory, setExpCategory] = useState<string>("CARBON_GAS");
  const [expDescription, setExpDescription] = useState<string>("");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expPaymentMethod, setExpPaymentMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [expResponsible, setExpResponsible] = useState<string>("Admin en Caja");
  const [expReceipt, setExpReceipt] = useState<string>("");

  const [printShift, setPrintShift] = useState<CashShiftData | null>(null);

  // 1. Cargar turno de caja activo
  const fetchShiftData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/caja/shift");
      const json = await res.json();
      if (json.success && json.data) {
        setActiveShift(json.data.activeShift || null);
        setLiveData(json.data.liveData || null);
        setRecentClosedShifts(json.data.recentClosedShifts || []);
        if (json.data.liveData?.expectedCash) {
          setCountedCash(json.data.liveData.expectedCash);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Cargar gastos
  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/caja/expenses");
      const json = await res.json();
      if (json.success && json.data) {
        setExpensesList(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 3. Cargar reportes contables
  const fetchReport = useCallback(async () => {
    setIsReportLoading(true);
    try {
      let url = `/api/admin/caja/reports?period=${reportPeriod}`;
      if (reportPeriod === "custom") {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      } else {
        url += `&date=${customDate}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setReportData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReportLoading(false);
    }
  }, [reportPeriod, customDate, customStartDate, customEndDate]);

  useEffect(() => {
    fetchShiftData();
    fetchExpenses();
  }, [fetchShiftData, fetchExpenses]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReport();
    }
  }, [activeTab, fetchReport]);

  // 4. Cargar bitácora de auditoría
  const fetchAuditLogs = useCallback(async () => {
    setIsAuditLoading(true);
    try {
      let url = "/api/admin/audit?limit=100";
      if (auditActionFilter !== "ALL") {
        url += `&action=${auditActionFilter}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setAuditLogs(json.data);
      }
    } catch (err) {
      console.error("Error al cargar auditoría:", err);
    } finally {
      setIsAuditLoading(false);
    }
  }, [auditActionFilter]);

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  // Handler para reabrir turno cerrado
  const handleRequestReopenShift = (shift: CashShiftData) => {
    if (activeShift) {
      toast.error(
        `Ya existe un turno abierto actualmente (#${activeShift.id.slice(-4)}). Debes cerrarlo antes de reabrir este turno.`
      );
      return;
    }

    setAuthModalConfig({
      isOpen: true,
      title: "Reabrir Turno de Caja Liquidado",
      description: `El turno del ${new Date(shift.openedAt).toLocaleDateString()} volverá a estar ABIERTO. Podrás continuar registrando ventas y gastos en este turno.`,
      actionType: "REOPEN_SHIFT",
      payload: { shiftId: shift.id },
      confirmButtonText: "Autorizar y Reabrir Turno",
      confirmButtonColor: "amber",
      detailsBadge: `Turno #${shift.id.slice(-4)} • Ventas: ${formatPrice(
        (shift.totalSalesCash || 0) + (shift.totalSalesDigital || 0) + (shift.totalSalesCard || 0)
      )}`,
    });
  };

  // Handler para limpieza de historial
  const handleConfirmClearHistory = () => {
    if (!clearStartDate || !clearEndDate) {
      toast.error("Selecciona el rango de fechas para la limpieza");
      return;
    }

    setShowClearHistoryModal(false);

    setAuthModalConfig({
      isOpen: true,
      title: "Limpieza Masiva de Historial / Pruebas",
      description: `Se eliminarán permanentemente todas las cuentas cobradas entre el ${clearStartDate} y el ${clearEndDate}${
        clearIncludeExpenses ? " y sus gastos registrados" : ""
      }. Esta acción no se puede deshacer.`,
      actionType: "CLEAR_HISTORY",
      payload: {
        startDate: clearStartDate,
        endDate: clearEndDate,
        includeExpenses: clearIncludeExpenses,
      },
      confirmButtonText: "Autorizar y Purgar Datos",
      confirmButtonColor: "rose",
      detailsBadge: `PERÍODO: ${clearStartDate} al ${clearEndDate}${clearIncludeExpenses ? " (+ Gastos)" : ""}`,
    });
  };

  // Intervalo para actualizar el arqueo en vivo cada 15 segundos
  useEffect(() => {
    if (activeTab === "shift" && activeShift) {
      const interval = setInterval(fetchShiftData, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab, activeShift, fetchShiftData]);

  // Manejo de Apertura de Caja
  const handleOpenShift = async () => {
    if (openInitialCash < 0) {
      toast.error("La base inicial no puede ser negativa");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/caja/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialCash: openInitialCash,
          openedBy: openCajeroName,
          notes: openNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "No se pudo abrir el turno de caja");
      }
      toast.success(json.message);
      setShowOpenModal(false);
      fetchShiftData();
    } catch (err: any) {
      toast.error(err.message || "Error al abrir turno");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejo de Cierre y Liquidación de Caja
  const handleCloseShift = async () => {
    if (!activeShift) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/caja/shift", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: activeShift.id,
          actualCash: countedCash,
          closedBy: openCajeroName,
          notes: closeNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Error al liquidar el turno");
      }
      toast.success(json.message);
      setShowCloseModal(false);
      setPrintShift(json.data);
      fetchShiftData();
      fetchReport();
    } catch (err: any) {
      toast.error(err.message || "Error al liquidar turno");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejo de Registro de Gasto
  const handleCreateExpense = async () => {
    if (!expDescription.trim() || expAmount <= 0) {
      toast.error("Ingresa una descripción y un monto válido");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/caja/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: expCategory,
          description: expDescription,
          amount: expAmount,
          paymentMethod: expPaymentMethod,
          responsible: expResponsible,
          receiptNumber: expReceipt,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Error al registrar el gasto");
      }
      toast.success(json.message);
      setShowExpenseModal(false);
      setExpDescription("");
      setExpAmount(0);
      setExpReceipt("");
      fetchExpenses();
      fetchShiftData();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar gasto");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar un gasto
  const handleDeleteExpense = async (id: string) => {
    if (!confirm("¿Deseas eliminar este registro de gasto?")) return;
    try {
      const res = await fetch(`/api/admin/caja/expenses?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Gasto eliminado");
        fetchExpenses();
        fetchShiftData();
      } else {
        toast.error(json.message || "Error al eliminar");
      }
    } catch {
      toast.error("Error al procesar la solicitud");
    }
  };

  // Cálculo de diferencia de caja en el modal
  const liveDiff = useMemo(() => {
    const expected = liveData?.expectedCash || 0;
    return countedCash - expected;
  }, [countedCash, liveData]);

  // Filtrado de gastos en la pestaña
  const filteredExpenses = useMemo(() => {
    if (selectedExpenseCat === "ALL") return expensesList;
    return expensesList.filter((e) => e.category === selectedExpenseCat);
  }, [expensesList, selectedExpenseCat]);

  return (
    <div className="w-full bg-[#101217] border border-gray-800/80 rounded-3xl flex flex-col shadow-2xl overflow-hidden min-h-[calc(100vh-140px)]">
      {/* ======================================================================= */}
      {/* 1. CABECERA PRINCIPAL Y STATUS DEL TURNO                                */}
      {/* ======================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3.5 bg-[#14161f] border-b border-gray-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
            <WalletCards className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white">
                Caja & Contabilidad
              </h1>
              {activeShift ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  TURNO ABIERTO
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[10px] border border-rose-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  CAJA CERRADA
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {activeShift
                ? `Abierto por ${activeShift.openedBy} • Base inicial: ${formatPrice(activeShift.initialCash)}`
                : "No hay un turno de caja activo en este momento"}
            </p>
          </div>
        </div>

        {/* Botones de acción según estado */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={fetchShiftData}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all"
            title="Refrescar datos en vivo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {activeShift ? (
            <>
              <button
                type="button"
                onClick={() => setShowExpenseModal(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs border border-rose-800/50 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Registrar Gasto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCountedCash(liveData?.expectedCash || 0);
                  setShowCloseModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Liquidar & Cerrar Caja</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowOpenModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
            >
              <Banknote className="w-4 h-4 stroke-[2.5]" />
              <span>Abrir Turno de Caja</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. BARRA DE NAVEGACIÓN EN PESTAÑAS                                     */}
      {/* ======================================================================= */}
      <div className="flex items-center px-4 sm:px-6 border-b border-gray-800 bg-[#12141c] gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("shift")}
          className={`py-3 px-3.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "shift"
              ? "border-amber-500 text-amber-400 font-black"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Turno & Arqueo en Vivo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className={`py-3 px-3.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "expenses"
              ? "border-amber-500 text-amber-400 font-black"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Libro de Gastos ({expensesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`py-3 px-3.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "reports"
              ? "border-amber-500 text-amber-400 font-black"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Histórico & Reportes Contables</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`py-3 px-3.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "audit"
              ? "border-amber-500 text-amber-400 font-black"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Auditoría & Seguridad PIN</span>
        </button>
      </div>

      {/* ======================================================================= */}
      {/* 3. PESTAÑA 1: TURNO Y ARQUEO EN VIVO                                    */}
      {/* ======================================================================= */}
      {activeTab === "shift" && (
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {!activeShift ? (
            /* Estado cuando la caja está cerrada */
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Banknote className="w-8 h-8 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-black text-white">
                  Caja Cerrada en este Momento
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Para registrar ventas con control de arqueo, gastos de caja menor y liquidar el día, inicia un nuevo turno ingresando la base inicial en efectivo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOpenModal(true)}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-xl active:scale-95 transition-all flex items-center gap-2"
              >
                <Banknote className="w-4 h-4 stroke-[2.5]" />
                <span>Iniciar Apertura de Turno</span>
              </button>
            </div>
          ) : (
            /* Estado cuando la caja está abierta */
            <>
              {/* Tarjetas KPI de Arqueo en Vivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Efectivo en Caja Esperado */}
                <div className="bg-[#161a24] border border-amber-500/40 p-4 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                      EFECTIVO EN CAJA ESPERADO
                    </span>
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                      <Banknote className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {formatPrice(liveData?.expectedCash || 0)}
                  </div>
                  <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-800 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Base Inicial:</span>
                      <span className="text-gray-200 font-bold">{formatPrice(activeShift.initialCash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Ventas Efectivo:</span>
                      <span className="text-emerald-400 font-bold">{formatPrice(liveData?.salesCash || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>- Gastos Efectivo:</span>
                      <span className="text-rose-400 font-bold">{formatPrice(liveData?.expensesCash || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Ventas Digitales (Nequi / Daviplata) */}
                <div className="bg-[#171626] border border-indigo-500/30 p-4 rounded-2xl space-y-2 shadow-lg">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider block">
                      VENTAS DIGITALES (NEQUI)
                    </span>
                    <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                      <Smartphone className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-indigo-200">
                    {formatPrice(liveData?.salesDigital || 0)}
                  </div>
                  <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-800">
                    Acreditaciones recibidas en cuenta bancaria del asadero
                  </p>
                </div>

                {/* 3. Ventas Datáfono / Tarjeta */}
                <div className="bg-[#121c29] border border-sky-500/30 p-4 rounded-2xl space-y-2 shadow-lg">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-sky-300 uppercase tracking-wider block">
                      VENTAS TARJETA (DATÁFONO)
                    </span>
                    <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
                      <CreditCard className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-sky-200">
                    {formatPrice(liveData?.salesCard || 0)}
                  </div>
                  <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-800">
                    Vouchers aprobados en datáfono físico
                  </p>
                </div>

                {/* 4. Utilidad Neta del Turno */}
                <div className="bg-[#131d1a] border border-emerald-500/30 p-4 rounded-2xl space-y-2 shadow-lg">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                      UTILIDAD NETA DEL TURNO
                    </span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-300">
                    {formatPrice(liveData?.netProfit || 0)}
                  </div>
                  <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-800 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Ventas Totales:</span>
                      <span className="text-white font-bold">{formatPrice(liveData?.totalSales || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gastos Totales:</span>
                      <span className="text-rose-400 font-bold">{formatPrice(liveData?.totalExpenses || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paneles Divididos: Ventas del Turno vs Gastos del Turno */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Listado de Ventas del Turno */}
                <div className="bg-[#14161f] border border-gray-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2.5">
                    <div>
                      <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-amber-400" />
                        <span>Ventas del Turno ({liveData?.salesCount || 0})</span>
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        Mesas: {formatPrice(liveData?.salesMesas || 0)} • Barra: {formatPrice(liveData?.salesBarra || 0)}
                      </p>
                    </div>
                    <span className="text-xs font-black text-amber-400">
                      {formatPrice(liveData?.totalSales || 0)}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {liveData?.recentSessions?.length === 0 ? (
                      <p className="text-[11px] text-gray-500 py-6 text-center italic">
                        No hay ventas cerradas todavía en este turno.
                      </p>
                    ) : (
                      liveData?.recentSessions?.map((s: any) => (
                        <div
                          key={s.id}
                          className="bg-[#1a1e27] p-2.5 rounded-xl border border-gray-800 flex justify-between items-center text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-amber-400 text-[11px]">
                                {s.tableNumber}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(s.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 line-clamp-1 truncate">
                              {s.closedBy || "Caja"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-white block">
                              {formatPrice(s.total)}
                            </span>
                            <span className="text-[9px] text-gray-500">
                              {s.items?.length || 0} ítems
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Listado de Gastos del Turno */}
                <div className="bg-[#14161f] border border-gray-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2.5">
                    <div>
                      <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4 text-rose-400" />
                        <span>Gastos de este Turno ({liveData?.expensesCount || 0})</span>
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        Efectivo: {formatPrice(liveData?.expensesCash || 0)} • Digital: {formatPrice(liveData?.expensesDigital || 0)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowExpenseModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold text-[10px] border border-rose-800/60 flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>+ Gasto</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {liveData?.recentExpenses?.length === 0 ? (
                      <p className="text-[11px] text-gray-500 py-6 text-center italic">
                        No se han registrado salidas de dinero en este turno.
                      </p>
                    ) : (
                      liveData?.recentExpenses?.map((e: any) => {
                        const cat = EXPENSE_CATEGORIES[e.category] || { label: e.category, icon: "🏷️", color: "text-gray-400" };
                        return (
                          <div
                            key={e.id}
                            className="bg-[#1a1e27] p-2.5 rounded-xl border border-gray-800 flex justify-between items-center text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px]">{cat.icon}</span>
                                <span className="font-bold text-gray-200 text-xs">
                                  {e.description}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400">
                                {cat.label} • {e.paymentMethod === "CASH" ? "💵 Efectivo" : "📱 Digital"} • Por: {e.responsible || "Caja"}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-rose-400 block">
                                -{formatPrice(e.amount)}
                              </span>
                              <span className="text-[9px] text-gray-500">
                                {new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Historial de Turnos Liquidados Recientes */}
          <div className="bg-[#14161f] border border-gray-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>ÚLTIMOS TURNOS DE CAJA LIQUIDADOS</span>
            </h3>

            {recentClosedShifts.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No hay turnos cerrados registrados previamente.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {recentClosedShifts.map((s) => {
                  const diff = s.difference || 0;
                  return (
                    <div
                      key={s.id}
                      className="bg-[#181b24] border border-gray-800 rounded-xl p-3 space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[11px] font-black text-white block">
                            {new Date(s.openedAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(s.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} a {s.closedAt ? new Date(s.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </span>
                        </div>
                        {diff === 0 ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            CUADRE EXACTO
                          </span>
                        ) : diff > 0 ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            +{formatPrice(diff)} SOBRANTE
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            -{formatPrice(Math.abs(diff))} FALTANTE
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-gray-400 space-y-0.5 border-t border-gray-800 pt-1.5">
                        <div className="flex justify-between">
                          <span>Ventas Totales:</span>
                          <span className="font-bold text-white">{formatPrice(s.totalSales)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gastos Totales:</span>
                          <span className="font-bold text-rose-400">{formatPrice(s.totalExpenses)}</span>
                        </div>
                        <div className="flex justify-between font-black text-emerald-400">
                          <span>Utilidad:</span>
                          <span>{formatPrice(s.netProfit)}</span>
                        </div>
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setPrintShift(s)}
                          className="flex-1 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Tirilla</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestReopenShift(s)}
                          title="Reabrir este turno si fue liquidado por error"
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center gap-1 transition-all border border-amber-500/20"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reabrir</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 4. PESTAÑA 2: LIBRO DE GASTOS & EGRESOS                                 */}
      {/* ======================================================================= */}
      {activeTab === "expenses" && (
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-800">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>Libro Oficial de Gastos y Salidas de Caja</span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Registra compras de carbón, pollo de emergencia, verduras de plaza, empaques y adelantos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Nuevo Gasto</span>
            </button>
          </div>

          {/* Filtros rápidos por categoría de gasto */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedExpenseCat("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedExpenseCat === "ALL"
                  ? "bg-amber-500 text-black font-black"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Todas ({expensesList.length})
            </button>
            {Object.keys(EXPENSE_CATEGORIES).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedExpenseCat(k)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedExpenseCat === k
                    ? "bg-amber-500 text-black font-black"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                <span>{EXPENSE_CATEGORIES[k].icon}</span>
                <span>{EXPENSE_CATEGORIES[k].label}</span>
              </button>
            ))}
          </div>

          {/* Lista de Gastos */}
          {filteredExpenses.length === 0 ? (
            <div className="py-16 text-center text-gray-500 space-y-2">
              <TrendingDown className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs font-bold">No hay gastos registrados en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredExpenses.map((exp) => {
                const cat = EXPENSE_CATEGORIES[exp.category] || { label: exp.category, icon: "🏷️", color: "text-gray-400", badgeBg: "bg-gray-800" };
                return (
                  <div
                    key={exp.id}
                    className="bg-[#181b24] border border-gray-800 rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between shadow-lg"
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cat.badgeBg} ${cat.color} flex items-center gap-1`}>
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-gray-500 hover:text-rose-400 transition-colors p-1"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-2">
                        {exp.description}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(exp.date).toLocaleDateString()} • {new Date(exp.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] text-gray-400 block font-bold">
                          {exp.paymentMethod === "CASH" ? "💵 Efectivo Caja" : "📱 Transferencia"}
                        </span>
                        <span className="text-[10px] text-gray-300">
                          {exp.responsible || "Caja"}
                        </span>
                      </div>
                      <span className="text-sm font-black text-rose-400">
                        -{formatPrice(exp.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* 5. PESTAÑA 3: HISTÓRICO & REPORTES CONTABLES                            */}
      {/* ======================================================================= */}
      {activeTab === "reports" && (
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Selector de Períodos: Día, Semana, Mes, Año y Personalizado */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-1.5 bg-[#161a22] p-1 rounded-2xl border border-gray-800 overflow-x-auto">
              <button
                type="button"
                onClick={() => setReportPeriod("day")}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  reportPeriod === "day"
                    ? "bg-amber-500 text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Día
              </button>
              <button
                type="button"
                onClick={() => setReportPeriod("week")}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  reportPeriod === "week"
                    ? "bg-amber-500 text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setReportPeriod("month")}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  reportPeriod === "month"
                    ? "bg-amber-500 text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Mes
              </button>
              <button
                type="button"
                onClick={() => setReportPeriod("year")}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  reportPeriod === "year"
                    ? "bg-amber-500 text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Año
              </button>
              <button
                type="button"
                onClick={() => setReportPeriod("custom")}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1 ${
                  reportPeriod === "custom"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md"
                    : "text-amber-400/80 hover:text-amber-300"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Personalizado</span>
              </button>
            </div>

            {/* Selector de Fechas Según Período */}
            {reportPeriod === "custom" ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#181b24] border border-gray-800 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Desde:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent text-white text-xs outline-none font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-[#181b24] border border-gray-800 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Hasta:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent text-white text-xs outline-none font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchReport}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow transition-all active:scale-95"
                >
                  Filtrar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-bold">
                  {reportPeriod === "day"
                    ? "Fecha:"
                    : reportPeriod === "month"
                    ? "Mes de referencia:"
                    : reportPeriod === "year"
                    ? "Año:"
                    : "Fecha base:"}
                </span>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-[#181b24] border border-gray-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={fetchReport}
                  className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300"
                  title="Actualizar reporte"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Subtítulo de Confirmación del Rango Activo & Botón de Limpieza */}
          {reportData?.periodLabel && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-400 px-1">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>{reportData.periodLabel}</span>
                <span className="text-[11px] text-gray-500 font-normal">
                  (Del {new Date(reportData.startDate).toLocaleDateString()} al{" "}
                  {new Date(reportData.endDate).toLocaleDateString()})
                </span>
              </span>

              {/* Botón de Limpieza de Historial / Pruebas */}
              <button
                type="button"
                onClick={() => setShowClearHistoryModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-[11px] border border-rose-800/40 flex items-center gap-1.5 self-start sm:self-auto transition-all"
                title="Eliminar o limpiar cuentas de prueba en un rango de fechas con autorización PIN"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar Historial / Pruebas</span>
              </button>
            </div>
          )}

          {isReportLoading ? (
            <div className="py-20 text-center text-gray-500 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
              <p className="text-xs font-bold">Calculando balance financiero del período...</p>
            </div>
          ) : reportData ? (
            <>
              {/* Tarjetas Maestras de Resumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#161a24] border border-gray-800 p-4 rounded-2xl space-y-1 shadow-md">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                    VENTAS TOTALES
                  </span>
                  <div className="text-2xl font-black text-amber-400">
                    {formatPrice(reportData.summary.totalSales)}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {reportData.summary.ordersCount} pedidos atendidos
                  </p>
                </div>

                <div className="bg-[#161a24] border border-gray-800 p-4 rounded-2xl space-y-1 shadow-md">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                    GASTOS OPERATIVOS
                  </span>
                  <div className="text-2xl font-black text-rose-400">
                    {formatPrice(reportData.summary.totalExpenses)}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {reportData.summary.expensesCount} salidas registradas
                  </p>
                </div>

                <div className="bg-[#161a24] border border-emerald-500/30 p-4 rounded-2xl space-y-1 shadow-md">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                    UTILIDAD NETA OPERATIVA
                  </span>
                  <div className="text-2xl font-black text-emerald-300">
                    {formatPrice(reportData.summary.netProfit)}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Ingresos netos después de gastos
                  </p>
                </div>

                <div className="bg-[#161a24] border border-gray-800 p-4 rounded-2xl space-y-1 shadow-md">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                    TICKET PROMEDIO
                  </span>
                  <div className="text-2xl font-black text-white">
                    {formatPrice(reportData.summary.averageTicket)}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Promedio consumido por cuenta
                  </p>
                </div>
              </div>

              {/* Comparativas: Formas de Pago y Gastos por Categoría */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Distribución de Ventas por Método */}
                <div className="bg-[#14161f] border border-gray-800 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5 border-b border-gray-800 pb-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span>Desglose por Formas de Pago</span>
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-amber-400 flex items-center gap-1">💵 Efectivo</span>
                        <span>{formatPrice(reportData.salesBreakdown.cash)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{
                            width: `${reportData.summary.totalSales > 0 ? (reportData.salesBreakdown.cash / reportData.summary.totalSales) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-indigo-400 flex items-center gap-1">🟣 Nequi / Digital</span>
                        <span>{formatPrice(reportData.salesBreakdown.digital)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{
                            width: `${reportData.summary.totalSales > 0 ? (reportData.salesBreakdown.digital / reportData.summary.totalSales) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-sky-400 flex items-center gap-1">💳 Tarjeta / Datáfono</span>
                        <span>{formatPrice(reportData.salesBreakdown.card)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-sky-500"
                          style={{
                            width: `${reportData.summary.totalSales > 0 ? (reportData.salesBreakdown.card / reportData.summary.totalSales) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-800 flex justify-between text-[11px] text-gray-400">
                    <span>Ventas en Salón Mesas: <strong className="text-white">{formatPrice(reportData.salesBreakdown.mesas)}</strong></span>
                    <span>Mostrador Barra: <strong className="text-white">{formatPrice(reportData.salesBreakdown.barra)}</strong></span>
                  </div>
                </div>

                {/* Gastos por Categoría */}
                <div className="bg-[#14161f] border border-gray-800 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5 border-b border-gray-800 pb-2">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span>Gastos por Categoría</span>
                  </h3>

                  {reportData.expensesBreakdown.byCategory.length === 0 ? (
                    <p className="text-xs text-gray-500 py-6 text-center italic">
                      No hay gastos registrados en el período seleccionado.
                    </p>
                  ) : (
                    <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                      {reportData.expensesBreakdown.byCategory.map((c) => {
                        const cat = EXPENSE_CATEGORIES[c.category] || { icon: "🏷️", color: "text-gray-300" };
                        return (
                          <div key={c.category} className="flex justify-between items-center bg-[#181b24] p-2 rounded-xl border border-gray-800">
                            <span className="flex items-center gap-1.5 text-gray-200">
                              <span>{cat.icon}</span>
                              <span>{c.label} ({c.count})</span>
                            </span>
                            <span className="font-black text-rose-400">{formatPrice(c.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Platos más vendidos */}
              {reportData.topDishes.length > 0 && (
                <div className="bg-[#14161f] border border-gray-800 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5 border-b border-gray-800 pb-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Platos Más Vendidos en el Período</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {reportData.topDishes.map((d, idx) => (
                      <div key={idx} className="bg-[#181b24] p-3 rounded-xl border border-gray-800 text-center space-y-1">
                        <span className="text-[10px] font-black text-amber-400 block truncate">#{idx + 1} {d.name}</span>
                        <div className="text-base font-black text-white">{d.quantity} <span className="text-[10px] text-gray-400 font-normal">uds</span></div>
                        <span className="text-[10px] text-gray-400 block">{formatPrice(d.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ======================================================================= */}
      {/* 6. PESTAÑA 4: AUDITORÍA & SEGURIDAD PIN                                 */}
      {/* ======================================================================= */}
      {activeTab === "audit" && (
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Bitácora de Auditoría & Seguridad PIN</span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Registro inmutable de todas las acciones sensibles autorizadas con PIN o contraseña de Administrador.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-[#14161a] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-amber-500 font-bold"
              >
                <option value="ALL">Todas las acciones</option>
                <option value="REACTIVATE_SESSION">Reactivación de Cuentas</option>
                <option value="EDIT_PAYMENT_METHOD">Cambios de Forma de Pago</option>
                <option value="CANCEL_SESSION">Anulaciones de Venta</option>
                <option value="DELETE_SESSION">Eliminación de Cuentas</option>
                <option value="REOPEN_SHIFT">Reapertura de Turnos</option>
                <option value="CLEAR_HISTORY">Limpieza de Historial</option>
              </select>

              <button
                type="button"
                onClick={fetchAuditLogs}
                disabled={isAuditLoading}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all"
                title="Actualizar bitácora"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Registros de Auditoría */}
          {isAuditLoading ? (
            <div className="py-20 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              <span>Cargando registros de auditoría...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-500 bg-[#14161a] border border-gray-800 rounded-3xl p-8 space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500/40 mx-auto" />
              <p className="font-bold text-gray-400">Sin acciones críticas registradas</p>
              <p className="text-[11px] text-gray-500">
                Cada vez que un administrador use su PIN para reactivar una cuenta, cambiar un método de pago, anular una venta o reabrir un turno, aparecerá aquí detallado.
              </p>
            </div>
          ) : (
            <div className="bg-[#14161a] border border-gray-800 rounded-3xl overflow-hidden divide-y divide-gray-800/80">
              {auditLogs.map((log: any) => {
                const badgeColor =
                  log.action === "REACTIVATE_SESSION"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : log.action === "EDIT_PAYMENT_METHOD"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : log.action === "CANCEL_SESSION"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : log.action === "DELETE_SESSION"
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : log.action === "REOPEN_SHIFT"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    : "bg-purple-500/20 text-purple-300 border-purple-500/30";

                const actionLabel =
                  log.action === "REACTIVATE_SESSION"
                    ? "Reactivación"
                    : log.action === "EDIT_PAYMENT_METHOD"
                    ? "Cambio de Pago"
                    : log.action === "CANCEL_SESSION"
                    ? "Venta Anulada"
                    : log.action === "DELETE_SESSION"
                    ? "Cuenta Eliminada"
                    : log.action === "REOPEN_SHIFT"
                    ? "Turno Reabierto"
                    : log.action === "CLEAR_HISTORY"
                    ? "Limpieza Historial"
                    : log.action;

                return (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-900/30 transition-all text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${badgeColor}`}
                        >
                          {actionLabel}
                        </span>
                        <span className="font-bold text-white text-xs">
                          {log.description}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          🕒 {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        <strong className="text-gray-400">Justificación:</strong> &quot;{log.reason}&quot;
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Aprobado por: <span className="font-semibold text-gray-300">{log.approvedBy}</span>
                        {log.targetType && (
                          <span className="ml-2 font-mono text-[9px] text-gray-600">
                            [{log.targetType}]
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 1: APERTURA DE TURNO DE CAJA (BASE INICIAL)                       */}
      {/* ======================================================================= */}
      {showOpenModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowOpenModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#14161f] border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-amber-400" />
                <span>Apertura de Turno de Caja</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOpenModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                  BASE INICIAL EN EFECTIVO (PARA VUELTAS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-amber-400 text-base">$</span>
                  <input
                    type="number"
                    step={10000}
                    value={openInitialCash}
                    onChange={(e) => setOpenInitialCash(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-[#181b24] border border-gray-800 focus:border-amber-500 rounded-xl pl-8 pr-3 py-2.5 text-base font-black text-white outline-none"
                  />
                </div>
              </div>

              {/* Botones de sugerencia rápida de base */}
              <div className="grid grid-cols-4 gap-1.5">
                {[50000, 100000, 150000, 200000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setOpenInitialCash(val)}
                    className="py-1 px-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-[10px] font-bold text-gray-300 border border-gray-700"
                  >
                    {formatPrice(val)}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                  RESPONSABLE / CAJERO
                </label>
                <input
                  type="text"
                  value={openCajeroName}
                  onChange={(e) => setOpenCajeroName(e.target.value)}
                  className="w-full bg-[#181b24] border border-gray-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                  placeholder="Nombre de cajero"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                  NOTAS DE APERTURA (OPCIONAL)
                </label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full bg-[#181b24] border border-gray-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  placeholder="Ej: Turno Mañana / Billetes de 10k y 20k"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowOpenModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-xs font-bold text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleOpenShift}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black text-xs shadow-lg active:scale-95 transition-all"
              >
                ✓ Confirmar Apertura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 2: LIQUIDACIÓN Y CIERRE DE TURNO (ARQUEO)                         */}
      {/* ======================================================================= */}
      {showCloseModal && activeShift && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowCloseModal(false)}
        >
          <div
            className="w-full max-w-lg bg-[#14161f] border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                <span>Liquidación & Cierre de Caja</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Resumen del sistema */}
            <div className="bg-[#181b24] p-3 rounded-2xl border border-gray-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Base Inicial:</span>
                <span className="font-bold text-white">{formatPrice(activeShift.initialCash)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>+ Ventas en Efectivo:</span>
                <span className="font-bold text-emerald-400">{formatPrice(liveData?.salesCash || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>- Gastos de Caja Menor (Efectivo):</span>
                <span className="font-bold text-rose-400">-{formatPrice(liveData?.expensesCash || 0)}</span>
              </div>
              <div className="pt-1.5 border-t border-gray-700 flex justify-between font-black text-sm">
                <span className="text-amber-400 uppercase">Efectivo Esperado en Caja:</span>
                <span className="text-white">{formatPrice(liveData?.expectedCash || 0)}</span>
              </div>
            </div>

            {/* Conteo Físico Real */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  DINERO FÍSICO CONTADO EN CAJA
                </label>
                <button
                  type="button"
                  onClick={() => setCountedCash(liveData?.expectedCash || 0)}
                  className="text-amber-400 text-xs font-bold hover:underline"
                >
                  Asignar Esperado
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-amber-400 text-base">$</span>
                <input
                  type="number"
                  step={1000}
                  value={countedCash}
                  onChange={(e) => setCountedCash(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-[#181b24] border border-gray-800 focus:border-amber-500 rounded-xl pl-8 pr-3 py-2.5 text-lg font-black text-white outline-none"
                />
              </div>

              {/* Botonera de billetes para facilitar conteo */}
              <div className="grid grid-cols-6 gap-1 pt-1">
                {[100000, 50000, 20000, 10000, 5000, 2000].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setCountedCash((prev) => prev + b)}
                    className="py-1 px-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-[9px] font-bold text-gray-300 border border-gray-700"
                  >
                    +{formatPrice(b)}
                  </button>
                ))}
              </div>
            </div>

            {/* Indicador en vivo de diferencia / cuadre */}
            <div
              className={`p-3 rounded-2xl border text-xs flex justify-between items-center ${
                liveDiff === 0
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : liveDiff > 0
                  ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-300"
              }`}
            >
              <div>
                <span className="font-black block uppercase text-[10px]">
                  {liveDiff === 0 ? "CUADRE EXACTO" : liveDiff > 0 ? "SOBRANTE EN CAJA" : "FALTANTE EN CAJA"}
                </span>
                <span className="text-[11px] opacity-80">
                  {liveDiff === 0
                    ? "El efectivo coincide exactamente con las ventas y gastos"
                    : liveDiff > 0
                    ? `Hay un excedente de ${formatPrice(liveDiff)}`
                    : `Faltan ${formatPrice(Math.abs(liveDiff))} para cuadrar la caja`}
                </span>
              </div>
              <span className="text-base font-black">
                {liveDiff === 0 ? "$ 0" : (liveDiff > 0 ? `+${formatPrice(liveDiff)}` : `-${formatPrice(Math.abs(liveDiff))}`)}
              </span>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                OBSERVACIONES DE CIERRE / JUSTIFICACIÓN
              </label>
              <textarea
                rows={2}
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Ej: Turno cerrado sin novedades / Descuadre justificado..."
                className="w-full bg-[#181b24] border border-gray-800 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-xs font-bold text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCloseShift}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs shadow-lg active:scale-95 transition-all"
              >
                ✓ Confirmar Cierre y Liquidar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 3: REGISTRAR GASTO DE CAJA MENOR                                  */}
      {/* ======================================================================= */}
      {showExpenseModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowExpenseModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#14161f] border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                <span>Registrar Gasto Operativo</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                  CATEGORÍA DEL GASTO
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {Object.keys(EXPENSE_CATEGORIES).map((k) => {
                    const c = EXPENSE_CATEGORIES[k];
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setExpCategory(k)}
                        className={`p-2 rounded-xl border text-xs font-bold text-left flex items-center gap-2 transition-all ${
                          expCategory === k
                            ? "bg-amber-500 text-black border-amber-400 font-black shadow-md"
                            : "bg-[#181b24] border-gray-800 text-gray-300 hover:text-white"
                        }`}
                      >
                        <span>{c.icon}</span>
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                  DESCRIPCIÓN DEL GASTO
                </label>
                <input
                  type="text"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="Ej: 1 bulto de carbón vegetal / 10 pollos de plaza"
                  className="w-full bg-[#181b24] border border-gray-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                    VALOR ($ COP)
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={expAmount || ""}
                    onChange={(e) => setExpAmount(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full bg-[#181b24] border border-gray-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm font-black text-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                    FORMA DE SALIDA
                  </label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value as any)}
                    className="w-full bg-[#181b24] border border-gray-800 focus:border-amber-500 rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none"
                  >
                    <option value="CASH">💵 Efectivo de Caja</option>
                    <option value="TRANSFER">📱 Transferencia Digital</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                    RESPONSABLE
                  </label>
                  <input
                    type="text"
                    value={expResponsible}
                    onChange={(e) => setExpResponsible(e.target.value)}
                    placeholder="Quien solicitó"
                    className="w-full bg-[#181b24] border border-gray-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                    NRO FACTURA / SOPORTE
                  </label>
                  <input
                    type="text"
                    value={expReceipt}
                    onChange={(e) => setExpReceipt(e.target.value)}
                    placeholder="Opcional"
                    className="w-full bg-[#181b24] border border-gray-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-xs font-bold text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreateExpense}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs shadow-lg active:scale-95 transition-all"
              >
                ✓ Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 4: TIRILLA DE CIERRE Y LIQUIDACIÓN IMPRIMIBLE                      */}
      {/* ======================================================================= */}
      {printShift && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPrintShift(null)}
        >
          <div
            className="w-full max-w-sm bg-white text-black rounded-3xl p-6 shadow-2xl space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera Tipo Factura Térmica */}
            <div className="text-center border-b border-dashed border-gray-400 pb-3 space-y-1">
              <h2 className="font-black text-sm uppercase tracking-wider">
                PÍO PÍO ASADERO & RESTAURANTE
              </h2>
              <p className="text-[10px] text-gray-600">
                COMPROBANTE DE CIERRE Y LIQUIDACIÓN DE CAJA
              </p>
              <p className="text-[10px] text-gray-500">
                Fecha Cierre: {printShift.closedAt ? new Date(printShift.closedAt).toLocaleString() : new Date().toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-500">
                Responsable: {printShift.closedBy || printShift.openedBy}
              </p>
            </div>

            {/* Desglose Contable */}
            <div className="space-y-1.5 border-b border-dashed border-gray-400 pb-3 text-xs">
              <div className="flex justify-between">
                <span>Base Inicial:</span>
                <span className="font-bold">{formatPrice(printShift.initialCash)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas en Efectivo:</span>
                <span className="font-bold">{formatPrice(printShift.totalSalesCash)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas Nequi/Daviplata:</span>
                <span className="font-bold">{formatPrice(printShift.totalSalesDigital)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas Datáfono/Tarjeta:</span>
                <span className="font-bold">{formatPrice(printShift.totalSalesCard)}</span>
              </div>
              <div className="flex justify-between font-black border-t border-gray-200 pt-1">
                <span>VENTAS TOTALES:</span>
                <span>{formatPrice(printShift.totalSales)}</span>
              </div>
            </div>

            {/* Gastos del Turno */}
            <div className="space-y-1.5 border-b border-dashed border-gray-400 pb-3 text-xs">
              <div className="flex justify-between">
                <span>Gastos en Efectivo:</span>
                <span className="font-bold">-{formatPrice(printShift.totalExpensesCash)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gastos por Transferencia:</span>
                <span className="font-bold">-{formatPrice(printShift.totalExpensesDigital)}</span>
              </div>
              <div className="flex justify-between font-black border-t border-gray-200 pt-1 text-red-600">
                <span>GASTOS TOTALES:</span>
                <span>-{formatPrice(printShift.totalExpenses)}</span>
              </div>
            </div>

            {/* Arqueo de Efectivo Físico */}
            <div className="space-y-1.5 border-b border-dashed border-gray-400 pb-3 text-xs bg-gray-50 p-2 rounded-xl">
              <div className="flex justify-between font-bold">
                <span>Efectivo Esperado:</span>
                <span>{formatPrice(printShift.expectedCash || 0)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Efectivo Contado Real:</span>
                <span>{formatPrice(printShift.actualCash || 0)}</span>
              </div>
              <div className="flex justify-between font-black text-sm border-t border-gray-300 pt-1">
                <span>DIFERENCIA:</span>
                <span
                  className={
                    (printShift.difference || 0) === 0
                      ? "text-green-700"
                      : (printShift.difference || 0) > 0
                      ? "text-blue-700"
                      : "text-red-700"
                  }
                >
                  {(printShift.difference || 0) === 0
                    ? "$ 0 (EXACTO)"
                    : (printShift.difference || 0) > 0
                    ? `+${formatPrice(printShift.difference || 0)}`
                    : `-${formatPrice(Math.abs(printShift.difference || 0))}`}
                </span>
              </div>
            </div>

            <div className="text-center text-[10px] text-gray-500 pt-1">
              *** Documento generado por Sistema Pío Pío POS ***
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrintShift(null)}
                className="w-1/2 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-black font-bold text-xs"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 py-2 rounded-xl bg-black hover:bg-gray-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CONFIRMACIÓN PREVIA PARA LIMPIEZA DE HISTORIAL */}
      {showClearHistoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowClearHistoryModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#14161f] border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-black text-rose-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>Limpieza de Historial / Pruebas</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowClearHistoryModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-800/30 text-rose-300 text-xs leading-relaxed space-y-1">
              <p className="font-bold">⚠️ Atención: Acción destructiva</p>
              <p className="text-[11px] text-rose-200/80">
                Esta acción eliminará de forma irreversible las ventas y cuentas del período seleccionado. Se requiere autorización obligatoria con PIN de Administrador.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                    FECHA INICIAL
                  </label>
                  <input
                    type="date"
                    value={clearStartDate}
                    onChange={(e) => setClearStartDate(e.target.value)}
                    className="w-full bg-[#181b24] border border-gray-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                    FECHA FINAL
                  </label>
                  <input
                    type="date"
                    value={clearEndDate}
                    onChange={(e) => setClearEndDate(e.target.value)}
                    className="w-full bg-[#181b24] border border-gray-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#181b24] border border-gray-800 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={clearIncludeExpenses}
                  onChange={(e) => setClearIncludeExpenses(e.target.checked)}
                  className="rounded border-gray-700 text-rose-500 focus:ring-rose-500 w-4 h-4 bg-gray-900"
                />
                <span>Eliminar también los egresos / gastos de este período</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearHistoryModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearHistory}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-xs shadow-lg shadow-rose-600/20"
              >
                Continuar a Autorización
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UNIVERSAL DE AUTORIZACIÓN ADMINISTRATIVA CON PIN */}
      {authModalConfig && (
        <AdminAuthModal
          isOpen={authModalConfig.isOpen}
          onClose={() => setAuthModalConfig(null)}
          onSuccess={() => {
            setAuthModalConfig(null);
            fetchShiftData();
            fetchExpenses();
            if (activeTab === "reports") fetchReport();
            if (activeTab === "audit") fetchAuditLogs();
          }}
          title={authModalConfig.title}
          description={authModalConfig.description}
          actionType={authModalConfig.actionType}
          payload={authModalConfig.payload}
          confirmButtonText={authModalConfig.confirmButtonText}
          confirmButtonColor={authModalConfig.confirmButtonColor}
          detailsBadge={authModalConfig.detailsBadge}
        />
      )}
    </div>
  );
}
