import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    const images = parseImages(settings.headerImages);

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
        headerImages: images,
        headerTagline: settings.headerTagline || "Asadero & Restaurante Tradicional",
        headerDescription: settings.headerDescription || "El auténtico sabor a la brasa, broaster y platos típicos",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        data: {
          restaurantName: "Pío Pío - Asadero y Restaurante",
          whatsappNumber: "573001234567",
          phone: "573001234567",
          address: "Carrera Principal con Calle 10, Centro",
          openingHours: "Lunes a Domingo: 10:00 AM a 9:00 PM",
          wifiSsid: "PioPio-Clientes",
          wifiPassword: "Parrilla2026*",
          headerImages: defaultHeaderImages,
          headerTagline: "Asadero & Restaurante Tradicional",
          headerDescription: "El auténtico sabor a la brasa, broaster y platos típicos",
        },
      },
      { status: 200 }
    );
  }
}
