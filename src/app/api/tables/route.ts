import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Obtener ajustes del restaurante para saber el total de mesas configuradas
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: "default" },
      select: { totalTables: true },
    });
    const totalTablesCount = settings?.totalTables || 15;

    // 2. Obtener todas las sesiones de mesa activas (no cerradas)
    const activeSessions = await prisma.tableSession.findMany({
      where: {
        status: {
          not: "CLOSED",
        },
      },
      include: {
        waiter: {
          select: { id: true, name: true, pin: true, isActive: true },
        },
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Crear mapa de sesiones activas por número de mesa con consolidación automática de seguridad
    const sessionByTable = new Map<string, any>();
    for (const s of activeSessions) {
      if (!sessionByTable.has(s.tableNumber)) {
        sessionByTable.set(s.tableNumber, s);
      } else {
        const existing = sessionByTable.get(s.tableNumber)!;
        existing.items = [...existing.items, ...s.items];
        existing.total = existing.items
          .filter((i: any) => i.status !== "CANCELLED")
          .reduce((acc: number, it: any) => acc + Number(it.subtotal), 0);
      }
    }

    // 3. Generar la cuadrícula de mesas de la 1 a totalTablesCount
    const tables = [];
    for (let i = 1; i <= totalTablesCount; i++) {
      const tableNumberStr = String(i);
      const session = sessionByTable.get(tableNumberStr) || null;
      const minutesOpen = session?.createdAt
        ? Math.max(0, Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 60000))
        : null;

      let hasPendingDelivery = false;
      let deliveryState: "PENDING_INITIAL" | "PENDING_ADDITION" | "ALL_DELIVERED" | "NONE" = "NONE";
      let pendingWaitMinutes = 0;
      let isOverdue = false;

      if (session) {
        const confirmedItems = (session.items || []).filter(
          (it: any) => it.status !== "PENDING_CONFIRMATION" && it.status !== "CANCELLED"
        );
        const pendingDeliveryItems = confirmedItems.filter((it: any) => !it.deliveredAt);
        const hasDeliveredItems = confirmedItems.some((it: any) => it.deliveredAt);

        hasPendingDelivery = pendingDeliveryItems.length > 0;
        if (confirmedItems.length > 0) {
          if (!hasPendingDelivery) {
            deliveryState = "ALL_DELIVERED";
          } else if (hasDeliveredItems) {
            deliveryState = "PENDING_ADDITION";
          } else {
            deliveryState = "PENDING_INITIAL";
          }
        }

        if (pendingDeliveryItems.length > 0) {
          const earliestPendingTime = Math.min(
            ...pendingDeliveryItems.map((it: any) => new Date(it.createdAt).getTime())
          );
          pendingWaitMinutes = Math.max(0, Math.floor((Date.now() - earliestPendingTime) / 60000));
        }
        isOverdue = pendingWaitMinutes >= 5;
      }

      tables.push({
        tableNumber: tableNumberStr,
        status: session ? session.status : "FREE",
        minutesOpen,
        hasPendingDelivery,
        deliveryState,
        pendingWaitMinutes,
        isOverdue,
        session: session
          ? {
              ...session,
              total: Number(session.total),
              hasPendingDelivery,
              deliveryState,
              pendingWaitMinutes,
              isOverdue,
              items: session.items.map((item: any) => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                subtotal: Number(item.subtotal),
              })),
            }
          : null,
      });
    }

    // 4. Obtener el historial de mesas cobradas y liberadas hoy (Registro de Transacciones)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const closedSessionsRaw = await prisma.tableSession.findMany({
      where: {
        status: "CLOSED",
        closedAt: {
          gte: startOfToday,
        },
      },
      include: {
        waiter: {
          select: { id: true, name: true },
        },
        items: {
          where: {
            status: { not: "CANCELLED" },
          },
        },
      },
      orderBy: { closedAt: "desc" },
      take: 50,
    });

    const closedSessionsToday = closedSessionsRaw.map((s: any) => ({
      ...s,
      total: Number(s.total),
      items: s.items.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
    }));

    // Métricas rápidas y contadores para semáforo de mesas
    const counts = {
      open: tables.filter((t: any) => t.status === "OPEN").length,
      pending: tables.filter((t: any) => t.status === "PENDING_CONFIRMATION").length,
      billRequested: tables.filter((t: any) => t.status === "BILL_REQUESTED").length,
      free: tables.filter((t: any) => t.status === "FREE").length,
      pendingDelivery: tables.filter((t: any) => t.hasPendingDelivery).length,
    };

    const pendingQRSessionsCount = counts.pending;
    const billRequestedCount = counts.billRequested;
    const activeSessionsCount = activeSessions.length;

    return NextResponse.json({
      success: true,
      data: {
        totalTables: totalTablesCount,
        tables,
        counts,
        activeSessionsCount,
        pendingQRSessionsCount,
        billRequestedCount,
        todaySessions: closedSessionsToday,
        closedSessionsToday,
      },
    });
  } catch (error: any) {
    console.error("Error al obtener mesas:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener estado de mesas", error: error.message },
      { status: 500 }
    );
  }
}
