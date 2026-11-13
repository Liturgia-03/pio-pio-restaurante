"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminNavSidebar } from "@/components/admin/AdminNavSidebar";
import { AdminMobileDrawer } from "@/components/admin/AdminMobileDrawer";
import { AdminBottomBar } from "@/components/admin/AdminBottomBar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[#0f1115] text-gray-100">{children}</div>;
  }

  // Título según la ruta
  let pageTitle = "Dashboard";
  if (pathname.includes("/admin/dishes/new")) pageTitle = "Nuevo Plato";
  else if (pathname.includes("/admin/dishes")) pageTitle = "Gestión de Platos";
  else if (pathname.includes("/admin/categories")) pageTitle = "Categorías";
  else if (pathname.includes("/admin/promo-modal")) pageTitle = "Modal Promocional";
  else if (pathname.includes("/admin/qr")) pageTitle = "Códigos QR Mesas";
  else if (pathname.includes("/admin/settings")) pageTitle = "Ajustes Asadero";

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-100 flex flex-col md:flex-row">
      <AdminNavSidebar />

      <AdminMobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-6">
        <AdminHeader
          title={pageTitle}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      <AdminBottomBar />
    </div>
  );
}
