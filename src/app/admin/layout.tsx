import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ClientOnly } from "@/components/common/ClientOnly";

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
