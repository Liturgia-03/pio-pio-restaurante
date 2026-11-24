import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminAuthorization, logAuditEvent } from "@/lib/admin-auth-check";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      action,
      pinOrPassword,
      reason,
      sessionId,
      shiftId,
      newPaymentMethod,
      mixedCash,
      mixedTransfer,
      startDate,
      endDate,
      includeExpenses = false,
    } = body;

    // 1. Validar autorización de administrador mediante PIN o Contraseña
    const auth = await verifyAdminAuthorization(pinOrPassword);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.error || "PIN o contraseña de Administrador incorrecto" },
        { status: 401 }
      );
    }

    // 2. Validar motivo obligatorio
    if (!reason || reason.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: "Debes ingresar un motivo justificado para esta acción (mínimo 3 caracteres)" },
        { status: 400 }
      );
    }

    const approvedBy = auth.username;

    // =========================================================================
    // ACCIÓN A: REACTIVAR CUENTA COBRADA POR ERROR
    // =========================================================================
    if (action === "REACTIVATE_SESSION") {
      if (!sessionId) {
        return NextResponse.json({ success: false, message: "ID de sesión requerido" }, { status: 400 });
      }

      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: { items: true },
      });

      if (!session) {
        return NextResponse.json({ success: false, message: "Cuenta no encontrada" }, { status: 404 });
      }

      if (session.status !== "CLOSED" && session.status !== "CANCELLED") {
        return NextResponse.json(
          { success: false, message: `La cuenta ${session.tableNumber} ya se encuentra activa (${session.status})` },
          { status: 400 }
        );
      }

      // Reabrir sesión en base de datos
      const updated = await prisma.tableSession.update({
        where: { id: sessionId },
        data: {
          status: "OPEN",
          closedAt: null,
          closedBy: `Reactivada por ${approvedBy}: ${reason.trim()}`,
        },
      });

      await logAuditEvent({
        action: "REACTIVATE_SESSION",
        description: `Reactivación de cuenta ${session.tableNumber} (Total: $${Number(session.total).toLocaleString()})`,
        reason,
        approvedBy,
        targetId: session.id,
        targetType: "SESSION",
        previousData: {
          status: session.status,
          total: session.total,
          closedAt: session.closedAt,
          closedBy: session.closedBy,
        },
        newData: { status: "OPEN" },
      });

      return NextResponse.json({
        success: true,
        message: `Cuenta ${session.tableNumber} reactivada exitosamente. Ya se encuentra disponible nuevamente en el sistema.`,
        data: updated,
      });
    }

    // =========================================================================
    // ACCIÓN B: CORREGIR FORMA DE PAGO EN CUENTA YA COBRADA
    // =========================================================================
    if (action === "EDIT_PAYMENT_METHOD") {
      if (!sessionId || !newPaymentMethod) {
        return NextResponse.json(
          { success: false, message: "ID de sesión y nuevo método de pago son requeridos" },
          { status: 400 }
        );
      }

      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return NextResponse.json({ success: false, message: "Cuenta no encontrada" }, { status: 404 });
      }

      // Formatear nuevo paymentDesc
      let newPaymentDesc = "Efectivo";
      if (newPaymentMethod === "NEQUI") {
        newPaymentDesc = "Nequi/Daviplata";
      } else if (newPaymentMethod === "CARD") {
        newPaymentDesc = "Datáfono/Tarjeta";
      } else if (newPaymentMethod === "MIXED") {
        newPaymentDesc = `Pago Mixto (Efectivo: $${Number(mixedCash || 0).toLocaleString()} + Nequi: $${Number(mixedTransfer || 0).toLocaleString()})`;
      } else {
        newPaymentDesc = "Efectivo";
      }

      const prefix = session.closedBy?.split("•")[0]?.trim() || "Admin en Caja";
      const newClosedBy = `${prefix} • ${newPaymentDesc} [Corregido por ${approvedBy}]`;

      const updated = await prisma.tableSession.update({
        where: { id: sessionId },
        data: {
          closedBy: newClosedBy,
        },
      });

      await logAuditEvent({
        action: "EDIT_PAYMENT_METHOD",
        description: `Corrección de forma de pago en ${session.tableNumber} a ${newPaymentMethod}`,
        reason,
        approvedBy,
        targetId: session.id,
        targetType: "SESSION",
        previousData: { closedBy: session.closedBy },
        newData: { closedBy: newClosedBy },
      });

      return NextResponse.json({
        success: true,
        message: `Forma de pago de ${session.tableNumber} actualizada a ${newPaymentDesc}. El arqueo de caja se ha recalibrado.`,
        data: updated,
      });
    }

    // =========================================================================
    // ACCIÓN C: ANULACIÓN FORMAL DE VENTA (VENTA NULA / DEVOLUCIÓN)
    // =========================================================================
    if (action === "CANCEL_SESSION") {
      if (!sessionId) {
        return NextResponse.json({ success: false, message: "ID de sesión requerido" }, { status: 400 });
      }

      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return NextResponse.json({ success: false, message: "Cuenta no encontrada" }, { status: 404 });
      }

      const updated = await prisma.tableSession.update({
        where: { id: sessionId },
        data: {
          status: "CANCELLED",
          closedBy: `ANULADA por ${approvedBy} • Motivo: ${reason.trim()}`,
        },
      });

      await logAuditEvent({
        action: "CANCEL_SESSION",
        description: `Anulación formal de venta ${session.tableNumber} por $${Number(session.total).toLocaleString()}`,
        reason,
        approvedBy,
        targetId: session.id,
        targetType: "SESSION",
        previousData: { status: session.status, total: session.total, closedBy: session.closedBy },
        newData: { status: "CANCELLED" },
      });

      return NextResponse.json({
        success: true,
        message: `Venta ${session.tableNumber} marcada como ANULADA. No sumará al total de ventas del día.`,
        data: updated,
      });
    }

    // =========================================================================
    // ACCIÓN D: ELIMINACIÓN DEFINITIVA DE UNA CUENTA ESPECÍFICA
    // =========================================================================
    if (action === "DELETE_SESSION") {
      if (!sessionId) {
        return NextResponse.json({ success: false, message: "ID de sesión requerido" }, { status: 400 });
      }

      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: { items: true },
      });

      if (!session) {
        return NextResponse.json({ success: false, message: "Cuenta no encontrada" }, { status: 404 });
      }

      // Guardar respaldo completo en auditoría antes de borrar
      await logAuditEvent({
        action: "DELETE_SESSION",
        description: `Eliminación definitiva de cuenta ${session.tableNumber} ($${Number(session.total).toLocaleString()})`,
        reason,
        approvedBy,
        targetId: session.id,
        targetType: "SESSION",
        previousData: {
          tableNumber: session.tableNumber,
          total: session.total,
          status: session.status,
          closedAt: session.closedAt,
          itemsCount: session.items.length,
        },
      });

      await prisma.tableSession.delete({
        where: { id: sessionId },
      });

      return NextResponse.json({
        success: true,
        message: `Cuenta ${session.tableNumber} eliminada definitivamente del sistema.`,
      });
    }

    // =========================================================================
    // ACCIÓN E: REABRIR TURNO DE CAJA LIQUIDADO POR ERROR
    // =========================================================================
    if (action === "REOPEN_SHIFT") {
      if (!shiftId) {
        return NextResponse.json({ success: false, message: "ID de turno requerido" }, { status: 400 });
      }

      const shift = await prisma.cashShift.findUnique({
        where: { id: shiftId },
      });

      if (!shift) {
        return NextResponse.json({ success: false, message: "Turno no encontrado" }, { status: 404 });
      }

      // Verificar que no haya otro turno abierto actualmente
      const anotherOpen = await prisma.cashShift.findFirst({
        where: { status: "OPEN" },
      });

      if (anotherOpen) {
        return NextResponse.json(
          {
            success: false,
            message: `Ya existe otro turno abierto actualmente (#${anotherOpen.id.slice(-4)}). Debes cerrarlo antes de reabrir este.`,
          },
          { status: 400 }
        );
      }

      const updated = await prisma.cashShift.update({
        where: { id: shiftId },
        data: {
          status: "OPEN",
          closedAt: null,
          notes: shift.notes ? `${shift.notes} • [Reabierto por ${approvedBy}: ${reason.trim()}]` : `[Reabierto por ${approvedBy}: ${reason.trim()}]`,
        },
      });

      await logAuditEvent({
        action: "REOPEN_SHIFT",
        description: `Reapertura de turno de caja cerrado del ${new Date(shift.openedAt).toLocaleDateString()}`,
        reason,
        approvedBy,
        targetId: shift.id,
        targetType: "SHIFT",
        previousData: { status: shift.status, actualCash: shift.actualCash, difference: shift.difference },
        newData: { status: "OPEN" },
      });

      return NextResponse.json({
        success: true,
        message: `Turno de caja reabierto exitosamente. Ya puedes seguir registrando ventas y gastos en este turno.`,
        data: updated,
      });
    }

    // =========================================================================
    // ACCIÓN F: LIMPIEZA MASIVA DE HISTORIAL / DATOS DE PRUEBA
    // =========================================================================
    if (action === "CLEAR_HISTORY") {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { success: false, message: "Fecha de inicio y fin requeridas para la limpieza" },
          { status: 400 }
        );
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Borrar sesiones en el rango
      const deletedSessions = await prisma.tableSession.deleteMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });

      let deletedExpensesCount = 0;
      if (includeExpenses) {
        const deletedExpenses = await prisma.expense.deleteMany({
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
        });
        deletedExpensesCount = deletedExpenses.count;
      }

      await logAuditEvent({
        action: "CLEAR_HISTORY",
        description: `Limpieza de historial del ${start.toLocaleDateString()} al ${end.toLocaleDateString()} (${deletedSessions.count} cuentas eliminadas, ${deletedExpensesCount} gastos eliminados)`,
        reason,
        approvedBy,
        targetType: "HISTORY",
        previousData: {
          sessionsPurged: deletedSessions.count,
          expensesPurged: deletedExpensesCount,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Limpieza completada: se eliminaron ${deletedSessions.count} cuentas${includeExpenses ? ` y ${deletedExpensesCount} gastos` : ""} del período seleccionado.`,
      });
    }

    return NextResponse.json({ success: false, message: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error al ejecutar acción protegida:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error interno al ejecutar acción" },
      { status: 500 }
    );
  }
}
