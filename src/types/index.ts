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

