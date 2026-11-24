import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseSessionPayment, EXPENSE_CATEGORIES } from "@/lib/caja-helpers";
import { getBogotaDayBounds } from "@/lib/formatters";

export const dynamic = "force-dynamic";

// GET: Generar reporte contable con filtros por Día, Semana, Mes y Año
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "day"; // "day" | "week" | "month" | "year" | "custom"
    const targetDateStr = searchParams.get("date"); // YYYY-MM-DD
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    let startDate: Date;
    let endDate: Date;

    if (period === "custom") {
      const startBounds = getBogotaDayBounds(startParam || undefined);
      const endBounds = getBogotaDayBounds(endParam || undefined);
      if (startBounds.startDate > endBounds.endDate) {
        startDate = endBounds.startDate;
        endDate = startBounds.endDate;
      } else {
        startDate = startBounds.startDate;
        endDate = endBounds.endDate;
      }
    } else {
      if (period === "day") {
        const bounds = getBogotaDayBounds(targetDateStr || undefined);
        startDate = bounds.startDate;
        endDate = bounds.endDate;
      } else {
        const baseDate = targetDateStr ? new Date(targetDateStr) : new Date();
        startDate = new Date(baseDate);
        endDate = new Date(baseDate);

        if (period === "week") {
          // Semana de Lunes a Domingo
          const day = startDate.getDay();
          const diffToMonday = day === 0 ? -6 : 1 - day; // domingo es 0
          startDate.setDate(startDate.getDate() + diffToMonday);
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        } else if (period === "month") {
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (period === "year") {
          startDate = new Date(baseDate.getFullYear(), 0, 1, 0, 0, 0, 0);
          endDate = new Date(baseDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        }
      }
    }

    // 1. Consultar ventas cerradas en el rango
    const sessions = await prisma.tableSession.findMany({
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
      orderBy: { closedAt: "asc" },
    });

    // 2. Consultar gastos en el rango
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // 3. Consultar turnos liquidados en el rango
    const shifts = await prisma.cashShift.findMany({
      where: {
        status: "CLOSED",
        closedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { closedAt: "desc" },
    });

    // 4. Calcular métricas de ventas
    let totalSales = 0;
    let salesCash = 0;
    let salesDigital = 0;
    let salesCard = 0;
    let salesMesas = 0;
    let salesBarra = 0;

    const dishCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};

    sessions.forEach((s) => {
      const parsed = parseSessionPayment(s);
      totalSales += parsed.total;
      salesCash += parsed.cash;
      salesDigital += parsed.digital;
      salesCard += parsed.card;

      if (s.tableNumber.startsWith("BARRA")) {
        salesBarra += parsed.total;
      } else {
        salesMesas += parsed.total;
      }

      s.items.forEach((it) => {
        if (!dishCounts[it.dishName]) {
          dishCounts[it.dishName] = { name: it.dishName, quantity: 0, revenue: 0 };
        }
        dishCounts[it.dishName].quantity += Number(it.quantity || 1);
        dishCounts[it.dishName].revenue += Number(it.subtotal || 0);
      });
    });

    const topDishes = Object.values(dishCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 5. Calcular métricas de gastos
    let totalExpenses = 0;
    let expensesCash = 0;
    let expensesDigital = 0;
    const expenseByCategory: Record<string, { category: string; label: string; amount: number; count: number }> = {};

    Object.keys(EXPENSE_CATEGORIES).forEach((cat) => {
      expenseByCategory[cat] = {
        category: cat,
        label: EXPENSE_CATEGORIES[cat].label,
        amount: 0,
        count: 0,
      };
    });

    expenses.forEach((e) => {
      const amt = Number(e.amount || 0);
      totalExpenses += amt;
      if (e.paymentMethod === "CASH") {
        expensesCash += amt;
      } else {
        expensesDigital += amt;
      }

      const catKey = e.category || "VARIOS";
      if (!expenseByCategory[catKey]) {
        expenseByCategory[catKey] = {
          category: catKey,
          label: EXPENSE_CATEGORIES[catKey]?.label || catKey,
          amount: 0,
          count: 0,
        };
      }
      expenseByCategory[catKey].amount += amt;
      expenseByCategory[catKey].count += 1;
    });

    // 6. Resumen financiero global
    const netProfit = totalSales - totalExpenses;
    const averageTicket = sessions.length > 0 ? Math.round(totalSales / sessions.length) : 0;

    const periodLabel =
      period === "custom"
        ? `Personalizado: ${startDate.toLocaleDateString()} al ${endDate.toLocaleDateString()}`
        : period === "day"
        ? `Día: ${startDate.toLocaleDateString()}`
        : period === "week"
        ? `Semana: ${startDate.toLocaleDateString()} al ${endDate.toLocaleDateString()}`
        : period === "month"
        ? `Mes: ${startDate.toLocaleString("es-ES", { month: "long", year: "numeric" })}`
        : `Año: ${startDate.getFullYear()}`;

    return NextResponse.json({
      success: true,
      data: {
        period,
        periodLabel,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        summary: {
          totalSales,
          totalExpenses,
          netProfit,
          averageTicket,
          ordersCount: sessions.length,
          expensesCount: expenses.length,
          shiftsCount: shifts.length,
        },
        salesBreakdown: {
          cash: salesCash,
          digital: salesDigital,
          card: salesCard,
          mesas: salesMesas,
          barra: salesBarra,
        },
        expensesBreakdown: {
          cash: expensesCash,
          digital: expensesDigital,
          byCategory: Object.values(expenseByCategory).filter((c) => c.amount > 0),
        },
        topDishes,
        recentShifts: shifts.slice(0, 8),
        recentExpenses: expenses.slice(-10).reverse(),
      },
    });
  } catch (error: any) {
    console.error("Error al generar reporte contable:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al generar reporte contable" },
      { status: 500 }
    );
  }
}
