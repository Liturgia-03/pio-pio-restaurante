import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || "confirm"; // "confirm" | "reject"

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: { items: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesión de mesa no encontrada" },
        { status: 404 }
      );
    }

    if (action === "confirm") {
      // Pasar todos los ítems pendientes a CONFIRMED
      await prisma.orderItem.updateMany({
        where: {
          tableSessionId: sessionId,
          status: "PENDING_CONFIRMATION",
        },
        data: {
          status: "CONFIRMED",
        },
      });

      // Recalcular total
      const validItems = await prisma.orderItem.findMany({
        where: {
          tableSessionId: sessionId,
          status: { not: "CANCELLED" },
        },
      });

      const total = validItems.reduce((acc, it) => acc + Number(it.subtotal), 0);

      await prisma.tableSession.update({
        where: { id: sessionId },
        data: {
          status: "OPEN",
          total,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Pedido confirmado y marchado a cocina exitosamente",
      });
    } else {
      // Rechazar / descartar ítems pendientes
      await prisma.orderItem.updateMany({
        where: {
          tableSessionId: sessionId,
          status: "PENDING_CONFIRMATION",
        },
        data: {
          status: "CANCELLED",
          cancelledReason: body.reason || "Rechazado por mesero o caja",
        },
      });

      // Verificar si quedan ítems confirmados
      const confirmedItems = await prisma.orderItem.findMany({
        where: {
          tableSessionId: sessionId,
          status: "CONFIRMED",
        },
      });

      if (confirmedItems.length === 0) {
        // Si no queda nada confirmado, liberar la mesa cerrando la sesión
        await prisma.tableSession.update({
          where: { id: sessionId },
          data: {
            status: "CLOSED",
            closedAt: new Date(),
            closedBy: "Descartado",
            total: 0,
          },
        });
      } else {
        const total = confirmedItems.reduce((acc, it) => acc + Number(it.subtotal), 0);
        await prisma.tableSession.update({
          where: { id: sessionId },
          data: {
            status: "OPEN",
            total,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Pedido rechazado y removido de la comanda",
      });
    }
  } catch (error: any) {
    console.error("Error al confirmar pedido:", error);
    return NextResponse.json(
      { success: false, message: "Error al procesar confirmación", error: error.message },
      { status: 500 }
    );
  }
}
