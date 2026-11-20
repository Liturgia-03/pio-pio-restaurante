import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTable =
      searchParams.get("mesa") ||
      searchParams.get("tableNumber") ||
      searchParams.get("table") ||
      "";
    const sessionId = searchParams.get("sessionId");

    let tableNumInt = 0;
    if (rawTable) {
      tableNumInt = parseInt(rawTable.replace(/\D/g, "") || "0", 10);
    }

    if (!sessionId && (isNaN(tableNumInt) || tableNumInt <= 0)) {
      return NextResponse.json(
        { success: false, message: "Número de mesa o ID de sesión no válido" },
        { status: 400 }
      );
    }

    const normalizedTable = tableNumInt > 0 ? String(tableNumInt) : "";

    // 1. Si se proporciona sessionId, buscar directamente por ID
    let session = null;
    if (sessionId) {
      session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: {
          waiter: { select: { id: true, name: true } },
          items: {
            where: { status: { not: "CANCELLED" } },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    // 2. Si no se encontró por ID o no venía sessionId, buscar la sesión activa de la mesa
    if (!session && normalizedTable) {
      session = await prisma.tableSession.findFirst({
        where: {
          tableNumber: normalizedTable,
          status: { not: "CLOSED" },
        },
        include: {
          waiter: { select: { id: true, name: true } },
          items: {
            where: { status: { not: "CANCELLED" } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // 3. Si hay sesión activa encontrada
    if (session && session.status !== "CLOSED") {
      const items = session.items || [];
      const total = items.reduce((acc, it) => acc + Number(it.subtotal), 0);

      // Cálculo de entrega y tiempo de espera en cocina
      const confirmedItems = items.filter((it) => it.status !== "PENDING_CONFIRMATION");
      const pendingDeliveryItems = confirmedItems.filter((it) => !it.deliveredAt);
      const hasDeliveredItems = confirmedItems.some((it) => it.deliveredAt);

      const hasPendingDelivery = pendingDeliveryItems.length > 0;
      const isAllDelivered = confirmedItems.length > 0 && pendingDeliveryItems.length === 0;

      let deliveryState: "PENDING_INITIAL" | "PENDING_ADDITION" | "ALL_DELIVERED" | "NONE" = "NONE";
      if (confirmedItems.length > 0) {
        if (isAllDelivered) {
          deliveryState = "ALL_DELIVERED";
        } else if (hasDeliveredItems) {
          deliveryState = "PENDING_ADDITION";
        } else {
          deliveryState = "PENDING_INITIAL";
        }
      }

      let pendingWaitMinutes = 0;
      if (pendingDeliveryItems.length > 0) {
        const earliestPendingTime = Math.min(
          ...pendingDeliveryItems.map((it) => new Date(it.createdAt).getTime())
        );
        pendingWaitMinutes = Math.max(0, Math.floor((Date.now() - earliestPendingTime) / 60000));
      }
      const isOverdue = pendingWaitMinutes >= 5;

      return NextResponse.json({
        success: true,
        data: {
          hasActiveSession: true,
          sessionId: session.id,
          tableNumber: session.tableNumber,
          status: session.status, // "PENDING_CONFIRMATION" | "OPEN" | "BILL_REQUESTED"
          total: total > 0 ? total : session.total,
          waiterName: session.waiter?.name || null,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          deliveredAt: session.deliveredAt,
          hasPendingDelivery,
          isAllDelivered,
          deliveryState,
          pendingWaitMinutes,
          isOverdue,
          itemsCount: items.reduce((acc, it) => acc + it.quantity, 0),
          items: items.map((it) => ({
            id: it.id,
            dishId: it.dishId,
            dishName: it.dishName,
            portionLabel: it.portionLabel,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            subtotal: it.subtotal,
            notes: it.notes,
            round: it.round,
            status: it.status,
            deliveredAt: it.deliveredAt,
            createdAt: it.createdAt,
          })),
        },
      });
    }

    // 4. Si la sesión fue cerrada recientemente (últimos 15 minutos)
    if (normalizedTable) {
      const recentlyClosed = await prisma.tableSession.findFirst({
        where: {
          tableNumber: normalizedTable,
          status: "CLOSED",
          closedAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000),
          },
        },
        orderBy: { closedAt: "desc" },
      });

      if (recentlyClosed) {
        return NextResponse.json({
          success: true,
          data: {
            hasActiveSession: false,
            status: "CLOSED",
            tableNumber: normalizedTable,
            sessionId: recentlyClosed.id,
            total: recentlyClosed.total,
            closedAt: recentlyClosed.closedAt,
          },
        });
      }
    }

    // 5. Mesa libre sin sesiones activas
    return NextResponse.json({
      success: true,
      data: {
        hasActiveSession: false,
        status: "FREE",
        tableNumber: normalizedTable,
      },
    });
  } catch (error: any) {
    console.error("Error al consultar estado de mesa:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno al consultar estado de la mesa",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
