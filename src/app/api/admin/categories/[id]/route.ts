import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: parsed.error.issues[0]?.message || "Datos inválidos",
          error: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/");
    revalidatePath("/menu");

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Categoría actualizada exitosamente",
      error: null,
    });
  } catch (error: any) {
    console.error("Error al actualizar categoría:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al actualizar categoría",
        error: error.message,
      },
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
    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/menu");

    return NextResponse.json({
      success: true,
      data: null,
      message: "Categoría eliminada exitosamente",
      error: null,
    });
  } catch (error: any) {
    console.error("Error al eliminar categoría:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al eliminar categoría. Verifique que no tenga platos asociados.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

