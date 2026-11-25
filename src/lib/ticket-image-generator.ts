/**
 * Generador de Tirilla de Liquidación Gráfica de Alta Resolución (HD)
 * Pío Pío Asadero & Restaurante
 *
 * Genera una imagen PNG nítida estilo Factura POS Premium lista para descargar,
 * compartir por WhatsApp o imprimir, con resolución optimizada para pantallas retina.
 */

import { formatPrice, formatDateTime } from "./formatters";
import { EXPENSE_CATEGORIES } from "./caja-helpers";

export interface CashShiftDataForTicket {
  id: string;
  status: string;
  openedAt: string;
  closedAt?: string | null;
  openedBy: string;
  closedBy?: string | null;
  initialCash: number;
  expectedCash?: number | null;
  actualCash?: number | null;
  difference?: number | null;
  baseLeftForNext?: number | null;
  withdrawnCash?: number | null;
  totalSalesCash: number;
  totalSalesDigital: number;
  totalSalesCard: number;
  totalExpensesCash: number;
  totalExpensesDigital: number;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  notes?: string | null;
}

export interface ExpenseItemForTicket {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  responsible?: string | null;
  receiptNumber?: string | null;
}

// Función auxiliar para dibujar rectángulos redondeados con fallback universal
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Carga una imagen de forma asíncrona
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Genera el Blob PNG de la tirilla de liquidación en alta resolución
 */
