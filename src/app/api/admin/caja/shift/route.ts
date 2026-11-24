import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseSessionPayment } from "@/lib/caja-helpers";

export const dynamic = "force-dynamic";

// GET: Obtener el turno de caja activo en vivo y los turnos cerrados recientes
export async function GET() {
  try {
    // 1. Buscar turno abierto actualmente
    const activeShift = await prisma.cashShift.findFirst({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    let liveData = null;

    if (activeShift) {
      // 2. Traer todas las ventas cerradas desde la apertura del turno
      const closedSessions = await prisma.tableSession.findMany({
        where: {
          status: "CLOSED",
          closedAt: {
            gte: activeShift.openedAt,
          },
        },
        include: {
          items: {
            where: { status: { not: "CANCELLED" } },
          },
        },
        orderBy: { closedAt: "desc" },
      });

      // 3. Traer todos los gastos registrados en este turno
      const shiftExpenses = await prisma.expense.findMany({
        where: {
          cashShiftId: activeShift.id,
        },
        orderBy: { date: "desc" },
      });

      // 4. Calcular acumulados de ventas por método de pago
      let salesCash = 0;
      let salesDigital = 0;
      let salesCard = 0;
      let totalSales = 0;
      let salesCount = closedSessions.length;

      let salesMesas = 0;
      let salesBarra = 0;

      closedSessions.forEach((session) => {
        const parsed = parseSessionPayment(session);
        salesCash += parsed.cash;
        salesDigital += parsed.digital;
        salesCard += parsed.card;
        totalSales += parsed.total;

        if (session.tableNumber.startsWith("BARRA")) {
          salesBarra += parsed.total;
        } else {
          salesMesas += parsed.total;
        }
      });

      // 5. Calcular acumulados de gastos
      let expensesCash = 0;
      let expensesDigital = 0;
      let totalExpenses = 0;

      shiftExpenses.forEach((exp) => {
        const amt = Number(exp.amount || 0);
        totalExpenses += amt;
        if (exp.paymentMethod === "CASH") {
          expensesCash += amt;
        } else {
          expensesDigital += amt;
        }
      });

      // 6. Efectivo esperado en caja = Base inicial + Ventas efectivo - Gastos pagados en efectivo
      const initialCash = Number(activeShift.initialCash || 0);
      const expectedCash = initialCash + salesCash - expensesCash;
      const netProfit = totalSales - totalExpenses;

      liveData = {
        salesCash,
        salesDigital,
        salesCard,
        totalSales,
        salesCount,
        salesMesas,
        salesBarra,
        expensesCash,
        expensesDigital,
        totalExpenses,
        expensesCount: shiftExpenses.length,
        initialCash,
        expectedCash,
        netProfit,
        recentSessions: closedSessions.slice(0, 15),
        recentExpenses: shiftExpenses.slice(0, 15),
      };
    }

    // 7. Lista de últimos 10 turnos liquidados para histórico rápido
    const recentClosedShifts = await prisma.cashShift.findMany({
      where: { status: "CLOSED" },
      take: 10,
      orderBy: { closedAt: "desc" },
      include: {
        _count: { select: { expenses: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        activeShift,
        liveData,
        recentClosedShifts,
      },
    });
  } catch (error: any) {
    console.error("Error al consultar turno de caja:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al consultar turno de caja" },
      { status: 500 }
    );
  }
}

// POST: Abrir un nuevo turno de caja (Registrar base inicial)
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { initialCash = 0, openedBy = "Admin en Caja", notes = "" } = body;

    // Verificar si ya hay un turno abierto
    const existing = await prisma.cashShift.findFirst({
      where: { status: "OPEN" },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Ya existe un turno de caja abierto iniciado por ${existing.openedBy} el ${new Date(existing.openedAt).toLocaleTimeString()}`,
        },
        { status: 400 }
      );
    }

    const shift = await prisma.cashShift.create({
      data: {
        initialCash: Math.max(0, Number(initialCash) || 0),
        openedBy: openedBy.trim() || "Admin en Caja",
        notes: notes.trim() || null,
        status: "OPEN",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Turno de caja abierto exitosamente con base de $${Number(shift.initialCash).toLocaleString()}`,
      data: shift,
    });
  } catch (error: any) {
    console.error("Error al abrir turno de caja:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al abrir turno de caja" },
      { status: 500 }
    );
  }
}

// PATCH: Liquidar y cerrar el turno de caja activo (Arqueo definitivo)
export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { shiftId, actualCash, closedBy = "Admin en Caja", notes = "" } = body;

    if (!shiftId) {
      return NextResponse.json(
        { success: false, message: "ID de turno requerido" },
        { status: 400 }
      );
    }

    const shift = await prisma.cashShift.findUnique({
      where: { id: shiftId },
    });

    if (!shift || shift.status === "CLOSED") {
      return NextResponse.json(
        { success: false, message: "El turno ya se encuentra cerrado o no existe" },
        { status: 400 }
      );
    }

    // Traer todas las ventas cerradas del turno
    const closedSessions = await prisma.tableSession.findMany({
      where: {
        status: "CLOSED",
        closedAt: {
          gte: shift.openedAt,
        },
      },
    });

    // Traer todos los gastos del turno
    const shiftExpenses = await prisma.expense.findMany({
      where: {
        cashShiftId: shift.id,
      },
    });

    // Calcular valores finales
    let totalSalesCash = 0;
    let totalSalesDigital = 0;
    let totalSalesCard = 0;
    let totalSales = 0;

    closedSessions.forEach((s) => {
      const parsed = parseSessionPayment(s);
      totalSalesCash += parsed.cash;
      totalSalesDigital += parsed.digital;
      totalSalesCard += parsed.card;
      totalSales += parsed.total;
    });

    let totalExpensesCash = 0;
    let totalExpensesDigital = 0;
    let totalExpenses = 0;

    shiftExpenses.forEach((exp) => {
      const amt = Number(exp.amount || 0);
      totalExpenses += amt;
      if (exp.paymentMethod === "CASH") {
        totalExpensesCash += amt;
      } else {
        totalExpensesDigital += amt;
      }
    });

    const initialCash = Number(shift.initialCash || 0);
    const expectedCash = initialCash + totalSalesCash - totalExpensesCash;
    const realCounted = Math.max(0, Number(actualCash || 0));
    const difference = realCounted - expectedCash;
    const netProfit = totalSales - totalExpenses;

    const closedAt = new Date();

    const updatedShift = await prisma.cashShift.update({
      where: { id: shiftId },
      data: {
        status: "CLOSED",
        closedAt,
        closedBy: closedBy.trim() || "Admin en Caja",
        expectedCash,
        actualCash: realCounted,
        difference,
        totalSalesCash,
        totalSalesDigital,
        totalSalesCard,
        totalExpensesCash,
        totalExpensesDigital,
        totalSales,
        totalExpenses,
        netProfit,
        notes: notes.trim() || shift.notes,
      },
      include: {
        expenses: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Turno liquidado y cerrado exitosamente. Diferencia: ${difference === 0 ? "Cuadre exacto" : difference > 0 ? `Sobrante de $${difference.toLocaleString()}` : `Faltante de $${Math.abs(difference).toLocaleString()}`}`,
      data: updatedShift,
    });
  } catch (error: any) {
    console.error("Error al liquidar turno de caja:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al liquidar turno de caja" },
      { status: 500 }
    );
  }
}
