import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawTable = String(body.tableNumber || "").trim();
    const tableNumInt = parseInt(rawTable.replace(/\D/g, "") || "0", 10);

    if (isNaN(tableNumInt) || tableNumInt <= 0) {
      return NextResponse.json(
        { success: false, message: "Número de mesa no válido" },
        { status: 400 }
      );
    }

    const normalizedTable = String(tableNumInt);

    // Buscar sesión activa de la mesa
    const activeSession = await prisma.tableSession.findFirst({
      where: {
        tableNumber: normalizedTable,
        status: { not: "CLOSED" },
      },
    });

    if (!activeSession) {
      return NextResponse.json(
        {
          success: false,
          message: `No hay una orden activa en la Mesa #${normalizedTable}. Puedes realizar tu pedido desde el menú.`,
        },
        { status: 404 }
      );
    }

    // Agregar ítem de notificación de mesero
    await prisma.orderItem.create({
      data: {
        tableSessionId: activeSession.id,
        dishName: "🔔 Llamado de Mesero (Atención en Mesa)",
        unitPrice: 0,
        quantity: 1,
        subtotal: 0,
        notes: body.reason || "El cliente solicita asistencia de un mesero en la mesa",
        addedBy: "CUSTOMER_QR",
        addedByName: "Cliente QR",
        round: 1,
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `¡Mesero notificado para la Mesa #${normalizedTable}! En breve se acercarán a atenderte.`,
    });
  } catch (error: any) {
    console.error("Error al llamar mesero:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al llamar mesero",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
