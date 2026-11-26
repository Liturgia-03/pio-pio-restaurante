"use client";

import React, { useState } from "react";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import {
  ShieldAlert,
  Lock,
  X,
  Loader2,
  KeyRound,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle2,
  Delete,
} from "lucide-react";
import { toast } from "sonner";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data?: any) => void;
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
}

export function AdminAuthModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  actionType,
  payload,
  confirmButtonText = "Autorizar Acción",
  confirmButtonColor = "amber",
  detailsBadge,
}: AdminAuthModalProps) {
  const [pinOrPassword, setPinOrPassword] = useState("");
  const [reason, setReason] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pinOrPassword.length < 20) {
      setPinOrPassword((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setPinOrPassword((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinOrPassword("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!pinOrPassword.trim()) {
      toast.error("Ingresa el PIN o contraseña de Administrador");
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      toast.error("Debes ingresar un motivo o justificación válida (mínimo 3 caracteres)");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/audit/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          pinOrPassword: pinOrPassword.trim(),
          reason: reason.trim(),
          ...payload,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Error al procesar la autorización");
      }

      toast.success(json.message || "Acción autorizada y registrada con éxito");
      onSuccess(json.data);
      onClose();
    } catch (error: any) {
      console.error("Error en autorización:", error);
      toast.error(error.message || "Credenciales incorrectas o error en el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estilos de botones de confirmación
  const colorStyles = {
    amber: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20 text-white",
    rose: "bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 shadow-rose-600/20 text-white",
    emerald: "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/20 text-white",
    blue: "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-600/20 text-white",
  }[confirmButtonColor];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain">
      <div className="w-full max-w-md bg-[#12141a] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[92vh] overscroll-contain">
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-start justify-between gap-3 bg-[#161a22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-snug">{title}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo / Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Badge de detalles contextuales */}
          {detailsBadge && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{detailsBadge}</span>
            </div>
          )}

          {/* Advertencia de Auditoría */}
          <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-[10px] text-gray-400 leading-relaxed">
            🛡️ <strong className="text-gray-300">Registro inmutable:</strong> Esta acción requiere PIN o contraseña de Administrador y quedará asentada en la bitácora de auditoría con fecha, hora y motivo justificado.
          </div>

          {/* Campo Motivo / Justificación */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span>Motivo o Justificación <strong className="text-rose-400">*</strong></span>
              <span className="text-[10px] text-gray-500 font-normal">Mínimo 3 caracteres</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Se cerró la cuenta por error antes del pago total / Cliente solicitó pagar por Nequi"
              className="w-full bg-[#181b22] border border-gray-700 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Campo PIN / Contraseña */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>PIN (4 dígitos) o Contraseña de Admin <strong className="text-rose-400">*</strong></span>
              </span>
              <span className="text-[10px] text-gray-500 font-mono">PIN Inicial: 1234</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={pinOrPassword}
                onChange={(e) => setPinOrPassword(e.target.value)}
                placeholder="Ingresa PIN o contraseña"
                className="w-full bg-[#181b22] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-center font-mono font-bold tracking-widest text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Teclado numérico táctil para tablets / POS */}
          <div className="pt-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 block mb-1 text-center">
              Teclado Táctil Rápido
            </span>
            <div className="grid grid-cols-3 gap-1.5 max-w-[260px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(String(num))}
                  className="h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 active:bg-amber-600 active:text-black font-mono font-black text-sm text-white transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-10 rounded-xl bg-gray-800/80 hover:bg-rose-950 hover:text-rose-300 font-bold text-xs text-gray-400 transition-all flex items-center justify-center"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                className="h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 active:bg-amber-600 active:text-black font-mono font-black text-sm text-white transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-all flex items-center justify-center"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !pinOrPassword.trim() || reason.trim().length < 3}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none ${colorStyles}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{confirmButtonText}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
