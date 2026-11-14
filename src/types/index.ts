export type Role = "ADMIN" | "STAFF";

export type ItemBadge = "NONE" | "POPULAR" | "CHEFS_SPECIAL" | "NEW" | "PROMO";

export interface Portion {
  id?: string;
  label: string;
  price: number;
  isDefault: boolean;
}

export interface DishItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  discountPrice: number | null;
  imageUrl: string;
  imagePublicId?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  badge: ItemBadge;
  preparationTime?: number | null;
  servings?: string | null;
  sortOrder: number;
  portions: Portion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryWithDishes {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  sortOrder: number;
  isActive: boolean;
  dishes: DishItem[];
}

export interface PromoModalData {
  id?: string;
  // Campos editables de la Tarjeta de Bienvenida (Paso 1)
  welcomeBadge?: string | null;
  welcomeTitle?: string | null;
  welcomeSubtitle?: string | null;
  welcomeDescription?: string | null;
  welcomeButtonText?: string | null;
  welcomeTag1?: string | null;
  welcomeTag1Sub?: string | null;
  welcomeTag2?: string | null;
  welcomeTag2Sub?: string | null;
  welcomeTag3?: string | null;
  welcomeTag3Sub?: string | null;

  // Campos del Plato Promocional (Paso 2)
  title: string;
  subtitle: string | null;
  description: string;
  imageUrl: string;
  imagePublicId?: string | null;
  badgeText: string | null;
  regularPrice: number | null;
  promoPrice: number | null;
  ctaText: string;
  targetDishId: string | null;
  isActive: boolean;
  autoShowDelayMs: number;
  showOncePerSession: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message: string;
  error?: string | null;
}

