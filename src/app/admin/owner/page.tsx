import { Metadata } from "next";
import { OwnerDashboardView } from "@/components/admin/OwnerDashboardView";

export const metadata: Metadata = {
  title: "Panel Ejecutivo del Dueño | Pío Pío",
  description: "Monitoreo en tiempo real de finanzas, salón, personal y auditoría de Pío Pío Asadero & Restaurante",
};

export default function OwnerPage() {
  return (
    <div className="p-3 sm:p-6">
      <OwnerDashboardView />
    </div>
  );
}
