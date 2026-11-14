import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Se requiere un arreglo 'orderedIds' con los identificadores de categorías",
          error: "Invalid input",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      )
    );

    revalidatePath("/");
    revalidatePath("/menu");

    return NextResponse.json({
      success: true,
      data: null,
      message: "Orden de categorías actualizado exitosamente",
      error: null,
    });
  } catch (error: any) {
    console.error("Error al reordenar categorías:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al actualizar el orden de categorías",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

