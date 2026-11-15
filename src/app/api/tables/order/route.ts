import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawTable = String(body.tableNumber || "").trim();

    if (!rawTable) {
      return NextResponse.json(
        { success: false, message: "El número de mesa es requerido" },
        { status: 400 }
      );
    }

    const tableNumInt = parseInt(rawTable, 10);
    if (isNaN(tableNumInt) || tableNumInt <= 0) {
      return NextResponse.json(
        { success: false, message: "Número de mesa no válido" },
        { status: 400 }
      );
    }

    // Normalizado siempre sin ceros a la izquierda (ej: "05" -> "5")
    const normalizedTable = String(tableNumInt);

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Debes incluir al menos un plato en el pedido" },
        { status: 400 }
      );
    }

    const addedBy = body.addedBy || "CUSTOMER_QR"; // "CUSTOMER_QR" | "WAITER" | "ADMIN_CASHIER"
    const addedByName = body.addedByName || (addedBy === "CUSTOMER_QR" ? "Cliente QR" : addedBy === "WAITER" ? "Mesero" : "Caja");
    const waiterId = body.waiterId || null;

    // Buscar si ya existe una sesión abierta para esta mesa
    const existingSession = await prisma.tableSession.findFirst({
      where: {
        tableNumber: normalizedTable,
        status: {
          not: "CLOSED",
        },
      },
      include: {
        items: true,
      },
    });

    let sessionId: string;
    let roundNumber = 1;

    if (existingSession) {
      sessionId = existingSession.id;
      // Obtener la última ronda registrada
      const maxRound = existingSession.items.reduce((max, it) => Math.max(max, it.round || 1), 1);
      roundNumber = maxRound + 1;

      // Crear los nuevos OrderItem bajo la misma sesión existente
      for (const item of items) {
        const unitPrice = Number(item.unitPrice) || 0;
        const quantity = Number(item.quantity) || 1;
        const subtotal = unitPrice * quantity;
        const itemStatus = addedBy === "CUSTOMER_QR" ? "PENDING_CONFIRMATION" : "CONFIRMED";

        await prisma.orderItem.create({
          data: {
            tableSessionId: sessionId,
            dishId: String(item.dishId || "custom"),
            dishName: String(item.dishName || "Plato"),
            portionLabel: item.portionLabel ? String(item.portionLabel) : null,
            unitPrice,
            quantity,
            subtotal,
            notes: item.notes ? String(item.notes) : null,
            addedBy,
            addedByName,
            round: roundNumber,
            status: itemStatus,
          },
        });
      }

      // Si el mesero o admin envió el pedido y asignó waiterId, actualizar si no tenía
      const updateData: any = {};
      if (waiterId && !existingSession.waiterId) {
        updateData.waiterId = waiterId;
      }

      // Si viene por QR, poner en PENDING_CONFIRMATION para alertar al mesero
      if (addedBy === "CUSTOMER_QR") {
        updateData.status = "PENDING_CONFIRMATION";
      } else if (existingSession.status === "PENDING_CONFIRMATION") {
        updateData.status = "OPEN";
      }

      // Recalcular el total sumando solo ítems no cancelados
      const allItems = await prisma.orderItem.findMany({
        where: {
          tableSessionId: sessionId,
          status: { not: "CANCELLED" },
        },
      });

      const newTotal = allItems.reduce((acc, it) => acc + Number(it.subtotal), 0);
      updateData.total = newTotal;

      await prisma.tableSession.update({
        where: { id: sessionId },
        data: updateData,
      });
    } else {
      // Crear nueva sesión para la mesa
      const initialStatus = addedBy === "CUSTOMER_QR" ? "PENDING_CONFIRMATION" : "OPEN";
      
      let initialTotal = 0;
      const orderItemsData = items.map((item: any) => {
        const unitPrice = Number(item.unitPrice) || 0;
        const quantity = Number(item.quantity) || 1;
        const subtotal = unitPrice * quantity;
        initialTotal += subtotal;

        return {
          dishId: String(item.dishId || "custom"),
          dishName: String(item.dishName || "Plato"),
          portionLabel: item.portionLabel ? String(item.portionLabel) : null,
          unitPrice,
          quantity,
          subtotal,
          notes: item.notes ? String(item.notes) : null,
          addedBy,
          addedByName,
          round: 1,
          status: addedBy === "CUSTOMER_QR" ? "PENDING_CONFIRMATION" : "CONFIRMED",
        };
      });

      const newSession = await prisma.tableSession.create({
        data: {
          tableNumber: normalizedTable,
          status: initialStatus,
          waiterId,
          total: initialTotal,
          items: {
            create: orderItemsData,
          },
        },
      });

      sessionId = newSession.id;
    }

    return NextResponse.json({
      success: true,
      message:
        addedBy === "CUSTOMER_QR"
          ? "¡Pedido enviado a la mesa con éxito!"
          : "Comanda registrada correctamente",
      data: {
        sessionId,
        tableNumber: normalizedTable,
        round: roundNumber,
      },
    });
  } catch (error: any) {
    console.error("Error al registrar pedido en mesa:", error);
    return NextResponse.json(
      { success: false, message: "Error al registrar pedido en mesa", error: error.message },
      { status: 500 }
    );
  }
}
