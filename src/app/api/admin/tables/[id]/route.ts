import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingTable = await prisma.restaurantTable.findUnique({
      where: { id },
    });

    if (!existingTable) {
      return NextResponse.json(
        { success: false, message: "Mesa no encontrada" },
        { status: 404 }
      );
    }

    const newNumber = body.number ? String(body.number).trim() : existingTable.number;
    const label = body.label !== undefined ? (body.label ? String(body.label).trim() : null) : existingTable.label;
    const isActive = typeof body.isActive === "boolean" ? body.isActive : existingTable.isActive;

    // Si cambió el número, verificar que no colisione con otra mesa
    if (newNumber !== existingTable.number) {
      const duplicate = await prisma.restaurantTable.findUnique({
        where: { number: newNumber },
      });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { success: false, message: `Ya existe otra mesa con el número "${newNumber}"` },
          { status: 400 }
        );
      }

      // Actualizar número en sesiones activas si las hay
      await prisma.tableSession.updateMany({
        where: {
          tableNumber: existingTable.number,
          status: { not: "CLOSED" },
        },
        data: {
          tableNumber: newNumber,
        },
      });
    }

    const updated = await prisma.restaurantTable.update({
      where: { id },
      data: {
        number: newNumber,
        label,
        isActive,
        sortOrder: parseInt(newNumber, 10) || existingTable.sortOrder,
      },
    });

    revalidatePath("/admin/tables");
    revalidatePath("/waiter");
    revalidatePath("/admin/qr");

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Mesa #${newNumber} actualizada correctamente`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error al actualizar mesa", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const table = await prisma.restaurantTable.findUnique({
      where: { id },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, message: "Mesa no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si tiene una comanda o sesión activa en curso
    const activeSession = await prisma.tableSession.findFirst({
      where: {
        tableNumber: table.number,
        status: { not: "CLOSED" },
      },
    });

    if (activeSession) {
      return NextResponse.json(
        {
          success: false,
          message: `No se puede eliminar la Mesa #${table.number} porque tiene una comanda activa en curso. Ciérrala o cóbrala primero.`,
        },
        { status: 400 }
      );
    }

    await prisma.restaurantTable.delete({
      where: { id },
    });

    // Sincronizar totalTables en ajustes
    const totalCount = await prisma.restaurantTable.count();
    await prisma.restaurantSettings.updateMany({
      data: { totalTables: Math.max(1, totalCount) },
    });

    revalidatePath("/admin/tables");
    revalidatePath("/waiter");
    revalidatePath("/admin/qr");

    return NextResponse.json({
      success: true,
      message: `Mesa #${table.number} eliminada correctamente`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error al eliminar mesa", error: error.message },
      { status: 500 }
    );
  }
}
