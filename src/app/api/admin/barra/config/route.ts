import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_FILE_PATH = path.join(process.cwd(), "prisma", "barra-config.json");

export interface BarraConfig {
  activeBills: number[];
  paymentMethods: {
    cash: boolean;
    nequi: boolean;
    daviplata: boolean;
    card: boolean;
    mixed: boolean;
  };
  favoriteDishNames: string[];
}

export const DEFAULT_BARRA_CONFIG: BarraConfig = {
  activeBills: [100000, 50000, 20000, 10000, 5000, 2000],
  paymentMethods: {
    cash: true,
    nequi: true,
    daviplata: true,
    card: true,
    mixed: true,
  },
  favoriteDishNames: [
    "Pollo Asado Entero",
    "Medio Pollo Asado",
    "Cuarto de Pollo Asado",
    "Pollo Apanado Entero",
    "Medio Pollo Apanado",
    "Porción de Papa Salada",
    "Porción de Yuca al Vapor",
    "Gaseosa 1.5 Litros",
  ],
};

function readConfig(): BarraConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      return { ...DEFAULT_BARRA_CONFIG, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error("Error reading barra config:", e);
  }
  return DEFAULT_BARRA_CONFIG;
}

function writeConfig(config: BarraConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing barra config:", e);
  }
}

export async function GET() {
  const config = readConfig();
  return NextResponse.json({ success: true, data: config });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = readConfig();
    const updated: BarraConfig = {
      activeBills: Array.isArray(body.activeBills) ? body.activeBills : current.activeBills,
      paymentMethods: {
        ...current.paymentMethods,
        ...(body.paymentMethods || {}),
      },
      favoriteDishNames: Array.isArray(body.favoriteDishNames) ? body.favoriteDishNames : current.favoriteDishNames,
    };
    writeConfig(updated);
    return NextResponse.json({
      success: true,
      data: updated,
      message: "Configuración de barra guardada con éxito",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Error al guardar configuración" },
      { status: 500 }
    );
  }
}
