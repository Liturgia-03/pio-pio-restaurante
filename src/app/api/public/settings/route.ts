import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
        },
      },
      { status: 200 }
    );
  }
}
