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

    let interShiftSummary = null;

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
    } else {
      // 2b. CAJA CERRADA: Calcular resumen inter-turno para sugerir la base automática
      // Buscar el último turno cerrado
      const lastClosedShift = await prisma.cashShift.findFirst({
        where: { status: "CLOSED" },
        orderBy: { closedAt: "desc" },
      });

      const sinceDate = lastClosedShift?.closedAt || new Date(0);

      // Ventas realizadas con caja cerrada
      const interSessions = await prisma.tableSession.findMany({
        where: {
          status: "CLOSED",
          closedAt: { gte: sinceDate },
        },
        include: {
          items: { where: { status: { not: "CANCELLED" } } },
        },
        orderBy: { closedAt: "asc" },
      });

      let interSalesCash = 0;
      let interSalesDigital = 0;
      let interSalesTotal = 0;

      interSessions.forEach((s) => {
        const parsed = parseSessionPayment(s);
        interSalesCash += parsed.cash;
        interSalesDigital += parsed.digital + parsed.card;
        interSalesTotal += parsed.total;
      });

      // Gastos realizados con caja cerrada
      const interExpenses = await prisma.expense.findMany({
        where: {
          cashShiftId: null,
          date: { gte: sinceDate },
        },
        orderBy: { date: "asc" },
      });

      let interExpensesCash = 0;
      let interExpensesDigital = 0;
      let interExpensesTotal = 0;

      interExpenses.forEach((exp) => {
        const amt = Number(exp.amount || 0);
        interExpensesTotal += amt;
        if (exp.paymentMethod === "CASH") {
          interExpensesCash += amt;
        } else {
          interExpensesDigital += amt;
        }
      });

      // Base dejada en el último cierre (o 0 si no hubo o se retiró todo)
      const baseLeft = Number(lastClosedShift?.baseLeftForNext ?? 0);

      // Base inicial sugerida para la próxima apertura de caja:
      // Base dejada + ventas en efectivo caja cerrada - gastos en efectivo caja cerrada
      const suggestedInitialCash = Math.max(0, baseLeft + interSalesCash - interExpensesCash);

      interShiftSummary = {
        lastClosedShiftId: lastClosedShift?.id || null,
        lastClosedAt: lastClosedShift?.closedAt || null,
        lastClosedBy: lastClosedShift?.closedBy || null,
        baseLeft,
        interSalesCash,
        interSalesDigital,
        interSalesTotal,
        interSalesCount: interSessions.length,
        interExpensesCash,
        interExpensesDigital,
        interExpensesTotal,
        interExpensesCount: interExpenses.length,
        suggestedInitialCash,
      };
    }

    // 7. Lista de últimos turnos liquidados para histórico rápido (con desglose de gastos)
    const recentClosedShifts = await prisma.cashShift.findMany({
      where: { status: "CLOSED" },
      take: 20,
      orderBy: { closedAt: "desc" },
      include: {
        expenses: {
          orderBy: { date: "asc" },
        },
        _count: { select: { expenses: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        activeShift,
        liveData,
        interShiftSummary,
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

    // Asociar gastos registrados con caja cerrada al nuevo turno activo
    await prisma.expense.updateMany({
      where: {
        cashShiftId: null,
      },
      data: {
        cashShiftId: shift.id,
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
    const { shiftId, actualCash, baseLeftForNext = 0, closedBy = "Admin en Caja", notes = "" } = body;

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
    const baseLeft = Math.max(0, Number(baseLeftForNext || 0));
    const withdrawnCash = Math.max(0, realCounted - baseLeft);
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
        baseLeftForNext: baseLeft,
        withdrawnCash,
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
      message: `Turno liquidado y cerrado exitosamente. Base dejada en caja: $${baseLeft.toLocaleString()} • Efectivo retirado: $${withdrawnCash.toLocaleString()} • Diferencia: ${difference === 0 ? "Cuadre exacto" : difference > 0 ? `Sobrante de $${difference.toLocaleString()}` : `Faltante de $${Math.abs(difference).toLocaleString()}`}`,
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
