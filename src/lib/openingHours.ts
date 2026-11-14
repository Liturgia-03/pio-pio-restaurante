/**
 * Utilidades para calcular si el restaurante se encuentra ABIERTO o CERRADO
 * en tiempo real según el horario configurado en el panel administrativo.
 */

export interface RestaurantOpenStatus {
  isOpen: boolean;
  label: string;       // "🟢 Abierto ahora" | "🔴 Cerrado ahora"
  shortLabel: string;  // "🟢 Abierto" | "🔴 Cerrado"
  badgeClass: string;
  dotColor: string;
}

/**
 * Obtiene la hora y minutos actuales en la zona horaria de Colombia (America/Bogota - UTC-5)
 */
export function getColombiaCurrentTime(): { hours: number; minutes: number; totalMinutes: number } {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hours = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minutes = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    return { hours, minutes, totalMinutes: hours * 60 + minutes };
  } catch {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return { hours, minutes, totalMinutes: hours * 60 + minutes };
  }
}

/**
 * Convierte una expresión de hora (ej: "8:00 AM", "10:00 PM", "22:00", "8 AM") a minutos del día (0 - 1439)
 */
function parseTimeToMinutes(timeStr: string, isEnd = false): number | null {
  const clean = timeStr.trim().toLowerCase();
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3];

  if (period === "pm" && hour < 12) {
    hour += 12;
  } else if (period === "am" && hour === 12) {
    hour = 0;
  } else if (!period) {
    // Si no tiene AM/PM, pero es horario de restaurante (ej. "8 a 10" o "10 a 9")
    if (isEnd && hour < 12 && hour <= 9) {
      hour += 12; // "9" suele ser 9 PM (21:00) en cierres de restaurante
    }
  }

  return hour * 60 + minute;
}

/**
 * Parsea el horario del restaurante (ej: "Lunes a Domingo: 08:00 AM a 10:00 PM")
 * y devuelve el estado actual: Abierto o Cerrado.
 */
export function getRestaurantOpenStatus(scheduleStr?: string | null): RestaurantOpenStatus {
  if (!scheduleStr || !scheduleStr.trim()) {
    return {
      isOpen: true,
      label: "🟢 Abierto ahora",
      shortLabel: "🟢 Abierto",
      badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-400",
    };
  }

  // Extraer patrones de horas (ej: "08:00 AM" y "10:00 PM", o "8:00 - 22:00", o "8:00 a 21:00")
  // Buscamos todas las ocurrencias de horas con o sin AM/PM
  const timeRegex = /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/gi;
  const matches = scheduleStr.match(timeRegex);

  if (!matches || matches.length < 2) {
    // Si no se pueden identificar dos horas, fallback abierto
    return {
      isOpen: true,
      label: "🟢 Abierto ahora",
      shortLabel: "🟢 Abierto",
      badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-400",
    };
  }

  const startStr = matches[0];
  const endStr = matches[matches.length - 1]; // Tomar la última hora encontrada como hora de cierre

  const startMinutes = parseTimeToMinutes(startStr, false);
  const endMinutes = parseTimeToMinutes(endStr, true);

  if (startMinutes === null || endMinutes === null) {
    return {
      isOpen: true,
      label: "🟢 Abierto ahora",
      shortLabel: "🟢 Abierto",
      badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-400",
    };
  }

  const current = getColombiaCurrentTime();
  const currentMinutes = current.totalMinutes;

  let isOpen = false;
  if (startMinutes < endMinutes) {
    // Horario habitual el mismo día (ej: 08:00 a 22:00)
    isOpen = currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Horario que cruza la medianoche (ej: 18:00 a 02:00)
    isOpen = currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  if (isOpen) {
    return {
      isOpen: true,
      label: "🟢 Abierto ahora",
      shortLabel: "🟢 Abierto",
      badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-400",
    };
  } else {
    return {
      isOpen: false,
      label: "🔴 Cerrado ahora",
      shortLabel: "🔴 Cerrado",
      badgeClass: "bg-red-500/20 text-red-400 border-red-500/30",
      dotColor: "bg-red-400",
    };
  }
}
