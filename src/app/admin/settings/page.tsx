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
  Sparkles,
  Globe,
  Share2,
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

  // Redes Sociales y Página Web
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Datos de encabezado conservados internamente (configurables en Ajustes Menú)
  const [headerImages, setHeaderImages] = useState<string[]>([]);
  const [headerTagline, setHeaderTagline] = useState("Asadero & Restaurante Tradicional");
  const [headerDescription, setHeaderDescription] = useState("El auténtico sabor a la brasa, broaster y platos típicos");
  const [logoUrl, setLogoUrl] = useState("/logo-pio-pio.png");

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
      if (settings.facebookUrl) setFacebookUrl(settings.facebookUrl);
      if (settings.instagramUrl) setInstagramUrl(settings.instagramUrl);
      if (settings.websiteUrl) setWebsiteUrl(settings.websiteUrl);
      if (settings.adminUsername) setAdminUsername(settings.adminUsername);
      if (settings.headerImages && Array.isArray(settings.headerImages)) {
        setHeaderImages(settings.headerImages);
      }
      if (settings.headerTagline) setHeaderTagline(settings.headerTagline);
      if (settings.headerDescription) setHeaderDescription(settings.headerDescription);
      if (settings.logoUrl) setLogoUrl(settings.logoUrl);
    }
  }, [settings]);

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
      facebookUrl: facebookUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      websiteUrl: websiteUrl.trim(),
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

        {/* Redes Sociales y Sitio Web Oficial */}
        <div className="border-t border-gray-800/80 pt-4 space-y-3.5">
          <div className="flex items-center gap-2 text-amber-400">
            <Share2 className="w-4 h-4" />
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Redes Sociales y Sitio Web
            </label>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Conecta las redes oficiales y página web de Pío Pío para que tus comensales las visiten desde la carta digital.
          </p>

          <div className="space-y-3">
            {/* Facebook */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#1877F2]/10 border border-[#1877F2]/30 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </span>
                <span>Página de Facebook (URL)</span>
              </label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/asaderopiopio"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Instagram */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 fill-pink-500" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </span>
                <span>Perfil de Instagram (URL)</span>
              </label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/asaderopiopio"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>

            {/* Página Web */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                </span>
                <span>Página Web Oficial (URL)</span>
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://asaderopiopio.com"
                className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
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

