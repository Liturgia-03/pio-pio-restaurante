import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Obtener lista de personal (cajeros/administradores, meseros y PIN de auditoría)
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { success: false, message: "No autorizado. Solo Super Admin.", error: "Forbidden" },
        { status: 403 }
      );
    }

    const [users, waiters, settings] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.waiter.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.restaurantSettings.findFirst({
        select: { adminPin: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        waiters,
        adminPin: settings?.adminPin || "1234",
      },
    });
  } catch (error: any) {
    console.error("Error al obtener lista de personal:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al obtener personal" },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo cajero/administrador o mesero
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Acción reservada exclusivamente para el Super Admin." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "CREATE_USER") {
      const { username, name, password, role = "ADMIN" } = body;
      if (!username || !password || password.length < 4) {
        return NextResponse.json(
          { success: false, message: "Usuario y contraseña (mínimo 4 caracteres) son obligatorios." },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: username.trim(), mode: "insensitive" } },
            { name: { equals: username.trim(), mode: "insensitive" } },
          ],
        },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, message: "Ya existe un usuario con este nombre o correo." },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(password);
      const newUser = await prisma.user.create({
        data: {
          email: username.trim(),
          name: (name || username).trim(),
          passwordHash,
          role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      return NextResponse.json({
        success: true,
        message: `Usuario ${newUser.email} creado exitosamente como ${newUser.role}.`,
        data: newUser,
      });
    }

    if (action === "CREATE_WAITER") {
      const { name, pin } = body;
      if (!name?.trim() || !pin?.trim() || pin.length !== 4) {
        return NextResponse.json(
          { success: false, message: "El nombre y un PIN numérico de 4 dígitos son obligatorios." },
          { status: 400 }
        );
      }

      const newWaiter = await prisma.waiter.create({
        data: {
          name: name.trim(),
          pin: pin.trim(),
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Mesero ${newWaiter.name} registrado con éxito.`,
        data: newWaiter,
      });
    }

    return NextResponse.json({ success: false, message: "Acción no reconocida." }, { status: 400 });
  } catch (error: any) {
    console.error("Error en staff POST:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al procesar solicitud" },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar credenciales, roles, meseros o PIN de auditoría
export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Acción reservada exclusivamente para el Super Admin." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    // 1. Cambiar contraseña de un usuario
    if (action === "UPDATE_USER_PASSWORD") {
      const { userId, newPassword } = body;
      if (!userId || !newPassword || newPassword.length < 4) {
        return NextResponse.json(
          { success: false, message: "La nueva contraseña debe tener al menos 4 caracteres." },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      return NextResponse.json({
        success: true,
        message: "Contraseña actualizada exitosamente.",
      });
    }

    // 2. Cambiar PIN o estado de mesero
    if (action === "UPDATE_WAITER") {
      const { waiterId, name, pin, isActive } = body;
      if (!waiterId) {
        return NextResponse.json({ success: false, message: "ID de mesero obligatorio." }, { status: 400 });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (pin !== undefined) {
        if (pin.length !== 4) {
          return NextResponse.json({ success: false, message: "El PIN debe ser de 4 dígitos." }, { status: 400 });
        }
        updateData.pin = pin.trim();
      }
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      const updated = await prisma.waiter.update({
        where: { id: waiterId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: `Mesero ${updated.name} actualizado exitosamente.`,
        data: updated,
      });
    }

    // 3. Cambiar PIN maestro de auditoría
    if (action === "UPDATE_ADMIN_PIN") {
      const { newPin } = body;
      if (!newPin || String(newPin).trim().length !== 4) {
        return NextResponse.json(
          { success: false, message: "El PIN de auditoría debe ser de 4 dígitos exactos." },
          { status: 400 }
        );
      }

      const settings = await prisma.restaurantSettings.findFirst();
      if (settings) {
        await prisma.restaurantSettings.update({
          where: { id: settings.id },
          data: { adminPin: String(newPin).trim() },
        });
      } else {
        await prisma.restaurantSettings.create({
          data: { adminPin: String(newPin).trim() },
        });
      }

      return NextResponse.json({
        success: true,
        message: `PIN de auditoría actualizado a ${newPin}.`,
      });
    }

    return NextResponse.json({ success: false, message: "Acción no reconocida." }, { status: 400 });
  } catch (error: any) {
    console.error("Error en staff PATCH:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al actualizar" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un usuario o mesero
export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Acción reservada exclusivamente para el Super Admin." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const waiterId = searchParams.get("waiterId");

    if (userId) {
      if (userId === session.userId) {
        return NextResponse.json(
          { success: false, message: "No puedes eliminar tu propia cuenta de Super Admin en uso." },
          { status: 400 }
        );
      }

      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ success: true, message: "Usuario eliminado exitosamente." });
    }

    if (waiterId) {
      await prisma.waiter.delete({ where: { id: waiterId } });
      return NextResponse.json({ success: true, message: "Mesero eliminado exitosamente." });
    }

    return NextResponse.json({ success: false, message: "Parámetro no especificado." }, { status: 400 });
  } catch (error: any) {
    console.error("Error en staff DELETE:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error al eliminar" },
      { status: 500 }
    );
  }
}
