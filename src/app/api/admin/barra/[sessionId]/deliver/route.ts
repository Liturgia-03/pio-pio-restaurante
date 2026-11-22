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

    const {
      paymentMethod,
      cashPaidAmount,
      cashChange,
      mixedCash,
      mixedTransfer,
    } = body;

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: { items: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Pedido de barra no encontrado" },
        { status: 404 }
      );
    }

    if (session.status === "CLOSED") {
      return NextResponse.json(
        { success: false, message: "Este pedido ya fue entregado y cobrado" },
        { status: 400 }
      );
    }

    const wasAlreadyPaid = session.closedBy?.startsWith("PAGADO_PREVIO");

    let finalClosedBy = "";
    if (wasAlreadyPaid) {
      const prevMethod = session.closedBy?.replace("PAGADO_PREVIO: ", "") || "Pagado";
      finalClosedBy = `Admin en Barra [Entregado] • ${prevMethod}`;
    } else {
      // Se cobró al momento de la entrega
      let paymentDesc = "Efectivo";
      if (paymentMethod === "CASH") {
        paymentDesc = `Efectivo${cashPaidAmount ? ` (Paga: $${Number(cashPaidAmount).toLocaleString()}, Cambio: $${Number(cashChange || 0).toLocaleString()})` : ""}`;
      } else if (paymentMethod === "NEQUI") {
        paymentDesc = "Nequi/Daviplata";
      } else if (paymentMethod === "CARD") {
        paymentDesc = "Datáfono/Tarjeta";
      } else if (paymentMethod === "MIXED") {
        paymentDesc = `Pago Mixto (Efectivo: $${Number(mixedCash || 0).toLocaleString()} + Nequi: $${Number(mixedTransfer || 0).toLocaleString()})`;
      }
      finalClosedBy = `Admin en Barra [Cobrado al Entregar] • ${paymentDesc}`;
    }

    const now = new Date();

    // Actualizar sesión a CLOSED y marcar entrega en todos los items
    const updated = await prisma.$transaction(async (tx) => {
      await tx.orderItem.updateMany({
        where: {
          tableSessionId: sessionId,
          deliveredAt: null,
        },
        data: {
          deliveredAt: now,
        },
      });

      return tx.tableSession.update({
        where: { id: sessionId },
        data: {
          status: "CLOSED",
          deliveredAt: now,
          closedAt: now,
          closedBy: finalClosedBy,
        },
        include: { items: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Pedido ${session.tableNumber} marcado como entregado y cobrado`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error al marcar pedido entregado en barra:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al entregar pedido" },
      { status: 500 }
    );
  }
}
