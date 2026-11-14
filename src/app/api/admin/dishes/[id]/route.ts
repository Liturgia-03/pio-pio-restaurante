import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { dishSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dish = await prisma.dish.findUnique({
      where: { id },
      include: {
        category: true,
        portions: {
          orderBy: { price: "asc" },
        },
      },
    });

    if (!dish) {
      return NextResponse.json(
        { success: false, data: null, message: "Plato no encontrado", error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dish,
      message: "Plato encontrado",
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, message: "Error al obtener plato", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = dishSchema.safeParse(body);

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

    const { portions, ...dishData } = parsed.data;

    // Transaction to update dish and recreate portions
    const updatedDish = await prisma.$transaction(async (tx) => {
      await tx.dishPortion.deleteMany({
        where: { dishId: id },
      });

      return tx.dish.update({
        where: { id },
        data: {
          ...dishData,
          portions: {
            create: (portions || []).map((p) => ({
              label: p.label,
              price: p.price,
              isDefault: p.isDefault,
            })),
          },
        },
        include: {
          category: true,
          portions: true,
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/menu");

    return NextResponse.json({
      success: true,
      data: updatedDish,
      message: "Plato actualizado exitosamente",
      error: null,
    });
  } catch (error: any) {
    console.error("Error al actualizar plato:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al actualizar plato",
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
    await prisma.dish.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/menu");

    return NextResponse.json({
      success: true,
      data: null,
      message: "Plato eliminado exitosamente",
      error: null,
    });
  } catch (error: any) {
    console.error("Error al eliminar plato:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al eliminar plato",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

