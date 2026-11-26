import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getBogotaPeriodBounds } from "@/lib/formatters";

export const dynamic = "force-dynamic";

// GET: Listar gastos con filtros opcionales (período: día, semana, mes, año, personalizado)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period"); // "day" | "week" | "month" | "year" | "custom"
    const targetDateStr = searchParams.get("date");
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");
    const shiftId = searchParams.get("shiftId");
    const category = searchParams.get("category");
    const limitParam = searchParams.get("limit");

    const where: any = {};
    if (shiftId) where.cashShiftId = shiftId;
    if (category && category !== "ALL") where.category = category;

    let periodBounds: { startDate: Date; endDate: Date } | null = null;
    if (period) {
      periodBounds = getBogotaPeriodBounds(period, targetDateStr, startParam, endParam);
      where.date = {
        gte: periodBounds.startDate,
        lte: periodBounds.endDate,
      };
    }

    const takeLimit = limitParam ? parseInt(limitParam, 10) : (period ? undefined : 100);

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      ...(takeLimit ? { take: takeLimit } : {}),
      include: {
        cashShift: {
          select: {
            id: true,
            status: true,
            openedBy: true,
          },
        },
      },
    });

    // Calcular resumen consolidado
    let totalAmount = 0;
    let totalCash = 0;
    let totalTransfer = 0;
    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      totalAmount += amt;
      if (exp.paymentMethod === "CASH") {
        totalCash += amt;
      } else {
        totalTransfer += amt;
      }
    }

    return NextResponse.json({
      success: true,
      data: expenses,
      summary: {
        totalAmount,
        totalCash,
        totalTransfer,
        count: expenses.length,
      },
      periodBounds: periodBounds ? {
        startDate: periodBounds.startDate.toISOString(),
        endDate: periodBounds.endDate.toISOString(),
      } : null,
    });
  } catch (error: any) {
    console.error("Error al obtener gastos:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al obtener gastos" },
      { status: 500 }
    );
  }
}

// POST: Registrar nuevo gasto de caja menor o transferencia
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      category = "VARIOS",
      description,
      amount,
      paymentMethod = "CASH",
      responsible = "Admin en Caja",
      receiptNumber = null,
      date = null,
    } = body;

    if (!description || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, message: "Descripción y monto válido son requeridos" },
        { status: 400 }
      );
    }

    // Buscar si hay un turno de caja abierto para asociarlo automáticamente
    const activeShift = await prisma.cashShift.findFirst({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    const expense = await prisma.expense.create({
      data: {
        category,
        description: description.trim(),
        amount: Number(amount),
        paymentMethod: paymentMethod === "TRANSFER" ? "TRANSFER" : "CASH",
        responsible: responsible?.trim() || "Admin en Caja",
        receiptNumber: receiptNumber?.trim() || null,
        date: date ? new Date(date) : new Date(),
        cashShiftId: activeShift ? activeShift.id : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Gasto de $${Number(expense.amount).toLocaleString()} registrado exitosamente`,
      data: expense,
    });
  } catch (error: any) {
    console.error("Error al registrar gasto:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al registrar gasto" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un gasto
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID de gasto requerido" },
        { status: 400 }
      );
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Gasto eliminado correctamente",
    });
  } catch (error: any) {
    console.error("Error al eliminar gasto:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al eliminar gasto" },
      { status: 500 }
    );
  }
}
