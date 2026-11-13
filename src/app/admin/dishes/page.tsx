"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Flame,
} from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { DishItem } from "@/types";
import { toast } from "sonner";

export default function AdminDishesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const { data: dishes = [], isLoading } = useQuery<DishItem[]>({
    queryKey: ["admin-dishes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dishes");
      const json = await res.json();
      return json.data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Toggle disponibilidad optimista
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const res = await fetch(`/api/admin/dishes/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      });
      if (!res.ok) throw new Error("Error al cambiar disponibilidad");
      return res.json();
    },
    onMutate: async ({ id, isAvailable }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-dishes"] });
      const previousDishes = queryClient.getQueryData<DishItem[]>(["admin-dishes"]);

      queryClient.setQueryData<DishItem[]>(["admin-dishes"], (old = []) =>
        old.map((dish) => (dish.id === id ? { ...dish, isAvailable } : dish))
      );

      return { previousDishes };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousDishes) {
        queryClient.setQueryData(["admin-dishes"], context.previousDishes);
      }
      toast.error("Error al actualizar disponibilidad");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-dishes"] });
      queryClient.invalidateQueries({ queryKey: ["public-menu"] });
      toast.success(data.message || "Disponibilidad actualizada");
    },
  });

  // Eliminar plato
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/dishes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar el plato");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dishes"] });
      queryClient.invalidateQueries({ queryKey: ["public-menu"] });
      toast.success("Plato eliminado exitosamente");
    },
    onError: () => {
      toast.error("No se pudo eliminar el plato");
    },
  });

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchesSearch =
        dish.name.toLowerCase().includes(search.toLowerCase()) ||
        dish.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "ALL" || dish.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [dishes, search, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Barra de Acciones y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar platos o ingredientes..."
            className="w-full bg-[#181b20] border border-gray-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <Link
          href="/admin/dishes/new"
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Plato</span>
        </Link>
      </div>

      {/* Chips de filtro por Categoría */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === "ALL"
              ? "bg-orange-500 text-white"
              : "bg-[#181b20] text-gray-400 hover:text-white border border-gray-800"
          }`}
        >
          Todos ({dishes.length})
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? "bg-orange-500 text-white"
                : "bg-[#181b20] text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Lista de Platos */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-xs">Cargando platos...</span>
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="p-12 text-center bg-[#181b20] border border-gray-800 rounded-2xl space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="text-sm font-bold text-white">No se encontraron platos</p>
          <p className="text-xs text-gray-400">
            Intenta cambiar los filtros o agrega un nuevo plato a la carta.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredDishes.map((dish) => (
            <div
              key={dish.id}
              className={`p-3.5 bg-[#181b20] border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                dish.isAvailable ? "border-gray-800" : "border-red-950/40 bg-[#14161a]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className={`w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-800 ${
                    !dish.isAvailable ? "grayscale opacity-60" : ""
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate">
                      {dish.name}
                    </h4>
                    {!dish.isAvailable && (
                      <span className="bg-red-900/60 text-red-300 text-[10px] font-bold px-2 py-0.2 rounded-full flex-shrink-0">
                        Agotado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate max-w-sm">
                    {dish.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-extrabold text-orange-400">
                      {formatPrice(dish.discountPrice || dish.basePrice)}
                    </span>
                    {dish.portions && dish.portions.length > 0 && (
                      <span className="text-[10px] text-gray-500">
                        • {dish.portions.length} porciones
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Controles de Disponibilidad y Acciones */}
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-400">
                    {dish.isAvailable ? "Disponible" : "Agotado"}
                  </span>
                  {/* Switch iOS Style */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={dish.isAvailable}
                    onClick={() =>
                      toggleMutation.mutate({
                        id: dish.id,
                        isAvailable: !dish.isAvailable,
                      })
                    }
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      dish.isAvailable ? "bg-emerald-600" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        dish.isAvailable ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/dishes/${dish.id}`}
                    aria-label="Editar plato"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar "${dish.name}"?`)) {
                        deleteMutation.mutate(dish.id);
                      }
                    }}
                    aria-label="Eliminar plato"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

