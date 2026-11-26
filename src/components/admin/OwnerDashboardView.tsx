"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Crown,
  WalletCards,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Smartphone,
  RefreshCw,
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  KeyRound,
  PlusCircle,
  Trash2,
  Lock,
  Utensils,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Receipt,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice, formatDateTime, formatTime, formatDate } from "@/lib/formatters";
import { EXPENSE_CATEGORIES } from "@/lib/caja-helpers";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";

interface OwnerStatsData {
  timestamp: string;
  shift: {
    id: string;
    status: string;
    openedAt: string;
    openedBy: string;
    initialCash: number;
  } | null;
  kpis: {
    salesTotal: number;
    salesCash: number;
    salesDigital: number;
    salesCount: number;
    salesMesas: number;
    salesBarra: number;
    expensesTotal: number;
    expensesCash: number;
    expensesDigital: number;
    expensesCount: number;
    expectedCashInDrawer: number;
    netProfitToday: number;
  };
  salon: {
    totalTables: number;
    occupiedTables: number;
    freeTables: number;
    pendingConfirmationCount: number;
    billRequestedCount: number;
    totalPendingCashInTables: number;
    activeSessionsCount: number;
  };
  recentSales: Array<{
    id: string;
    tableNumber: string;
    total: number;
    cash: number;
    digital: number;
    card: number;
    closedAt: string;
    closedBy: string;
    itemsCount: number;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    paymentMethod: string;
    responsible: string;
    receiptNumber?: string;
    date: string;
  }>;
}

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface StaffWaiter {
  id: string;
  name: string;
  pin: string;
  isActive: boolean;
  createdAt: string;
}

