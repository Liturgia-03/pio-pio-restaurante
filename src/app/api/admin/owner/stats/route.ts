import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseSessionPayment } from "@/lib/caja-helpers";
import { getBogotaDayBounds } from "@/lib/formatters";

export const dynamic = "force-dynamic";

// GET: Estadísticas ejecutivas consolidadas en tiempo real para el Dueño (Super Admin)
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "No autenticado", error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1. Rango del día en hora Colombia (Bogotá, UTC-5)
    const { startDate, endDate } = getBogotaDayBounds();

    // 2. Turno de caja abierto actualmente
    const activeShift = await prisma.cashShift.findFirst({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    // 3. Ventas cobradas hoy (TableSession cerrada hoy)
    const closedSessionsToday = await prisma.tableSession.findMany({
      where: {
        status: "CLOSED",
        closedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
        },
      },
      orderBy: { closedAt: "desc" },
    });

    let salesTotal = 0;
    let salesCash = 0;
    let salesDigital = 0;
    let salesCard = 0;
    let salesMesas = 0;
    let salesBarra = 0;

    closedSessionsToday.forEach((s) => {
      const parsed = parseSessionPayment(s);
      salesTotal += parsed.total;
      salesCash += parsed.cash;
      salesDigital += parsed.digital;
      salesCard += parsed.card;

      if (s.tableNumber.toUpperCase().includes("BARRA")) {
        salesBarra += parsed.total;
      } else {
        salesMesas += parsed.total;
      }
    });

    // 4. Gastos operativos registrados hoy
    const expensesToday = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc" },
    });

    let expensesTotal = 0;
    let expensesCash = 0;
    let expensesDigital = 0;

    expensesToday.forEach((exp) => {
      const amt = Number(exp.amount || 0);
      expensesTotal += amt;
      if (exp.paymentMethod === "CASH") {
        expensesCash += amt;
      } else {
        expensesDigital += amt;
      }
    });

    // 5. Arqueo y cálculo de efectivo en vivo
    const shiftInitialCash = activeShift ? Number(activeShift.initialCash || 0) : 0;
    const expectedCashInDrawer = shiftInitialCash + salesCash - expensesCash;
    const netProfitToday = salesTotal - expensesTotal;

    // 6. Mesas activas en salón en este instante
    const activeTables = await prisma.tableSession.findMany({
      where: {
        status: { in: ["OPEN", "PENDING_CONFIRMATION", "BILL_REQUESTED"] },
      },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
        },
        waiter: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const pendingConfirmationCount = activeTables.filter(
      (t) => t.status === "PENDING_CONFIRMATION"
    ).length;
    const billRequestedCount = activeTables.filter(
      (t) => t.status === "BILL_REQUESTED"
    ).length;
    const totalPendingCashInTables = activeTables.reduce(
      (acc, t) => acc + Number(t.total || 0),
      0
    );

    // Ajustes generales (número total de mesas)
    const settings = await prisma.restaurantSettings.findFirst({
      select: { totalTables: true, adminPin: true },
    });
    const totalTablesCount = settings?.totalTables || 15;
    const occupiedTablesCount = activeTables.filter((t) => !t.tableNumber.toUpperCase().includes("BARRA")).length;
    const freeTablesCount = Math.max(0, totalTablesCount - occupiedTablesCount);

    // 7. Feed de cobros del día (todos los movimientos)
    const recentSalesFeed = closedSessionsToday.map((s) => {
      const parsed = parseSessionPayment(s);
      return {
        id: s.id,
        tableNumber: s.tableNumber,
        total: parsed.total,
        cash: parsed.cash,
        digital: parsed.digital,
        card: parsed.card,
        closedAt: s.closedAt,
        closedBy: s.closedBy || "Caja",
        itemsCount: s.items.length,
      };
    });

    // 8. Feed de gastos del día (todos los movimientos)
    const recentExpensesFeed = expensesToday.map((e) => ({
      id: e.id,
      description: e.description,
      amount: Number(e.amount),
      category: e.category,
      paymentMethod: e.paymentMethod,
      responsible: e.responsible,
      receiptNumber: e.receiptNumber,
      date: e.date,
    }));

    return NextResponse.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        shift: activeShift
          ? {
              id: activeShift.id,
              status: activeShift.status,
              openedAt: activeShift.openedAt,
              openedBy: activeShift.openedBy,
              initialCash: shiftInitialCash,
            }
          : null,
        kpis: {
          salesTotal,
          salesCash,
          salesDigital: salesDigital + salesCard,
          salesCount: closedSessionsToday.length,
          salesMesas,
          salesBarra,
          expensesTotal,
          expensesCash,
          expensesDigital,
          expensesCount: expensesToday.length,
          expectedCashInDrawer,
          netProfitToday,
        },
        salon: {
          totalTables: totalTablesCount,
          occupiedTables: occupiedTablesCount,
          freeTables: freeTablesCount,
          pendingConfirmationCount,
          billRequestedCount,
          totalPendingCashInTables,
          activeSessionsCount: activeTables.length,
        },
        recentSales: recentSalesFeed,
        recentExpenses: recentExpensesFeed,
      },
    });
  } catch (error: any) {
    console.error("Error al obtener estadísticas del dueño:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
