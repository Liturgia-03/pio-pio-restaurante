import prisma from "@/lib/prisma";
import { comparePassword, getSessionUser } from "@/lib/auth";

export interface VerifyAuthResult {
  authorized: boolean;
  username: string;
  error?: string;
}

/**
 * Valida un PIN de 4 dígitos o una contraseña de Administrador
 */
export async function verifyAdminAuthorization(
  pinOrPassword: string
): Promise<VerifyAuthResult> {
  const secret = (pinOrPassword || "").trim();

  if (!secret) {
    return {
      authorized: false,
      username: "",
      error: "El PIN o contraseña de Administrador es obligatorio",
    };
  }

  try {
    // 1. Obtener ajustes del asadero para chequear el PIN administrativo rápido
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: "default" },
    });

    const configuredPin = settings?.adminPin || "1234";

    // Si coincide con el PIN rápido (ej: "1234")
    if (secret === configuredPin) {
      const session = await getSessionUser().catch(() => null);
      return {
        authorized: true,
        username: session?.name || "Administrador (vía PIN)",
      };
    }

    // 2. Verificar contra los usuarios con rol ADMIN en base de datos
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    for (const admin of adminUsers) {
      const match = await comparePassword(secret, admin.passwordHash);
      if (match) {
        return {
          authorized: true,
          username: admin.name || admin.email || "Administrador",
        };
      }
    }

    // 3. Fallback de emergencia con variables de entorno
    if (
      process.env.ADMIN_INITIAL_PASSWORD &&
      secret === process.env.ADMIN_INITIAL_PASSWORD
    ) {
      return {
        authorized: true,
        username: "Admin Maestro (Credencial)",
      };
    }

    return {
      authorized: false,
      username: "",
      error: "PIN o contraseña de Administrador incorrecto",
    };
  } catch (error: any) {
    console.error("Error al verificar autorización de admin:", error);
    return {
      authorized: false,
      username: "",
      error: error.message || "Error al verificar autorización",
    };
  }
}

/**
 * Registra una acción sensible en el historial inmutable de auditoría
 */
export async function logAuditEvent({
  action,
  description,
  reason,
  approvedBy,
  targetId,
  targetType,
  previousData,
  newData,
}: {
  action: string;
  description: string;
  reason: string;
  approvedBy: string;
  targetId?: string | null;
  targetType?: string | null;
  previousData?: any;
  newData?: any;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        action,
        description,
        reason: reason.trim(),
        approvedBy: approvedBy || "Admin",
        targetId: targetId || null,
        targetType: targetType || null,
        previousData: previousData ? JSON.stringify(previousData) : null,
        newData: newData ? JSON.stringify(newData) : null,
      },
    });
  } catch (error) {
    console.error("Error al registrar evento de auditoría:", error);
    return null;
  }
}
