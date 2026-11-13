import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const promo = await prisma.promotionalModal.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        data: promo || null,
        message: promo ? "Promoción obtenida exitosamente" : "No hay promoción activa",
        error: null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error: any) {
    console.error("Error al obtener promoción:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al cargar la promoción",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

