import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const waiters = await prisma.waiter.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: waiters,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error al listar meseros", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const pin = String(body.pin || "").trim();

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, message: "El nombre del mesero debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    if (!pin || pin.length < 4) {
      return NextResponse.json(
        { success: false, message: "El PIN debe ser de 4 dígitos" },
        { status: 400 }
      );
    }

    const newWaiter = await prisma.waiter.create({
      data: {
        name,
        pin,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Mesero "${name}" creado exitosamente`,
      data: newWaiter,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error al crear mesero", error: error.message },
      { status: 500 }
    );
  }
}
