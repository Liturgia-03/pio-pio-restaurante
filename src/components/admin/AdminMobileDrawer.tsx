"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  LayoutDashboard,
  UtensilsCrossed,
  FolderTree,
  Sparkles,
  ExternalLink,
  LogOut,
  PlusCircle,
  QrCode,
  Settings,
  Zap,
  WalletCards,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string | null;
}

export function AdminMobileDrawer({ isOpen, onClose, userRole }: AdminMobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen && !isClosing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isClosing]);

  // Manejar el botón atrás nativo del celular para cerrar el drawer suavemente
  useEffect(() => {
    if (!isOpen) return;

    const onPopState = () => {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 200);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Cierre cuando se presiona la 'X' o se toca fuera del drawer (backdrop)
  const handleDismiss = () => {
    if (typeof window !== "undefined" && window.history.state?.pioAdminDrawer) {
      window.history.back();
      return;
    }
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  // Navegación inmediata a la sección elegida
  const handleNavigate = (href: string) => {
    // Si ya está en esa misma pantalla, solo cerramos el drawer
    if (pathname === href) {
      handleDismiss();
      return;
    }

    // Limpiar el estado de historia del drawer sin disparar popstate
    if (typeof window !== "undefined" && window.history.state?.pioAdminDrawer) {
      window.history.replaceState(null, "");
    }

    onClose();
    router.push(href);
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined" && window.history.state?.pioAdminDrawer) {
      window.history.replaceState(null, "");
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("pio_user_role");
    }
    onClose();
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      toast.success("Sesión cerrada");
      window.location.href = "/admin/login";
    } catch {
      toast.error("Error al cerrar sesión");
    }
  };

  const isSuperAdmin = userRole === "SUPER_ADMIN" || pathname.startsWith("/admin/owner");

  const menuItems = isSuperAdmin
    ? [
        { label: "👑 Panel Ejecutivo del Dueño", href: "/admin/owner", icon: Crown },
        { label: "Caja & Contabilidad", href: "/admin/caja", icon: WalletCards },
        { label: "Ajustes Generales del Asadero", href: "/admin/settings", icon: Settings },
      ]
    : [
        { label: "Dashboard Resumen", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Barra Rápida", href: "/admin/barra", icon: Zap },
        { label: "Control de Mesas & Caja", href: "/admin/tables", icon: UtensilsCrossed },
        { label: "Caja & Contabilidad", href: "/admin/caja", icon: WalletCards },
        { label: "Gestión de Platos", href: "/admin/dishes", icon: UtensilsCrossed },
        { label: "Nuevo Plato", href: "/admin/dishes/new", icon: PlusCircle },
        { label: "Categorías", href: "/admin/categories", icon: FolderTree },
        { label: "Ajustes Menú", href: "/admin/promo-modal", icon: Sparkles },
        { label: "Códigos QR Mesas", href: "/admin/qr", icon: QrCode },
        { label: "Ajustes Asadero", href: "/admin/settings", icon: Settings },
      ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex bg-black/85 backdrop-blur-md md:hidden transition-all duration-200 ease-out ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100 animate-in fade-in"
      }`}
      onClick={handleDismiss}
    >
      <div
        className={`relative w-4/5 max-w-xs h-full overflow-y-auto overscroll-contain bg-[#181b20] border-r border-gray-800 p-5 flex flex-col justify-between shadow-2xl transform transition-all duration-200 ease-out ${
          isClosing
            ? "-translate-x-full opacity-0"
            : "translate-x-0 opacity-100 animate-in slide-in-from-left duration-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header con botón cerrar */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 bg-amber-950 flex-shrink-0 shadow-md">
                <img
                  src="/logo-pio-pio.png"
                  alt="Pío Pío"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pío Pío Admin</h3>
                <span className="text-[10px] text-amber-400 font-semibold uppercase">
                  {isSuperAdmin ? "SUPER ADMIN • DUEÑO" : "Staff & Cocina"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Cerrar navegación"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 active:scale-95 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links de Navegación */}
          <nav className="mt-5 space-y-1.5">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNavigate(item.href)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-150 ease-out active:scale-[0.98] text-left ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30 font-bold shadow-sm"
                      : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer del Drawer */}
        <div className="pt-4 border-t border-gray-800 space-y-2">
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.state?.pioAdminDrawer) {
                window.history.replaceState(null, "");
              }
              onClose();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl border border-gray-700 active:scale-[0.98] transition-all duration-200"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Carta en Vivo</span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-red-950/30 hover:bg-red-900/40 text-red-400 text-xs font-semibold rounded-xl border border-red-800/30 active:scale-[0.98] transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
