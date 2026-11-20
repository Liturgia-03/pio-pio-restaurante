import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
        },
      },
    });

    if (!session || session.status === "CLOSED") {
      return NextResponse.json(
        { success: false, message: "Sesión de mesa no encontrada o ya cerrada" },
        { status: 404 }
      );
    }

    const now = new Date();

    // Actualizar todos los ítems activos pendientes de entrega
    const updateResult = await prisma.orderItem.updateMany({
      where: {
        tableSessionId: sessionId,
        status: { not: "CANCELLED" },
        deliveredAt: null,
      },
      data: {
        deliveredAt: now,
      },
    });

    // Actualizar la fecha de última entrega en la sesión
    await prisma.tableSession.update({
      where: { id: sessionId },
      data: {
        deliveredAt: now,
      },
    });

    revalidatePath("/waiter");
    revalidatePath("/admin/tables");
    revalidatePath("/menu");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        tableNumber: session.tableNumber,
        deliveredCount: updateResult.count,
        deliveredAt: now,
      },
      message: `Mesa #${session.tableNumber}: ${
        updateResult.count > 0 ? "Pedido / adición marcada como entregada en mesa" : "Pedido ya estaba entregado"
      }`,
    });
  } catch (error: any) {
    console.error("Error al marcar pedido como entregado:", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar estado de entrega", error: error.message },
      { status: 500 }
    );
  }
}
