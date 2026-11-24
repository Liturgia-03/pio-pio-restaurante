import { AdminBarraView } from "@/components/admin/AdminBarraView";

export const metadata = {
  title: "Barra Rápida & Mostrador | Pío Pío Admin",
  description: "Control de pedidos rápidos para llevar y atención en mostrador",
};

export default function AdminBarraPage() {
  return (
    <div className="w-full">
      <AdminBarraView />
    </div>
  );
}
