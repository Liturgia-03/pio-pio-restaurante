import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.isAvailable !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "El campo isAvailable debe ser un booleano (true/false)",
          error: "Invalid input",
        },
        { status: 400 }
      );
    }

    const updatedDish = await prisma.dish.update({
      where: { id },
      data: { isAvailable: body.isAvailable },
    });

    // Invalidar caché de Next.js para que el menú público refleje el cambio de disponibilidad de inmediato
    revalidatePath("/");
    revalidatePath("/menu");

    return NextResponse.json({
      success: true,
      data: {
        id: updatedDish.id,
        name: updatedDish.name,
        isAvailable: updatedDish.isAvailable,
        updatedAt: updatedDish.updatedAt,
      },
      message: `Plato marcado como ${updatedDish.isAvailable ? "Disponible" : "Agotado"}`,
      error: null,
    });
  } catch (error: any) {
    console.error("Error al actualizar disponibilidad del plato:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al actualizar disponibilidad",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

