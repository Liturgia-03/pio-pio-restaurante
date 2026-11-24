import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Listar gastos con filtros opcionales
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get("shiftId");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};
    if (shiftId) where.cashShiftId = shiftId;
    if (category) where.category = category;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
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

    return NextResponse.json({
      success: true,
      data: expenses,
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
