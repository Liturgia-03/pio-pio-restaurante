import prisma from "@/lib/prisma";
import PublicMenuClient from "@/components/public/PublicMenuClient";
import { CategoryWithDishes, PromoModalData } from "@/types";

export const dynamic = "force-dynamic";

export default async function PublicMenuPage() {
  let categories: CategoryWithDishes[] = [];
  let promo: PromoModalData | null = null;
  let settings: any = {
    restaurantName: "Pío Pío - Asadero y Restaurante",
    whatsappNumber: "573001234567",
    phone: "573001234567",
    address: "Carrera Principal con Calle 10, Centro",
    openingHours: "Lunes a Domingo: 10:00 AM a 9:00 PM",
    wifiSsid: "PioPio-Clientes",
    wifiPassword: "Parrilla2026*",
    facebookUrl: "",
    instagramUrl: "",
    websiteUrl: "",
  };

  try {
    const [rawCategories, rawPromo, rawSettings] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          dishes: {
            orderBy: { sortOrder: "asc" },
            include: {
              portions: true,
            },
          },
        },
      }),
      prisma.promotionalModal.findFirst({
        where: { isActive: true },
      }),
      prisma.restaurantSettings.findUnique({
        where: { id: "default" },
      }),
    ]);

    categories = JSON.parse(JSON.stringify(rawCategories));

    if (rawPromo) {
      promo = JSON.parse(JSON.stringify(rawPromo));
    }

    if (rawSettings) {
      settings = {
        restaurantName: rawSettings.name,
        whatsappNumber: rawSettings.whatsapp,
        phone: rawSettings.phone,
        address: rawSettings.address,
        openingHours: rawSettings.schedule,
        wifiSsid: rawSettings.wifiSsid,
        wifiPassword: rawSettings.wifiPassword,
        facebookUrl: rawSettings.facebookUrl || "",
        instagramUrl: rawSettings.instagramUrl || "",
        websiteUrl: rawSettings.websiteUrl || "",
      };
    }
  } catch (error) {
    console.error("Error al precargar datos SSR en el servidor:", error);
  }

  return (
    <PublicMenuClient
      initialCategories={categories}
      initialPromo={promo}
      initialSettings={settings}
    />
  );
}
