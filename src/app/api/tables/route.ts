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

    // Crear mapa de sesiones activas por número de mesa
    const sessionByTable = new Map<string, typeof activeSessions[0]>();
    activeSessions.forEach((s) => {
      sessionByTable.set(s.tableNumber, s);
    });

    // 3. Generar la cuadrícula de mesas de la 1 a totalTablesCount
    const tables = [];
    for (let i = 1; i <= totalTablesCount; i++) {
      const tableNumberStr = String(i);
      const session = sessionByTable.get(tableNumberStr) || null;
      const minutesOpen = session?.createdAt
        ? Math.max(0, Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 60000))
        : null;

      tables.push({
        tableNumber: tableNumberStr,
        status: session ? session.status : "FREE",
        minutesOpen,
        session: session
          ? {
              ...session,
              total: Number(session.total),
              items: session.items.map((item) => ({
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

    const closedSessionsToday = closedSessionsRaw.map((s) => ({
      ...s,
      total: Number(s.total),
      items: s.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
    }));

    // Métricas rápidas
    const pendingQRSessionsCount = activeSessions.filter(
      (s) => s.status === "PENDING_CONFIRMATION"
    ).length;
    const billRequestedCount = activeSessions.filter(
      (s) => s.status === "BILL_REQUESTED"
    ).length;
    const activeSessionsCount = activeSessions.length;

    return NextResponse.json({
      success: true,
      data: {
        totalTables: totalTablesCount,
        tables,
        activeSessionsCount,
        pendingQRSessionsCount,
        billRequestedCount,
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
