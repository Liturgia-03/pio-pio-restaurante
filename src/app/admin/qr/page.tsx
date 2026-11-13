"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { QrCode, Printer, Download, Table, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AdminQRPage() {
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const fullUrl = `${baseUrl || "http://localhost:3000"}/?mesa=${tableNumber}`;

  useEffect(() => {
    if (!fullUrl) return;

    QRCode.toDataURL(fullUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: "#181b20",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [fullUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `QR-Mesa-${tableNumber}-Pio-Pio.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success(`Código QR de Mesa ${tableNumber} descargado con éxito`);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Estilos para impresión exclusiva de la tarjeta QR */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-card,
          #printable-qr-card * {
            visibility: visible;
          }
          #printable-qr-card {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            box-shadow: none !important;
            border: 4px solid #f59e0b !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <span>Generador de Códigos QR para Mesas</span>
          </h2>
          <p className="text-xs text-gray-400">
            Genera e imprime los códigos QR oficiales de Pío Pío para colocar en cada mesa.
          </p>
        </div>
      </div>

      {/* Controles de Configuración */}
      <div className="bg-[#181b20] border border-gray-800 rounded-3xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-amber-400" />
              <span>Número de Mesa</span>
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={tableNumber}
              onChange={(e) => setTableNumber(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>URL Base (Dominio / IP)</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://10.241.81.201:3000 o https://tu-dominio.com"
              className="w-full bg-[#14161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        <div className="p-3 bg-[#14161a] border border-gray-800 rounded-xl text-xs text-gray-400 space-y-1">
          <span className="font-semibold text-gray-300 block">Enlace que abrirá el cliente al escanear:</span>
          <span className="text-amber-400 font-mono break-all">{fullUrl}</span>
        </div>
      </div>

      {/* Tarjeta Imprimible de Mesa Oficial Pío Pío */}
      <div className="flex flex-col items-center space-y-4">
        <div
          id="printable-qr-card"
          ref={printRef}
          className="w-72 sm:w-80 bg-white text-gray-900 rounded-3xl p-6 shadow-2xl border-4 border-amber-500 flex flex-col items-center text-center space-y-3.5"
        >
          {/* Logo Oficial y Nombre de Pío Pío */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 bg-amber-950 flex-shrink-0 shadow-md shadow-amber-500/20">
              <img
                src="/logo-pio-pio.png"
                alt="Pío Pío Asadero y Restaurante"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <h3 className="text-base font-black text-gray-900 leading-none">
                Pío Pío
              </h3>
              <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block mt-0.5">
                Asadero y Restaurante
              </span>
            </div>
          </div>

          {/* Badge de la Mesa */}
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white font-black text-xs px-5 py-1.5 rounded-full uppercase tracking-wider shadow-md">
            MESA #{tableNumber.toString().padStart(2, "0")}
          </div>

          {/* Imagen QR */}
          <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white p-2.5 rounded-2xl border-2 border-amber-200/80 shadow-inner flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Mesa ${tableNumber}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            )}
          </div>

          {/* Instrucciones de Escaneo */}
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wide">
              Escanea con tu celular
            </p>
            <p className="text-[10px] text-gray-600 leading-snug">
              Accede a la carta digital interactiva, promociones del día y realiza tu pedido directo a la cocina.
            </p>
          </div>

          {/* Despedida */}
          <div className="pt-2 border-t border-gray-200 w-full text-center">
            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">
              ¡El Sabor Que Nos Une! • ¡Buen Provecho!
            </span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-2xl border border-gray-700 active:scale-95 transition-all shadow-md min-h-[44px]"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Descargar QR</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 hover:opacity-90 text-white text-xs font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-amber-500/25 min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Tarjeta</span>
          </button>
        </div>
      </div>
    </div>
  );
}

