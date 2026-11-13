import {
  Flame,
  UtensilsCrossed,
  Salad,
  Beer,
  Coffee,
  Sparkles,
  ShoppingBag,
  Utensils,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Flame,
  UtensilsCrossed,
  Salad,
  Beer,
  Coffee,
  Sparkles,
  ShoppingBag,
  Utensils,
};

export function IconRenderer({
  name,
  className = "w-5 h-5",
}: {
  name?: string | null;
  className?: string;
}) {
  const IconComponent = (name && iconMap[name]) || UtensilsCrossed;
  return <IconComponent className={className} />;
}

