"use client";

import Link from "next/link";
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
} from "lucide-react";
import { toast } from "sonner";

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminMobileDrawer({ isOpen, onClose }: AdminMobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      toast.success("Sesión cerrada");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("Error al cerrar sesión");
    }
  };

  const menuItems = [
    { label: "Dashboard Resumen", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Gestión de Platos", href: "/admin/dishes", icon: UtensilsCrossed },
    { label: "Nuevo Plato", href: "/admin/dishes/new", icon: PlusCircle },
    { label: "Categorías", href: "/admin/categories", icon: FolderTree },
    { label: "Modal Promocional", href: "/admin/promo-modal", icon: Sparkles },
    { label: "Códigos QR Mesas", href: "/admin/qr", icon: QrCode },
    { label: "Ajustes Asadero", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-4/5 max-w-xs h-full bg-[#181b20] border-r border-gray-800 p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header con botón cerrar */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 bg-amber-950 flex-shrink-0">
                <img
                  src="/logo-pio-pio.png"
                  alt="Pío Pío"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pío Pío Admin</h3>
                <span className="text-[10px] text-amber-400 font-semibold uppercase">
                  Staff & Cocina
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar navegación"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white bg-gray-800/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links de Navegación */}
          <nav className="mt-6 space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30 font-bold"
                      : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer del Drawer */}
        <div className="pt-4 border-t border-gray-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl border border-gray-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Carta en Vivo</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-red-950/30 hover:bg-red-900/40 text-red-400 text-xs font-semibold rounded-xl border border-red-800/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
