import { v2 as cloudinary } from "cloudinary";

// Configuración de Cloudinary si las credenciales existen en variables de entorno
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  url: string;
  publicId?: string;
  provider: "cloudinary" | "base64" | "local";
}

/**
 * Sube una imagen procesando según el entorno:
 * 1. Cloudinary: Si están configuradas las credenciales (Cloudinary SDK con WebP y max 800px).
 * 2. Fallback Serverless Seguro (Producción sin Cloudinary): Codifica a Base64 Data URI para NUNCA escribir
 *    en el sistema de archivos de solo lectura y prevenir el error EROFS.
 * 3. Fallback Local (Desarrollo): Guarda en /public/uploads utilizando dynamic import de fs/promises.
 */
export async function uploadImage(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string = "image/webp"
): Promise<UploadResult> {
  // 1. Camino Cloudinary (Recomendado en Producción)
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "pio-pio-menu",
          format: "webp",
          transformation: [
            { width: 800, crop: "limit" }, // Redimensiona fotos pesadas de 8MB a max 800px
            { quality: "auto" },           // Compresión visual óptima
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error("Error al subir a Cloudinary"));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            provider: "cloudinary",
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  // 2. Fallback de Producción sin Cloudinary (Serverless-Safe: Cero escrituras a disco, previene EROFS)
  if (process.env.NODE_ENV === "production") {
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;
    return {
      url: dataUri,
      publicId: `datauri-${Date.now()}`,
      provider: "base64",
    };
  }

  // 3. Fallback en Desarrollo Local (Condicionado estrictamente a NODE_ENV !== "production")
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(originalFilename) || ".webp";
  const uniqueName = `dish-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;
  const filePath = path.join(uploadDir, uniqueName);

  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${uniqueName}`,
    publicId: uniqueName,
    provider: "local",
  };
}
