import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Obtener pedidos de barra activos (en espera de entrega) y número de ticket del día
export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Pedidos activos de barra (no cerrados)
    const activeOrders = await prisma.tableSession.findMany({
      where: {
        tableNumber: {
          startsWith: "BARRA",
        },
        status: {
          not: "CLOSED",
        },
      },
      include: {
        items: {
          where: {
            status: { not: "CANCELLED" },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Conteo de tickets de barra de hoy para generar el consecutivo automático
    const countToday = await prisma.tableSession.count({
      where: {
        tableNumber: {
          startsWith: "BARRA",
        },
        createdAt: {
          gte: todayStart,
        },
      },
    });

    const nextTicketNumber = `#${String(countToday + 1).padStart(2, "0")}`;

    return NextResponse.json({
      success: true,
      data: {
        activeOrders,
        countToday,
        nextTicketNumber,
      },
    });
  } catch (error: any) {
    console.error("Error al obtener pedidos de barra:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST: Crear pedido rápido en barra (Cobro inmediato O Envío a Cocina)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName = "Cliente Mostrador",
      destination = "LLEVAR", // LLEVAR | BARRA
      items = [],
      paymentTiming = "NOW", // NOW | ON_DELIVERY
      paymentMethod = "CASH", // CASH | NEQUI | CARD | MIXED
      cashPaidAmount,
      cashChange,
      mixedCash,
      mixedTransfer,
      isDeliveredImmediately = false,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "La canasta de pedido debe tener al menos un plato" },
        { status: 400 }
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Calcular consecutivo diario de ticket
    const countToday = await prisma.tableSession.count({
      where: {
        tableNumber: {
          startsWith: "BARRA",
        },
        createdAt: {
          gte: todayStart,
        },
      },
    });

    const ticketNumber = `#${String(countToday + 1).padStart(2, "0")}`;
    const tableIdentifier = `BARRA ${ticketNumber}`;

    // Calcular total oficial
    const totalAmount = items.reduce(
      (acc: number, item: any) => acc + Number(item.unitPrice || 0) * Number(item.quantity || 1),
      0
    );

    // Formatear texto descriptivo del pago para cierre de caja
    let paymentDesc = "";
    if (paymentMethod === "CASH") {
      paymentDesc = `Efectivo${cashPaidAmount ? ` (Paga: $${Number(cashPaidAmount).toLocaleString()}, Cambio: $${Number(cashChange || 0).toLocaleString()})` : ""}`;
    } else if (paymentMethod === "NEQUI") {
      paymentDesc = "Nequi/Daviplata";
    } else if (paymentMethod === "CARD") {
      paymentDesc = "Datáfono/Tarjeta";
    } else if (paymentMethod === "MIXED") {
      paymentDesc = `Pago Mixto (Efectivo: $${Number(mixedCash || 0).toLocaleString()} + Nequi: $${Number(mixedTransfer || 0).toLocaleString()})`;
    }

    const clientLabel = customerName.trim() || "Cliente Mostrador";
    const destLabel = destination === "LLEVAR" ? "Para Llevar" : "Consumo en Barra";

    // CASO 1: PAGA DE INMEDIATO Y SE ENTREGA YA (Venta directa de mostrador en 1 paso)
    if (paymentTiming === "NOW" && isDeliveredImmediately) {
      const session = await prisma.tableSession.create({
        data: {
          tableNumber: tableIdentifier,
          status: "CLOSED",
          total: totalAmount,
          deliveredAt: new Date(),
          closedAt: new Date(),
          closedBy: `Admin en Barra [${destLabel}] • ${clientLabel} • ${paymentDesc}`,
          items: {
            create: items.map((it: any) => ({
              dishId: it.dishId || null,
              dishName: it.dishName,
              portionLabel: it.portionLabel || null,
              unitPrice: Number(it.unitPrice),
              quantity: Number(it.quantity || 1),
              subtotal: Number(it.unitPrice) * Number(it.quantity || 1),
              notes: it.notes ? `${destLabel} • ${it.notes}` : destLabel,
              addedBy: "ADMIN_CASHIER",
              addedByName: "Barra Mostrador",
              deliveredAt: new Date(),
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Venta cerrada y entregada exitosamente (${ticketNumber})`,
        data: { session, ticketNumber, isDelivered: true },
      });
    }

    // CASO 2 O 3: REQUIERE COCINA / ESPERA (Paga ahora O Paga al retirar)
    const isPaid = paymentTiming === "NOW";
    const paymentTag = isPaid
      ? `PAGADO [${paymentDesc}]`
      : "PENDIENTE DE PAGO";

    const session = await prisma.tableSession.create({
      data: {
        tableNumber: tableIdentifier,
        status: "OPEN",
        total: totalAmount,
        deliveredAt: null,
        closedBy: isPaid ? `PAGADO_PREVIO: ${paymentDesc}` : "PENDIENTE_PAGO",
        items: {
          create: items.map((it: any) => ({
            dishId: it.dishId || null,
            dishName: it.dishName,
            portionLabel: it.portionLabel || null,
            unitPrice: Number(it.unitPrice),
            quantity: Number(it.quantity || 1),
            subtotal: Number(it.unitPrice) * Number(it.quantity || 1),
            notes: it.notes
              ? `${destLabel} • ${clientLabel} • ${paymentTag} • ${it.notes}`
              : `${destLabel} • ${clientLabel} • ${paymentTag}`,
            addedBy: "ADMIN_CASHIER",
            addedByName: "Barra Mostrador",
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: isPaid
        ? `Pedido ${ticketNumber} pagado y enviado a preparación en cocina`
        : `Pedido ${ticketNumber} enviado a cocina (paga al retirar)`,
      data: { session, ticketNumber, isDelivered: false },
    });
  } catch (error: any) {
    console.error("Error al crear pedido en barra:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al procesar pedido de barra" },
      { status: 500 }
    );
  }
}
