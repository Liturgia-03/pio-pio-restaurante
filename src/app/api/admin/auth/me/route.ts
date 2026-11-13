import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, data: null, message: "No autenticado", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, data: null, message: "Usuario no encontrado", error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: "Usuario autenticado",
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, message: "Error al verificar sesión", error: error.message },
      { status: 500 }
    );
  }
}

