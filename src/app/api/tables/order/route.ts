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

    const tableNumInt = parseInt(rawTable.replace(/\D/g, "") || "0", 10);
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
    const addedByName =
      body.addedByName ||
      (addedBy === "CUSTOMER_QR"
        ? "Cliente QR"
        : addedBy === "WAITER"
        ? "Mesero"
        : "Caja");
    const waiterId = body.waiterId || null;

    // Ejecutar dentro de una transacción interactiva de Prisma con reintento automático
    // para blindar contra colisiones de concurrencia (Race Conditions)
    let attempts = 0;
    const maxAttempts = 3;
    let result: { sessionId: string; roundNumber: number } | null = null;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        result = await prisma.$transaction(
          async (tx) => {
            // 0. Bloqueo transaccional atómico por mesa en PostgreSQL (Advisory Lock):
            // Garantiza que dos o más comensales en la misma mesa (ej: Mesa 7)
            // no creen cuentas separadas si envían el pedido en el mismo milisegundo.
            const lockKey = `pio_table_${normalizedTable}`;
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

            // 1. Buscar si ya existe una sesión abierta para esta mesa
            const activeSessions = await tx.tableSession.findMany({
              where: {
                tableNumber: normalizedTable,
                status: {
                  not: "CLOSED",
                },
              },
              include: {
                items: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            });

            let primarySession = activeSessions[0] || null;

            // Auto-curación de concurrencia: si por una colisión previa existieran 2 sesiones activas,
            // unificamos los ítems en la primera y cerramos la duplicada
            if (activeSessions.length > 1) {
              const duplicateSessions = activeSessions.slice(1);
              for (const dup of duplicateSessions) {
                await tx.orderItem.updateMany({
                  where: { tableSessionId: dup.id },
                  data: { tableSessionId: primarySession.id },
                });
                await tx.tableSession.update({
                  where: { id: dup.id },
                  data: { status: "CLOSED", closedBy: "Sistema (Auto-Unificación)" },
                });
              }
            }

            let sessionId: string;
            let roundNumber = 1;

            if (primarySession) {
              sessionId = primarySession.id;
              // Determinar la última ronda registrada
              const maxRound = primarySession.items.reduce(
                (max: number, it: any) => Math.max(max, it.round || 1),
                1
              );
              roundNumber = maxRound + 1;

              // Insertar los nuevos OrderItems en lote
              const itemStatus =
                addedBy === "CUSTOMER_QR"
                  ? "PENDING_CONFIRMATION"
                  : "CONFIRMED";

              for (const item of items) {
                const unitPrice = Number(item.unitPrice) || 0;
                const quantity = Number(item.quantity) || 1;
                const subtotal = unitPrice * quantity;

                await tx.orderItem.create({
                  data: {
                    tableSessionId: sessionId,
                    dishId: item.dishId ? String(item.dishId) : null,
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

              // Preparar actualización de la sesión
              const updateData: any = {};
              if (waiterId && !primarySession.waiterId) {
                updateData.waiterId = waiterId;
              }

              // Si viene por QR, poner en PENDING_CONFIRMATION para alertar al mesero
              if (addedBy === "CUSTOMER_QR") {
                updateData.status = "PENDING_CONFIRMATION";
              } else if (primarySession.status === "PENDING_CONFIRMATION") {
                updateData.status = "OPEN";
              }

              // Recalcular el total sumando solo ítems no cancelados
              const allItems = await tx.orderItem.findMany({
                where: {
                  tableSessionId: sessionId,
                  status: { not: "CANCELLED" },
                },
              });

              const newTotal = allItems.reduce(
                (acc: number, it: any) => acc + Number(it.subtotal),
                0
              );
              updateData.total = newTotal;

              await tx.tableSession.update({
                where: { id: sessionId },
                data: updateData,
              });
            } else {
              // No existe sesión previa: crearla
              const initialStatus =
                addedBy === "CUSTOMER_QR" ? "PENDING_CONFIRMATION" : "OPEN";

              let initialTotal = 0;
              const orderItemsData = items.map((item: any) => {
                const unitPrice = Number(item.unitPrice) || 0;
                const quantity = Number(item.quantity) || 1;
                const subtotal = unitPrice * quantity;
                initialTotal += subtotal;

                return {
                  dishId: item.dishId ? String(item.dishId) : null,
                  dishName: String(item.dishName || "Plato"),
                  portionLabel: item.portionLabel ? String(item.portionLabel) : null,
                  unitPrice,
                  quantity,
                  subtotal,
                  notes: item.notes ? String(item.notes) : null,
                  addedBy,
                  addedByName,
                  round: 1,
                  status:
                    addedBy === "CUSTOMER_QR"
                      ? "PENDING_CONFIRMATION"
                      : "CONFIRMED",
                };
              });

              const newSession = await tx.tableSession.create({
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
              roundNumber = 1;
            }

            return { sessionId, roundNumber };
          },
          {
            maxWait: 20000,
            timeout: 30000,
          }
        );

        // Si la transacción completó con éxito, salir del bucle
        break;
      } catch (err: any) {
        lastError = err;
        // Si fue una colisión de escritura o contención transaccional, esperar un jitter breve y reintentar
        const isConflict =
          err.code === "P2034" ||
          err.code === "P2002" ||
          err.code === "P2028" ||
          err.message?.includes("deadlock") ||
          err.message?.includes("conflict") ||
          err.message?.includes("expired transaction") ||
          err.message?.includes("could not serialize");

        if (isConflict && attempts < maxAttempts) {
          const delay = 40 * attempts + Math.floor(Math.random() * 40);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        } else {
          throw err;
        }
      }
    }

    if (!result) {
      throw lastError || new Error("No se pudo procesar la comanda tras múltiples reintentos");
    }

    return NextResponse.json({
      success: true,
      message:
        addedBy === "CUSTOMER_QR"
          ? "¡Pedido enviado a la mesa con éxito!"
          : "Comanda registrada correctamente",
      data: {
        sessionId: result.sessionId,
        tableNumber: normalizedTable,
        round: result.roundNumber,
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
