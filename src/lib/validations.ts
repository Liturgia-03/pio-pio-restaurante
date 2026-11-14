import { z } from "zod";

export const dishSchema = z.object({
  categoryId: z.string().min(1, "Categoría requerida"),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  description: z.string().min(5, "La descripción es requerida").max(500),
  basePrice: z.coerce.number().positive("El precio base debe ser mayor a 0"),
  discountPrice: z.coerce.number().positive().nullable().optional(),
  imageUrl: z.string().min(1, "URL o ruta de imagen requerida"),
  imagePublicId: z.string().optional().nullable(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  badge: z.enum(["NONE", "POPULAR", "CHEFS_SPECIAL", "NEW", "PROMO"]).default("NONE"),
  preparationTime: z.coerce.number().int().positive().nullable().optional(),
  servings: z.string().max(50).optional().nullable(),
  portions: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().min(1, "Etiqueta requerida (ej: 1/2 Pollo)"),
        price: z.coerce.number().positive("Precio debe ser positivo"),
        isDefault: z.boolean().default(false),
      })
    )
    .optional()
    .default([]),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Nombre requerido").max(60),
  description: z.string().max(200).optional().nullable(),
  iconName: z.string().default("Flame"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const promoModalSchema = z.object({
  // Campos de la Tarjeta de Bienvenida (Paso 1)
  welcomeBadge: z.string().max(60).optional().nullable(),
  welcomeTitle: z.string().max(80).optional().nullable(),
  welcomeSubtitle: z.string().max(100).optional().nullable(),
  welcomeDescription: z.string().max(500).optional().nullable(),
  welcomeButtonText: z.string().max(60).optional().nullable(),
  welcomeTag1: z.string().max(40).optional().nullable(),
  welcomeTag1Sub: z.string().max(40).optional().nullable(),
  welcomeTag2: z.string().max(40).optional().nullable(),
  welcomeTag2Sub: z.string().max(40).optional().nullable(),
  welcomeTag3: z.string().max(40).optional().nullable(),
  welcomeTag3Sub: z.string().max(40).optional().nullable(),

  // Campos del Plato Promocional (Paso 2)
  title: z.string().min(3, "Título requerido").max(80),
  subtitle: z.string().max(120).optional().nullable(),
  description: z.string().min(5, "Descripción requerida").max(300),
  imageUrl: z.string().min(1, "URL o ruta de imagen requerida"),
  badgeText: z.string().max(30).optional().nullable(),
  regularPrice: z.coerce.number().positive().optional().nullable(),
  promoPrice: z.coerce.number().positive().optional().nullable(),
  ctaText: z.string().default("Ver en el Menú"),
  targetDishId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  autoShowDelayMs: z.coerce.number().int().min(0).max(5000).default(0),
  showOncePerSession: z.boolean().default(true),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Ingresa tu usuario").optional(),
  email: z.string().min(1, "Ingresa tu usuario").optional(),
  password: z.string().min(1, "Ingresa tu contraseña"),
}).refine((data) => data.username || data.email, {
  message: "El usuario es requerido",
  path: ["username"],
});

