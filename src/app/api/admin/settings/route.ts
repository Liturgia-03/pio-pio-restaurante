import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import * as bcrypt from "bcrypt";

const defaultHeaderImages = [
  "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
];

function parseImages(raw: string | null | undefined): string[] {
  if (!raw) return defaultHeaderImages;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return defaultHeaderImages;
}

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
          headerImages: JSON.stringify(defaultHeaderImages),
          headerTagline: "Asadero & Restaurante Tradicional",
          headerDescription: "El auténtico sabor a la brasa, broaster y platos típicos",
        },
      });
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { email: true, name: true },
    });

    const headerImages = parseImages(settings.headerImages);

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
        logoUrl: settings.logoUrl || "/logo-pio-pio.png",
        headerImages,
        headerTagline: settings.headerTagline || "Asadero & Restaurante Tradicional",
        headerDescription: settings.headerDescription || "El auténtico sabor a la brasa, broaster y platos típicos",
        adminUsername: adminUser?.name || adminUser?.email || "Piopio123",
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

    const headerImagesStr = Array.isArray(body.headerImages)
      ? JSON.stringify(body.headerImages)
      : typeof body.headerImages === "string"
      ? body.headerImages
      : undefined;

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
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
        ...(headerImagesStr !== undefined ? { headerImages: headerImagesStr } : {}),
        ...(body.headerTagline !== undefined ? { headerTagline: body.headerTagline } : {}),
        ...(body.headerDescription !== undefined ? { headerDescription: body.headerDescription } : {}),
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
        logoUrl: body.logoUrl || "/logo-pio-pio.png",
        headerImages: headerImagesStr || JSON.stringify(defaultHeaderImages),
        headerTagline: body.headerTagline || "Asadero & Restaurante Tradicional",
        headerDescription: body.headerDescription || "El auténtico sabor a la brasa, broaster y platos típicos",
      },
    });

    // 2. Si el usuario solicitó cambio de credenciales de administración (Usuario o Contraseña)
    const newUsername = (body.adminUsername || body.username || "").trim();
    const newPassword = (body.newPassword || "").trim();

    if (newUsername || newPassword) {
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });

      if (!adminUser) {
        return NextResponse.json(
          { success: false, message: "Usuario administrador no encontrado" },
          { status: 404 }
        );
      }

      if (newPassword) {
        if (body.currentPassword) {
          const isValid = await bcrypt.compare(body.currentPassword, adminUser.passwordHash);
          if (!isValid) {
            return NextResponse.json(
              { success: false, message: "La contraseña actual es incorrecta" },
              { status: 400 }
            );
          }
        }
      }

      const userUpdateData: any = {};
      if (newUsername && newUsername.length >= 2) {
        userUpdateData.email = newUsername;
        userUpdateData.name = newUsername;
      }
      if (newPassword && newPassword.length >= 4) {
        userUpdateData.passwordHash = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: userUpdateData,
        });
      }
    }

    // Invalidar caché de Next.js para que el menú público refleje cambios al instante
    revalidatePath("/");
    revalidatePath("/menu");

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
        headerImages: parseImages(updatedSettings.headerImages),
        headerTagline: updatedSettings.headerTagline || "Asadero & Restaurante Tradicional",
        headerDescription: updatedSettings.headerDescription || "El auténtico sabor a la brasa, broaster y platos típicos",
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