export async function generateTicketImageBlob(
  shift: CashShiftDataForTicket,
  expenses: ExpenseItemForTicket[] = []
): Promise<Blob> {
  if (typeof window === "undefined" || !document) {
    throw new Error("Canvas sólo está disponible en el navegador.");
  }

  const DPR = 2; // Factor de alta resolución (Retina 2x)
  const W = 620; // Ancho virtual en px
  const pad = 28;
  const contentW = W - pad * 2;

  // Cargar logotipo oficial
  const logoImg = await loadImage("/logo-pio-pio.png");

  // Calcular altura dinámica
  let H = 30; // Margen superior
  H += 175; // Cabecera institucional
  H += 170; // Bloque 1: Ventas e Ingresos
  H += 15; // Espaciador

  // Bloque 2: Gastos
  const expenseCount = expenses.length;
  let expensesHeight = 65; // Título y subtotales base
  if (expenseCount === 0) {
    expensesHeight += 45;
  } else {
    expensesHeight += expenseCount * 44 + 40;
  }
  H += expensesHeight;
  H += 15; // Espaciador

  // Bloque 3: Arqueo de Caja Física
  H += 215;
  H += 15; // Espaciador

  // Bloque 4: Utilidad Neta
  H += 85;

  // Observaciones si existen
  if (shift.notes && shift.notes.trim()) {
    H += 60;
  }

  // Footer y margen inferior
  H += 65;

  // Crear Canvas
  const canvas = document.createElement("canvas");
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo inicializar el contexto 2D de Canvas");
  }

  // Escalar para alta definición
  ctx.scale(DPR, DPR);

  // Fondo principal blanco puro
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Marco exterior decorativo
  drawRoundRect(ctx, 12, 12, W - 24, H - 24, 20);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#e5e7eb";
  ctx.stroke();

  let curY = 32;

  // =========================================================================
  // 1. CABECERA INSTITUCIONAL
  // =========================================================================
  // Logotipo
  if (logoImg) {
    ctx.save();
    const logoSize = 54;
    const logoX = W / 2 - logoSize / 2;
    drawRoundRect(ctx, logoX, curY, logoSize, logoSize, 27);
    ctx.clip();
    ctx.drawImage(logoImg, logoX, curY, logoSize, logoSize);
    ctx.restore();
    curY += logoSize + 10;
  }

  // Nombre del Asadero
  ctx.fillStyle = "#111827";
  ctx.font = "900 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PÍO PÍO ASADERO & RESTAURANTE", W / 2, curY);
  curY += 17;

  // Subtítulo
  ctx.fillStyle = "#6b7280";
  ctx.font = "800 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("COMPROBANTE DE CIERRE Y LIQUIDACIÓN DE CAJA", W / 2, curY);
  curY += 16;

  // Caja de datos del turno (Apertura, Cierre, Cajero)
  const metaBoxH = 62;
  drawRoundRect(ctx, pad, curY, contentW, metaBoxH, 12);
  ctx.fillStyle = "#f9fafb";
  ctx.fill();
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "600 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#4b5563";

  // Apertura
  ctx.fillText("Apertura:", pad + 14, curY + 18);
  ctx.font = "700 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#111827";
  ctx.fillText(`${formatDateTime(shift.openedAt)} (${shift.openedBy})`, pad + 78, curY + 18);

  // Cierre
  ctx.font = "600 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#4b5563";
  ctx.fillText("Cierre:", pad + 14, curY + 36);
  ctx.font = "700 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#111827";
  const closeStr = shift.closedAt ? formatDateTime(shift.closedAt) : formatDateTime(new Date());
  ctx.fillText(closeStr, pad + 78, curY + 36);

  // Cajero responsable
  ctx.font = "600 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#4b5563";
  ctx.fillText("Liquidado por:", pad + 14, curY + 53);
  ctx.font = "800 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#d97706";
  ctx.fillText((shift.closedBy || shift.openedBy || "Administrador").toUpperCase(), pad + 94, curY + 53);

  curY += metaBoxH + 16;

  // =========================================================================
  // 2. BLOQUE 1: RESUMEN DE VENTAS E INGRESOS (AMBAR / DORADO)
  // =========================================================================
  const salesBoxH = 158;
  drawRoundRect(ctx, pad, curY, contentW, salesBoxH, 14);
  ctx.fillStyle = "#fffbeb";
  ctx.fill();
  ctx.strokeStyle = "#fde68a";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Encabezado Bloque 1
  ctx.fillStyle = "#92400e";
  ctx.font = "900 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("1. RESUMEN DE INGRESOS Y VENTAS", pad + 14, curY + 22);

  // Desglose de 4 ítems
  const salesItems = [
    { label: "Base Inicial en Caja:", val: formatPrice(shift.initialCash), color: "#111827" },
    { label: "Ventas en Efectivo:", val: formatPrice(shift.totalSalesCash), color: "#059669" },
    { label: "Ventas Nequi / Transf.:", val: formatPrice(shift.totalSalesDigital), color: "#2563eb" },
    { label: "Ventas Tarjeta (Datáfono):", val: formatPrice(shift.totalSalesCard), color: "#7c3aed" },
  ];

  let itemY = curY + 44;
  salesItems.forEach((it) => {
    ctx.font = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#4b5563";
    ctx.textAlign = "left";
    ctx.fillText(it.label, pad + 14, itemY);

    ctx.font = "800 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = it.color;
    ctx.textAlign = "right";
    ctx.fillText(it.val, W - pad - 14, itemY);

    itemY += 21;
  });

  // Cintillo de Total Ventas Recaudadas
  const totalBarY = curY + 120;
  drawRoundRect(ctx, pad + 10, totalBarY, contentW - 20, 28, 8);
  ctx.fillStyle = "#fef3c7";
  ctx.fill();
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = "900 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#78350f";
  ctx.textAlign = "left";
  ctx.fillText("VENTAS TOTALES DEL TURNO:", pad + 20, totalBarY + 18);

  ctx.font = "900 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#b45309";
  ctx.textAlign = "right";
  ctx.fillText(formatPrice(shift.totalSales), W - pad - 20, totalBarY + 18);

  curY += salesBoxH + 14;

  // =========================================================================
  // 3. BLOQUE 2: DETALLE DE GASTOS OPERATIVOS (ROJO SUAVE)
  // =========================================================================
  drawRoundRect(ctx, pad, curY, contentW, expensesHeight, 14);
  ctx.fillStyle = "#fff1f2";
  ctx.fill();
  ctx.strokeStyle = "#fecdd3";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Encabezado Bloque 2
  ctx.fillStyle = "#9f1239";
  ctx.font = "900 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`2. GASTOS OPERATIVOS (${expenseCount})`, pad + 14, curY + 22);

  ctx.font = "900 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#e11d48";
  ctx.textAlign = "right";
  ctx.fillText(`-${formatPrice(shift.totalExpenses)}`, W - pad - 14, curY + 22);

  let expItemY = curY + 44;

  if (expenseCount === 0) {
    ctx.font = "italic 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.fillText("Sin egresos registrados en este turno ($ 0)", W / 2, expItemY);
    expItemY += 28;
  } else {
    // Listar cada gasto
    expenses.forEach((exp, idx) => {
      const catInfo = EXPENSE_CATEGORIES[exp.category];
      const methodLabel = exp.paymentMethod === "CASH" ? "Efectivo" : "Nequi/Transf.";

      // Fila principal: Número + Descripción y Monto
      ctx.font = "800 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#1f2937";
      ctx.textAlign = "left";
      const desc = `${idx + 1}. ${exp.description}`;
      // Truncar si es muy largo
      ctx.fillText(desc.length > 40 ? desc.slice(0, 38) + "..." : desc, pad + 16, expItemY);

      ctx.font = "900 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#e11d48";
      ctx.textAlign = "right";
      ctx.fillText(`-${formatPrice(exp.amount)}`, W - pad - 16, expItemY);

      // Sublínea: Categoría, Método, Responsable
      ctx.font = "500 9.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "left";
      let metaText = `${catInfo?.label || exp.category} • ${methodLabel}`;
      if (exp.responsible) metaText += ` • Resp: ${exp.responsible}`;
      if (exp.receiptNumber) metaText += ` • #${exp.receiptNumber}`;
      ctx.fillText(metaText, pad + 28, expItemY + 14);

      // Línea divisoria muy tenue entre gastos
      if (idx < expenseCount - 1) {
        ctx.beginPath();
        ctx.moveTo(pad + 16, expItemY + 22);
        ctx.lineTo(W - pad - 16, expItemY + 22);
        ctx.strokeStyle = "#ffe4e6";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      expItemY += 44;
    });

    // Subtotales de gastos (Efectivo vs Digital)
    ctx.beginPath();
    ctx.moveTo(pad + 14, expItemY);
    ctx.lineTo(W - pad - 14, expItemY);
    ctx.strokeStyle = "#fecdd3";
    ctx.lineWidth = 1;
    ctx.stroke();
    expItemY += 16;

    ctx.font = "600 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#4b5563";
    ctx.textAlign = "left";
    ctx.fillText(`Efectivo: -${formatPrice(shift.totalExpensesCash)}`, pad + 16, expItemY);

    ctx.textAlign = "right";
    ctx.fillText(`Digital / Nequi: -${formatPrice(shift.totalExpensesDigital)}`, W - pad - 16, expItemY);
  }

  curY += expensesHeight + 14;

  // =========================================================================
  // 4. BLOQUE 3: ARQUEO DE CAJA FÍSICA & LIQUIDACIÓN
  // =========================================================================
  const auditBoxH = 205;
  drawRoundRect(ctx, pad, curY, contentW, auditBoxH, 14);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Título Bloque 3
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("3. ARQUEO DE CAJA FÍSICA & CONCILIACIÓN", pad + 14, curY + 22);

  // Dos tarjetas comparativas: Efectivo Esperado vs Efectivo Real Contado
  const cardW = (contentW - 36) / 2;
  const cardH = 50;
  const cardY = curY + 34;

  // Tarjeta Esperado
  drawRoundRect(ctx, pad + 14, cardY, cardW, cardH, 10);
  ctx.fillStyle = "#f1f5f9";
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = "700 9.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("EFECTIVO ESPERADO", pad + 24, cardY + 18);

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(formatPrice(shift.expectedCash || 0), pad + 24, cardY + 38);

  // Tarjeta Real Contado
  const card2X = pad + 14 + cardW + 8;
  drawRoundRect(ctx, card2X, cardY, cardW, cardH, 10);
  ctx.fillStyle = "#f1f5f9";
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = "700 9.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("EFECTIVO REAL CONTADO", card2X + 10, cardY + 18);

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(formatPrice(shift.actualCash || 0), card2X + 10, cardY + 38);

  // Badge de Estado de Cuadre
  const diff = shift.difference || 0;
  const badgeY = cardY + cardH + 10;
  drawRoundRect(ctx, pad + 14, badgeY, contentW - 28, 30, 8);

  let badgeBg = "#ecfdf5";
  let badgeBorder = "#a7f3d0";
  let badgeText = "#065f46";
  let badgeLabel = `✓ CUADRE EXACTO ($ 0)`;

  if (diff > 0) {
    badgeBg = "#eff6ff";
    badgeBorder = "#bfdbfe";
    badgeText = "#1e40af";
    badgeLabel = `▲ SOBRANTE DE DINERO (+${formatPrice(diff)})`;
  } else if (diff < 0) {
    badgeBg = "#fef2f2";
    badgeBorder = "#fecaca";
    badgeText = "#991b1b";
    badgeLabel = `▼ FALTANTE EN CAJA (-${formatPrice(Math.abs(diff))})`;
  }

  ctx.fillStyle = badgeBg;
  ctx.fill();
  ctx.strokeStyle = badgeBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = badgeText;
  ctx.font = "900 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(badgeLabel, W / 2, badgeY + 19);

  // Desglose de Destino del Dinero (Base vs Retiro)
  const destY = badgeY + 44;
  ctx.font = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.textAlign = "left";
  ctx.fillText("Base que queda en Caja (Próx. Turno):", pad + 14, destY);

  ctx.font = "800 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#d97706";
  ctx.textAlign = "right";
  ctx.fillText(formatPrice(shift.baseLeftForNext || 0), W - pad - 14, destY);

  const withdrawY = destY + 22;
  const withdrawVal =
    shift.withdrawnCash !== null && shift.withdrawnCash !== undefined
      ? shift.withdrawnCash
      : Math.max(0, (shift.actualCash || 0) - (shift.baseLeftForNext || 0));

  ctx.font = "700 11.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#047857";
  ctx.textAlign = "left";
  ctx.fillText("💵 Efectivo a Retirar / Consignar:", pad + 14, withdrawY);

  ctx.font = "900 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#065f46";
  ctx.textAlign = "right";
  ctx.fillText(formatPrice(withdrawVal), W - pad - 14, withdrawY);

  curY += auditBoxH + 14;

  // =========================================================================
  // 5. BLOQUE 4: UTILIDAD NETA DEL TURNO
  // =========================================================================
  const profitBoxH = 75;
  drawRoundRect(ctx, pad, curY, contentW, profitBoxH, 14);
  ctx.fillStyle = "#ecfdf5";
  ctx.fill();
  ctx.strokeStyle = "#6ee7b7";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = "#065f46";
  ctx.font = "900 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("UTILIDAD NETA DEL TURNO (Ventas - Gastos)", pad + 16, curY + 26);

  ctx.font = "900 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#047857";
  ctx.textAlign = "left";
  ctx.fillText(formatPrice(shift.netProfit), pad + 16, curY + 54);

  curY += profitBoxH + 12;

  // Observaciones si existen
  if (shift.notes && shift.notes.trim()) {
    drawRoundRect(ctx, pad, curY, contentW, 48, 10);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.stroke();

    ctx.font = "700 9.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "left";
    ctx.fillText("OBSERVACIONES DE CIERRE:", pad + 12, curY + 18);

    ctx.font = "500 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#1e293b";
    const noteText = shift.notes.length > 70 ? shift.notes.slice(0, 68) + "..." : shift.notes;
    ctx.fillText(noteText, pad + 12, curY + 34);

    curY += 58;
  }

  // =========================================================================
  // 6. PIE DE COMPROBANTE
  // =========================================================================
  ctx.font = "600 9.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#9ca3af";
  ctx.textAlign = "center";
  ctx.fillText("Comprobante generado por Sistema Pío Pío POS", W / 2, curY + 16);
  ctx.fillText(`ID de Auditoría: ${shift.id.slice(0, 18)} • www.piopio.com`, W / 2, curY + 30);

  // Retornar como Blob PNG
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("No se pudo generar el Blob PNG del comprobante"));
      }
    }, "image/png");
  });
}

