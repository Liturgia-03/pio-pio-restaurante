import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const waiterId = String(body.waiterId || "").trim();
    const pin = String(body.pin || "").trim();

    if (!pin) {
      return NextResponse.json(
        { success: false, message: "Debes ingresar tu PIN de 4 dígitos" },
        { status: 400 }
      );
    }

    let waiter = null;
    if (waiterId) {
      waiter = await prisma.waiter.findUnique({
        where: { id: waiterId },
      });
      if (!waiter || !waiter.isActive) {
        return NextResponse.json(
          { success: false, message: "Mesero no encontrado o inactivo" },
          { status: 404 }
        );
      }
      if (waiter.pin !== pin) {
        return NextResponse.json(
          { success: false, message: "PIN incorrecto. Intenta de nuevo" },
          { status: 401 }
        );
      }
    } else {
      // Búsqueda directa por PIN táctil en el teclado de salón
      waiter = await prisma.waiter.findFirst({
        where: {
          pin,
          isActive: true,
        },
      });

      if (!waiter) {
        return NextResponse.json(
          { success: false, message: "PIN no reconocido o mesero inactivo" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `¡Bienvenido(a), ${waiter.name}!`,
      data: {
        id: waiter.id,
        name: waiter.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error en autenticación", error: error.message },
      { status: 500 }
    );
  }
}
