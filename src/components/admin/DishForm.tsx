"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, ArrowLeft, Loader2, Save, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Portion } from "@/types";

interface DishFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export function DishForm({ initialData, isEditing = false }: DishFormProps) {
  const router = useRouter();

  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [basePrice, setBasePrice] = useState(initialData?.basePrice?.toString() || "");
  const [discountPrice, setDiscountPrice] = useState(
    initialData?.discountPrice ? initialData.discountPrice.toString() : ""
  );
  const [imageUrl, setImageUrl] = useState(
    initialData?.imageUrl ||
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop"
  );
  const [isAvailable, setIsAvailable] = useState(
    initialData?.isAvailable !== undefined ? initialData.isAvailable : true
  );
  const [badge, setBadge] = useState(initialData?.badge || "NONE");
  const [servings, setServings] = useState(initialData?.servings || "");
  const [preparationTime, setPreparationTime] = useState(
    initialData?.preparationTime ? initialData.preparationTime.toString() : ""
  );
  const [portions, setPortions] = useState<Portion[]>(
    initialData?.portions?.map((p: any) => ({
      label: p.label,
      price: p.price,
      isDefault: p.isDefault,
    })) || []
  );

  const [loading, setLoading] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Si no hay categoría seleccionada y ya cargaron las categorías
  if (!categoryId && categories.length > 0) {
    setCategoryId(categories[0].id);
  }

  const handleAddPortion = () => {
    setPortions([
      ...portions,
      { label: "", price: Number(basePrice) || 0, isDefault: portions.length === 0 },
    ]);
  };

  const handleRemovePortion = (index: number) => {
    setPortions(portions.filter((_, i) => i !== index));
  };

  const handlePortionChange = (index: number, field: keyof Portion, value: any) => {
    setPortions(
      portions.map((portion, i) => {
        if (i === index) {
          return { ...portion, [field]: value };
        }
        if (field === "isDefault" && value === true) {
          return { ...portion, isDefault: false };
        }
        return portion;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Seleccione una categoría");
      return;
    }

    setLoading(true);

    const payload = {
      categoryId,
      name,
      description,
      basePrice: parseFloat(basePrice),
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      imageUrl,
      isAvailable,
      badge,
      servings: servings || null,
      preparationTime: preparationTime ? parseInt(preparationTime) : null,
      portions: portions.filter((p) => p.label.trim() !== ""),
    };

    try {
      const url = isEditing
        ? `/api/admin/dishes/${initialData.id}`
        : "/api/admin/dishes";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Error al guardar el plato");
        setLoading(false);
        return;
      }

      toast.success(
        isEditing ? "Plato actualizado con éxito" : "Plato creado exitosamente"
      );
      router.push("/admin/dishes");
      router.refresh();
    } catch {
      toast.error("Error al conectar con el servidor");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* Botón Volver */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado</span>
        </button>
        <span className="text-xs font-bold text-orange-400">
          {isEditing ? "Editar Plato" : "Crear Nuevo Plato"}
        </span>
      </div>

      <div className="bg-[#181b20] border border-gray-800 rounded-3xl p-5 sm:p-6 space-y-4">
        {/* Categoría y Disponibilidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Categoría *</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">
              Estado de Disponibilidad
            </label>
            <div className="flex items-center justify-between p-2 bg-[#14161a] border border-gray-800 rounded-xl h-[42px]">
              <span className="text-xs text-gray-400">
                {isAvailable ? "Disponible en carta" : "Agotado en cocina"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isAvailable}
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isAvailable ? "bg-emerald-600" : "bg-gray-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    isAvailable ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Nombre del Plato */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300">Nombre del Plato *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Punta de Anca Madurada (400g)"
            className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Descripción Gastronómica */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-300">
            Descripción & Término a la leña *
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe los ingredientes, guarniciones y preparación tradicional..."
            className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 leading-relaxed"
          />
        </div>

        {/* Precios: Base y Oferta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Precio Base ($ COP) *</label>
            <input
              type="number"
              required
              min="0"
              step="100"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="38000"
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">
              Precio Descuento ($ COP, Opcional)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              placeholder="Dejar vacío si no está en descuento"
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-orange-400 placeholder-gray-600 focus:outline-none focus:border-orange-500 font-bold"
            />
          </div>
        </div>

        {/* URL de Imagen, Previsualización y Subida */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300">
              Fotografía del Plato *
            </label>
            <label className="cursor-pointer text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors">
              <ImageIcon className="w-3.5 h-3.5" />
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
                    toast.info("Subiendo imagen...");
                    const res = await fetch("/api/upload", {
                      method: "POST",
                      body: formData,
                    });
                    const json = await res.json();
                    if (json.success && json.data?.url) {
                      setImageUrl(json.data.url);
                      toast.success("Foto subida exitosamente");
                    } else {
                      toast.error(json.message || "Error al subir imagen");
                    }
                  } catch {
                    toast.error("Error al conectar con el servidor de carga");
                  }
                }}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... o /uploads/..."
              className="flex-1 bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 font-mono"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Vista previa"
                className="w-11 h-11 rounded-xl object-cover border border-gray-800"
              />
            )}
          </div>
        </div>

        {/* Badge y Datos de Servicio */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Distintivo (Badge)</label>
            <select
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="NONE">Sin Distintivo</option>
              <option value="POPULAR">🔥 El Más Vendido</option>
              <option value="CHEFS_SPECIAL">⭐ Recomendado</option>
              <option value="NEW">✨ Nuevo</option>
              <option value="PROMO">🏷️ Oferta Especial</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Porción / Personas</label>
            <input
              type="text"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="Ej: 1 a 2 personas"
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Tiempo Prep. (min)</label>
            <input
              type="number"
              min="0"
              value={preparationTime}
              onChange={(e) => setPreparationTime(e.target.value)}
              placeholder="Ej: 20"
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Administrador de Tamaños / Porciones */}
        <div className="border-t border-gray-800/80 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Variantes de Tamaño / Porciones
              </h4>
              <p className="text-[11px] text-gray-400">
                Opcional para platos como 1/4, 1/2 o pollo entero, o cortes por gramos.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddPortion}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-orange-400 text-xs font-bold rounded-xl border border-gray-700 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Tamaño</span>
            </button>
          </div>

          {portions.length > 0 && (
            <div className="space-y-2">
              {portions.map((portion, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 bg-[#14161a] border border-gray-800 rounded-xl"
                >
                  <input
                    type="text"
                    required
                    value={portion.label}
                    onChange={(e) =>
                      handlePortionChange(idx, "label", e.target.value)
                    }
                    placeholder="Etiqueta (ej: 1/2 Pollo)"
                    className="flex-1 bg-transparent border-b border-gray-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={portion.price}
                    onChange={(e) =>
                      handlePortionChange(
                        idx,
                        "price",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Precio"
                    className="w-24 bg-transparent border-b border-gray-700 px-2 py-1 text-xs text-orange-400 font-bold focus:outline-none focus:border-orange-500 text-right"
                  />
                  <label className="flex items-center gap-1 text-[11px] text-gray-400 cursor-pointer">
                    <input
                      type="radio"
                      name="defaultPortion"
                      checked={portion.isDefault}
                      onChange={() => handlePortionChange(idx, "isDefault", true)}
                      className="accent-orange-500"
                    />
                    <span>Defecto</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemovePortion(idx)}
                    className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón Guardar */}
        <div className="pt-4 border-t border-gray-800">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-xs transition-all duration-300 ease-out disabled:opacity-50 min-h-[48px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando plato...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? "Guardar Cambios" : "Publicar en la Carta"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

