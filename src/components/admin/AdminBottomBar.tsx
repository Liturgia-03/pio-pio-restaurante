"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, Utensils, FolderTree, Sparkles, Plus, Zap, Crown, WalletCards, Settings } from "lucide-react";

interface AdminBottomBarProps {
  userRole?: string | null;
}

export function AdminBottomBar({ userRole }: AdminBottomBarProps) {
  const pathname = usePathname();

  const isSuperAdmin = userRole === "SUPER_ADMIN";

  // Si es Super Admin, barra inferior exclusiva con las 3 pestañas solicitadas
  if (isSuperAdmin) {
    const ownerNavItems = [
      { label: "👑 Dueño", href: "/admin/owner", icon: Crown },
      { label: "💵 Caja", href: "/admin/caja", icon: WalletCards },
      { label: "⚙️ Ajustes", href: "/admin/settings", icon: Settings },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#181b20]/95 backdrop-blur-lg border-t border-gray-800/90 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {ownerNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-300 ease-out min-h-[48px] active:scale-95 ${
                  isActive
                    ? "text-amber-400 font-black bg-amber-500/15 border border-amber-500/30 shadow-md"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[11px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Barra", href: "/admin/barra", icon: Zap },
    { label: "Mesas", href: "/admin/tables", icon: Utensils },
    { label: "Platos", href: "/admin/dishes", icon: UtensilsCrossed },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#181b20]/95 backdrop-blur-lg border-t border-gray-800/90 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-300 ease-out min-h-[44px] active:scale-95 ${
                isActive ? "text-orange-500 font-bold scale-105" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}

        {/* Botón Flotante Central (FAB) para Agregar Plato */}
        <div className="-mt-7">
          <Link
            href="/admin/dishes/new"
            aria-label="Agregar nuevo plato"
            className="flex items-center justify-center w-13 h-13 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-600/40 border-4 border-[#0f1115] active:scale-90 hover:scale-105 transition-all duration-300 ease-out"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </Link>
        </div>

        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-300 ease-out min-h-[44px] active:scale-95 ${
                isActive ? "text-orange-500 font-bold scale-105" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

