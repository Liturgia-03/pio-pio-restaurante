import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { dishSchema } from "@/lib/validations";

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Math.random().toString(36).substring(2, 6)
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const dishes = await prisma.dish.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        category: true,
        portions: {
          orderBy: { price: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: dishes,
      message: "Platos obtenidos exitosamente",
      error: null,
    });
  } catch (error: any) {
    console.error("Error al obtener platos admin:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al obtener platos",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = dishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: parsed.error.issues[0]?.message || "Datos del plato inválidos",
          error: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { portions, ...dishData } = parsed.data;
    const slug = generateSlug(dishData.name);

    const newDish = await prisma.dish.create({
      data: {
        ...dishData,
        slug,
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

    revalidatePath("/");

    return NextResponse.json(
      {
        success: true,
        data: newDish,
        message: "Plato creado exitosamente",
        error: null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al crear plato:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al guardar el plato",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

