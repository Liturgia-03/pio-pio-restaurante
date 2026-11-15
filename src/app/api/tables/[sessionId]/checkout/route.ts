import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json().catch(() => ({}));
    const closedBy = body.closedBy || "Admin en Caja";

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

    if (session.status === "CLOSED") {
      return NextResponse.json(
        { success: false, message: "Esta mesa ya fue cobrada y liberada" },
        { status: 400 }
      );
    }

    // Recalcular total final definitivo
    const validItems = session.items.filter((it) => it.status !== "CANCELLED");
    const finalTotal = validItems.reduce((acc, it) => acc + Number(it.subtotal), 0);

    // Cerrar sesión y liberar la mesa inmediatamente
    const closedSession = await prisma.tableSession.update({
      where: { id: sessionId },
      data: {
        status: "CLOSED",
        total: finalTotal,
        closedAt: new Date(),
        closedBy,
      },
    });

    return NextResponse.json({
      success: true,
      message: `¡Mesa #${session.tableNumber} cobrada y liberada con éxito!`,
      data: {
        tableNumber: session.tableNumber,
        total: finalTotal,
        closedAt: closedSession.closedAt,
      },
    });
  } catch (error: any) {
    console.error("Error al cobrar y liberar mesa:", error);
    return NextResponse.json(
      { success: false, message: "Error al cobrar y liberar la mesa", error: error.message },
      { status: 500 }
    );
  }
}
