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
} from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { DishItem } from "@/types";
import { toast } from "sonner";

export default function AdminPromoModalPage() {
  const queryClient = useQueryClient();

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
  const [autoShowDelayMs, setAutoShowDelayMs] = useState(800);

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
      setAutoShowDelayMs(promo.autoShowDelayMs || 800);
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
      toast.success("Promoción actualizada exitosamente");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al actualizar la promoción");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
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
      autoShowDelayMs: Number(autoShowDelayMs),
      showOncePerSession: true,
    };
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-xs">Cargando configuración de la promoción...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          <span>Editor del Modal Promocional Flotante</span>
        </h2>
        <p className="text-xs text-gray-400">
          Personaliza la ventana emergente que ven los clientes al escanear el código QR en mesa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario (7 columnas en desktop) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#181b20] border border-gray-800 rounded-3xl p-5 space-y-4"
        >
          {/* Switch Activar / Desactivar Promo */}
          <div className="flex items-center justify-between p-3.5 bg-[#14161a] border border-gray-800 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-white block">
                Estado del Modal Promocional
              </span>
              <span className="text-[11px] text-gray-400">
                {isActive
                  ? "Activo: Se desplegará automáticamente a los comensales"
                  : "Desactivado: No se mostrará ninguna ventana flotante"}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isActive ? "bg-emerald-600" : "bg-gray-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
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
                placeholder="Ej: 20% OFF HOY"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">
                Precio Normal ($)
              </label>
              <input
                type="number"
                min="0"
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                placeholder="42000"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">
                Precio Promo ($)
              </label>
              <input
                type="number"
                min="0"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                placeholder="37000"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-orange-400 font-bold focus:outline-none focus:border-orange-500"
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

          {/* Botón Guardar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50 min-h-[46px]"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Actualizar Promoción</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Mobile Mockup Preview (5 columnas en desktop) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400">
            <Eye className="w-4 h-4 text-orange-400" />
            <span>Vista Previa en Vivo (Celular del Comensal)</span>
          </div>

          {/* Marco simulador de smartphone */}
          <div className="w-[310px] sm:w-[330px] rounded-[36px] bg-[#000000] p-3 shadow-2xl border-4 border-gray-700/80 ring-1 ring-orange-500/30 relative">
            {/* Notch del Celular */}
            <div className="w-28 h-4 bg-gray-900 rounded-full mx-auto mb-2" />

            {/* Pantalla del celular con el modal flotando */}
            <div className="relative rounded-2xl bg-[#0f1115] overflow-hidden p-2 min-h-[440px] flex items-center justify-center">
              {/* Fondo simulando el menú desenfocado */}
              <div className="absolute inset-0 bg-[#0f1115] opacity-20 pointer-events-none flex flex-col gap-2 p-3">
                <div className="h-6 bg-gray-800 rounded-lg w-3/4" />
                <div className="h-16 bg-gray-800 rounded-xl" />
                <div className="h-16 bg-gray-800 rounded-xl" />
              </div>

              {/* Tarjeta del Modal flotante en vivo */}
              <div className="relative w-full overflow-hidden bg-[#181b20] border border-orange-500/30 rounded-2xl shadow-xl z-10">
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
          </div>
        </div>
      </div>
    </div>
  );
}

