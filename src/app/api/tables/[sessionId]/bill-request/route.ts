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
