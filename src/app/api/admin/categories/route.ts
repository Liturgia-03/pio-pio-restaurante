import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations";

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

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { dishes: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
      message: "Categorías obtenidas exitosamente",
      error: null,
    });
  } catch (error: any) {
    console.error("Error al obtener categorías:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al obtener categorías",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const slug = generateSlug(parsed.data.name);

    const category = await prisma.category.create({
      data: {
        ...parsed.data,
        slug,
      },
    });

    revalidatePath("/");
    revalidatePath("/menu");

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: "Categoría creada exitosamente",
        error: null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al crear categoría:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al crear categoría",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

