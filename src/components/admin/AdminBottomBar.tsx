"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, FolderTree, Sparkles, Plus } from "lucide-react";

export function AdminBottomBar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Platos", href: "/admin/dishes", icon: UtensilsCrossed },
    { label: "Categorías", href: "/admin/categories", icon: FolderTree },
    { label: "Promo", href: "/admin/promo-modal", icon: Sparkles },
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