/**
 * Descarga directamente la imagen PNG en el dispositivo del usuario
 */
export async function downloadTicketImage(
  shift: CashShiftDataForTicket,
  expenses: ExpenseItemForTicket[] = []
): Promise<void> {
  const blob = await generateTicketImageBlob(shift, expenses);
  const dateStr = (shift.closedAt ? new Date(shift.closedAt) : new Date())
    .toISOString()
    .slice(0, 10);
  const fileName = `Tirilla-Liquidacion-PioPio-${dateStr}.png`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Comparte la imagen PNG mediante Web Share API (con fallback de descarga o portapapeles)
 */
export async function shareTicketImage(
  shift: CashShiftDataForTicket,
  expenses: ExpenseItemForTicket[] = []
): Promise<{ sharedAsFile: boolean }> {
  const blob = await generateTicketImageBlob(shift, expenses);
  const dateStr = (shift.closedAt ? new Date(shift.closedAt) : new Date())
    .toISOString()
    .slice(0, 10);
  const fileName = `Tirilla-Liquidacion-PioPio-${dateStr}.png`;

  const file = new File([blob], fileName, { type: "image/png" });
  const title = `Tirilla de Liquidación - Pío Pío (${dateStr})`;
  const text = `Comprobante de cierre y liquidación de caja - Pío Pío Asadero & Restaurante`;

  if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return { sharedAsFile: true };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { sharedAsFile: true }; // El usuario canceló la ventana de compartir
      }
    }
  }

  // Fallback si el navegador no permite compartir archivos: Descargar la imagen automáticamente
  await downloadTicketImage(shift, expenses);
  return { sharedAsFile: false };
}
