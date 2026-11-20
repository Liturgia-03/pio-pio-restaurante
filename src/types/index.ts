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
  imageUrl?: string | null;
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

export type TableStatus = "OPEN" | "PENDING_CONFIRMATION" | "BILL_REQUESTED" | "CLOSED";
export type ItemSource = "CUSTOMER_QR" | "WAITER" | "ADMIN_CASHIER";
export type ItemStatus = "PENDING_CONFIRMATION" | "CONFIRMED" | "CANCELLED";

export interface WaiterItem {
  id: string;
  name: string;
  pin: string;
  isActive: boolean;
  createdAt?: string;
}

export interface OrderItemData {
  id: string;
  tableSessionId: string;
  dishId: string;
  dishName: string;
  portionLabel?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
  addedBy: ItemSource;
  addedByName?: string | null;
  round: number;
  status: ItemStatus;
  cancelledReason?: string | null;
  createdAt: string;
}

export interface TableSessionData {
  id: string;
  tableNumber: string;
  status: TableStatus;
  waiterId?: string | null;
  waiter?: WaiterItem | null;
  total: number;
  closedAt?: string | null;
  closedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemData[];
}

export interface TableCardData {
  tableNumber: string;
  session: TableSessionData | null;
  status: "FREE" | TableStatus;
  minutesOpen?: number | null;
}


