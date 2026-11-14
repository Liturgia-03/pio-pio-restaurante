"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { CategoryCard } from "@/components/public/CategoryCard";
import { CategoryChips } from "@/components/public/CategoryChips";
import { DishCard } from "@/components/public/DishCard";
import { DishDetailSheet } from "@/components/public/DishDetailSheet";
import { PromoModal } from "@/components/public/PromoModal";
import { CartFloatingButton } from "@/components/public/CartFloatingButton";
import { CartSheet } from "@/components/public/CartSheet";
import { IconRenderer } from "@/components/common/IconRenderer";
import { formatPrice } from "@/lib/formatters";
import { CategoryWithDishes, DishItem, PromoModalData } from "@/types";
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

  // Pestaña activa de las 3 tarjetas superiores
  const [activeTab, setActiveTab] = useState<"menu" | "promos" | "info">("menu");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null);
  const [copiedWifi, setCopiedWifi] = useState(false);

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
    setSelectedCategoryId(catId);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      {/* Header Sticky con Buscador y Logo */}
      <PublicHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearching={isSearching}
        onToggleSearch={() => {
          setIsSearching(!isSearching);
          if (isSearching) setSearchQuery("");
        }}
      />

      {/* TRES TARJETAS SUPERIORES: VER MENÚ COMPLETO | PROMOCIONES | INFORMACIÓN */}
      <section className="px-3 pt-3 pb-2.5 bg-[#14161a]/95 border-b border-gray-800/80 sticky top-[60px] z-30 backdrop-blur-md">
        <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto">
          {/* Tarjeta 1: Ver Menú Completo */}
          <button
            onClick={() => {
              setActiveTab("menu");
              setSelectedCategoryId(null);
            }}
            className={`relative p-2.5 rounded-2xl border text-center transition-all duration-300 ease-out flex flex-col items-center justify-center min-h-[72px] active:scale-[0.96] ${
              activeTab === "menu"
                ? "bg-gradient-to-b from-amber-500/25 via-amber-500/10 to-transparent border-amber-500 text-white shadow-lg shadow-amber-500/20"
                : "bg-[#181b20] border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center mb-1 transition-all duration-300 ${
                activeTab === "menu"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-black leading-tight block">
              Ver Menú Completo
            </span>
            <span className="text-[9px] text-amber-400 font-semibold mt-0.5 block">
              {categories.length} Categorías
            </span>
          </button>

          {/* Tarjeta 2: Promociones */}
          <button
            onClick={() => setActiveTab("promos")}
            className={`relative p-2.5 rounded-2xl border text-center transition-all duration-300 ease-out flex flex-col items-center justify-center min-h-[72px] active:scale-[0.96] ${
              activeTab === "promos"
                ? "bg-gradient-to-b from-orange-500/25 via-orange-500/10 to-transparent border-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "bg-[#181b20] border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center mb-1 transition-all duration-300 ${
                activeTab === "promos"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-black leading-tight block">
              Promociones
            </span>
            <span className="text-[9px] text-orange-400 font-semibold mt-0.5 block">
              Especial del Día
            </span>
          </button>

          {/* Tarjeta 3: Información */}
          <button
            onClick={() => setActiveTab("info")}
            className={`relative p-2.5 rounded-2xl border text-center transition-all duration-300 ease-out flex flex-col items-center justify-center min-h-[72px] active:scale-[0.96] ${
              activeTab === "info"
                ? "bg-gradient-to-b from-red-500/25 via-red-500/10 to-transparent border-red-500 text-white shadow-lg shadow-red-500/20"
                : "bg-[#181b20] border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center mb-1 transition-all duration-300 ${
                activeTab === "info"
                  ? "bg-red-500 text-white shadow-md shadow-red-500/30 scale-105"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-black leading-tight block">
              Información
            </span>
            <span className="text-[9px] text-red-400 font-semibold mt-0.5 block">
              Horario & Wi-Fi
            </span>
          </button>
        </div>

        {/* Si el comensal está en mesa se muestra la insignia discreta */}
        {mesaNumber && (
          <div className="mt-2 text-center">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black px-3 py-0.5 rounded-full">
              <Table className="w-3 h-3 text-amber-400" />
              <span>Atención en Mesa #{mesaNumber}</span>
            </span>
          </div>
        )}
      </section>

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
                    onSelect={(d) => setSelectedDish(d)}
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
              /* Si HAY categoría seleccionada: Muestra ÚNICA Y EXCLUSIVAMENTE los platos de esa categoría */
              currentCategory && (
                <div key={`cat-${currentCategory.id}`} className="space-y-4 animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]">
                  {/* Botón Volver a Categorías */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedCategoryId(null)}
                      className="inline-flex items-center gap-2 py-2 px-3.5 bg-gray-900 hover:bg-gray-800 text-amber-400 text-xs font-black rounded-xl border border-gray-800 active:scale-95 transition-all duration-300 ease-out shadow-md"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver a Categorías</span>
                    </button>

                    <span className="text-xs text-gray-400 font-bold">
                      {currentCategory.dishes.length}{" "}
                      {currentCategory.dishes.length === 1 ? "plato" : "platos"}
                    </span>
                  </div>

                  {/* Cabecera de la Categoría Activa */}
                  <div className="p-4 bg-gradient-to-r from-amber-500/10 via-[#181b20] to-orange-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center flex-shrink-0">
                      <IconRenderer name={currentCategory.iconName} className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white leading-tight">
                        {currentCategory.name}
                      </h2>
                      {currentCategory.description && (
                        <p className="text-xs text-gray-400 leading-snug mt-0.5">
                          {currentCategory.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Lista Única de los Platos de esta Categoría */}
                  <div className="grid grid-cols-1 gap-3">
                    {currentCategory.dishes.map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        onSelect={(d) => setSelectedDish(d)}
                      />
                    ))}
                  </div>

                  {/* Botón Inferior para regresar a ver más categorías */}
                  <div className="pt-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedCategoryId(null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-gray-900 to-[#181b20] hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold rounded-2xl border border-gray-800 active:scale-95 transition-all shadow-lg"
                    >
                      <ArrowLeft className="w-4 h-4 text-amber-400" />
                      <span>Ver todas las categorías de Pío Pío</span>
                    </button>
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
                      onSelect={(d) => setSelectedDish(d)}
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
            {/* 1. Presentación del Asadero y Restaurante */}
            <div className="relative rounded-3xl overflow-hidden bg-[#181b20] border border-gray-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 bg-amber-950 flex-shrink-0 shadow-lg shadow-amber-500/20">
                  <img
                    src="/logo-pio-pio.png"
                    alt="Pío Pío Asadero y Restaurante"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white leading-tight">
                    Pío Pío
                  </h3>
                  <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block">
                    Asadero & Restaurante
                  </span>
                  <span className="inline-block mt-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    🟢 Abierto hoy
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed border-t border-gray-800/80 pt-3">
                Tradición, sabor y calidad en cada preparación. Especialistas en el auténtico
                pollo asado a la leña, crujiente apanado broaster, asados a la brasa y las más
                deliciosas bandejas típicas colombianas. ¡El sabor tradicional que reúne a la
                familia!
              </p>
            </div>

            {/* 2. Horarios de Atención */}
            <div className="p-4 bg-[#181b20] border border-gray-800 rounded-2xl flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Horario de Atención
                </h4>
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
        onClose={() => setSelectedDish(null)}
      />

      {/* Botón Flotante de Carrito / Pedido */}
      <CartFloatingButton />

      {/* Modal / Sheet del Pedido con WhatsApp dinámico */}
      <CartSheet
        initialMesa={mesaNumber}
        restaurantWhatsapp={settingsData?.whatsappNumber || "573001234567"}
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
