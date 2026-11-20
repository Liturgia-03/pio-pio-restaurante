"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DishItem, Portion } from "@/types";
import { toast } from "sonner";

export interface CartItem {
  id: string; // unique item key: dishId + portionId
  dishId: string;
  name: string;
  portionLabel?: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface CustomerSessionItem {
  id: string;
  dishId?: string | null;
  dishName: string;
  portionLabel?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  round: number;
  status: string;
  deliveredAt?: string | null;
  createdAt: string;
}

export interface CustomerTableSession {
  hasActiveSession: boolean;
  sessionId?: string;
  tableNumber: string;
  status: "PENDING_CONFIRMATION" | "OPEN" | "BILL_REQUESTED" | "CLOSED" | "FREE";
  total?: number;
  waiterName?: string | null;
  itemsCount?: number;
  createdAt?: string;
  deliveredAt?: string | null;
  hasPendingDelivery?: boolean;
  isAllDelivered?: boolean;
  deliveryState?: "PENDING_INITIAL" | "PENDING_ADDITION" | "ALL_DELIVERED" | "NONE";
  pendingWaitMinutes?: number;
  isOverdue?: boolean;
  items?: CustomerSessionItem[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (dish: DishItem, portion?: Portion | null) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Estado de la comanda en vivo de la mesa
  customerSession: CustomerTableSession | null;
  activeTableNumber: string | null;
  setActiveTableNumber: (table: string | null) => void;
  refreshTableSession: () => Promise<void>;
  clearCustomerSession: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTableNumber, setActiveTableNumber] = useState<string | null>(null);
  const [customerSession, setCustomerSession] = useState<CustomerTableSession | null>(null);

  // Cargar carrito y mesa desde localStorage/sessionStorage en cliente
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("piopio_cart");
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }

      const savedMesa =
        sessionStorage.getItem("piopio_mesa") || localStorage.getItem("piopio_mesa");
      if (savedMesa) {
        const parsed = parseInt(savedMesa.replace(/\D/g, "") || "0", 10);
        if (parsed > 0) setActiveTableNumber(String(parsed));
      }

      const savedSession = localStorage.getItem("piopio_customer_session");
      if (savedSession) {
        setCustomerSession(JSON.parse(savedSession));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Guardar carrito en localStorage
  useEffect(() => {
    try {
      localStorage.setItem("piopio_cart", JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  // Actualizar sesión activa de mesa con el backend en tiempo real
  const refreshTableSession = useCallback(async () => {
    if (!activeTableNumber) return;
    try {
      const res = await fetch(`/api/public/table-status?mesa=${activeTableNumber}`);
      const json = await res.json();
      if (json.success && json.data) {
        const newData = json.data as CustomerTableSession;

        setCustomerSession((prev) => {
          // Si pasa de PENDING a OPEN: Notificación celebratoria
          if (prev?.status === "PENDING_CONFIRMATION" && newData.status === "OPEN") {
            toast.success("¡Tu pedido ha sido aprobado por el mesero y está marchando a cocina!", {
              duration: 6000,
            });
          }

          // Si pasa a CLOSED: Notificación de mesa liberada
          if (
            prev?.status &&
            prev.status !== "CLOSED" &&
            prev.status !== "FREE" &&
            newData.status === "CLOSED"
          ) {
            toast.info("¡Cuenta pagada y cerrada en caja! Gracias por tu visita a Pío Pío.", {
              duration: 7000,
            });
          }

          return newData;
        });

        if (newData.hasActiveSession) {
          localStorage.setItem("piopio_customer_session", JSON.stringify(newData));
        } else if (newData.status === "FREE") {
          localStorage.removeItem("piopio_customer_session");
        }
      }
    } catch (err) {
      console.error("Error al sincronizar estado de comanda:", err);
    }
  }, [activeTableNumber]);

  // Polling inteligente con detección de visibilidad activa (ahorra cuota y suspende en reposo)
  useEffect(() => {
    if (!activeTableNumber) return;
    refreshTableSession();

    // Solo consulta si la pestaña está activa y visible en pantalla
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshTableSession();
      }
    }, 5000);

    // Refresco instantáneo al desbloquear el teléfono o volver a la pestaña
    const handleResume = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshTableSession();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleResume);
      window.addEventListener("focus", handleResume);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleResume);
        window.removeEventListener("focus", handleResume);
      }
    };
  }, [activeTableNumber, refreshTableSession]);

  const clearCustomerSession = () => {
    setCustomerSession(null);
    localStorage.removeItem("piopio_customer_session");
  };

  const addItem = (dish: DishItem, portion?: Portion | null) => {
    const price = portion ? portion.price : dish.discountPrice || dish.basePrice;
    const portionLabel = portion ? portion.label : undefined;
    const itemKey = `${dish.id}-${portionLabel || "default"}`;

    setItems((prev) => {
      const existing = prev.find((item) => item.id === itemKey);
      if (existing) {
        return prev.map((item) =>
          item.id === itemKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: itemKey,
          dishId: dish.id,
          name: dish.name,
          portionLabel,
          price,
          quantity: 1,
          imageUrl: dish.imageUrl,
        },
      ];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        customerSession,
        activeTableNumber,
        setActiveTableNumber,
        refreshTableSession,
        clearCustomerSession,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe utilizarse dentro de un CartProvider");
  }
  return context;
}


