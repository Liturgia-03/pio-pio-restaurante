"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Por favor ingresa tu usuario");
      return;
    }
    if (!password) {
      toast.error("Por favor ingresa tu contraseña");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Usuario o contraseña incorrectos");
        setLoading(false);
        return;
      }

      const userRole = data?.data?.user?.role;

      if (typeof window !== "undefined") {
        localStorage.setItem("pio_user_role", userRole || "");
      }

      if (userRole === "SUPER_ADMIN") {
        toast.success("👑 ¡Bienvenido, Super Admin!");
        window.location.href = "/admin/owner";
      } else {
        toast.success("¡Bienvenido al panel de Pío Pío!");
        window.location.href = "/admin/dashboard";
      }
    } catch {
      toast.error("Error de conexión al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f1115]">
      <div className="w-full max-w-sm bg-[#181b20] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-[modalPopIn_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
        {/* Glow de fondo */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header con Logo Pío Pío */}
        <div className="text-center space-y-2 mb-6">
          <div className="relative w-20 h-20 rounded-full mx-auto overflow-hidden border-2 border-amber-400 shadow-xl shadow-amber-500/20 bg-amber-950 animate-logo-glow">
            <img
              src="/logo-pio-pio.png"
              alt="Pío Pío Asadero y Restaurante"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-xl font-black text-white">Panel Administrativo</h1>
          <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
            Pío Pío • Asadero y Restaurante
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Usuario</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-amber-400 active:scale-90 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 text-xs transition-all duration-300 ease-out disabled:opacity-50 min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingresando...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Nota informativa */}
        <div className="mt-6 pt-4 border-t border-gray-800/80 text-center">
          <p className="text-[11px] text-gray-500">
            Acceso exclusivo para administradores y cocina.
          </p>
        </div>
      </div>
    </div>
  );
}
