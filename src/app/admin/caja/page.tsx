import { AdminCajaView } from "@/components/admin/AdminCajaView";

export const metadata = {
  title: "Caja & Contabilidad | Pío Pío Admin",
  description: "Apertura y cierre de caja, arqueo de turnos, libro de gastos y reportes contables",
};

export default function AdminCajaPage() {
  return (
    <div className="w-full">
      <AdminCajaView />
    </div>
  );
}
