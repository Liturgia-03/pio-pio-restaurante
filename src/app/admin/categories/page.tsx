"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderTree,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { IconRenderer } from "@/components/common/IconRenderer";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Flame");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const isFormOpenRef = useRef(false);
  isFormOpenRef.current = isCreating || editingId !== null;

  // Manejar el botón Atrás del celular para cerrar el formulario sin salir de la página
  useEffect(() => {
    const onPopState = () => {
      if (isFormOpenRef.current) {
        resetForm();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Reordenar categorías
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Error al reordenar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["public-menu"] });
      toast.success("Orden actualizado");
    },
  });

  const handleMove = (index: number, direction: "up" | "down") => {
    const newCategories = [...categories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;

    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    const orderedIds = newCategories.map((c) => c.id);
    reorderMutation.mutate(orderedIds);
  };

  // Crear categoría
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["public-menu"] });
      toast.success("Categoría creada");
      handleCloseForm();
    },
    onError: (err: any) => toast.error(err.message || "Error al crear categoría"),
  });

  // Actualizar categoría
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["public-menu"] });
      toast.success("Categoría actualizada");
      handleCloseForm();
    },
    onError: (err: any) => toast.error(err.message || "Error al actualizar"),
  });

  // Eliminar categoría
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["public-menu"] });
      toast.success("Categoría eliminada");
    },
    onError: (err: any) => toast.error(err.message || "Error al eliminar categoría"),
  });

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setName("");
    setDescription("");
    setIconName("Flame");
    setImageUrl("");
    setIsUploading(false);
    setIsActive(true);
  };

  const handleCloseForm = () => {
    if (typeof window !== "undefined" && window.history.state?.pioAdminCategoryForm) {
      window.history.back();
      return;
    }
    resetForm();
  };

  const handleStartCreate = () => {
    if (typeof window !== "undefined") {
      window.history.pushState({ pioAdminCategoryForm: true }, "");
    }
    setIsCreating(true);
  };

  const handleStartEdit = (cat: any) => {
    if (typeof window !== "undefined") {
      window.history.pushState({ pioAdminCategoryForm: true }, "");
    }
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setIconName(cat.iconName || "Flame");
    setImageUrl(cat.imageUrl || "");
    setIsUploading(false);
    setIsActive(cat.isActive);
    setIsCreating(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      description: description.trim() || null,
      iconName,
      imageUrl: imageUrl.trim() || null,
      isActive,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">
            Gestión de Categorías
          </h2>
          <p className="text-xs text-gray-400">
            Reorganiza las secciones del menú para que aparezcan en el orden deseado.
          </p>
        </div>

        {!isCreating && !editingId && (
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-orange-500/20 min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        )}
      </div>

      {/* Formulario de Creación / Edición */}
      {(isCreating || editingId) && (
        <form
          onSubmit={handleSave}
          className="bg-[#181b20] border border-orange-500/40 rounded-3xl p-5 space-y-4 shadow-xl animate-[fadeInUpSoft_0.32s_cubic-bezier(0.16,1,0.3,1)_both]"
        >
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
              {editingId ? "Editar Categoría" : "Crear Nueva Categoría"}
            </span>
            <button
              type="button"
              onClick={handleCloseForm}
              className="text-gray-400 hover:text-white active:scale-90 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300">Nombre *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Pollos Asados y Broaster"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300">Icono Lucide</label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Flame">🔥 Flame (Brasas / Fuego)</option>
                <option value="UtensilsCrossed">🥩 UtensilsCrossed (Carnes)</option>
                <option value="Salad">🥗 Salad (Acompañamientos)</option>
                <option value="Beer">🍺 Beer (Bebidas y Cervezas)</option>
                <option value="Coffee">☕ Coffee (Café y Calientes)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300">
              Descripción Breve (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Asados a la leña lentamente al carbón de roble"
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Imagen de la Categoría */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300">
                Foto de la Categoría (para la tarjeta del menú)
              </label>
              <label className="cursor-pointer text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{isUploading ? "Subiendo..." : "Subir Imagen"}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      setIsUploading(true);
                      toast.info("Subiendo imagen...");
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const json = await res.json();
                      if (json.success && json.data?.url) {
                        setImageUrl(json.data.url);
                        toast.success("Foto de categoría subida con éxito");
                      } else {
                        toast.error(json.message || "Error al subir imagen");
                      }
                    } catch {
                      toast.error("Error al conectar con el servidor de carga");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                />
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL o sube una imagen desde el botón arriba"
                className="flex-1 bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 font-mono"
              />
              {imageUrl && (
                <div className="relative group w-10 h-10 rounded-xl overflow-hidden border border-orange-500/40 flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    title="Quitar imagen"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-orange-500 w-4 h-4"
              />
              <span>Visible en la carta digital</span>
            </label>

            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="py-2.5 px-5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Categorías con Reordenamiento */}
      {isLoading ? (
        <div className="py-12 flex justify-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {categories.map((cat: any, index: number) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3.5 bg-[#181b20] border border-gray-800 hover:border-gray-700/80 rounded-2xl gap-3 transition-all duration-300 ease-out hover:shadow-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-10 h-10 rounded-xl object-cover border border-orange-500/30 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
                    <IconRenderer name={cat.iconName} className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate">
                      {cat.name}
                    </h4>
                    {!cat.isActive && (
                      <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full">
                        Oculta
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {cat._count?.dishes ?? 0} platos asociados
                  </span>
                </div>
              </div>

              {/* Botones de Orden Arriba / Abajo y Acciones */}
              <div className="flex items-center gap-1">
                <button
                  disabled={index === 0}
                  onClick={() => handleMove(index, "up")}
                  aria-label="Mover arriba"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 active:scale-90 transition-all duration-200 disabled:opacity-25"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={index === categories.length - 1}
                  onClick={() => handleMove(index, "down")}
                  aria-label="Mover abajo"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 active:scale-90 transition-all duration-200 disabled:opacity-25"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleStartEdit(cat)}
                  aria-label="Editar categoría"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 active:scale-90 transition-all duration-200 ml-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar la categoría "${cat.name}"?`)) {
                      deleteMutation.mutate(cat.id);
                    }
                  }}
                  aria-label="Eliminar categoría"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-400 active:scale-90 transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

