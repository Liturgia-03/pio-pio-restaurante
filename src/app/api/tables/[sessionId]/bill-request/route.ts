import { NextResponse } from "next/server";
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
    });

    if (!session || session.status === "CLOSED") {
      return NextResponse.json(
        { success: false, message: "Sesión no válida o ya cerrada" },
        { status: 404 }
      );
    }

    // Validar que no haya platos o adiciones pendientes de entrega en mesa
    const pendingItemsCount = await prisma.orderItem.count({
      where: {
        tableSessionId: sessionId,
        status: { not: "CANCELLED" },
        deliveredAt: null,
      },
    });

    if (pendingItemsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No puedes pedir la cuenta todavía. Tus platos están siendo preparados en cocina y deben ser entregados en tu mesa primero.",
        },
        { status: 400 }
      );
    }

    await prisma.tableSession.update({
      where: { id: sessionId },
      data: {
        status: "BILL_REQUESTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Solicitud de cuenta enviada para la Mesa #${session.tableNumber}`,
    });
  } catch (error: any) {
    console.error("Error al solicitar cuenta:", error);
    return NextResponse.json(
      { success: false, message: "Error al solicitar cuenta", error: error.message },
      { status: 500 }
    );
  }
}
