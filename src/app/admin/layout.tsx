import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ClientOnly } from "@/components/common/ClientOnly";

export const metadata: Metadata = {
  title: "Admin Pío Pío | Panel de Control",
  description: "Panel de administración y control operativo de mesas, pedidos y caja - Pío Pío",
  manifest: "/manifest-admin.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Admin Pío Pío",
  },
  icons: {
    apple: "/logo-pio-pio.png",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-screen bg-[#0f1115]" />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </ClientOnly>
  );
}
