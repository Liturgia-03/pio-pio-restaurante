export const BOGOTA_TIMEZONE = "America/Bogota";

export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea fecha y hora completa en la zona horaria oficial de Colombia (UTC-5)
 * Ejemplo: "24/11/2026, 11:28 a. m."
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Formatea únicamente la hora en la zona horaria oficial de Colombia (UTC-5)
 * Ejemplo: "11:28 a. m."
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Formatea únicamente la fecha en la zona horaria oficial de Colombia (UTC-5)
 * Ejemplo: "24/11/2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Retorna los límites de inicio y fin en UTC de un día calendario en Colombia (UTC-5).
 * El día en Colombia va desde 05:00:00 UTC hasta 04:59:59.999 UTC del día siguiente.
 */
export function getBogotaDayBounds(dateStr?: string): { startDate: Date; endDate: Date } {
  let y: number, m: number, d: number;
  if (dateStr && dateStr.includes("-")) {
    const parts = dateStr.split("-").map(Number);
    y = parts[0];
    m = parts[1];
    d = parts[2];
  } else {
    // Si no se pasa dateStr, obtener fecha actual en Bogotá
    const nowBogota = new Intl.DateTimeFormat("en-CA", {
      timeZone: BOGOTA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const parts = nowBogota.split("-").map(Number);
    y = parts[0];
    m = parts[1];
    d = parts[2];
  }

  // 00:00:00 hora Colombia = 05:00:00 UTC
  const startDate = new Date(Date.UTC(y, m - 1, d, 5, 0, 0, 0));
  // 23:59:59.999 hora Colombia = 04:59:59.999 UTC del día siguiente
  const endDate = new Date(Date.UTC(y, m - 1, d + 1, 4, 59, 59, 999));

  return { startDate, endDate };
}


