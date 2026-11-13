import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        dishes: {
          orderBy: { sortOrder: "asc" },
          include: {
            portions: {
              orderBy: { price: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { categories },
        message: "Menú cargado exitosamente",
        error: null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("Error al obtener menú público:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al cargar la carta del menú",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

