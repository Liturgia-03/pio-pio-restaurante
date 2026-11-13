import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import * as bcrypt from "bcrypt";

export async function GET() {
  try {
    let settings = await prisma.restaurantSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.restaurantSettings.create({
        data: {
          id: "default",
          name: "Pío Pío - Asadero y Restaurante",
          whatsapp: "573001234567",
          phone: "573001234567",
          address: "Carrera Principal con Calle 10, Centro",
          schedule: "Lunes a Domingo: 10:00 AM a 9:00 PM",
          wifiSsid: "PioPio-Clientes",
          wifiPassword: "Parrilla2026*",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        restaurantName: settings.name,
        whatsappNumber: settings.whatsapp,
        phone: settings.phone,
        address: settings.address,
        openingHours: settings.schedule,
        wifiSsid: settings.wifiSsid,
        wifiPassword: settings.wifiPassword,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, message: "Error al leer ajustes", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // 1. Actualización de ajustes del restaurante en Base de Datos
    const updatedSettings = await prisma.restaurantSettings.upsert({
      where: { id: "default" },
      update: {
        name: body.restaurantName || "Pío Pío - Asadero y Restaurante",
        whatsapp: body.whatsappNumber || "573001234567",
        phone: body.phone || body.whatsappNumber || "573001234567",
        address: body.address || "",
        schedule: body.openingHours || "",
        wifiSsid: body.wifiSsid || "",
        wifiPassword: body.wifiPassword || "",
      },
      create: {
        id: "default",
        name: body.restaurantName || "Pío Pío - Asadero y Restaurante",
        whatsapp: body.whatsappNumber || "573001234567",
        phone: body.phone || body.whatsappNumber || "573001234567",
        address: body.address || "",
        schedule: body.openingHours || "",
        wifiSsid: body.wifiSsid || "",
        wifiPassword: body.wifiPassword || "",
      },
    });

    // 2. Si el usuario solicitó cambio de contraseña de administración
    if (body.newPassword && body.newPassword.trim().length >= 6) {
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });

      if (!adminUser) {
        return NextResponse.json(
          { success: false, message: "Usuario administrador no encontrado" },
          { status: 404 }
        );
      }

      if (body.currentPassword) {
        const isValid = await bcrypt.compare(body.currentPassword, adminUser.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            { success: false, message: "La contraseña actual es incorrecta" },
            { status: 400 }
          );
        }
      }

      const newHash = await bcrypt.hash(body.newPassword.trim(), 10);
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { passwordHash: newHash },
      });
    }

    // Invalidar caché de Next.js para que el menú público refleje cambios al instante
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      data: {
        restaurantName: updatedSettings.name,
        whatsappNumber: updatedSettings.whatsapp,
        phone: updatedSettings.phone,
        address: updatedSettings.address,
        openingHours: updatedSettings.schedule,
        wifiSsid: updatedSettings.wifiSsid,
        wifiPassword: updatedSettings.wifiPassword,
      },
      message: "Ajustes guardados correctamente en la base de datos",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, message: "Error al guardar ajustes", error: error.message },
      { status: 500 }
    );
  }
}
