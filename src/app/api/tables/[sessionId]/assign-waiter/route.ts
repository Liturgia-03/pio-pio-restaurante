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

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        waiter: {
          select: { id: true, name: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesión de mesa no encontrada" },
        { status: 404 }
      );
    }

    // Si viene waiterId vacío, null o "none", se desasigna el mesero
    let newWaiterId: string | null = null;
    let waiterName = "Sin asignar (Atención en Caja)";

    if (body.waiterId && body.waiterId !== "none") {
      const waiter = await prisma.waiter.findUnique({
        where: { id: String(body.waiterId) },
        select: { id: true, name: true, isActive: true },
      });

      if (!waiter) {
        return NextResponse.json(
          { success: false, message: "El mesero especificado no existe" },
          { status: 404 }
        );
      }

      newWaiterId = waiter.id;
      waiterName = waiter.name;
    }

    const updatedSession = await prisma.tableSession.update({
      where: { id: sessionId },
      data: {
        waiterId: newWaiterId,
      },
      include: {
        waiter: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: newWaiterId
        ? `Mesa #${session.tableNumber} asignada al mesero ${waiterName}`
        : `Mesa #${session.tableNumber} liberada de asignación (Atención en Caja)`,
      data: updatedSession,
    });
  } catch (error: any) {
    console.error("Error al asignar mesero a la mesa:", error);
    return NextResponse.json(
      { success: false, message: "Error interno al asignar mesero", error: error.message },
      { status: 500 }
    );
  }
}
