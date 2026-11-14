"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Phone,
  Wifi,
  MapPin,
  Clock,
  Save,
  Loader2,
  CheckCircle2,
  Lock,
  KeyRound,
  User,
  Eye,
  EyeOff,
  Images,
  Trash2,
  Plus,
  Upload,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const [restaurantName, setRestaurantName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [address, setAddress] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  // Carrusel de Fotos de Portada del Encabezado
  const [headerImages, setHeaderImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [headerTagline, setHeaderTagline] = useState("Asadero & Restaurante Tradicional");
  const [headerDescription, setHeaderDescription] = useState("El auténtico sabor a la brasa, broaster y platos típicos");
  const [logoUrl, setLogoUrl] = useState("/logo-pio-pio.png");
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);

  // Credenciales de administración (Usuario y Contraseña)
  const [adminUsername, setAdminUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibilidad de contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      return json.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setRestaurantName(settings.restaurantName || "Pío Pío - Asadero y Restaurante");
      setWhatsappNumber(settings.whatsappNumber || "573001234567");
      setAddress(settings.address || "");
      setOpeningHours(settings.openingHours || "");
      setWifiSsid(settings.wifiSsid || "");
      setWifiPassword(settings.wifiPassword || "");
      if (settings.adminUsername) setAdminUsername(settings.adminUsername);
      if (settings.headerImages && Array.isArray(settings.headerImages)) {
        setHeaderImages(settings.headerImages);
      }
      if (settings.headerTagline) setHeaderTagline(settings.headerTagline);
      if (settings.headerDescription) setHeaderDescription(settings.headerDescription);
      if (settings.logoUrl) setLogoUrl(settings.logoUrl);
    }
  }, [settings]);

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) {
      toast.error("Ingresa una URL de imagen válida");
      return;
    }
    setHeaderImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
    toast.success("Foto añadida al carrusel");
  };

  const handleRemoveImage = (index: number) => {
    setHeaderImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Foto eliminada del carrusel");
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
        toast.success("Foto subida y agregada al carrusel");
      } else {
        toast.error(json.message || "Error al subir imagen");
      }
    } catch {
      toast.error("Error al conectar con el servidor de carga");
    } finally {
      setIsUploadingHeader(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Ajustes y credenciales guardados correctamente");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar ajustes");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword) {
      if (newPassword.length < 4) {
        toast.error("La nueva contraseña debe tener al menos 4 caracteres");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Las nuevas contraseñas no coinciden");
        return;
      }
    }

    updateMutation.mutate({
      restaurantName,
      whatsappNumber,
      address,
      openingHours,
      wifiSsid,
      wifiPassword,
      headerImages,
      logoUrl,
      headerTagline: headerTagline.trim(),
      headerDescription: headerDescription.trim(),
      adminUsername: adminUsername.trim(),
      ...(newPassword ? { currentPassword, newPassword, confirmPassword } : {}),
    });
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs">Cargando ajustes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <span>Ajustes Generales del Asadero</span>
        </h2>
        <p className="text-xs text-gray-400">
          Configura el número de WhatsApp para pedidos y la red Wi-Fi para los clientes en mesa.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#181b20] border border-gray-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl"
      >
        {/* ============================================================== */}
        {/* 1. FOTOS DE PORTADA DEL ENCABEZADO (CARRUSEL)                 */}
        {/* ============================================================== */}
        <div className="space-y-4 border-b border-gray-800/80 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Images className="w-5 h-5" />
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Fotos de Portada del Encabezado (Carrusel)
              </label>
            </div>
            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              {headerImages.length} {headerImages.length === 1 ? "foto activa" : "fotos activas"}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            Sube fotos horizontales del asadero (brasas, pollos dorados, parrilladas). Estas imágenes rotarán automáticamente en el encabezado de la carta digital de tus clientes.
          </p>

          {/* Grid de Fotos Actuales en el Carrusel */}
          {headerImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {headerImages.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative group rounded-2xl overflow-hidden border border-gray-800 bg-gray-950 aspect-[16/9] shadow-md"
                >
                  <img
                    src={url}
                    alt={`Foto portada ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  
                  <span className="absolute bottom-1.5 left-2 text-[9px] font-black text-amber-300 uppercase tracking-wider">
                    {idx === 0 ? "★ Principal" : `Foto #${idx + 1}`}
                  </span>

                  {/* Botón Eliminar Foto */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    title="Eliminar foto"
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-xl bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all opacity-90 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-950/60 rounded-2xl border border-dashed border-gray-800 text-center text-xs text-gray-500">
              No has subido fotos personalizadas. Se mostrarán las fotos por defecto del asadero.
            </div>
          )}

          {/* Controles para Agregar Fotos (Subir Archivo o Pegar URL) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Botón Subir Archivo */}
            <label className="cursor-pointer flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 rounded-2xl text-xs font-bold text-amber-300 transition-all active:scale-[0.98]">
              {isUploadingHeader ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Subiendo foto...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Subir desde Galería / Cámara</span>
                </>
              )}
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

            {/* Input Pegar URL */}
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="O pega una URL de imagen..."
                className="flex-1 bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          {/* Campos de Subtítulo y Descripción del Encabezado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-300">
                Subtítulo del Encabezado
              </label>
              <input
                type="text"
                value={headerTagline}
                onChange={(e) => setHeaderTagline(e.target.value)}
                placeholder="Ej: Asadero & Restaurante Tradicional"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-300">
                Eslogan / Descripción Breve
              </label>
              <input
                type="text"
                value={headerDescription}
                onChange={(e) => setHeaderDescription(e.target.value)}
                placeholder="Ej: El auténtico sabor a la brasa, broaster y platos típicos"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp para Pedidos */}
        <div className="space-y-1.5 border-b border-gray-800/80 pb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Phone className="w-4 h-4" />
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Número de WhatsApp para Recibir Pedidos *
            </label>
          </div>
          <p className="text-[11px] text-gray-400">
            Incluye el código de país sin espacios ni signos (Ejemplo Colombia: <strong>573001234567</strong>).
          </p>
          <input
            type="text"
            required
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="573001234567"
            className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Wi-Fi para Clientes en Mesa */}
        <div className="space-y-3 border-b border-gray-800/80 pb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Wifi className="w-4 h-4" />
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Datos de Wi-Fi para Clientes (Visible en la carta)
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400">
                Nombre de la Red (SSID)
              </label>
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="Ej: PioPio-Clientes"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400">
                Contraseña de Wi-Fi
              </label>
              <input
                type="text"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="Ej: Pollo2026*"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Dirección y Horarios */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Dirección Física del Restaurante</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Carrera 15 # 24-10, Centro"
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Horario de Atención</span>
            </label>
            <input
              type="text"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="Ej: Lunes a Domingo: 10:00 AM a 9:00 PM"
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Seguridad y Credenciales de Acceso */}
        <div className="border-t border-gray-800/80 pt-4 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Lock className="w-4 h-4" />
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Credenciales de Acceso al Panel Administrativo
            </label>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Desde aquí puedes cambiar tu <strong>Usuario</strong>, tu <strong>Contraseña</strong> o ambos en cualquier momento.
          </p>

          {/* Campo Usuario */}
          <div className="space-y-1 max-w-sm">
            <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Usuario Administrador</span>
            </label>
            <input
              type="text"
              required
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="Ej: Piopio123"
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-2">
              Cambio de Contraseña (Opcional - dejar en blanco para conservar la actual)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Contraseña Actual */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-400"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-400"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full bg-[#14161a] border border-gray-800 rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 text-xs transition-all duration-300 ease-out disabled:opacity-50 min-h-[46px]"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Ajustes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

