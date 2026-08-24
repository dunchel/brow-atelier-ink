"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Cart } from "@/lib/cart";

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  isOpen: boolean;
  error: string | null;
  itemCount: number;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

const CART_ID_KEY = "brow-atelier-cart-id";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemCount = cart?.totalQuantity ?? 0;

  useEffect(() => {
    const savedCartId = localStorage.getItem(CART_ID_KEY);
    if (!savedCartId) return;

    fetch(`/api/cart?cartId=${encodeURIComponent(savedCartId)}`)
      .then((res) => res.json())
      .then(({ cart }) => {
        if (cart) {
          setCart(cart);
        } else {
          localStorage.removeItem(CART_ID_KEY);
        }
      })
      .catch(() => localStorage.removeItem(CART_ID_KEY));
  }, []);

  const saveCart = useCallback((newCart: Cart) => {
    setCart(newCart);
    localStorage.setItem(CART_ID_KEY, newCart.id);
  }, []);

  const addItem = useCallback(async (variantId: string, quantity = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart?.id ?? null,
          variantId,
          quantity,
        }),
      });
      const data = await res.json();
      if (data.cart) {
        saveCart(data.cart);
        setIsOpen(true);
        return;
      }
      throw new Error(data.error || "Kon niet toevoegen aan winkelwagen.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kon niet toevoegen aan winkelwagen.";
      setError(message);
      setIsOpen(true);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setLoading(false);
    }
  }, [cart?.id, saveCart]);

  const updateItem = useCallback(async (lineId: string, quantity: number) => {
    if (!cart?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: cart.id, lineId, quantity }),
      });
      const data = await res.json();
      if (data.cart) saveCart(data.cart);
    } finally {
      setLoading(false);
    }
  }, [cart?.id, saveCart]);

  const removeItem = useCallback(async (lineId: string) => {
    if (!cart?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: cart.id, lineId }),
      });
      const data = await res.json();
      if (data.cart) saveCart(data.cart);
    } finally {
      setLoading(false);
    }
  }, [cart?.id, saveCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        isOpen,
        error,
        itemCount,
        addItem,
        updateItem,
        removeItem,
        openCart: () => setIsOpen(true),
        closeCart: () => {
          setIsOpen(false);
          setError(null);
        },
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
