"use client";

import { use, useEffect, useState } from "react";
import { DishForm } from "@/components/admin/DishForm";
import { Loader2 } from "lucide-react";

export default function EditDishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [dish, setDish] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDish() {
      try {
        const res = await fetch(`/api/admin/dishes/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setDish(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadDish();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-xs">Cargando información del plato...</span>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-sm font-bold text-white">Plato no encontrado</p>
      </div>
    );
  }

  return <DishForm initialData={dish} isEditing={true} />;
}
