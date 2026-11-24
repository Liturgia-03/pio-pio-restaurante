"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdminNavSidebar } from "@/components/admin/AdminNavSidebar";
import { AdminBarraDrawer } from "@/components/admin/AdminBarraDrawer";
import { AdminMobileDrawer } from "@/components/admin/AdminMobileDrawer";
import { AdminBottomBar } from "@/components/admin/AdminBottomBar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Consultar el rol del usuario autenticado actual
  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setUserRole(json.data.role);
        }
      })
      .catch(() => {});
  }, []);

  // Cerrar el drawer automáticamente cada vez que cambia la ruta
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleOpenDrawer = () => {
    if (typeof window !== "undefined") {
      window.history.pushState({ pioAdminDrawer: true }, "");
    }
    setDrawerOpen(true);
  };

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[#0f1115] text-gray-100">{children}</div>;
  }

  // Título según la ruta (en mayúsculas)
  let pageTitle = "DASHBOARD";
  if (pathname.includes("/admin/owner")) pageTitle = "PANEL EJECUTIVO DEL DUEÑO";
  else if (pathname.includes("/admin/dishes/new")) pageTitle = "NUEVO PLATO";
  else if (pathname.includes("/admin/dishes")) pageTitle = "GESTIÓN DE PLATOS";
  else if (pathname.includes("/admin/categories")) pageTitle = "CATEGORÍAS";
  else if (pathname.includes("/admin/promo-modal")) pageTitle = "AJUSTES MENÚ";
  else if (pathname.includes("/admin/qr")) pageTitle = "CÓDIGOS QR MESAS";
  else if (pathname.includes("/admin/settings")) pageTitle = "AJUSTES ASADERO";
  else if (pathname.includes("/admin/caja")) pageTitle = "CAJA & CONTABILIDAD";
  else if (pathname.includes("/admin/barra")) pageTitle = "BARRA RÁPIDA & MOSTRADOR";
  else if (pathname.includes("/admin/tables")) pageTitle = "CONTROL DE MESAS Y CAJA";

  const isSuperAdmin = userRole === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-100 flex flex-col md:flex-row">
      <AdminNavSidebar userRole={userRole} />

      {/* Barra de Pedidos Rápidos y Mostrador: solo para personal operativo (no Super Admin) */}
      {!isSuperAdmin && <AdminBarraDrawer />}

      <AdminMobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userRole={userRole}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-6">
        <AdminHeader
          title={pageTitle}
          onOpenDrawer={handleOpenDrawer}
        />
        <main
          key={pathname}
          className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]"
        >
          {children}
        </main>
      </div>

      <AdminBottomBar userRole={userRole} />
    </div>
  );
}
