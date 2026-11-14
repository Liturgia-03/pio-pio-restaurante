"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Save,
  Loader2,
  Flame,
  Tag,
  ArrowRight,
  Layers,
  Smartphone,
  LayoutTemplate,
  Trash2,
  Plus,
  Upload,
  Clock,
  RotateCcw,
  Search,
  ImageIcon,
} from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { DishItem } from "@/types";
import { toast } from "sonner";

const DEFAULT_HEADER_IMAGES = [
  "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
];

export default function AdminPromoModalPage() {
  const queryClient = useQueryClient();

  // Pestaña activa del formulario de edición: "welcome" | "promo" | "header"
  const [activeTab, setActiveTab] = useState<"welcome" | "promo" | "header">("welcome");

  // Pestaña activa del simulador móvil en vivo: 1 (Bienvenida) | 2 (Promoción) | 3 (Portada)
  const [previewStep, setPreviewStep] = useState<1 | 2 | 3>(1);

  // --- Estado de la Tarjeta de Bienvenida (Paso 1) ---
  const [welcomeBadge, setWelcomeBadge] = useState("El Sabor Que Nos Une");
  const [welcomeTitle, setWelcomeTitle] = useState("¡Bienvenidos a Pío Pío!");
  const [welcomeSubtitle, setWelcomeSubtitle] = useState("Asadero & Restaurante Tradicional");
  const [welcomeDescription, setWelcomeDescription] = useState(
    "Disfruta de nuestros auténticos pollos asados al carbón y apanados crocantes, jugosos cortes a la brasa y las recetas típicas más queridas de nuestra tierra."
  );
  const [welcomeButtonText, setWelcomeButtonText] = useState("Ver Oferta Especial de Hoy");
  const [welcomeTag1, setWelcomeTag1] = useState("Pollos");
  const [welcomeTag1Sub, setWelcomeTag1Sub] = useState("Asado & Broaster");
  const [welcomeTag2, setWelcomeTag2] = useState("Parrilla");
  const [welcomeTag2Sub, setWelcomeTag2Sub] = useState("A la Brasa");
  const [welcomeTag3, setWelcomeTag3] = useState("Típicos");
  const [welcomeTag3Sub, setWelcomeTag3Sub] = useState("Bandejas & Sopas");

  // --- Estado del Plato Promocional (Paso 2) ---
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [ctaText, setCtaText] = useState("Ver en el Menú");
  const [targetDishId, setTargetDishId] = useState("");
  const [isActive, setIsActive] = useState(true);

  // --- Estado de la Portada del Menú (Paso 3) ---
  const [headerImages, setHeaderImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const [restaurantName, setRestaurantName] = useState("Pío Pío");
  const [headerTagline, setHeaderTagline] = useState("Asadero & Restaurante Tradicional");
  const [headerDescription, setHeaderDescription] = useState("El auténtico sabor a la brasa, broaster y platos típicos");
  const [logoUrl, setLogoUrl] = useState("/logo-pio-pio.png");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [openingHours, setOpeningHours] = useState("Lunes a Domingo: 10:00 AM a 9:00 PM");

  // Carga de configuración del modal promocional
  const { data: promo, isLoading: isLoadingPromo } = useQuery({
    queryKey: ["admin-promo"],
    queryFn: async () => {
      const res = await fetch("/api/admin/promo-modal");
      const json = await res.json();
      return json.data;
    },
  });

  // Carga de platos para enlazar en la promoción
  const { data: dishes = [] } = useQuery<DishItem[]>({
    queryKey: ["admin-dishes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dishes");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Carga de ajustes generales del asadero y portada
  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      return json.data;
    },
  });

  // Sincronizar datos del modal promocional
  useEffect(() => {
    if (promo) {
      setWelcomeBadge(promo.welcomeBadge || "El Sabor Que Nos Une");
      setWelcomeTitle(promo.welcomeTitle || "¡Bienvenidos a Pío Pío!");
      setWelcomeSubtitle(promo.welcomeSubtitle || "Asadero & Restaurante Tradicional");
      setWelcomeDescription(
        promo.welcomeDescription ||
          "Disfruta de nuestros auténticos pollos asados al carbón y apanados crocantes, jugosos cortes a la brasa y las recetas típicas más queridas de nuestra tierra."
      );
      setWelcomeButtonText(promo.welcomeButtonText || "Ver Oferta Especial de Hoy");
      setWelcomeTag1(promo.welcomeTag1 || "Pollos");
      setWelcomeTag1Sub(promo.welcomeTag1Sub || "Asado & Broaster");
      setWelcomeTag2(promo.welcomeTag2 || "Parrilla");
      setWelcomeTag2Sub(promo.welcomeTag2Sub || "A la Brasa");
      setWelcomeTag3(promo.welcomeTag3 || "Típicos");
      setWelcomeTag3Sub(promo.welcomeTag3Sub || "Bandejas & Sopas");

      setTitle(promo.title || "");
      setSubtitle(promo.subtitle || "");
      setDescription(promo.description || "");
      setImageUrl(
        promo.imageUrl ||
          "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop"
      );
      setBadgeText(promo.badgeText || "");
      setRegularPrice(promo.regularPrice ? promo.regularPrice.toString() : "");
      setPromoPrice(promo.promoPrice ? promo.promoPrice.toString() : "");
      setCtaText(promo.ctaText || "Ver en el Menú");
      setTargetDishId(promo.targetDishId || "");
      setIsActive(promo.isActive !== undefined ? promo.isActive : true);
    }
  }, [promo]);

  // Sincronizar datos de portada y ajustes del asadero
  useEffect(() => {
    if (settingsData) {
      if (settingsData.restaurantName) setRestaurantName(settingsData.restaurantName);
      if (settingsData.headerImages && Array.isArray(settingsData.headerImages)) {
        setHeaderImages(settingsData.headerImages);
      }
      if (settingsData.headerTagline) setHeaderTagline(settingsData.headerTagline);
      if (settingsData.headerDescription) setHeaderDescription(settingsData.headerDescription);
      if (settingsData.logoUrl) setLogoUrl(settingsData.logoUrl);
      if (settingsData.openingHours) setOpeningHours(settingsData.openingHours);
    }
  }, [settingsData]);

  // Handlers para Fotos de Portada
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) {
      toast.error("Ingresa una URL de imagen válida");
      return;
    }
    setHeaderImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
    toast.success("Foto agregada a la portada");
  };

  const handleRemoveImage = (index: number) => {
    setHeaderImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Foto eliminada de la portada");
  };

  const handleUploadHeaderImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    setIsUploadingHeader(true);
    try {
      toast.info("Subiendo foto de portada...");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setHeaderImages((prev) => [...prev, json.data.url]);
        toast.success("Foto agregada al carrusel de portada");
      } else {
        toast.error(json.message || "Error al subir imagen");
      }
    } catch {
      toast.error("Error al conectar con el servidor de carga");
    } finally {
      setIsUploadingHeader(false);
    }
  };

  const handleUploadLogo = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    setIsUploadingLogo(true);
    try {
      toast.info("Subiendo nuevo logotipo...");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setLogoUrl(json.data.url);
        toast.success("Logotipo actualizado con éxito");
      } else {
        toast.error(json.message || "Error al subir logotipo");
      }
    } catch {
      toast.error("Error al conectar con el servidor de carga");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Mutación unificada para guardar Modal Promocional y Portada/Ajustes
  const updateMutation = useMutation({
    mutationFn: async ({ promoPayload, settingsPayload }: { promoPayload: any; settingsPayload: any }) => {
      const [promoRes, settingsRes] = await Promise.all([
        fetch("/api/admin/promo-modal", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(promoPayload),
        }),
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsPayload),
        }),
      ]);

      const promoJson = await promoRes.json();
      const settingsJson = await settingsRes.json();

      if (!promoRes.ok || !promoJson.success) throw new Error(promoJson.message || "Error al guardar modal");
      if (!settingsRes.ok || !settingsJson.success) throw new Error(settingsJson.message || "Error al guardar ajustes");

      return { promoJson, settingsJson };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo"] });
      queryClient.invalidateQueries({ queryKey: ["public-promo"] });
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });
      toast.success("Ajustes del menú, bienvenida y portada guardados con éxito");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al actualizar la configuración");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const promoPayload = {
      // Bienvenida
      welcomeBadge,
      welcomeTitle,
      welcomeSubtitle,
      welcomeDescription,
      welcomeButtonText,
      welcomeTag1,
      welcomeTag1Sub,
      welcomeTag2,
      welcomeTag2Sub,
      welcomeTag3,
      welcomeTag3Sub,

      // Promoción
      title,
      subtitle: subtitle || null,
      description,
      imageUrl,
      badgeText: badgeText || null,
      regularPrice: regularPrice ? parseFloat(regularPrice) : null,
      promoPrice: promoPrice ? parseFloat(promoPrice) : null,
      ctaText,
      targetDishId: targetDishId || null,
      isActive,
      autoShowDelayMs: 0,
      showOncePerSession: true,
    };

    const settingsPayload = {
      restaurantName: restaurantName.trim() || "Pío Pío",
      headerTagline: headerTagline.trim(),
      headerDescription: headerDescription.trim(),
      headerImages,
      logoUrl: logoUrl || "/logo-pio-pio.png",
      openingHours: openingHours.trim(),
    };

    updateMutation.mutate({ promoPayload, settingsPayload });
  };

  const isLoading = isLoadingPromo || isLoadingSettings;

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs">Cargando ajustes del menú...</span>
      </div>
    );
  }

  const effectiveHeaderImages = headerImages.length > 0 ? headerImages : DEFAULT_HEADER_IMAGES;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Ajustes del Menú: Bienvenida, Promoción y Portada</span>
        </h2>
        <p className="text-xs text-gray-400">
          Personaliza la experiencia inicial de 3 secciones que verán los comensales al ingresar a la carta digital.
        </p>
      </div>

      {/* Selector de Pestañas de Edición */}
      <div className="flex items-center gap-1.5 p-1 bg-[#181b20] border border-gray-800 rounded-2xl max-w-xl overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab("welcome");
            setPreviewStep(1);
          }}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 ease-out active:scale-95 ${
            activeTab === "welcome"
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Tarjeta Bienvenida</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("promo");
            setPreviewStep(2);
          }}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 ease-out active:scale-95 ${
            activeTab === "promo"
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>2. Plato Promocional</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("header");
            setPreviewStep(3);
          }}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 ease-out active:scale-95 ${
            activeTab === "header"
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>3. Portada Menú</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario (7 columnas en desktop) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#181b20] border border-gray-800 rounded-3xl p-5 space-y-4"
        >
          {/* Switch Global Activar / Desactivar Modal (Aplica a Paso 1 y Paso 2) */}
          {(activeTab === "welcome" || activeTab === "promo") && (
            <div className="flex items-center justify-between p-3.5 bg-[#14161a] border border-gray-800 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-white block">
                  Mostrar Modal al Abrir la Carta
                </span>
                <span className="text-[11px] text-gray-400">
                  {isActive
                    ? "Activo: Se desplegará la bienvenida y la promo automáticamente"
                    : "Desactivado: El comensal entrará directo a la carta digital"}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-out ${
                  isActive ? "bg-emerald-600" : "bg-gray-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${
                    isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 1: EDICIÓN DE TARJETA DE BIENVENIDA               */}
          {/* ======================================================== */}
          {activeTab === "welcome" && (
            <div className="space-y-4 animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                  Configuración de la Tarjeta de Bienvenida (Paso 1)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    Distintivo Superior (Badge)
                  </label>
                  <input
                    type="text"
                    value={welcomeBadge}
                    onChange={(e) => setWelcomeBadge(e.target.value)}
                    placeholder="Ej: 🔥 El Sabor Que Nos Une"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    Título de Bienvenida *
                  </label>
                  <input
                    type="text"
                    required
                    value={welcomeTitle}
                    onChange={(e) => setWelcomeTitle(e.target.value)}
                    placeholder="Ej: ¡Bienvenidos a Pío Pío!"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Subtítulo Institucional
                </label>
                <input
                  type="text"
                  value={welcomeSubtitle}
                  onChange={(e) => setWelcomeSubtitle(e.target.value)}
                  placeholder="Ej: Asadero & Restaurante Tradicional"
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Mensaje de Presentación *
                </label>
                <textarea
                  required
                  rows={3}
                  value={welcomeDescription}
                  onChange={(e) => setWelcomeDescription(e.target.value)}
                  placeholder="Escribe el mensaje de bienvenida y tradición culinaria..."
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Texto del Botón Principal
                </label>
                <input
                  type="text"
                  required
                  value={welcomeButtonText}
                  onChange={(e) => setWelcomeButtonText(e.target.value)}
                  placeholder="Ver Oferta Especial de Hoy"
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              {/* 3 Especialidades Destacadas */}
              <div className="pt-2 border-t border-gray-800/80 space-y-3">
                <label className="text-xs font-bold text-gray-300 block">
                  3 Especialidades de la Casa (Mini Badges)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Badge 1 */}
                  <div className="p-2.5 bg-[#14161a] border border-gray-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-400 block">Pilar 1</span>
                    <input
                      type="text"
                      value={welcomeTag1}
                      onChange={(e) => setWelcomeTag1(e.target.value)}
                      placeholder="Pollos"
                      className="w-full bg-[#181b20] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                    <input
                      type="text"
                      value={welcomeTag1Sub}
                      onChange={(e) => setWelcomeTag1Sub(e.target.value)}
                      placeholder="Asado & Broaster"
                      className="w-full bg-[#181b20] border border-gray-800 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-400"
                    />
                  </div>

                  {/* Badge 2 */}
                  <div className="p-2.5 bg-[#14161a] border border-gray-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-orange-400 block">Pilar 2</span>
                    <input
                      type="text"
                      value={welcomeTag2}
                      onChange={(e) => setWelcomeTag2(e.target.value)}
                      placeholder="Parrilla"
                      className="w-full bg-[#181b20] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                    <input
                      type="text"
                      value={welcomeTag2Sub}
                      onChange={(e) => setWelcomeTag2Sub(e.target.value)}
                      placeholder="A la Brasa"
                      className="w-full bg-[#181b20] border border-gray-800 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-400"
                    />
                  </div>

                  {/* Badge 3 */}
                  <div className="p-2.5 bg-[#14161a] border border-gray-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-300 block">Pilar 3</span>
                    <input
                      type="text"
                      value={welcomeTag3}
                      onChange={(e) => setWelcomeTag3(e.target.value)}
                      placeholder="Típicos"
                      className="w-full bg-[#181b20] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                    <input
                      type="text"
                      value={welcomeTag3Sub}
                      onChange={(e) => setWelcomeTag3Sub(e.target.value)}
                      placeholder="Bandejas & Sopas"
                      className="w-full bg-[#181b20] border border-gray-800 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 2: EDICIÓN DEL PLATO PROMOCIONAL                  */}
          {/* ======================================================== */}
          {activeTab === "promo" && (
            <div className="space-y-4 animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-black uppercase text-orange-400 tracking-wider">
                  Configuración del Plato Promocional (Paso 2)
                </h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Título de la Oferta *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: ¡Especial del Día en Brasa y Carbón!"
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Subtítulo / Nombre del Combo
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ej: Costillas BBQ Campesinas + Cerveza Artesanal"
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Descripción para el Comensal *
                </label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe la oferta especial para antojar al cliente..."
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300">
                    Imagen de la Promoción *
                  </label>
                  <label className="cursor-pointer text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir de Galería / Cámara</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          toast.info("Subiendo foto promocional...");
                          const res = await fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                          });
                          const json = await res.json();
                          if (json.success && json.data?.url) {
                            setImageUrl(json.data.url);
                            toast.success("Foto de promoción cargada");
                          } else {
                            toast.error(json.message || "Error al subir imagen");
                          }
                        } catch {
                          toast.error("Error al conectar con el servidor");
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... o /uploads/..."
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    Texto del Badge
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="20% OFF HOY"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 uppercase font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    Precio Regular (Tachado)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    placeholder="52000"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    Precio Promo Especial *
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(e.target.value)}
                    placeholder="41600"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-bold text-orange-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    Texto del Botón Acción
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Ver en el Menú"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    Vincular a Plato del Menú
                  </label>
                  <select
                    value={targetDishId}
                    onChange={(e) => setTargetDishId(e.target.value)}
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Sin enlace a plato específico --</option>
                    {dishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 3: EDICIÓN DE LA PORTADA DEL MENÚ (CARRUSEL & LOGO) */}
          {/* ======================================================== */}
          {activeTab === "header" && (
            <div className="space-y-4 animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
                <LayoutTemplate className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                  Configuración de Portada del Menú (Paso 3)
                </h3>
              </div>

              {/* 1. Fotos del Carrusel de Portada */}
              <div className="space-y-2.5 p-3.5 bg-[#14161a] border border-gray-800 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Fotos Horizontales del Carrusel
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Rotan automáticamente cada 4.5 segundos en la cabecera.
                    </span>
                  </div>
                  <label className="cursor-pointer text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all active:scale-95">
                    {isUploadingHeader ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Subir Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingHeader}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadHeaderImage(file);
                      }}
                    />
                  </label>
                </div>

                {/* Galería de Miniaturas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {effectiveHeaderImages.map((imgUrl, idx) => (
                    <div
                      key={`${imgUrl}-${idx}`}
                      className="relative group rounded-xl overflow-hidden aspect-video border border-gray-800 bg-gray-950 shadow-sm"
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto carrusel ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                        <span className="text-[9px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="w-7 h-7 rounded-lg bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center active:scale-90 transition-all shadow"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input para agregar URL directa */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="O pega una URL de imagen: https://..."
                    className="flex-1 bg-[#181b20] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>

              {/* 2. Logo Oficial del Menú */}
              <div className="space-y-2.5 p-3.5 bg-[#14161a] border border-gray-800 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Logotipo del Restaurante en Portada
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Se muestra en tamaño destacado (80×80px) con marco dorado.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoUrl("/logo-pio-pio.png");
                      toast.info("Logotipo restablecido al oficial de Pío Pío");
                    }}
                    className="text-[11px] font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Por Defecto</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  {/* Vista Previa del Logo */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-amber-950 flex-shrink-0 shadow-lg shadow-black p-0.5">
                    <img
                      src={logoUrl || "/logo-pio-pio.png"}
                      alt="Logo Pío Pío"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>

                  {/* Acciones de Carga de Logo */}
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all">
                      {isUploadingLogo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Subir Nuevo Logo (Galería / Cámara)</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingLogo}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadLogo(file);
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="/logo-pio-pio.png o https://..."
                      className="w-full bg-[#181b20] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Textos e Identidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    Nombre del Restaurante en Portada *
                  </label>
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Pío Pío"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    Subtítulo / Eslogan Destacado *
                  </label>
                  <input
                    type="text"
                    required
                    value={headerTagline}
                    onChange={(e) => setHeaderTagline(e.target.value)}
                    placeholder="Asadero & Restaurante Tradicional"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Descripción Corta de la Portada
                </label>
                <input
                  type="text"
                  value={headerDescription}
                  onChange={(e) => setHeaderDescription(e.target.value)}
                  placeholder="El auténtico sabor a la brasa, broaster y platos típicos"
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 4. Horario de Atención Sincronizado */}
              <div className="space-y-1.5 p-3.5 bg-[#14161a] border border-amber-500/20 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <label className="text-xs font-bold text-white">
                    Horario de Atención (Sincronizado con Ajustes del Asadero)
                  </label>
                </div>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="Lunes a Domingo: 10:00 AM a 9:00 PM"
                  className="w-full bg-[#181b20] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
                <span className="text-[11px] text-gray-400 block pt-0.5">
                  ℹ️ Este horario se sincroniza automáticamente con los Ajustes del Asadero y se muestra tanto en la cabecera del menú como en la sección informativa.
                </span>
              </div>
            </div>
          )}

          {/* Botón Guardar Cambios */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50 min-h-[46px]"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando ajustes del menú...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Ajustes del Menú</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Mobile Mockup Preview (5 columnas en desktop) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="flex items-center justify-between w-full max-w-[330px] mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Simulador Móvil</span>
            </div>

            {/* Alternador de Vista en el Celular (3 Pasos) */}
            <div className="flex items-center gap-1 bg-[#181b20] p-1 rounded-xl border border-gray-800 text-[10px]">
              <button
                type="button"
                onClick={() => setPreviewStep(1)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  previewStep === 1
                    ? "bg-amber-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                1. Bienvenida
              </button>
              <button
                type="button"
                onClick={() => setPreviewStep(2)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  previewStep === 2
                    ? "bg-orange-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                2. Promo
              </button>
              <button
                type="button"
                onClick={() => setPreviewStep(3)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  previewStep === 3
                    ? "bg-amber-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                3. Portada
              </button>
            </div>
          </div>

          {/* Marco simulador de smartphone */}
          <div className="w-[310px] sm:w-[330px] rounded-[36px] bg-[#000000] p-3 shadow-2xl border-4 border-gray-700/80 ring-1 ring-orange-500/30 relative">
            {/* Notch del Celular */}
            <div className="w-28 h-4 bg-gray-900 rounded-full mx-auto mb-2" />

            {/* Pantalla del celular */}
            <div className="relative rounded-2xl bg-[#0f1115] overflow-hidden min-h-[460px] flex flex-col justify-start">
              {/* ======================================================== */}
              {/* VISTA PREVIA PASO 1: TARJETA DE BIENVENIDA               */}
              {/* ======================================================== */}
              {previewStep === 1 && (
                <div className="p-3 my-auto">
                  <div className="relative w-full overflow-hidden bg-[#181b20] border border-amber-500/30 rounded-2xl shadow-xl z-10 p-4 text-center space-y-2.5 animate-in fade-in duration-200">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 bg-amber-950 mx-auto shadow-md">
                      <img
                        src={logoUrl || "/logo-pio-pio.png"}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {welcomeBadge && (
                      <span className="inline-block text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                        {welcomeBadge}
                      </span>
                    )}

                    <h3 className="text-sm font-black text-white leading-tight">
                      {welcomeTitle}
                    </h3>

                    {welcomeSubtitle && (
                      <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wide">
                        {welcomeSubtitle}
                      </p>
                    )}

                    <p className="text-[10px] text-gray-300 leading-relaxed line-clamp-3">
                      {welcomeDescription}
                    </p>

                    {/* 3 Mini Badges */}
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <div className="p-1 bg-[#14161a] rounded-lg border border-gray-800">
                        <span className="text-[9px] font-bold text-amber-400 block truncate">
                          {welcomeTag1}
                        </span>
                        <span className="text-[8px] text-gray-400 block truncate">
                          {welcomeTag1Sub}
                        </span>
                      </div>
                      <div className="p-1 bg-[#14161a] rounded-lg border border-gray-800">
                        <span className="text-[9px] font-bold text-orange-400 block truncate">
                          {welcomeTag2}
                        </span>
                        <span className="text-[8px] text-gray-400 block truncate">
                          {welcomeTag2Sub}
                        </span>
                      </div>
                      <div className="p-1 bg-[#14161a] rounded-lg border border-gray-800">
                        <span className="text-[9px] font-bold text-amber-300 block truncate">
                          {welcomeTag3}
                        </span>
                        <span className="text-[8px] text-gray-400 block truncate">
                          {welcomeTag3Sub}
                        </span>
                      </div>
                    </div>

                    <div className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 shadow-md">
                      <span>{welcomeButtonText}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* VISTA PREVIA PASO 2: PLATO PROMOCIONAL                   */}
              {/* ======================================================== */}
              {previewStep === 2 && (
                <div className="p-3 my-auto">
                  <div className="relative w-full overflow-hidden bg-[#181b20] border border-orange-500/30 rounded-2xl shadow-xl z-10 animate-in fade-in duration-200">
                    <div className="relative w-full h-32 bg-gray-900">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                          Sin imagen
                        </div>
                      )}
                      {badgeText && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <Tag className="w-2.5 h-2.5" />
                          {badgeText}
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center gap-1 text-orange-500 text-[10px] font-bold">
                        <Flame className="w-3 h-3 fill-orange-500" />
                        <span>Especial del Día</span>
                      </div>

                      <h4 className="text-xs font-black text-white leading-tight">
                        {title || "Título de la Promoción"}
                      </h4>

                      {subtitle && (
                        <p className="text-[10px] font-semibold text-orange-200">
                          {subtitle}
                        </p>
                      )}

                      <p className="text-[10px] text-gray-400 line-clamp-2">
                        {description || "Descripción promocional..."}
                      </p>

                      {(promoPrice || regularPrice) && (
                        <div className="flex items-baseline gap-2 pt-0.5">
                          {promoPrice && (
                            <span className="text-sm font-black text-orange-400">
                              {formatPrice(parseFloat(promoPrice))}
                            </span>
                          )}
                          {regularPrice && (
                            <span className="text-[10px] text-gray-500 line-through">
                              {formatPrice(parseFloat(regularPrice))}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1">
                        <span>{ctaText || "Ver en el Menú"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* VISTA PREVIA PASO 3: PORTADA COMPLETA DEL MENÚ            */}
              {/* ======================================================== */}
              {previewStep === 3 && (
                <div className="w-full h-full flex flex-col animate-in fade-in duration-200">
                  {/* Foto de Portada con Degradados */}
                  <div className="relative w-full h-32 bg-gray-950 overflow-hidden flex-shrink-0">
                    <img
                      src={effectiveHeaderImages[0] || DEFAULT_HEADER_IMAGES[0]}
                      alt="Portada"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/40 to-black/50" />

                    {/* Badge Flotante Superior */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[8px] font-black pointer-events-none">
                      <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md text-amber-400 rounded-full border border-amber-500/30">
                        🔥 CARTA DIGITAL
                      </span>
                      <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full">
                        📍 Mesa #1
                      </span>
                    </div>

                    {/* Dots Indicadores */}
                    {effectiveHeaderImages.length > 1 && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-full">
                        {effectiveHeaderImages.slice(0, 4).map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-full ${
                              i === 0 ? "w-3 h-1 bg-amber-400" : "w-1 h-1 bg-gray-400"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Identidad de Marca y Buscador */}
                  <div className="px-3 -mt-6 relative z-10 space-y-2 flex-1 flex flex-col">
                    <div className="flex items-end gap-2.5">
                      {/* Logo Redondeado con Borde Dorado */}
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-amber-950 flex-shrink-0 shadow-lg shadow-black p-0.5">
                        <img
                          src={logoUrl || "/logo-pio-pio.png"}
                          alt="Logo"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>

                      <div className="min-w-0 pb-0.5 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-white leading-tight truncate">
                            {restaurantName || "Pío Pío"}
                          </h4>
                          <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                            🟢 Abierto
                          </span>
                        </div>
                        <p className="text-[10px] font-extrabold text-amber-400 truncate leading-tight">
                          {headerTagline}
                        </p>
                        <p className="text-[8px] text-gray-400 truncate">
                          {openingHours}
                        </p>
                      </div>
                    </div>

                    {/* Buscador Integrado */}
                    <div className="bg-[#181b20] border border-gray-800 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow">
                      <Search className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span className="text-[9px] text-gray-500 truncate">
                        ¿Qué se te antoja hoy? (pollo, asado...)
                      </span>
                    </div>

                    {/* Platos Mockup Simulados Abajo */}
                    <div className="pt-1 space-y-1.5 flex-1">
                      <div className="p-2 bg-[#181b20]/90 border border-gray-800/80 rounded-xl flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden">
                          <img
                            src="https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=200&auto=format&fit=crop"
                            alt="Plato"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-white block truncate">
                            Pollo Asado Tradicional
                          </span>
                          <span className="text-[9px] font-black text-amber-400">
                            $ 43.000
                          </span>
                        </div>
                      </div>

                      <div className="p-2 bg-[#181b20]/90 border border-gray-800/80 rounded-xl flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden">
                          <img
                            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=200&auto=format&fit=crop"
                            alt="Plato"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-white block truncate">
                            Churrasco a la Brasa 350g
                          </span>
                          <span className="text-[9px] font-black text-amber-400">
                            $ 38.000
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