export function OwnerDashboardView() {
  const [activeTab, setActiveTab] = useState<"live" | "staff" | "audit">("live");
  const [stats, setStats] = useState<OwnerStatsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Datos de personal
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [staffWaiters, setStaffWaiters] = useState<StaffWaiter[]>([]);
  const [adminPin, setAdminPin] = useState<string>("1234");
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Bitácora de auditoría
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Modales de gestión
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "SUPER_ADMIN">("ADMIN");

  const [showChangePassModal, setShowChangePassModal] = useState<StaffUser | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState("");

  const [showCreateWaiterModal, setShowCreateWaiterModal] = useState(false);
  const [newWaiterName, setNewWaiterName] = useState("");
  const [newWaiterPin, setNewWaiterPin] = useState("");

  const [showEditPinModal, setShowEditPinModal] = useState(false);
  const [newPinVal, setNewPinVal] = useState("");

  // Estados para modales de pantalla completa (Ventas y Gastos)
  const [showAllSalesModal, setShowAllSalesModal] = useState(false);
  const [salesSearchQuery, setSalesSearchQuery] = useState("");
  const [salesMethodFilter, setSalesMethodFilter] = useState<"ALL" | "CASH" | "DIGITAL">("ALL");

  const [showAllExpensesModal, setShowAllExpensesModal] = useState(false);
  const [expensesSearchQuery, setExpensesSearchQuery] = useState("");
  const [expensesCategoryFilter, setExpensesCategoryFilter] = useState<string>("ALL");

  const isAnyModalOpen = Boolean(
    showCreateUserModal ||
    showChangePassModal ||
    showCreateWaiterModal ||
    showEditPinModal ||
    showAllSalesModal ||
    showAllExpensesModal
  );
  useBodyScrollLock(isAnyModalOpen);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Cargar Estadísticas en Vivo
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/owner/stats");
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // 2. Cargar Personal y Accesos
  const fetchStaff = useCallback(async () => {
    setIsLoadingStaff(true);
    try {
      const res = await fetch("/api/admin/owner/staff");
      const json = await res.json();
      if (json.success && json.data) {
        setStaffUsers(json.data.users || []);
        setStaffWaiters(json.data.waiters || []);
        setAdminPin(json.data.adminPin || "1234");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStaff(false);
    }
  }, []);

  // 3. Cargar Auditoría
  const fetchAudit = useCallback(async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch("/api/admin/audit?limit=40");
      const json = await res.json();
      if (json.success && json.data) {
        setAuditLogs(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refrescar estadísticas cada 20 segundos
    const timer = setInterval(fetchStats, 20000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "staff") fetchStaff();
    if (activeTab === "audit") fetchAudit();
  }, [activeTab, fetchStaff, fetchAudit]);

  // Handlers para Personal
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserPass.trim()) {
      toast.error("Ingresa usuario y contraseña");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/owner/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_USER",
          username: newUsername,
          name: newUserName || newUsername,
          password: newUserPass,
          role: newUserRole,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success(json.message);
      setShowCreateUserModal(false);
      setNewUsername("");
      setNewUserName("");
      setNewUserPass("");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Error al crear usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showChangePassModal || !newPasswordVal.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/owner/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_USER_PASSWORD",
          userId: showChangePassModal.id,
          newPassword: newPasswordVal,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success(json.message);
      setShowChangePassModal(null);
      setNewPasswordVal("");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar contraseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaiterName.trim() || newWaiterPin.length !== 4) {
      toast.error("Ingresa el nombre y un PIN de 4 dígitos");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/owner/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_WAITER",
          name: newWaiterName,
          pin: newWaiterPin,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success(json.message);
      setShowCreateWaiterModal(false);
      setNewWaiterName("");
      setNewWaiterPin("");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar mesero");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleWaiter = async (waiter: StaffWaiter) => {
    try {
      const res = await fetch("/api/admin/owner/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_WAITER",
          waiterId: waiter.id,
          isActive: !waiter.isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success(json.message);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar estado");
    }
  };

  const handleUpdateAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinVal.length !== 4) {
      toast.error("El PIN debe tener exactamente 4 dígitos");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/owner/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ADMIN_PIN",
          newPin: newPinVal,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success(json.message);
      setShowEditPinModal(false);
      setAdminPin(newPinVal);
      setNewPinVal("");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar PIN");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaffUser = async (userId: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${email}?`)) return;
    try {
      const res = await fetch(`/api/admin/owner/staff?userId=${userId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success(json.message);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    }
  };

  // Filtrado de cobros para el modal de pantalla completa
  const filteredSales = (stats?.recentSales || []).filter((s) => {
    const matchesSearch =
      salesSearchQuery.trim() === "" ||
      s.tableNumber.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
      s.closedBy.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
      String(s.total).includes(salesSearchQuery);

    const matchesMethod =
      salesMethodFilter === "ALL" ||
      (salesMethodFilter === "CASH" && s.cash > 0) ||
      (salesMethodFilter === "DIGITAL" && s.digital > 0);

    return matchesSearch && matchesMethod;
  });

  const totalFilteredSales = filteredSales.reduce((acc, s) => acc + s.total, 0);

  // Filtrado de gastos para el modal de pantalla completa
  const filteredExpenses = (stats?.recentExpenses || []).filter((e) => {
    const matchesSearch =
      expensesSearchQuery.trim() === "" ||
      e.description.toLowerCase().includes(expensesSearchQuery.toLowerCase()) ||
      e.responsible?.toLowerCase().includes(expensesSearchQuery.toLowerCase()) ||
      e.receiptNumber?.toLowerCase().includes(expensesSearchQuery.toLowerCase()) ||
      String(e.amount).includes(expensesSearchQuery);

    const matchesCategory =
      expensesCategoryFilter === "ALL" || e.category === expensesCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalFilteredExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-12">
      {/* ======================================================================= */}
      {/* CABECERA EJECUTIVA DEL DUEÑO (Compacta y Reorganizada)                  */}
      {/* ======================================================================= */}
      <div className="bg-gradient-to-r from-[#171510] via-[#1a1712] to-[#12141c] border border-amber-500/30 rounded-2xl p-2.5 sm:p-4 shadow-lg relative overflow-hidden">
        {/* Glow dorado decorativo sutil */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black shadow-md shadow-amber-500/20 flex-shrink-0">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-base font-black text-white truncate">
                  <span className="sm:hidden">Panel Ejecutivo</span>
                  <span className="hidden sm:inline">Panel Ejecutivo del Dueño</span>
                </h1>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[8px] sm:text-[9px] border border-amber-500/40 uppercase tracking-wider flex-shrink-0">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                Pío Pío Asadero & Restaurante • En tiempo real
              </p>
            </div>
          </div>

          {/* Botón de Refrescar en la misma fila superior */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] text-gray-400 font-mono hidden md:inline">
              {stats ? formatTime(stats.timestamp) : "--:--"}
            </span>
            <button
              type="button"
              onClick={() => {
                fetchStats();
                if (activeTab === "staff") fetchStaff();
                if (activeTab === "audit") fetchAudit();
                toast.success("Métricas actualizadas en vivo");
              }}
              className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl bg-[#221f18] hover:bg-[#2b271f] text-amber-300 border border-amber-500/30 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold active:scale-95 transition-all shadow-sm"
              title="Actualizar datos en tiempo real"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Resumen del Turno Activo: Tira horizontal compacta */}
        <div className="mt-2 pt-2 border-t border-amber-500/15 flex items-center justify-between text-[10px] sm:text-xs gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-gray-300 truncate">
              {stats?.shift ? (
                <>
                  Turno abierto por{" "}
                  <strong className="text-white font-semibold">{stats.shift.openedBy}</strong> a las{" "}
                  <span className="text-amber-300 font-medium">{formatTime(stats.shift.openedAt)}</span>
                </>
              ) : (
                <span className="text-rose-400 font-bold">Caja actualmente cerrada</span>
              )}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-gray-400 flex-shrink-0">
            {formatDate(new Date())}
          </span>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* PESTAÑAS PRINCIPALES: EN VIVO / PERSONAL / AUDITORÍA                    */}
      {/* ======================================================================= */}
      <div className="flex items-center bg-[#14161f] border border-gray-800 rounded-2xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("live")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === "live"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Finanzas & En Vivo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("staff")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === "staff"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Personal & Accesos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === "audit"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Auditoría & Seguridad</span>
        </button>
      </div>

      {/* ======================================================================= */}
      {/* PESTAÑA 1: FINANZAS Y SALÓN EN VIVO                                     */}
      {/* ======================================================================= */}
      {activeTab === "live" && (
        <div className="space-y-4 animate-in fade-in">
          {/* 4 Tarjetas Maestras de Finanzas: Cuadrícula compacta 2x2 en móvil y 4 cols en escritorio */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* 1. VENTAS TOTALES HOY */}
            <div className="bg-[#161a24] border border-amber-500/30 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                  <span className="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-wider block truncate">
                    <span className="hidden sm:inline">VENTAS TOTALES HOY</span>
                    <span className="sm:hidden">VENTAS HOY</span>
                  </span>
                  <span className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-amber-500/20 text-amber-300 flex-shrink-0">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                </div>
                <div className="text-base sm:text-2xl font-black text-white truncate">
                  {formatPrice(stats?.kpis.salesTotal || 0)}
                </div>
              </div>
              <div className="text-[9px] sm:text-[10px] text-gray-400 pt-1.5 sm:pt-2 mt-1 sm:mt-2 border-t border-gray-800 space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="truncate">Ef:</span>
                  <span className="text-emerald-400 font-bold ml-1">{formatPrice(stats?.kpis.salesCash || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate">Digital:</span>
                  <span className="text-indigo-300 font-bold ml-1">{formatPrice(stats?.kpis.salesDigital || 0)}</span>
                </div>
                <div className="text-[8px] sm:text-[9px] text-gray-500 pt-0.5 truncate">
                  <span className="hidden sm:inline">{stats?.kpis.salesCount || 0} pedidos cobrados hoy</span>
                  <span className="sm:hidden">{stats?.kpis.salesCount || 0} cobros hoy</span>
                </div>
              </div>
            </div>

            {/* 2. EFECTIVO EN CAJA */}
            <div className="bg-[#161a24] border border-emerald-500/30 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                  <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-wider block truncate">
                    <span className="hidden sm:inline">EFECTIVO EN CAJA</span>
                    <span className="sm:hidden">EN CAJA</span>
                  </span>
                  <span className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-emerald-500/20 text-emerald-300 flex-shrink-0">
                    <WalletCards className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                </div>
                <div className="text-base sm:text-2xl font-black text-emerald-300 truncate">
                  {formatPrice(stats?.kpis.expectedCashInDrawer || 0)}
                </div>
              </div>
              <div className="text-[9px] sm:text-[10px] text-gray-400 pt-1.5 sm:pt-2 mt-1 sm:mt-2 border-t border-gray-800 space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="truncate">Base:</span>
                  <span className="text-white font-bold ml-1">{formatPrice(stats?.shift?.initialCash || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate">+Ventas:</span>
                  <span className="text-emerald-400 font-bold ml-1">+{formatPrice(stats?.kpis.salesCash || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate">-Gastos:</span>
                  <span className="text-rose-400 font-bold ml-1">-{formatPrice(stats?.kpis.expensesCash || 0)}</span>
                </div>
              </div>
            </div>

            {/* 3. GASTOS OPERATIVOS */}
            <div className="bg-[#161a24] border border-rose-500/30 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                  <span className="text-[9px] sm:text-[10px] font-black text-rose-400 uppercase tracking-wider block truncate">
                    <span className="hidden sm:inline">GASTOS OPERATIVOS HOY</span>
                    <span className="sm:hidden">GASTOS HOY</span>
                  </span>
                  <span className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-rose-500/20 text-rose-300 flex-shrink-0">
                    <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                </div>
                <div className="text-base sm:text-2xl font-black text-rose-300 truncate">
                  {formatPrice(stats?.kpis.expensesTotal || 0)}
                </div>
              </div>
              <div className="text-[9px] sm:text-[10px] text-gray-400 pt-1.5 sm:pt-2 mt-1 sm:mt-2 border-t border-gray-800 space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="truncate">Efectivo:</span>
                  <span className="text-white font-bold ml-1">{formatPrice(stats?.kpis.expensesCash || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate">Transf:</span>
                  <span className="text-white font-bold ml-1">{formatPrice(stats?.kpis.expensesDigital || 0)}</span>
                </div>
                <div className="text-[8px] sm:text-[9px] text-gray-500 pt-0.5 truncate">
                  <span className="hidden sm:inline">{stats?.kpis.expensesCount || 0} salidas registradas</span>
                  <span className="sm:hidden">{stats?.kpis.expensesCount || 0} egresos</span>
                </div>
              </div>
            </div>

            {/* 4. UTILIDAD NETA OPERATIVA */}
            <div className="bg-gradient-to-br from-[#121c18] to-[#161a24] border border-emerald-500/50 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                  <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-wider block truncate">
                    <span className="hidden sm:inline">UTILIDAD NETA HOY</span>
                    <span className="sm:hidden">UTILIDAD NETA</span>
                  </span>
                  <span className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-emerald-500/20 text-emerald-300 flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                </div>
                <div className="text-base sm:text-2xl font-black text-emerald-300 truncate">
                  {formatPrice(stats?.kpis.netProfitToday || 0)}
                </div>
              </div>
              <div className="text-[9px] sm:text-[10px] text-gray-400 pt-1.5 sm:pt-2 mt-1 sm:mt-2 border-t border-gray-800 space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="truncate">Margen:</span>
                  <span className={`font-bold ml-1 ${((stats?.kpis.netProfitToday || 0) >= 0) ? "text-emerald-400" : "text-rose-400"}`}>
                    {((stats?.kpis.netProfitToday || 0) >= 0) ? "+ Ganancia" : "- Pérdida"}
                  </span>
                </div>
                <div className="text-[8px] sm:text-[9px] text-gray-500 pt-0.5 truncate">
                  Ventas – Gastos
                </div>
                <div className="text-[8px] sm:text-[9px] text-gray-500 pt-0.5 truncate hidden sm:block">
                  Ganancia neta del día
                </div>
              </div>
            </div>
          </div>

          {/* Estado del Salón y Mesas en Vivo */}
          <div className="bg-[#14161f] border border-gray-800 rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2.5">
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-400" />
                <span>ESTADO DEL SALÓN EN TIEMPO REAL</span>
              </h3>
              <span className="text-xs font-black text-amber-400">
                {formatPrice(stats?.salon.totalPendingCashInTables || 0)} por cobrar
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-[#181b24] p-3 rounded-2xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block uppercase">Mesas Ocupadas</span>
                <span className="text-lg font-black text-blue-400">
                  {stats?.salon.occupiedTables || 0} / {stats?.salon.totalTables || 15}
                </span>
              </div>
              <div className="bg-[#181b24] p-3 rounded-2xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block uppercase">Mesas Libres</span>
                <span className="text-lg font-black text-emerald-400">
                  {stats?.salon.freeTables || 0}
                </span>
              </div>
              <div className="bg-[#181b24] p-3 rounded-2xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block uppercase">Pidiendo Cuenta</span>
                <span className="text-lg font-black text-purple-400">
                  {stats?.salon.billRequestedCount || 0}
                </span>
              </div>
              <div className="bg-[#181b24] p-3 rounded-2xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block uppercase">Alertas QR</span>
                <span className="text-lg font-black text-amber-400">
                  {stats?.salon.pendingConfirmationCount || 0}
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* BOTONES INTERACTIVOS DE MOVIMIENTOS (ABREN PANTALLA COMPLETA)           */}
          {/* ======================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tarjeta-Botón 1: Movimientos de Ventas */}
            <button
              type="button"
              onClick={() => setShowAllSalesModal(true)}
              className="group relative text-left bg-gradient-to-br from-[#14161f] via-[#161a25] to-[#14161f] hover:to-[#1a2030] border border-gray-800 hover:border-emerald-500/50 p-4 sm:p-5 rounded-3xl shadow-xl transition-all duration-200 active:scale-[0.98] flex flex-col justify-between overflow-hidden cursor-pointer"
            >
              {/* Resplandor decorativo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

              <div className="flex items-start justify-between gap-3 relative z-10 w-full">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-md">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                  <span>Ver Todos</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div className="mt-4 space-y-1 relative z-10 w-full">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Movimientos de Ventas
                </span>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {formatPrice(stats?.kpis.salesTotal || 0)}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 pt-1.5 border-t border-gray-800/80">
                  <span className="text-emerald-400 font-bold">
                    {stats?.recentSales.length || 0} cobros hoy
                  </span>
                  <span>•</span>
                  <span className="truncate text-[11px]">
                    Ef: {formatPrice(stats?.kpis.salesCash || 0)} | Dig: {formatPrice(stats?.kpis.salesDigital || 0)}
                  </span>
                </div>
              </div>
            </button>

            {/* Tarjeta-Botón 2: Movimientos de Gastos */}
            <button
              type="button"
              onClick={() => setShowAllExpensesModal(true)}
              className="group relative text-left bg-gradient-to-br from-[#14161f] via-[#1d161a] to-[#14161f] hover:to-[#25191f] border border-gray-800 hover:border-rose-500/50 p-4 sm:p-5 rounded-3xl shadow-xl transition-all duration-200 active:scale-[0.98] flex flex-col justify-between overflow-hidden cursor-pointer"
            >
              {/* Resplandor decorativo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition-colors" />

              <div className="flex items-start justify-between gap-3 relative z-10 w-full">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shadow-md">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full group-hover:bg-rose-500/20 transition-colors">
                  <span>Ver Todos</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div className="mt-4 space-y-1 relative z-10 w-full">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Movimientos de Gastos
                </span>
                <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
                  -{formatPrice(stats?.kpis.expensesTotal || 0)}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 pt-1.5 border-t border-gray-800/80">
                  <span className="text-rose-400 font-bold">
                    {stats?.recentExpenses.length || 0} salidas hoy
                  </span>
                  <span>•</span>
                  <span className="truncate text-[11px]">
                    Ef: {formatPrice(stats?.kpis.expensesCash || 0)} | Transf: {formatPrice(stats?.kpis.expensesDigital || 0)}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA 2: PERSONAL & ACCESOS (CAJEROS, MESEROS Y PIN)                  */}
      {/* ======================================================================= */}
      {activeTab === "staff" && (
        <div className="space-y-5 animate-in fade-in">
          {/* Tarjeta 1: Clave Maestra de Auditoría */}
          <div className="bg-[#161a24] border border-amber-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  PIN MAESTRO DE AUDITORÍA & SEGURIDAD
                </h3>
                <p className="text-[11px] text-gray-400">
                  Clave de 4 dígitos para autorizar reaperturas de turnos, anulaciones y cambios sensibles.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="px-3 py-1.5 rounded-xl bg-black/40 border border-amber-500/40 text-amber-300 font-mono font-black text-sm tracking-widest">
                {adminPin}
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewPinVal(adminPin);
                  setShowEditPinModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all shadow"
              >
                Cambiar PIN
              </button>
            </div>
          </div>

          {/* Tarjeta 2: Usuarios Administradores y Cajeros */}
          <div className="bg-[#14161f] border border-gray-800 rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>CUENTAS DE ACCESO ADMINISTRATIVO ({staffUsers.length})</span>
                </h3>
                <p className="text-[10px] text-gray-400">
                  Cuentas para iniciar sesión en el panel del asadero.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Crear Cajero</span>
              </button>
            </div>

            <div className="divide-y divide-gray-800/80">
              {staffUsers.map((u) => {
                const isSuper = u.role === "SUPER_ADMIN";
                return (
                  <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                          isSuper
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {isSuper ? <Crown className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{u.email}</span>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                              isSuper
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            }`}
                          >
                            {isSuper ? "Super Admin (Dueño)" : "Cajero / Operativo"}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500">{u.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePassModal(u);
                          setNewPasswordVal("");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold"
                      >
                        Cambiar Contraseña
                      </button>
                      {!isSuper && (
                        <button
                          type="button"
                          onClick={() => handleDeleteStaffUser(u.id, u.email)}
                          className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tarjeta 3: Equipo de Meseros & PINes de Salón */}
          <div className="bg-[#14161f] border border-gray-800 rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  <span>MESEROS & PINES DE SALÓN ({staffWaiters.length})</span>
                </h3>
                <p className="text-[10px] text-gray-400">
                  PINes de 4 dígitos para que los meseros ingresen desde `/waiter`.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateWaiterModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 shadow"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Nuevo Mesero</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {staffWaiters.map((w) => (
                <div
                  key={w.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    w.isActive
                      ? "bg-[#181b24] border-gray-800"
                      : "bg-[#14161f]/60 border-gray-800/50 opacity-60"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{w.name}</span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                          w.isActive
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-gray-800 text-gray-500"
                        }`}
                      >
                        {w.isActive ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      PIN: <strong className="text-amber-400 font-black">{w.pin}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleWaiter(w)}
                      className={`p-1.5 rounded-lg text-[10px] font-bold ${
                        w.isActive
                          ? "bg-rose-950/40 text-rose-300 hover:bg-rose-900/60"
                          : "bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60"
                      }`}
                      title={w.isActive ? "Desactivar mesero" : "Activar mesero"}
                    >
                      {w.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA 3: BITÁCORA FORENSE DE AUDITORÍA & SEGURIDAD                    */}
      {/* ======================================================================= */}
      {activeTab === "audit" && (
        <div className="bg-[#14161f] border border-gray-800 rounded-3xl p-4 sm:p-5 space-y-3 animate-in fade-in">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>BITÁCORA FORENSE DE SEGURIDAD & EVENTOS CRÍTICOS</span>
              </h3>
              <p className="text-[10px] text-gray-400">
                Registro inmutable de acciones autorizadas, reaperturas de turnos y purgas.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAudit}
              className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center italic">
                No hay registros de auditoría recientes.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#181b24] p-3 rounded-2xl border border-gray-800 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-300 text-xs">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300">{log.description}</p>
                  <div className="text-[10px] text-gray-500 flex justify-between pt-0.5 border-t border-gray-800/60">
                    <span>Aprobado por: <strong className="text-gray-300">{log.approvedBy}</strong></span>
                    {log.reason && <span>Motivo: &quot;{log.reason}&quot;</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 1: CREAR USUARIO CAJERO                                          */}
      {/* ======================================================================= */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain animate-in fade-in">
          <div className="w-full max-w-sm bg-[#161922] border border-gray-800 rounded-3xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto overscroll-contain my-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2.5">
              <h3 className="text-sm font-black text-white">Crear Usuario del Sistema</h3>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">
                  Nombre de Usuario (Para Login)
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ej: cajero_tarde"
                  className="w-full bg-[#101217] border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">
                  Nombre Completo / Responsable
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej: María Rodríguez"
                  className="w-full bg-[#101217] border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">
                  Contraseña Inicial
                </label>
                <input
                  type="password"
                  required
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full bg-[#101217] border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">
                  Rol de Acceso
                </label>
                <select
                  value={newUserRole}
                  onChange={(e: any) => setNewUserRole(e.target.value)}
                  className="w-full bg-[#101217] border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                >
                  <option value="ADMIN">Cajero / Operativo (Caja & Mesas)</option>
                  <option value="SUPER_ADMIN">Super Admin (Dueño)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 text-gray-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-black"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 2: CAMBIAR CONTRASEÑA DE USUARIO                                 */}
      {/* ======================================================================= */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain animate-in fade-in">
          <div className="w-full max-w-sm bg-[#161922] border border-gray-800 rounded-3xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto overscroll-contain my-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2.5">
              <h3 className="text-sm font-black text-white">
                Cambiar Contraseña: {showChangePassModal.email}
              </h3>
              <button
                type="button"
                onClick={() => setShowChangePassModal(null)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full bg-[#101217] border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowChangePassModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 text-gray-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-black"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 3: CREAR MESERO                                                  */}
      {/* ======================================================================= */}
      {showCreateWaiterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain animate-in fade-in">
          <div className="w-full max-w-sm bg-[#161922] border border-gray-800 rounded-3xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto overscroll-contain my-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2.5">
              <h3 className="text-sm font-black text-white">Registrar Nuevo Mesero</h3>
              <button
                type="button"
                onClick={() => setShowCreateWaiterModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWaiter} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">
                  Nombre del Mesero
                </label>
                <input
                  type="text"
                  required
                  value={newWaiterName}
                  onChange={(e) => setNewWaiterName(e.target.value)}
                  placeholder="Ej: Camilo"
                  className="w-full bg-[#101217] border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">
                  PIN Táctil de Acceso (4 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={newWaiterPin}
                  onChange={(e) => setNewWaiterPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ej: 5544"
                  className="w-full bg-[#101217] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-base outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateWaiterModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 text-gray-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-black font-black"
                >
                  Guardar Mesero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 4: CAMBIAR PIN MAESTRO DE AUDITORÍA                              */}
      {/* ======================================================================= */}
      {showEditPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain animate-in fade-in">
          <div className="w-full max-w-sm bg-[#161922] border border-gray-800 rounded-3xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto overscroll-contain my-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2.5">
              <h3 className="text-sm font-black text-white">Cambiar PIN de Auditoría</h3>
              <button
                type="button"
                onClick={() => setShowEditPinModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateAdminPin} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">
                  Nuevo PIN de 4 dígitos
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={newPinVal}
                  onChange={(e) => setNewPinVal(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ej: 1234"
                  className="w-full bg-[#101217] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-lg outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowEditPinModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 text-gray-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-black"
                >
                  Guardar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL PANTALLA COMPLETA: TODOS LOS COBROS Y VENTAS DE HOY                */}
      {/* ======================================================================= */}
      {showAllSalesModal && (
        <div className="fixed inset-0 z-50 bg-[#0b0c10] text-white flex flex-col animate-in fade-in overscroll-contain">
          {/* Header Superior Fijo */}
          <header className="sticky top-0 z-20 bg-[#12141c]/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 sm:px-6 sm:py-4 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setShowAllSalesModal(false)}
                className="w-10 h-10 rounded-2xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                title="Volver al panel"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2 truncate">
                    <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Todos los Cobros de Hoy</span>
                  </h2>
                  <span className="text-[10px] sm:text-xs bg-emerald-500/15 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                    {stats?.recentSales.length || 0} movimientos
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate">
                  Total: <strong className="text-white font-black">{formatPrice(stats?.kpis.salesTotal || 0)}</strong>
                  {" • "}Ef: {formatPrice(stats?.kpis.salesCash || 0)} • Dig: {formatPrice(stats?.kpis.salesDigital || 0)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllSalesModal(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar</span>
            </button>
          </header>

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-[#101218] border-b border-gray-800/80 px-4 py-2.5 sm:px-6 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between max-w-5xl mx-auto">
              {/* Buscador */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={salesSearchQuery}
                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                  placeholder="Buscar por mesa (ej: 12, Barra #40), cajero o valor..."
                  className="w-full bg-[#181b24] border border-gray-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
                />
                {salesSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSalesSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Chips de filtro por método de pago */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSalesMethodFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer ${
                    salesMethodFilter === "ALL"
                      ? "bg-emerald-500 text-black shadow-sm"
                      : "bg-gray-800/60 text-gray-400 hover:text-white"
                  }`}
                >
                  Todos ({stats?.recentSales.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSalesMethodFilter("CASH")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer ${
                    salesMethodFilter === "CASH"
                      ? "bg-emerald-500 text-black shadow-sm"
                      : "bg-gray-800/60 text-gray-400 hover:text-white"
                  }`}
                >
                  💵 Efectivo ({stats?.recentSales.filter((s) => s.cash > 0).length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSalesMethodFilter("DIGITAL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer ${
                    salesMethodFilter === "DIGITAL"
                      ? "bg-emerald-500 text-black shadow-sm"
                      : "bg-gray-800/60 text-gray-400 hover:text-white"
                  }`}
                >
                  📱 Digital ({stats?.recentSales.filter((s) => s.digital > 0).length || 0})
                </button>
              </div>
            </div>
          </div>

          {/* Listado de Movimientos de Ventas */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-2">
            {filteredSales.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto" />
                <p className="text-sm font-bold text-gray-400">
                  {stats?.recentSales.length === 0
                    ? "Sin ventas registradas hoy todavía"
                    : "No se encontraron cobros con ese filtro"}
                </p>
                <p className="text-xs text-gray-500">
                  {stats?.recentSales.length === 0
                    ? "Los cobros de mesas y barra se sincronizarán aquí automáticamente en tiempo real."
                    : "Intenta con otro término de búsqueda o cambia el filtro de método."}
                </p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-2">
                {filteredSales.map((s, index) => (
                  <div
                    key={s.id || index}
                    className="bg-[#14161f] border border-gray-800 hover:border-gray-700 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-black text-xs shrink-0">
                        {s.tableNumber}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-xs sm:text-sm truncate">
                            {s.tableNumber.toUpperCase().includes("BARRA")
                              ? s.tableNumber
                              : `Mesa #${s.tableNumber}`}
                          </span>
                          <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full shrink-0">
                            {formatTime(s.closedAt)}
                          </span>
                          {s.itemsCount > 0 && (
                            <span className="text-[10px] text-gray-400 hidden sm:inline">
                              • {s.itemsCount} productos
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5 flex-wrap">
                          {s.cash > 0 && (
                            <span className="text-emerald-400 font-medium">
                              💵 Ef: {formatPrice(s.cash)}
                            </span>
                          )}
                          {s.digital > 0 && (
                            <span className="text-purple-400 font-medium">
                              📱 Dig: {formatPrice(s.digital)}
                            </span>
                          )}
                          <span className="text-gray-400 truncate">
                            • Por: <strong className="text-gray-300 font-semibold">{s.closedBy}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-black text-white block">
                        {formatPrice(s.total)}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-500/20">
                        Cobrado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Fijo */}
          <footer className="sticky bottom-0 bg-[#12141c]/95 backdrop-blur-md border-t border-gray-800 px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shadow-2xl">
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Total mostrado</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  {formatPrice(totalFilteredSales)}
                </span>
                <span className="text-[11px] text-gray-400">
                  ({filteredSales.length} de {stats?.recentSales.length || 0})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllSalesModal(false)}
              className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              Cerrar
            </button>
          </footer>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL PANTALLA COMPLETA: TODOS LOS GASTOS Y SALIDAS DE HOY              */}
      {/* ======================================================================= */}
      {showAllExpensesModal && (
        <div className="fixed inset-0 z-50 bg-[#0b0c10] text-white flex flex-col animate-in fade-in overscroll-contain">
          {/* Header Superior Fijo */}
          <header className="sticky top-0 z-20 bg-[#12141c]/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 sm:px-6 sm:py-4 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setShowAllExpensesModal(false)}
                className="w-10 h-10 rounded-2xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                title="Volver al panel"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2 truncate">
                    <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Todos los Gastos de Hoy</span>
                  </h2>
                  <span className="text-[10px] sm:text-xs bg-rose-500/15 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30 shrink-0">
                    {stats?.recentExpenses.length || 0} registros
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate">
                  Total: <strong className="text-rose-400 font-black">-{formatPrice(stats?.kpis.expensesTotal || 0)}</strong>
                  {" • "}Ef: -{formatPrice(stats?.kpis.expensesCash || 0)} • Transf: -{formatPrice(stats?.kpis.expensesDigital || 0)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllExpensesModal(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar</span>
            </button>
          </header>

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-[#101218] border-b border-gray-800/80 px-4 py-2.5 sm:px-6 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between max-w-5xl mx-auto">
              {/* Buscador */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={expensesSearchQuery}
                  onChange={(e) => setExpensesSearchQuery(e.target.value)}
                  placeholder="Buscar por descripción (ej: pollo, carbón, nómina), responsable o factura..."
                  className="w-full bg-[#181b24] border border-gray-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-rose-500 transition-colors"
                />
                {expensesSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setExpensesSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Chips de filtro por categoría */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setExpensesCategoryFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer ${
                    expensesCategoryFilter === "ALL"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-gray-800/60 text-gray-400 hover:text-white"
                  }`}
                >
                  Todas ({stats?.recentExpenses.length || 0})
                </button>
                {Object.entries(EXPENSE_CATEGORIES).map(([catKey, catVal]) => {
                  const countInCat = (stats?.recentExpenses || []).filter((e) => e.category === catKey).length;
                  if (countInCat === 0) return null;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setExpensesCategoryFilter(catKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 flex items-center gap-1 cursor-pointer ${
                        expensesCategoryFilter === catKey
                          ? "bg-rose-500 text-white shadow-sm"
                          : "bg-gray-800/60 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>{catVal.icon}</span>
                      <span>{catVal.label} ({countInCat})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Listado de Movimientos de Gastos */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-2">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <TrendingDown className="w-12 h-12 text-gray-600 mx-auto" />
                <p className="text-sm font-bold text-gray-400">
                  {stats?.recentExpenses.length === 0
                    ? "Sin gastos registrados hoy"
                    : "No se encontraron egresos con ese filtro"}
                </p>
                <p className="text-xs text-gray-500">
                  {stats?.recentExpenses.length === 0
                    ? "Cada salida o egreso registrado en Caja aparecerá aquí al instante."
                    : "Intenta con otro término de búsqueda o selecciona otra categoría."}
                </p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-2">
                {filteredExpenses.map((e, index) => {
                  const cat = EXPENSE_CATEGORIES[e.category] || { label: e.category, icon: "🏷️" };
                  return (
                    <div
                      key={e.id || index}
                      className="bg-[#14161f] border border-gray-800 hover:border-gray-700 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg shrink-0">
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs sm:text-sm truncate">
                              {e.description}
                            </span>
                            <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full shrink-0">
                              {formatTime(e.date)}
                            </span>
                            <span className="text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full hidden sm:inline">
                              {cat.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5 flex-wrap">
                            <span className={e.paymentMethod === "CASH" ? "text-emerald-400 font-medium" : "text-purple-400 font-medium"}>
                              {e.paymentMethod === "CASH" ? "💵 Efectivo" : "📱 Transferencia"}
                            </span>
                            <span className="text-gray-400 truncate">
                              • Por: <strong className="text-gray-300 font-semibold">{e.responsible || "Caja"}</strong>
                            </span>
                            {e.receiptNumber && (
                              <span className="text-gray-500 text-[10px] hidden sm:inline">
                                • Fact/Voucher: #{e.receiptNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm sm:text-base font-black text-rose-400 block">
                          -{formatPrice(e.amount)}
                        </span>
                        <span className="text-[10px] text-rose-400/90 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-rose-500/20">
                          Egreso
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Fijo */}
          <footer className="sticky bottom-0 bg-[#12141c]/95 backdrop-blur-md border-t border-gray-800 px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shadow-2xl">
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Total salidas mostrado</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-rose-400">
                  -{formatPrice(totalFilteredExpenses)}
                </span>
                <span className="text-[11px] text-gray-400">
                  ({filteredExpenses.length} de {stats?.recentExpenses.length || 0})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllExpensesModal(false)}
              className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              Cerrar
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
