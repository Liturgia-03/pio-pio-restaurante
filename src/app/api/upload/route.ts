import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, data: null, message: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validar tipo de imagen
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Formato no permitido. Utilice JPG, PNG o WebP",
        },
        { status: 400 }
      );
    }

    // Subir mediante el adaptador de almacenamiento (Cloudinary en prod / local fallback)
    const result = await uploadImage(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
        provider: result.provider,
      },
      message:
        result.provider === "cloudinary"
          ? "Imagen optimizada y guardada en Cloudinary"
          : result.provider === "base64"
          ? "Imagen optimizada en Base64 (Serverless)"
          : "Imagen guardada localmente",
      error: null,
    });
  } catch (error: any) {
    console.error("Error al subir imagen:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Error al procesar y subir la imagen",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
