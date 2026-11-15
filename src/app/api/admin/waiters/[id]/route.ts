import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.name) updateData.name = String(body.name).trim();
    if (body.pin) updateData.pin = String(body.pin).trim();
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

    const updated = await prisma.waiter.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Mesero actualizado correctamente",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error al actualizar mesero", error: error.message },
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

    await prisma.waiter.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Mesero eliminado correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error al eliminar mesero", error: error.message },
      { status: 500 }
    );
  }
}
