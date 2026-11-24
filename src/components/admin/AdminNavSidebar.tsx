"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderTree,
  Sparkles,
  ExternalLink,
  LogOut,
  PlusCircle,
  QrCode,
  Settings,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

export function AdminNavSidebar() {
  const pathname = usePathname();
  const router = useRouter();

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

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Mesas & Caja", href: "/admin/tables", icon: UtensilsCrossed },
    { label: "Caja & Contabilidad", href: "/admin/caja", icon: WalletCards },
    { label: "Platos & Disponibilidad", href: "/admin/dishes", icon: UtensilsCrossed },
    { label: "Crear Nuevo Plato", href: "/admin/dishes/new", icon: PlusCircle },
    { label: "Categorías", href: "/admin/categories", icon: FolderTree },
    { label: "Ajustes Menú", href: "/admin/promo-modal", icon: Sparkles },
    { label: "Códigos QR Mesas", href: "/admin/qr", icon: QrCode },
    { label: "Ajustes Asadero", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 bg-[#14161a] border-r border-gray-800 p-5 min-h-screen fixed top-0 left-0 bottom-0 z-30">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 pb-6 border-b border-gray-800">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400 flex items-center justify-center bg-amber-950 flex-shrink-0 shadow-lg shadow-amber-500/20">
            <img
              src="/logo-pio-pio.png"
              alt="Pío Pío"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white leading-tight">Pío Pío</h2>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              Panel Administrativo
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ease-out active:scale-[0.98] ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20 translate-x-1"
                    : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-100 hover:translate-x-1"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-gray-800 space-y-2">
        <Link
          href="/menu"
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl border border-gray-700 active:scale-[0.98] transition-all duration-300 ease-out"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          <span>Ver Carta de Clientes</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-red-950/30 hover:bg-red-900/40 text-red-400 text-xs font-semibold rounded-xl border border-red-800/30 active:scale-[0.98] transition-all duration-300 ease-out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
