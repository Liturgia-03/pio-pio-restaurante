import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { promoModalSchema } from "@/lib/validations";

export async function GET() {
  try {
    let promo = await prisma.promotionalModal.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!promo) {
      promo = await prisma.promotionalModal.create({
        data: {
          title: "¡Especial del Día!",
          subtitle: "Pregunta al mesero por las promociones vigentes",
          description: "Los mejores cortes y platos a la brasa preparados al instante.",
          imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop",
          isActive: false,
          autoShowDelayMs: 800,
          showOncePerSession: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: promo,
      message: "Configuración del modal obtenida exitosamente",
      error: null,
    });
  } catch (error: any) {
    console.error("Error al obtener promo admin:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al obtener promoción",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = promoModalSchema.safeParse(body);

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

    const firstPromo = await prisma.promotionalModal.findFirst();

    let saved;
    if (firstPromo) {
      saved = await prisma.promotionalModal.update({
        where: { id: firstPromo.id },
        data: parsed.data,
      });
    } else {
      saved = await prisma.promotionalModal.create({
        data: parsed.data,
      });
    }

    revalidatePath("/");
    revalidatePath("/menu");

    return NextResponse.json({
      success: true,
      data: saved,
      message: "Promoción actualizada exitosamente",
      error: null,
    });
  } catch (error: any) {
    console.error("Error al actualizar promo admin:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al actualizar promoción",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

