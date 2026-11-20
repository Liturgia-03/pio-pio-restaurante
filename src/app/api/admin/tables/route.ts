import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tables = await prisma.restaurantTable.findMany({
      orderBy: [{ sortOrder: "asc" }, { number: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: tables,
      message: "Mesas obtenidas exitosamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error al obtener mesas", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawNumber = String(body.number || "").trim();
    const label = body.label ? String(body.label).trim() : null;

    if (!rawNumber) {
      return NextResponse.json(
        { success: false, message: "El número o identificador de mesa es requerido" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una mesa con ese identificador
    const existing = await prisma.restaurantTable.findUnique({
      where: { number: rawNumber },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Ya existe una mesa con el identificador "${rawNumber}"` },
        { status: 400 }
      );
    }

    const newTable = await prisma.restaurantTable.create({
      data: {
        number: rawNumber,
        label,
        isActive: true,
        sortOrder: parseInt(rawNumber, 10) || 99,
      },
    });

    // Sincronizar totalTables en ajustes
    const totalCount = await prisma.restaurantTable.count();
    await prisma.restaurantSettings.updateMany({
      data: { totalTables: totalCount },
    });

    revalidatePath("/admin/tables");
    revalidatePath("/waiter");
    revalidatePath("/admin/qr");

    return NextResponse.json({
      success: true,
      data: newTable,
      message: `Mesa #${rawNumber} creada exitosamente`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error al crear mesa", error: error.message },
      { status: 500 }
    );
  }
}
