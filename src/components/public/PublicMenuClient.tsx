"use client";

import { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicBottomBar } from "@/components/public/PublicBottomBar";
import { CategoryCard } from "@/components/public/CategoryCard";
import { CategoryChips } from "@/components/public/CategoryChips";
import { DishCard } from "@/components/public/DishCard";
import { DishDetailSheet } from "@/components/public/DishDetailSheet";
import { PromoModal } from "@/components/public/PromoModal";
import { CartSheet } from "@/components/public/CartSheet";
import { useCart } from "@/context/CartContext";
import { IconRenderer } from "@/components/common/IconRenderer";
import { formatPrice } from "@/lib/formatters";
import { CategoryWithDishes, DishItem, PromoModalData } from "@/types";
import { getRestaurantOpenStatus } from "@/lib/openingHours";
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  Table,
  Wifi,
  ArrowLeft,
  UtensilsCrossed,
  Flame,
  Info,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Copy,
  Check,
  Tag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Share2,
  Globe,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface PublicMenuClientProps {
  initialCategories?: CategoryWithDishes[];
  initialPromo?: PromoModalData | null;
  initialSettings?: any;
}

function MenuContent({
  initialCategories = [],
  initialPromo = null,
  initialSettings = null,
}: PublicMenuClientProps) {
  const searchParams = useSearchParams();
  const urlMesa = searchParams?.get("mesa") || null;
  const [mesaNumber, setMesaNumber] = useState<string | null>(urlMesa);

  // Carrito de compras
  const { isCartOpen, setIsCartOpen } = useCart();

  useEffect(() => {
    if (urlMesa) {
      try {
        sessionStorage.setItem("piopio_mesa", urlMesa);
      } catch {}
      setMesaNumber(urlMesa);
    } else {
      try {
        const savedMesa = sessionStorage.getItem("piopio_mesa");
        if (savedMesa) setMesaNumber(savedMesa);
      } catch {}
    }
  }, [urlMesa]);

  // Pestaña activa (menu | promos | info)
  const [activeTab, setActiveTab] = useState<"menu" | "promos" | "info">("menu");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null);
  const [copiedWifi, setCopiedWifi] = useState(false);

  // Referencias mutables para evitar stale closures en el listener popstate
  const selectedCategoryIdRef = useRef(selectedCategoryId);
  selectedCategoryIdRef.current = selectedCategoryId;

  const selectedDishRef = useRef(selectedDish);
  selectedDishRef.current = selectedDish;

  const isCartOpenRef = useRef(isCartOpen);
  isCartOpenRef.current = isCartOpen;

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const isSearchingRef = useRef(isSearching);
  isSearchingRef.current = isSearching;

  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  // Inicializar estado base en el historial del navegador
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.history.state || !window.history.state.pioView) {
        window.history.replaceState({ pioView: "root" }, "");
      }
    }
  }, []);

  // Interceptor global del botón Atrás del celular (Android / iOS / navegador)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      // 1. Carrito abierto: CartSheet se encarga de su animación suave de cierre
      if (isCartOpenRef.current) return;

      // 2. Detalle de plato: DishDetailSheet se encarga de su animación suave de cierre
      if (selectedDishRef.current) return;

      // 3. Si el usuario está buscando y presiona atrás, cerrar la barra de búsqueda
      if (isSearchingRef.current || searchQueryRef.current) {
        setIsSearching(false);
        setSearchQuery("");
        return;
      }

      // 4. Si está dentro de una categoría, volver a la pantalla de Categorías
      if (selectedCategoryIdRef.current) {
        setSelectedCategoryId(null);
        setSlideDirection("none");
        return;
      }

      // 5. Si está en la pestaña Promos o Info, volver a la pestaña de Menú
      if (activeTabRef.current !== "menu") {
        setActiveTab("menu");
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Carga de menú público con initialData para SSR instantáneo
  const {
    data: menuData,
    isLoading: isLoadingMenu,
    error: menuError,
    refetch,
  } = useQuery({
    queryKey: ["public-menu"],
    queryFn: async () => {
      const res = await fetch("/api/public/menu");
      if (!res.ok) throw new Error("Error al cargar el menú");
      const json = await res.json();
      return json.data?.categories as CategoryWithDishes[];
    },
    initialData: initialCategories.length > 0 ? initialCategories : undefined,
    refetchInterval: 45000,
  });

  // Carga del modal promocional con initialData
  const { data: promoData } = useQuery({
    queryKey: ["public-promo"],
    queryFn: async () => {
      const res = await fetch("/api/public/promo-modal");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data as PromoModalData | null;
    },
    initialData: initialPromo,
  });

  // Carga de ajustes públicos del restaurante (WhatsApp, Wi-Fi, etc.) con initialData
  const { data: settingsData } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const res = await fetch("/api/public/settings");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
    initialData: initialSettings,
  });

  const categories = useMemo(() => menuData || [], [menuData]);

  // Categoría seleccionada actualmente
  const currentCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  // Índice, categoría anterior y categoría siguiente para scroll/swipe horizontal
  const currentCategoryIndex = useMemo(() => {
    if (!selectedCategoryId) return -1;
    return categories.findIndex((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const prevCategory = useMemo(() => {
    if (currentCategoryIndex <= 0) return null;
    return categories[currentCategoryIndex - 1];
  }, [categories, currentCategoryIndex]);

  const nextCategory = useMemo(() => {
    if (currentCategoryIndex < 0 || currentCategoryIndex >= categories.length - 1) return null;
    return categories[currentCategoryIndex + 1];
  }, [categories, currentCategoryIndex]);

  const [slideDirection, setSlideDirection] = useState<"next" | "prev" | "none">("none");

  const handleNextCategory = () => {
    if (!nextCategory) return;
    setSlideDirection("next");
    if (typeof window !== "undefined") {
      window.history.replaceState({ pioView: "category", categoryId: nextCategory.id }, "");
    }
    setSelectedCategoryId(nextCategory.id);
  };

  const handlePrevCategory = () => {
    if (!prevCategory) return;
    setSlideDirection("prev");
    if (typeof window !== "undefined") {
      window.history.replaceState({ pioView: "category", categoryId: prevCategory.id }, "");
    }
    setSelectedCategoryId(prevCategory.id);
  };

  // Soporte para gestos táctiles de deslizamiento horizontal (Swipe de izquierda a derecha y viceversa)
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
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartPos.current.x;
    const deltaY = currentY - touchStartPos.current.y;

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          isHorizontalSwipe.current = true;
        } else {
          isHorizontalSwipe.current = false;
        }
      }
    }

    if (isHorizontalSwipe.current === true) {
      setIsDragging(true);
      const dampened = deltaX * 0.4;
      setDragOffset(Math.max(-80, Math.min(80, dampened)));
    }
  };

  const handleTouchEnd = () => {
    if (isHorizontalSwipe.current === true && Math.abs(dragOffset) > 28) {
      if (dragOffset < 0 && nextCategory) {
        handleNextCategory();
      } else if (dragOffset > 0 && prevCategory) {
        handlePrevCategory();
      }
    }
    setIsDragging(false);
    setDragOffset(0);
    touchStartPos.current = null;
    isHorizontalSwipe.current = null;
  };

  // Platos que están en oferta o con descuento para la pestaña de Promociones
  const promoDishes = useMemo(() => {
    const list: DishItem[] = [];
    categories.forEach((cat) => {
      cat.dishes.forEach((dish) => {
        if (
          dish.isAvailable &&
          (dish.badge === "PROMO" ||
            dish.badge === "POPULAR" ||
            dish.badge === "CHEFS_SPECIAL" ||
            (dish.discountPrice !== null &&
              dish.discountPrice !== undefined &&
              dish.discountPrice > 0))
        ) {
          list.push(dish);
        }
      });
    });
    return list;
  }, [categories]);

  // Platos filtrados por búsqueda global
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();

    const allDishes: DishItem[] = [];
    categories.forEach((cat) => {
      cat.dishes.forEach((d) => {
        if (
          d.name.toLowerCase().includes(query) ||
          d.description.toLowerCase().includes(query)
        ) {
          allDishes.push(d);
        }
      });
    });
    return allDishes;
  }, [categories, searchQuery]);

  // Manejar navegación desde el Modal Promocional
  const handleNavigateFromPromo = (targetDishId: string) => {
    setActiveTab("menu");
    for (const cat of categories) {
      const found = cat.dishes.find((d) => d.id === targetDishId);
      if (found) {
        setSelectedCategoryId(cat.id);
        setTimeout(() => {
          const el = document.getElementById(`dish-${targetDishId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("highlight-dish");
            setTimeout(() => el.classList.remove("highlight-dish"), 2000);
          }
        }, 300);
        break;
      }
    }
  };

  const handleSelectCategory = (catId: string) => {
    setSlideDirection("none");
    if (typeof window !== "undefined") {
      if (!selectedCategoryIdRef.current) {
        window.history.pushState({ pioView: "category", categoryId: catId }, "");
      } else {
        window.history.replaceState({ pioView: "category", categoryId: catId }, "");
      }
    }
    setSelectedCategoryId(catId);
  };

  const handleBackToCategories = () => {
    if (typeof window !== "undefined" && window.history.state?.pioView === "category") {
      window.history.back();
    } else {
      setSelectedCategoryId(null);
      setSlideDirection("none");
    }
  };

  const handleSelectDish = (dish: DishItem) => {
    if (typeof window !== "undefined") {
      window.history.pushState({ pioView: "dish", dishId: dish.id }, "");
    }
    setSelectedDish(dish);
  };

  const handleCloseDish = () => {
    if (typeof window !== "undefined" && window.history.state?.pioView === "dish") {
      window.history.back();
    } else {
      setSelectedDish(null);
    }
  };

  const handleOpenCart = () => {
    if (typeof window !== "undefined") {
      window.history.pushState({ pioView: "cart" }, "");
    }
    setIsCartOpen(true);
  };

  const handleTabChange = (newTab: "menu" | "promos" | "info") => {
    if (newTab === activeTab) return;
    if (typeof window !== "undefined") {
      if (newTab !== "menu" && activeTab === "menu") {
        window.history.pushState({ pioView: "tab", tab: newTab }, "");
      } else if (newTab === "menu" && window.history.state?.pioView === "tab") {
        window.history.back();
        return;
      }
    }
    setActiveTab(newTab);
  };

  const handleToggleSearch = () => {
    if (!isSearching) {
      if (typeof window !== "undefined") {
        window.history.pushState({ pioView: "search" }, "");
      }
      setIsSearching(true);
    } else {
      if (typeof window !== "undefined" && window.history.state?.pioView === "search") {
        window.history.back();
      } else {
        setIsSearching(false);
        setSearchQuery("");
      }
    }
  };

  const handleCopyWifi = () => {
    const pass = settingsData?.wifiPassword || "Parrilla2026*";
    navigator.clipboard.writeText(pass);
    setCopiedWifi(true);
    toast.success("¡Contraseña de Wi-Fi copiada al portapapeles!");
    setTimeout(() => setCopiedWifi(false), 2500);
  };

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-[#0f1115] text-gray-100 flex flex-col selection:bg-amber-500 selection:text-black"
    >
      {/* Header Panorámico con Carrusel, Logo Grande y Buscador */}
      <PublicHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearching={isSearching}
        onToggleSearch={handleToggleSearch}
        mesaNumber={mesaNumber}
        headerImages={settingsData?.headerImages}
        headerTagline={settingsData?.headerTagline}
        headerDescription={settingsData?.headerDescription}
        restaurantName={settingsData?.restaurantName}
        logoUrl={settingsData?.logoUrl}
        openingHours={settingsData?.openingHours}
      />

      {/* Barra de Chips (solo visible cuando está dentro de una categoría en la pestaña Menú) */}
      {!searchQuery && activeTab === "menu" && selectedCategoryId && categories.length > 0 && (
        <CategoryChips
          categories={categories}
          activeCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
        />
      )}

      {/* Contenido Principal */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 space-y-6 pb-28">
        {/* Estado de Carga */}
        {isLoadingMenu && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-gray-400">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs font-semibold tracking-wide">
              Cargando la carta de Pío Pío...
            </p>
          </div>
        )}

        {/* Estado de Error */}
        {menuError && (
          <div className="p-6 bg-red-950/30 border border-red-500/30 rounded-2xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h3 className="text-sm font-bold text-red-200">
              No pudimos cargar la carta digital
            </h3>
            <p className="text-xs text-gray-400">
              Verifique su conexión o intente recargar el menú.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* VISTA 0: BÚSQUEDA ACTIVA (Si el usuario escribe en la lupa) */}
        {/* ======================================================== */}
        {!isLoadingMenu && searchQuery.trim().length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <h2 className="text-sm font-bold text-white">
                Resultados para &quot;{searchQuery}&quot;
              </h2>
              <span className="text-xs text-amber-400 font-bold">
                {searchResults.length} {searchResults.length === 1 ? "plato" : "platos"}
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-sm font-semibold text-gray-300">
                  No se encontraron platos que coincidan con &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-bold text-amber-400 underline underline-offset-4"
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {searchResults.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onSelect={handleSelectDish}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 1: VER MENÚ COMPLETO (Categorías y Platos)      */}
        {/* ======================================================== */}
        {!isLoadingMenu && !searchQuery && activeTab === "menu" && (
          <>
            {/* Si NO hay categoría seleccionada: Muestra las TARJETAS DE CATEGORÍAS apiladas */}
            {selectedCategoryId === null ? (
              <div key="all-categories" className="space-y-4 animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
                  <div>
                    <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                      <span>Categorías de la Carta</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Toca una categoría para ver sus platos y porciones disponibles
                    </p>
                  </div>
                  <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    {categories.length} Secciones
                  </span>
                </div>

                {/* Tarjetas Verticales de Categorías (Una debajo de la otra) */}
                <div className="flex flex-col gap-3.5">
                  {categories.map((cat) => (
                    <CategoryCard
                      key={cat.id}
                      category={cat}
                      onSelect={handleSelectCategory}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Si HAY categoría seleccionada: Muestra ÚNICA Y EXCLUSIVAMENTE los platos de esa categoría con soporte de Swipe horizontal */
              currentCategory && (
                <div
                  key={`cat-${currentCategory.id}`}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
                    transition: isDragging ? "none" : "transform 0.25s ease-out",
                  }}
                  className={`space-y-4 touch-pan-y ${
                    slideDirection === "next"
                      ? "animate-in fade-in slide-in-from-right-8 duration-300"
                      : slideDirection === "prev"
                      ? "animate-in fade-in slide-in-from-left-8 duration-300"
                      : "animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]"
                  }`}
                >
                  {/* Barra de Navegación Horizontal Superior: Volver + Flechas de Categoría */}
                  <div className="flex items-center justify-between gap-2 p-2 bg-[#181b20] border border-gray-800 rounded-2xl shadow-sm">
                    <button
                      onClick={handleBackToCategories}
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-gray-900 hover:bg-gray-800 text-amber-400 text-xs font-bold rounded-xl border border-gray-800 active:scale-95 transition-all"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Categorías</span>
                    </button>

                    {/* Selector Rápido Anterior / Siguiente */}
                    <div className="flex items-center gap-1">
                      <button
                        disabled={!prevCategory}
                        onClick={handlePrevCategory}
                        aria-label="Categoría anterior"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-90 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4 text-amber-400" />
                      </button>

                      <span className="text-[10px] font-black text-gray-400 px-2 min-w-[50px] text-center">
                        {currentCategoryIndex + 1} / {categories.length}
                      </span>

                      <button
                        disabled={!nextCategory}
                        onClick={handleNextCategory}
                        aria-label="Categoría siguiente"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-90 transition-all"
                      >
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                      </button>
                    </div>
                  </div>

                  {/* Cabecera de la Categoría Activa */}
                  <div className="p-4 bg-gradient-to-r from-amber-500/10 via-[#181b20] to-orange-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center flex-shrink-0">
                        <IconRenderer name={currentCategory.iconName} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-black text-white leading-tight truncate">
                          {currentCategory.name}
                        </h2>
                        {currentCategory.description && (
                          <p className="text-xs text-gray-400 leading-snug mt-0.5 truncate">
                            {currentCategory.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-black text-amber-400 bg-black/40 px-2.5 py-1 rounded-full border border-amber-500/20 flex-shrink-0">
                      {currentCategory.dishes.length}{" "}
                      {currentCategory.dishes.length === 1 ? "plato" : "platos"}
                    </span>
                  </div>

                  {/* Lista Única de los Platos de esta Categoría */}
                  <div className="grid grid-cols-1 gap-3">
                    {currentCategory.dishes.map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        onSelect={handleSelectDish}
                      />
                    ))}
                  </div>

                  {/* Navegación al Final de los Platos: Pasar a la Siguiente o Anterior Categoría */}
                  <div className="pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {prevCategory ? (
                        <button
                          onClick={handlePrevCategory}
                          className="flex items-center gap-2 p-3 bg-[#181b20] hover:bg-gray-800 border border-gray-800 rounded-2xl text-left active:scale-95 transition-all"
                        >
                          <ChevronLeft className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[9px] text-gray-500 uppercase font-black block">Anterior</span>
                            <span className="text-xs font-bold text-gray-200 truncate block">{prevCategory.name}</span>
                          </div>
                        </button>
                      ) : <div />}

                      {nextCategory && (
                        <button
                          onClick={handleNextCategory}
                          className="flex items-center justify-end gap-2 p-3 bg-[#181b20] hover:bg-gray-800 border border-amber-500/30 rounded-2xl text-right active:scale-95 transition-all shadow-md shadow-amber-500/10"
                        >
                          <div className="min-w-0">
                            <span className="text-[9px] text-amber-400 uppercase font-black block">Siguiente</span>
                            <span className="text-xs font-bold text-white truncate block">{nextCategory.name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1.5 pt-1">
                      <span>👈 Desliza la pantalla hacia los lados para cambiar de categoría 👉</span>
                    </p>

                    {/* Botón Inferior para regresar a ver más categorías */}
                    <div className="pt-2 text-center">
                      <button
                        onClick={handleBackToCategories}
                        className="inline-flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-gray-900 to-[#181b20] hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold rounded-2xl border border-gray-800 active:scale-95 transition-all shadow-lg"
                      >
                        <ArrowLeft className="w-4 h-4 text-amber-400" />
                        <span>Ver todas las categorías de Pío Pío</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 2: PROMOCIONES Y ESPECIALES DEL DÍA              */}
        {/* ======================================================== */}
        {!isLoadingMenu && !searchQuery && activeTab === "promos" && (
          <div key="tab-promos" className="space-y-5 animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                  <span>Promociones & Especiales Pío Pío</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Aprovecha los descuentos del día y platos recomendados de la casa
                </p>
              </div>
            </div>

            {/* Gran Tarjeta del Modal Promocional Destacado */}
            {promoData && promoData.isActive && (
              <div className="relative rounded-3xl overflow-hidden bg-[#181b20] border-2 border-orange-500/40 shadow-2xl">
                <div className="relative h-48 sm:h-56 bg-gray-900">
                  <img
                    src={promoData.imageUrl}
                    alt={promoData.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181b20] via-transparent to-black/30" />
                  {promoData.badgeText && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {promoData.badgeText}
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" />
                    Plato Estrella del Día
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                    {promoData.title}
                  </h3>
                  {promoData.subtitle && (
                    <p className="text-xs font-semibold text-orange-200">
                      {promoData.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {promoData.description}
                  </p>

                  {(promoData.promoPrice || promoData.regularPrice) && (
                    <div className="flex items-baseline gap-3 pt-1">
                      {promoData.promoPrice && (
                        <span className="text-2xl font-black text-orange-400">
                          {formatPrice(promoData.promoPrice)}
                        </span>
                      )}
                      {promoData.regularPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(promoData.regularPrice)}
                        </span>
                      )}
                    </div>
                  )}

                  {promoData.targetDishId && (
                    <button
                      onClick={() => handleNavigateFromPromo(promoData.targetDishId!)}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-xs transition-all"
                    >
                      <span>Ver Plato en la Carta</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lista de Platos con Oferta o Distintivo */}
            {promoDishes.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Más platos recomendados y en oferta
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {promoDishes.map((dish) => (
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      onSelect={handleSelectDish}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 3: INFORMACIÓN DEL NEGOCIO, HORARIOS Y WI-FI     */}
        {/* ======================================================== */}
        {!isLoadingMenu && !searchQuery && activeTab === "info" && (
          <div key="tab-info" className="space-y-5 animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]">
            {/* 1. Redes Sociales y Página Web Oficial */}
            <div className="relative rounded-3xl overflow-hidden bg-[#181b20] border border-gray-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-800/80">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">
                    Nuestras Redes Sociales & Web
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Sigue a Pío Pío para conocer las ofertas y promociones del día
                  </span>
                </div>
              </div>

              {/* Botones de Redes Sociales (Facebook, Instagram, Página Web) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Facebook */}
                {settingsData?.facebookUrl ? (
                  <a
                    href={settingsData.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#14161a] hover:bg-[#1877F2]/10 border border-gray-800 hover:border-[#1877F2]/40 transition-all duration-300 group active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1877F2]/10 group-hover:bg-[#1877F2] text-[#1877F2] group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-gray-400 block font-semibold">Comunidad</span>
                      <span className="text-xs font-black text-white group-hover:text-blue-400 block truncate">Facebook</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#14161a]/60 border border-gray-800/60 opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-gray-500 block">Comunidad</span>
                      <span className="text-xs font-bold text-gray-400 block">Facebook</span>
                    </div>
                  </div>
                )}

                {/* Instagram */}
                {settingsData?.instagramUrl ? (
                  <a
                    href={settingsData.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#14161a] hover:bg-pink-500/10 border border-gray-800 hover:border-pink-500/40 transition-all duration-300 group active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433]/20 via-[#dc2743]/20 to-[#bc1888]/20 group-hover:from-[#f09433] group-hover:via-[#dc2743] group-hover:to-[#bc1888] text-pink-400 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-gray-400 block font-semibold">Fotos & Reels</span>
                      <span className="text-xs font-black text-white group-hover:text-pink-400 block truncate">Instagram</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#14161a]/60 border border-gray-800/60 opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-gray-500 block">Fotos & Reels</span>
                      <span className="text-xs font-bold text-gray-400 block">Instagram</span>
                    </div>
                  </div>
                )}

                {/* Página Web */}
                {settingsData?.websiteUrl ? (
                  <a
                    href={settingsData.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#14161a] hover:bg-amber-500/10 border border-gray-800 hover:border-amber-500/40 transition-all duration-300 group active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-black flex items-center justify-center transition-colors flex-shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-gray-400 block font-semibold">Oficial</span>
                      <span className="text-xs font-black text-white group-hover:text-amber-400 block truncate">Sitio Web</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#14161a]/60 border border-gray-800/60 opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-gray-500 block">Oficial</span>
                      <span className="text-xs font-bold text-gray-400 block">Sitio Web</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Horarios de Atención */}
            <div className="p-4 bg-[#181b20] border border-gray-800 rounded-2xl flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Horario de Atención
                  </h4>
                  {(() => {
                    const status = getRestaurantOpenStatus(settingsData?.openingHours);
                    return (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-gray-300 font-semibold">
                  {settingsData?.openingHours || "Lunes a Domingo: 10:00 AM a 9:00 PM"}
                </p>
                <span className="text-[11px] text-gray-500 block">
                  Atención en mesa y pedidos para llevar todos los días.
                </span>
              </div>
            </div>

            {/* 3. Dirección Física */}
            <div className="p-4 bg-[#181b20] border border-gray-800 rounded-2xl flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Dirección y Ubicación
                </h4>
                <p className="text-xs text-gray-300 font-semibold">
                  {settingsData?.address || "Carrera Principal con Calle 10, Centro"}
                </p>
                <span className="text-[11px] text-gray-500 block">
                  Punto de atención presencial para comensales.
                </span>
              </div>
            </div>

            {/* 4. Contactos y Pedidos */}
            <div className="p-4 bg-[#181b20] border border-gray-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Líneas de Contacto y Domicilios
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://wa.me/${settingsData?.whatsappNumber || "573001234567"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Pedir por WhatsApp</span>
                </a>

                <a
                  href={`tel:${settingsData?.whatsappNumber || "573001234567"}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl text-xs active:scale-95 transition-all border border-gray-700"
                >
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>Llamar al Restaurante</span>
                </a>
              </div>
            </div>

            {/* 5. Zona Wi-Fi Gratuita para Clientes en Mesa */}
            <div className="p-5 bg-gradient-to-r from-blue-950/20 via-[#181b20] to-amber-950/20 border border-gray-800 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Wi-Fi Gratis para Clientes
                    </h4>
                    <span className="text-[10px] text-gray-400">
                      Conéctate mientras disfrutas de tu plato
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCopyWifi}
                  className="flex items-center gap-1.5 py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  {copiedWifi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWifi ? "Copiada" : "Copiar Clave"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800/80 text-xs">
                <div className="bg-[#14161a] p-2.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">
                    Red (SSID)
                  </span>
                  <span className="font-extrabold text-white">
                    {settingsData?.wifiSsid || "PioPio-Clientes"}
                  </span>
                </div>

                <div className="bg-[#14161a] p-2.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">
                    Contraseña
                  </span>
                  <code className="font-extrabold text-amber-400 font-mono">
                    {settingsData?.wifiPassword || "Parrilla2026*"}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer del Comensal */}
      <footer className="mt-auto border-t border-gray-800/80 bg-[#14161a] py-6 px-4 text-center text-xs text-gray-500 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <img src="/logo-pio-pio.png" alt="Pío Pío" className="w-5 h-5 rounded-full" />
          <span className="font-extrabold text-gray-300">
            Asadero y Restaurante Pío Pío
          </span>
        </div>
        {settingsData?.address && (
          <p className="text-[11px] text-gray-400">
            📍 {settingsData.address}
          </p>
        )}
        {settingsData?.openingHours && (
          <p className="text-[10px] text-gray-500">
            🕒 {settingsData.openingHours}
          </p>
        )}
        <p className="text-[10px] text-gray-600">
          Carta digital móvil • Precios en pesos colombianos (COP) • Servicio a la mesa
        </p>
      </footer>

      {/* Modal Promocional Flotante al inicio */}
      <PromoModal
        promo={promoData || null}
        onNavigateToDish={handleNavigateFromPromo}
      />

      {/* Sheet de Detalle de Plato al tocar */}
      <DishDetailSheet
        dish={selectedDish}
        onClose={handleCloseDish}
      />

      {/* Modal / Sheet del Pedido con WhatsApp dinámico */}
      <CartSheet
        initialMesa={mesaNumber}
        restaurantWhatsapp={settingsData?.whatsappNumber || "573001234567"}
      />

      {/* Barra de Navegación Inferior Móvil: MENÚ - PROMOS - PEDIDO - INFO */}
      <PublicBottomBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onResetCategory={handleBackToCategories}
        onOpenCart={handleOpenCart}
      />
    </div>
  );
}

export default function PublicMenuClient(props: PublicMenuClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <MenuContent {...props} />
    </Suspense>
  );
}
