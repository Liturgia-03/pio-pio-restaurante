/**
 * Utilidades para cálculo de ventas, métodos de pago y arqueo de caja
 */

export interface ParsedPayment {
  method: "CASH" | "NEQUI" | "CARD" | "MIXED";
  cash: number;
  digital: number;
  card: number;
  total: number;
}

export function parseSessionPayment(session: {
  total: number;
  closedBy?: string | null;
}): ParsedPayment {
  const desc = session.closedBy || "";
  const total = Number(session.total || 0);

  if (desc.includes("Pago Mixto")) {
    // Ej: Pago Mixto (Efectivo: $20.000 + Nequi: $15.000)
    const cashMatch = desc.match(/Efectivo:\s*\$([0-9.,]+)/i);
    const nequiMatch = desc.match(/Nequi:\s*\$([0-9.,]+)/i);

    const cashVal = cashMatch
      ? Number(cashMatch[1].replace(/\./g, "").replace(/,/g, ""))
      : Math.floor(total / 2);
    const digitalVal = nequiMatch
      ? Number(nequiMatch[1].replace(/\./g, "").replace(/,/g, ""))
      : total - cashVal;

    return {
      method: "MIXED",
      cash: isNaN(cashVal) ? Math.floor(total / 2) : cashVal,
      digital: isNaN(digitalVal) ? Math.ceil(total / 2) : digitalVal,
      card: 0,
      total,
    };
  }

  if (desc.includes("Nequi") || desc.includes("Daviplata")) {
    return { method: "NEQUI", cash: 0, digital: total, card: 0, total };
  }

  if (
    desc.includes("Tarjeta") ||
    desc.includes("Datáfono") ||
    desc.includes("Datafono") ||
    desc.includes("CARD")
  ) {
    return { method: "CARD", cash: 0, digital: 0, card: total, total };
  }

  // Efectivo por defecto
  return { method: "CASH", cash: total, digital: 0, card: 0, total };
}

export const EXPENSE_CATEGORIES: Record<
  string,
  { label: string; icon: string; color: string; badgeBg: string }
> = {
  POLLO_CARNES: {
    label: "Pollo & Carnes",
    icon: "🍗",
    color: "text-amber-400",
    badgeBg: "bg-amber-950/60 border-amber-600/40",
  },
  CARBON_GAS: {
    label: "Carbón, Leña & Gas",
    icon: "🔥",
    color: "text-orange-400",
    badgeBg: "bg-orange-950/60 border-orange-600/40",
  },
  VERDURAS_PLAZA: {
    label: "Verduras & Plaza",
    icon: "🥔",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-950/60 border-emerald-600/40",
  },
  EMPAQUES_DESECHABLES: {
    label: "Empaques & Desechables",
    icon: "📦",
    color: "text-cyan-400",
    badgeBg: "bg-cyan-950/60 border-cyan-600/40",
  },
  SERVICIOS_MANTENIMIENTO: {
    label: "Servicios & Mantenimiento",
    icon: "💡",
    color: "text-indigo-400",
    badgeBg: "bg-indigo-950/60 border-indigo-600/40",
  },
  PERSONAL_ADELANTOS: {
    label: "Personal & Adelantos",
    icon: "👥",
    color: "text-purple-400",
    badgeBg: "bg-purple-950/60 border-purple-600/40",
  },
  VARIOS: {
    label: "Otros Gastos Varios",
    icon: "🏷️",
    color: "text-gray-400",
    badgeBg: "bg-gray-800/80 border-gray-700",
  },
};
