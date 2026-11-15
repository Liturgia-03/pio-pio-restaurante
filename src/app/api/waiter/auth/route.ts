import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const waiterId = String(body.waiterId || "").trim();
    const pin = String(body.pin || "").trim();

    if (!waiterId || !pin) {
      return NextResponse.json(
        { success: false, message: "Debes seleccionar tu nombre e ingresar tu PIN" },
        { status: 400 }
      );
    }

    const waiter = await prisma.waiter.findUnique({
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
