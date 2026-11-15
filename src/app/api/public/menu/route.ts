import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Memoria caché Single-Flight de ultra alta velocidad:
// Blindaje contra Cache Stampede (Thundering Herd) para soportar avalanchas masivas con 1 sola consulta a Neon
let cachedCategories: any = null;
let cacheTimestamp = 0;
let inflightPromise: Promise<any> | null = null;
const CACHE_TTL_MS = 30000; // 30 segundos de caché en memoria

export async function GET() {
  try {
    const now = Date.now();
    if (cachedCategories && now - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        {
          success: true,
          data: { categories: cachedCategories },
          message: "Menú cargado exitosamente (Caché acelerada)",
          error: null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    // Si ya hay una consulta en vuelo, todas las peticiones concurrentes esperan a esa misma promesa
    // evitando saturar el pool de conexiones de Neon PostgreSQL
    if (!inflightPromise) {
      inflightPromise = prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          dishes: {
            orderBy: { sortOrder: "asc" },
            include: {
              portions: {
                orderBy: { price: "asc" },
              },
            },
          },
        },
      })
        .then((cats) => {
          cachedCategories = cats;
          cacheTimestamp = Date.now();
          inflightPromise = null;
          return cats;
        })
        .catch((err) => {
          inflightPromise = null;
          throw err;
        });
    }

    const categories = await inflightPromise;

    return NextResponse.json(
      {
        success: true,
        data: { categories },
        message: "Menú cargado exitosamente",
        error: null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("Error al obtener menú público:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al cargar la carta del menú",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

