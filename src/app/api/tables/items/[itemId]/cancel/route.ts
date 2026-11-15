import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Anulado por el Administrador en Caja";

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "Ítem no encontrado" },
        { status: 404 }
      );
    }

    // Marcar ítem como CANCELLED con su motivo
    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status: "CANCELLED",
        cancelledReason: reason,
      },
    });

    // Recalcular total de la sesión
    const remainingItems = await prisma.orderItem.findMany({
      where: {
        tableSessionId: item.tableSessionId,
        status: { not: "CANCELLED" },
      },
    });

    const newTotal = remainingItems.reduce((acc, it) => acc + Number(it.subtotal), 0);

    // Si ya no quedan ítems válidos en la sesión
    let newStatus = undefined;
    if (remainingItems.length === 0) {
      newStatus = "CLOSED" as const;
    }

    await prisma.tableSession.update({
      where: { id: item.tableSessionId },
      data: {
        total: newTotal,
        ...(newStatus ? { status: newStatus, closedAt: new Date(), closedBy: "Cancelación total" } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ítem anulado correctamente",
      data: {
        newTotal,
      },
    });
  } catch (error: any) {
    console.error("Error al anular ítem:", error);
    return NextResponse.json(
      { success: false, message: "Error al anular ítem", error: error.message },
      { status: 500 }
    );
  }
}
