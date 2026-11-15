"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Flame,
  Star,
  Sparkles,
  Tag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Percent,
  Layers,
} from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { DishItem } from "@/types";
import { toast } from "sonner";

type StatusFilter = "ALL" | "AVAILABLE" | "OUT_OF_STOCK" | "PROMOS";

export default function AdminDishesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

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

  // Opciones completas de categorías (incluyendo "ALL")
  const categoryOptions = useMemo(() => {
    return [
      { id: "ALL", name: "Todas las Categorías" },
      ...categories.map((c: any) => ({ id: c.id, name: c.name })),
    ];
  }, [categories]);

  // Navegación entre categorías: Índice, Anterior y Siguiente
  const currentCategoryIndex = useMemo(() => {
    return categoryOptions.findIndex((c) => c.id === selectedCategory);
  }, [categoryOptions, selectedCategory]);

  const prevCategory = useMemo(() => {
    if (currentCategoryIndex <= 0) return null;
    return categoryOptions[currentCategoryIndex - 1];
  }, [categoryOptions, currentCategoryIndex]);

  const nextCategory = useMemo(() => {
    if (currentCategoryIndex < 0 || currentCategoryIndex >= categoryOptions.length - 1) return null;
    return categoryOptions[currentCategoryIndex + 1];
  }, [categoryOptions, currentCategoryIndex]);

  const [slideDirection, setSlideDirection] = useState<"next" | "prev" | "none">("none");

  const handleNextCategory = () => {
    if (!nextCategory) return;
    setSlideDirection("next");
    setSelectedCategory(nextCategory.id);
  };

  const handlePrevCategory = () => {
    if (!prevCategory) return;
    setSlideDirection("prev");
    setSelectedCategory(prevCategory.id);
  };

  const handleSelectCategory = (catId: string) => {
    setSlideDirection("none");
    setSelectedCategory(catId);
  };

  // Referencias para auto-scroll suave del chip activo en el selector horizontal
  const chipsContainerRef = useRef<HTMLDivElement>(null);
  const chipButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const activeBtn = chipButtonRefs.current[selectedCategory];
    const container = chipsContainerRef.current;
    if (activeBtn && container) {
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const containerWidth = container.offsetWidth;
      const targetScrollLeft = btnLeft - containerWidth / 2 + btnWidth / 2;
      container.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: "smooth" });
    }
  }, [selectedCategory]);

  // Gestos táctiles de deslizamiento horizontal (Swipe de derecha a izquierda y viceversa)
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isHorizontalSwipe.current = null;
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartPos.current.x;
    const diffY = currentY - touchStartPos.current.y;

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipe.current) {
      setIsDragging(true);
      if ((!nextCategory && diffX < 0) || (!prevCategory && diffX > 0)) {
        setDragOffset(diffX * 0.25);
      } else {
        setDragOffset(diffX * 0.7);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isHorizontalSwipe.current && isDragging) {
      const threshold = 55;
      if (dragOffset < -threshold && nextCategory) {
        handleNextCategory();
      } else if (dragOffset > threshold && prevCategory) {
        handlePrevCategory();
      }
    }
    setDragOffset(0);
    setIsDragging(false);
    touchStartPos.current = null;
    isHorizontalSwipe.current = null;
  };

  // Conteos para los filtros de estado
  const statusCounts = useMemo(() => {
    let available = 0;
    let outOfStock = 0;
    let promos = 0;

    dishes.forEach((d) => {
      if (d.isAvailable) available++;
      else outOfStock++;

      const isPromoOrBadged =
        (d.discountPrice !== null && d.discountPrice !== undefined && d.discountPrice > 0) ||
        (Boolean(d.badge) && d.badge !== "NONE");

      if (isPromoOrBadged) promos++;
    });

    return {
      all: dishes.length,
      available,
      outOfStock,
      promos,
    };
  }, [dishes]);

  // Filtrado integral por texto, categoría y estado (Disponibles, Agotados, Promos)
  const filteredDishes = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    // Mapa rápido de nombres de categoría por ID
    const categoryNameMap = new Map<string, string>();
    categories.forEach((c: any) => {
      if (c?.id && c?.name) categoryNameMap.set(c.id, c.name.toLowerCase());
    });

    return dishes.filter((dish) => {
      // 1. Filtro por texto: Estrictamente solo nombres de platos o nombres de categorías (sin descripciones)
      const catName = categoryNameMap.get(dish.categoryId) || "";
      const matchesSearch =
        !searchLower ||
        dish.name.toLowerCase().includes(searchLower) ||
        catName.includes(searchLower);

      // 2. Filtro por Categoría
      const matchesCategory =
        selectedCategory === "ALL" || dish.categoryId === selectedCategory;

      // 3. Filtro por Estado (Disponibles, Agotados, Promos)
      let matchesStatus = true;
      if (statusFilter === "AVAILABLE") {
        matchesStatus = dish.isAvailable;
      } else if (statusFilter === "OUT_OF_STOCK") {
        matchesStatus = !dish.isAvailable;
      } else if (statusFilter === "PROMOS") {
        // En el filtro de promo aparecen los platos en promoción y los que tienen distintivo
        matchesStatus =
          (dish.discountPrice !== null &&
            dish.discountPrice !== undefined &&
            dish.discountPrice > 0) ||
          (Boolean(dish.badge) && dish.badge !== "NONE");
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [dishes, search, selectedCategory, statusFilter, categories]);

  // Renderizar distintivos (Badges) de cada plato
  const renderDishBadges = (dish: DishItem) => {
    const badges = [];

    if (dish.badge && dish.badge !== "NONE") {
      switch (dish.badge) {
        case "POPULAR":
          badges.push(
            <span
              key="badge-pop"
              className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 shadow-sm"
            >
              <Flame className="w-3 h-3 fill-orange-400" />
              Más Vendido
            </span>
          );
          break;
        case "CHEFS_SPECIAL":
          badges.push(
            <span
              key="badge-chef"
              className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 shadow-sm"
            >
              <Star className="w-3 h-3 fill-amber-300" />
              Recomendado
            </span>
          );
          break;
        case "NEW":
          badges.push(
            <span
              key="badge-new"
              className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 shadow-sm"
            >
              <Sparkles className="w-3 h-3" />
              Nuevo
            </span>
          );
          break;
        case "PROMO":
          badges.push(
            <span
              key="badge-promo"
              className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 shadow-sm"
            >
              <Tag className="w-3 h-3" />
              Oferta Especial
            </span>
          );
          break;
      }
    }

    // Si tiene descuento configurado pero su badge no era PROMO
    if (
      dish.discountPrice !== null &&
      dish.discountPrice !== undefined &&
      dish.discountPrice > 0 &&
      dish.badge !== "PROMO"
    ) {
      badges.push(
        <span
          key="badge-discount"
          className="inline-flex items-center gap-0.5 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 shadow-sm"
        >
          <Percent className="w-2.5 h-2.5" />
          En Descuento
        </span>
      );
    }

    return badges;
  };

  return (
    <div className="space-y-4">
      {/* 1. Barra de Búsqueda y Botón Nuevo Plato */}
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

      {/* 2. Filtros de Estado: Todos | Disponibles | Agotados | Promos */}
      <div className="flex items-center gap-1.5 p-1 bg-[#14161a] border border-gray-800/80 rounded-2xl overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
            statusFilter === "ALL"
              ? "bg-gray-800 text-white shadow-sm border border-gray-700"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Todos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-gray-300">
            {statusCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("AVAILABLE")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
            statusFilter === "AVAILABLE"
              ? "bg-emerald-600/30 text-emerald-300 shadow-sm border border-emerald-500/40"
              : "text-gray-400 hover:text-emerald-400"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Disponibles</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">
            {statusCounts.available}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("OUT_OF_STOCK")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
            statusFilter === "OUT_OF_STOCK"
              ? "bg-red-600/30 text-red-300 shadow-sm border border-red-500/40"
              : "text-gray-400 hover:text-red-400"
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-red-400" />
          <span>Agotados</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-950/60 text-red-300 border border-red-500/20">
            {statusCounts.outOfStock}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("PROMOS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
            statusFilter === "PROMOS"
              ? "bg-gradient-to-r from-orange-500/30 to-red-500/30 text-orange-300 shadow-sm border border-orange-500/50"
              : "text-gray-400 hover:text-orange-400"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
          <span>Promos & Distintivos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-950/60 text-orange-300 border border-orange-500/30 font-bold">
            {statusCounts.promos}
          </span>
        </button>
      </div>

      {/* 3. Selector de Categorías con Scroll Horizontal Suave (Chips) */}
      <div
        ref={chipsContainerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5"
      >
        {categoryOptions.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              ref={(el) => {
                chipButtonRefs.current[cat.id] = el;
              }}
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${
                isSelected
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/25 border border-orange-400"
                  : "bg-[#181b20] text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              <span>{cat.name}</span>
              {cat.id === "ALL" && (
                <span className="text-[10px] opacity-75 font-normal">({dishes.length})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Barra de Navegación Rápida de Categoría con Flechas Anterior / Siguiente */}
      <div className="flex items-center justify-between gap-2 p-2 bg-[#14161a] border border-gray-800 rounded-2xl">
        <button
          type="button"
          onClick={handlePrevCategory}
          disabled={!prevCategory}
          aria-label="Categoría anterior"
          className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
            prevCategory
              ? "bg-gray-900 hover:bg-gray-800 text-amber-400 border-gray-800"
              : "opacity-40 cursor-not-allowed bg-transparent text-gray-600 border-transparent"
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anterior:</span>
          <span className="truncate max-w-[100px]">{prevCategory ? prevCategory.name : "Inicio"}</span>
        </button>

        <div className="text-center min-w-0 px-1">
          <span className="text-xs font-black text-white block truncate">
            {categoryOptions.find((c) => c.id === selectedCategory)?.name || "Todas"}
          </span>
          <span className="text-[10px] text-gray-500 hidden sm:block">
            👈 Desliza hacia los lados para cambiar de categoría 👉
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextCategory}
          disabled={!nextCategory}
          aria-label="Categoría siguiente"
          className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
            nextCategory
              ? "bg-gray-900 hover:bg-gray-800 text-amber-400 border-gray-800"
              : "opacity-40 cursor-not-allowed bg-transparent text-gray-600 border-transparent"
          }`}
        >
          <span className="truncate max-w-[100px]">{nextCategory ? nextCategory.name : "Fin"}</span>
          <span className="hidden sm:inline">:Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5. Lista de Platos con Gestos Táctiles de Swipe Horizontal */}
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
            Intenta cambiar los filtros de búsqueda, categoría o estado.
          </p>
          {(search || selectedCategory !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("ALL");
                setStatusFilter("ALL");
              }}
              className="mt-2 text-xs font-bold text-orange-400 underline underline-offset-4"
            >
              Restablecer todos los filtros
            </button>
          )}
        </div>
      ) : (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
            transition: isDragging ? "none" : "transform 0.25s ease-out",
          }}
          className={`grid grid-cols-1 gap-3 touch-pan-y ${
            slideDirection === "next"
              ? "animate-in fade-in slide-in-from-right-8 duration-300"
              : slideDirection === "prev"
              ? "animate-in fade-in slide-in-from-left-8 duration-300"
              : ""
          }`}
        >
          {filteredDishes.map((dish) => {
            const hasDiscount =
              dish.discountPrice !== null &&
              dish.discountPrice !== undefined &&
              dish.discountPrice > 0;

            return (
              <div
                key={dish.id}
                className={`p-3.5 bg-[#181b20] border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all duration-300 ease-out hover:border-gray-700/80 hover:shadow-md ${
                  dish.isAvailable ? "border-gray-800" : "border-red-950/40 bg-[#14161a]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-800">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        !dish.isAvailable ? "grayscale opacity-60" : ""
                      }`}
                    />
                    {!dish.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-[9px] font-black text-red-300 uppercase">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate max-w-full">
                        {dish.name}
                      </h4>
                      {/* Distintivos (Badges) visibles si están asignados */}
                      {renderDishBadges(dish)}
                      {!dish.isAvailable && (
                        <span className="bg-red-900/60 text-red-300 text-[10px] font-bold px-2 py-0.2 rounded-full flex-shrink-0">
                          Agotado
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-400 truncate max-w-sm">
                      {dish.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-orange-400">
                        {formatPrice(dish.discountPrice || dish.basePrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] text-gray-500 line-through">
                          {formatPrice(dish.basePrice)}
                        </span>
                      )}
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
                      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-out focus:outline-none ${
                        dish.isAvailable ? "bg-emerald-600" : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-out ${
                          dish.isAvailable ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/dishes/${dish.id}`}
                      aria-label="Editar plato"
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white active:scale-90 transition-all duration-200 ease-out"
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
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 active:scale-90 transition-all duration-200 ease-out"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <p className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1.5 pt-2">
            <span>👈 Desliza la pantalla hacia los lados para navegar entre categorías 👉</span>
          </p>
        </div>
      )}
    </div>
  );
}
