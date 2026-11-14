"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  UtensilsCrossed,
  AlertTriangle,
  FolderTree,
  Sparkles,
  Plus,
  ArrowRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  XCircle,
  Copy,
} from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { DishItem, PromoModalData } from "@/types";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [baseUrl, setBaseUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const { data: dishes = [], isLoading: loadingDishes } = useQuery<DishItem[]>({
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

  const { data: promo } = useQuery<PromoModalData | null>({
    queryKey: ["admin-promo"],
    queryFn: async () => {
      const res = await fetch("/api/admin/promo-modal");
      const json = await res.json();
      return json.data || null;
    },
  });

  // Mutación para toggle rápido de disponibilidad optimista
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

  const activeDishes = dishes.filter((d) => d.isAvailable);
  const outOfStockDishes = dishes.filter((d) => !d.isAvailable);

  return (
    <div className="space-y-6">
      {/* Banner Superior de Bienvenida */}
      <div className="bg-gradient-to-r from-orange-950/30 via-[#181b20] to-amber-950/30 border border-orange-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Flame className="w-7 h-7 fill-orange-500" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              Gestión Rápida de Restaurante
            </h2>
            <p className="text-xs text-gray-400">
              Controla platos, existencias y promociones en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/admin/dishes/new"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all duration-300 ease-out min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Plato</span>
          </Link>
          <Link
            href="/menu"
            target="_blank"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl border border-gray-700 active:scale-[0.98] transition-all duration-300 ease-out min-h-[40px]"
          >
            <ExternalLink className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Ver Menú</span>
          </Link>
        </div>
      </div>

      {/* Barra Destacada: Enlace Público de la Carta Digital */}
      <div className="bg-gradient-to-r from-amber-500/10 via-[#181b20] to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ExternalLink className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">
              Enlace Público de la Carta Digital
            </span>
            <p className="text-xs font-mono text-gray-300 truncate">
              {baseUrl ? `${baseUrl}/menu` : "/menu"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              const link = baseUrl ? `${baseUrl}/menu` : `${window.location.origin}/menu`;
              navigator.clipboard.writeText(link);
              toast.success("Enlace de la carta copiado al portapapeles");
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 active:scale-95 transition-all min-h-[38px]"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" />
            <span>Copiar Link del Menú</span>
          </button>
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-amber-500/20 min-h-[38px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Carta Pública</span>
          </a>
        </div>
      </div>

      {/* Métricas KPI Rápidas (Mobile-First 2x2 Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#181b20] border border-gray-800 hover:border-gray-700/80 rounded-2xl p-4 space-y-1 transition-all duration-300 ease-out hover:shadow-lg">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold">Disponibles</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-white">{activeDishes.length}</p>
          <span className="text-[10px] text-gray-500 block">Visibles en carta</span>
        </div>

        <div className="bg-[#181b20] border border-gray-800 hover:border-gray-700/80 rounded-2xl p-4 space-y-1 transition-all duration-300 ease-out hover:shadow-lg">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-xs font-semibold">Agotados</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-red-400">{outOfStockDishes.length}</p>
          <span className="text-[10px] text-gray-500 block">Marcados no disponibles</span>
        </div>

        <div className="bg-[#181b20] border border-gray-800 hover:border-gray-700/80 rounded-2xl p-4 space-y-1 transition-all duration-300 ease-out hover:shadow-lg">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold">Categorías</span>
            <FolderTree className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-white">{categories.length}</p>
          <span className="text-[10px] text-gray-500 block">Secciones activas</span>
        </div>

        <div className="bg-[#181b20] border border-gray-800 hover:border-gray-700/80 rounded-2xl p-4 space-y-1 transition-all duration-300 ease-out hover:shadow-lg">
          <div className="flex items-center justify-between text-orange-400">
            <span className="text-xs font-semibold">Modal Promo</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-base font-black text-white">
            {promo?.isActive ? (
              <span className="text-emerald-400">Activo</span>
            ) : (
              <span className="text-gray-500">Pausado</span>
            )}
          </p>
          <span className="text-[10px] text-gray-500 block truncate">
            {promo?.title || "Sin promo"}
          </span>
        </div>
      </div>

      {/* Control Rápido de Platos Recientes / Alternador de Estado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              Control Rápido de Disponibilidad
            </h3>
            <p className="text-xs text-gray-400">
              Toca el interruptor para marcar agotado en cocina inmediatamente.
            </p>
          </div>
          <Link
            href="/admin/dishes"
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dishes.slice(0, 6).map((dish) => (
            <div
              key={dish.id}
              className="flex items-center justify-between p-3.5 bg-[#181b20] border border-gray-800 hover:border-gray-700/80 rounded-2xl gap-3 transition-all duration-300 ease-out hover:shadow-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className={`w-12 h-12 rounded-xl object-cover flex-shrink-0 transition-opacity duration-300 ${
                    !dish.isAvailable ? "grayscale opacity-60" : ""
                  }`}
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {dish.name}
                  </h4>
                  <span className="text-xs font-black text-orange-400">
                    {formatPrice(dish.discountPrice || dish.basePrice)}
                  </span>
                </div>
              </div>

              {/* iOS Style Quick Switch (>= 50px de ancho táctil) */}
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
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-out focus:outline-none ${
                  dish.isAvailable ? "bg-emerald-600" : "bg-gray-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-out ${
                    dish.isAvailable ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

