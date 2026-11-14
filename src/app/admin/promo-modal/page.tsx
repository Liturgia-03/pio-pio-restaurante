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
  Eye,
  Check,
  Layers,
  Utensils,
  Smartphone,
} from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { DishItem } from "@/types";
import { toast } from "sonner";

export default function AdminPromoModalPage() {
  const queryClient = useQueryClient();

  // Pestaña activa del formulario de edición: "welcome" | "promo"
  const [activeTab, setActiveTab] = useState<"welcome" | "promo">("welcome");

  // Pestaña activa del simulador móvil en vivo: 1 (Bienvenida) | 2 (Promoción)
  const [previewStep, setPreviewStep] = useState<1 | 2>(1);

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

  const { data: promo, isLoading } = useQuery({
    queryKey: ["admin-promo"],
    queryFn: async () => {
      const res = await fetch("/api/admin/promo-modal");
      const json = await res.json();
      return json.data;
    },
  });

  const { data: dishes = [] } = useQuery<DishItem[]>({
    queryKey: ["admin-dishes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dishes");
      const json = await res.json();
      return json.data || [];
    },
  });

  useEffect(() => {
    if (promo) {
      // Cargar campos de bienvenida
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

      // Cargar campos de promoción
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

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/promo-modal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo"] });
      queryClient.invalidateQueries({ queryKey: ["public-promo"] });
      toast.success("Modal de Bienvenida y Promoción guardado exitosamente");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al actualizar la configuración");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
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
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-xs">Cargando configuración del modal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          <span>Editor del Modal: Tarjeta de Bienvenida y Promoción</span>
        </h2>
        <p className="text-xs text-gray-400">
          Personaliza la experiencia inicial de 2 pasos que verán los clientes al abrir el menú digital.
        </p>
      </div>

      {/* Selector de Pestañas de Edición */}
      <div className="flex items-center gap-2 p-1 bg-[#181b20] border border-gray-800 rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => {
            setActiveTab("welcome");
            setPreviewStep(1);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 ease-out active:scale-95 ${
            activeTab === "welcome"
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Tarjeta de Bienvenida</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("promo");
            setPreviewStep(2);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 ease-out active:scale-95 ${
            activeTab === "promo"
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>2. Plato Promocional</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario (7 columnas en desktop) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#181b20] border border-gray-800 rounded-3xl p-5 space-y-4"
        >
          {/* Switch Global Activar / Desactivar Modal */}
          <div className="flex items-center justify-between p-3.5 bg-[#14161a] border border-gray-800 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-white block">
                Mostrar Modal al Abrir la Carta
              </span>
              <span className="text-[11px] text-gray-400">
                {isActive
                  ? "Activo: Se desplegará la bienvenida y la promo automáticamente"
                  : "Desactivado: El comensal entrará directo al listado de platos"}
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
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Texto del Botón Siguiente
                </label>
                <input
                  type="text"
                  value={welcomeButtonText}
                  onChange={(e) => setWelcomeButtonText(e.target.value)}
                  placeholder="Ej: Ver Oferta Especial de Hoy"
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              {/* 3 Cápsulas de Especialidades */}
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <label className="text-xs font-black text-gray-300 block">
                  Cápsulas de Especialidades (3 Destacados):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Cápsula 1 */}
                  <div className="p-2.5 bg-[#14161a] border border-gray-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-400 block">Cápsula 1</span>
                    <input
                      type="text"
                      value={welcomeTag1}
                      onChange={(e) => setWelcomeTag1(e.target.value)}
                      placeholder="Título (ej: Pollos)"
                      className="w-full bg-[#181b20] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                    <input
                      type="text"
                      value={welcomeTag1Sub}
                      onChange={(e) => setWelcomeTag1Sub(e.target.value)}
                      placeholder="Sub (ej: Asado & Broaster)"
                      className="w-full bg-[#181b20] border border-gray-800 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-400"
                    />
                  </div>

                  {/* Cápsula 2 */}
                  <div className="p-2.5 bg-[#14161a] border border-gray-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-orange-400 block">Cápsula 2</span>
                    <input
                      type="text"
                      value={welcomeTag2}
                      onChange={(e) => setWelcomeTag2(e.target.value)}
                      placeholder="Título (ej: Parrilla)"
                      className="w-full bg-[#181b20] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                    <input
                      type="text"
                      value={welcomeTag2Sub}
                      onChange={(e) => setWelcomeTag2Sub(e.target.value)}
                      placeholder="Sub (ej: A la Brasa)"
                      className="w-full bg-[#181b20] border border-gray-800 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-400"
                    />
                  </div>

                  {/* Cápsula 3 */}
                  <div className="p-2.5 bg-[#14161a] border border-gray-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 block">Cápsula 3</span>
                    <input
                      type="text"
                      value={welcomeTag3}
                      onChange={(e) => setWelcomeTag3(e.target.value)}
                      placeholder="Título (ej: Típicos)"
                      className="w-full bg-[#181b20] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                    <input
                      type="text"
                      value={welcomeTag3Sub}
                      onChange={(e) => setWelcomeTag3Sub(e.target.value)}
                      placeholder="Sub (ej: Bandejas & Sopas)"
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
                  Título de la Promoción *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: 🔥 ¡ESPECIAL PARRILLERO DE HOY!"
                  className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Subtítulo Seductor
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ej: Costillas BBQ Ahumadas a la Leña + Bebida"
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
                    placeholder="43000"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    Texto del Botón CTA
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
                    Plato Destino al pulsar CTA
                  </label>
                  <select
                    value={targetDishId}
                    onChange={(e) => setTargetDishId(e.target.value)}
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
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
                  <span>Guardando configuración...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios del Modal</span>
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

            {/* Alternador de Vista en el Celular */}
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
                Paso 1
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
                Paso 2
              </button>
            </div>
          </div>

          {/* Marco simulador de smartphone */}
          <div className="w-[310px] sm:w-[330px] rounded-[36px] bg-[#000000] p-3 shadow-2xl border-4 border-gray-700/80 ring-1 ring-orange-500/30 relative">
            {/* Notch del Celular */}
            <div className="w-28 h-4 bg-gray-900 rounded-full mx-auto mb-2" />

            {/* Pantalla del celular con el modal flotando */}
            <div className="relative rounded-2xl bg-[#0f1115] overflow-hidden p-2 min-h-[460px] flex items-center justify-center">
              {/* Fondo simulando el menú desenfocado */}
              <div className="absolute inset-0 bg-[#0f1115] opacity-20 pointer-events-none flex flex-col gap-2 p-3">
                <div className="h-6 bg-gray-800 rounded-lg w-3/4" />
                <div className="h-16 bg-gray-800 rounded-xl" />
                <div className="h-16 bg-gray-800 rounded-xl" />
              </div>

              {/* ======================================================== */}
              {/* VISTA PREVIA PASO 1: TARJETA DE BIENVENIDA               */}
              {/* ======================================================== */}
              {previewStep === 1 && (
                <div className="relative w-full overflow-hidden bg-[#181b20] border border-amber-500/30 rounded-2xl shadow-xl z-10 p-4 text-center space-y-2.5 animate-in fade-in duration-200">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 bg-amber-950 mx-auto shadow-md">
                    <img
                      src="/logo-pio-pio.png"
                      alt="Logo Pío Pío"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <span className="inline-block text-[9px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">
                      {welcomeBadge || "El Sabor Que Nos Une"}
                    </span>
                    <h4 className="text-sm font-black text-white leading-tight">
                      {welcomeTitle || "¡Bienvenidos a Pío Pío!"}
                    </h4>
                    <span className="text-[10px] font-bold text-amber-500 uppercase block">
                      {welcomeSubtitle || "Asadero & Restaurante Tradicional"}
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-300 leading-snug line-clamp-3 px-1">
                    {welcomeDescription || "Descripción de presentación..."}
                  </p>

                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <div className="bg-[#14161a] border border-gray-800 rounded-lg p-1">
                      <span className="text-[9px] font-bold text-gray-200 block">{welcomeTag1}</span>
                      <span className="text-[8px] text-amber-400 block truncate">{welcomeTag1Sub}</span>
                    </div>
                    <div className="bg-[#14161a] border border-gray-800 rounded-lg p-1">
                      <span className="text-[9px] font-bold text-gray-200 block">{welcomeTag2}</span>
                      <span className="text-[8px] text-orange-400 block truncate">{welcomeTag2Sub}</span>
                    </div>
                    <div className="bg-[#14161a] border border-gray-800 rounded-lg p-1">
                      <span className="text-[9px] font-bold text-gray-200 block">{welcomeTag3}</span>
                      <span className="text-[8px] text-emerald-400 block truncate">{welcomeTag3Sub}</span>
                    </div>
                  </div>

                  <div className="w-full py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1 shadow-md">
                    <span>{welcomeButtonText || "Ver Oferta Especial de Hoy"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* VISTA PREVIA PASO 2: PLATO PROMOCIONAL                   */}
              {/* ======================================================== */}
              {previewStep === 2 && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
