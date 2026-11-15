import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const rawNewTable = String(body.newTableNumber || "").trim();

    const tableNumInt = parseInt(rawNewTable, 10);
    if (isNaN(tableNumInt) || tableNumInt <= 0) {
      return NextResponse.json(
        { success: false, message: "Número de mesa de destino no válido" },
        { status: 400 }
      );
    }

    const normalizedNewTable = String(tableNumInt);

    // Verificar si la mesa de destino ya está ocupada
    const occupiedTarget = await prisma.tableSession.findFirst({
      where: {
        tableNumber: normalizedNewTable,
        status: { not: "CLOSED" },
      },
    });

    if (occupiedTarget) {
      return NextResponse.json(
        {
          success: false,
          message: `La Mesa #${normalizedNewTable} ya está ocupada con otra cuenta activa.`,
        },
        { status: 400 }
      );
    }

    // Actualizar mesa de la sesión
    const updated = await prisma.tableSession.update({
      where: { id: sessionId },
      data: {
        tableNumber: normalizedNewTable,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cuenta transferida con éxito a la Mesa #${normalizedNewTable}`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error al transferir mesa:", error);
    return NextResponse.json(
      { success: false, message: "Error al transferir cuenta de mesa", error: error.message },
      { status: 500 }
    );
  }
}
