import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartState, CartItem } from '../types';
import { api } from '../api';
import { useAuth } from './AuthContext';

const GUEST_CART_KEY = 'cravecart_guest_cart';

interface AddToCartResult {
  success: boolean;
  differentRestaurant?: boolean;
  currentRestaurant?: string;
}

interface CartContextType {
  cart: CartState | null;
  isLoading: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (
    menuItemId: number,
    quantity?: number,
    forceReset?: boolean,
    itemDetails?: {
      name: string;
      price: number | string;
      image_url: string;
      is_veg: boolean;
      restaurant_id: number;
      restaurant_name: string;
    }
  ) => Promise<AddToCartResult>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getLocalGuestCart(): CartState | null {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveLocalGuestCart(cart: CartState | null): void {
  try {
    if (!cart || cart.items.length === 0) {
      localStorage.removeItem(GUEST_CART_KEY);
    } else {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    }
  } catch (err) {
    console.error('Failed to save guest cart:', err);
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartState | null>(() => getLocalGuestCart());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Sync guest cart to backend upon authentication
  const syncGuestCartToBackend = useCallback(async () => {
    const guestCart = getLocalGuestCart();
    if (guestCart && guestCart.items.length > 0) {
      try {
        const syncPayload = guestCart.items.map((i) => ({
          menuItemId: i.menu_item_id,
          quantity: i.quantity,
        }));
        await api.syncCart(syncPayload);
        localStorage.removeItem(GUEST_CART_KEY);
      } catch (err) {
        console.warn('Cart sync warning:', err);
      }
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Load from local storage
      const local = getLocalGuestCart();
      setCart(local);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.getCart();
      setCart(res);
    } catch (err: any) {
      console.error('Failed to load server cart:', err.message);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      syncGuestCartToBackend().then(() => {
        refreshCart();
      });
    } else {
      const local = getLocalGuestCart();
      setCart(local);
    }
  }, [isAuthenticated, syncGuestCartToBackend, refreshCart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = async (
    menuItemId: number,
    quantity = 1,
    forceReset = false,
    itemDetails?: {
      name: string;
      price: number | string;
      image_url: string;
      is_veg: boolean;
      restaurant_id: number;
      restaurant_name: string;
    }
  ): Promise<AddToCartResult> => {
    // If authenticated, send directly to server
    if (isAuthenticated) {
      try {
        await api.addToCart(menuItemId, quantity, forceReset);
        await refreshCart();
        return { success: true };
      } catch (err: any) {
        if (
          err.message?.includes('Cart contains items from another restaurant') ||
          err.differentRestaurant
        ) {
          return { success: false, differentRestaurant: true };
        }
        throw err;
      }
    }

    // Unauthenticated Guest Cart handling
    const current = getLocalGuestCart();
    const itemRestId = itemDetails?.restaurant_id || (current ? current.restaurantId : null);
    const itemRestName = itemDetails?.restaurant_name || (current ? current.restaurantName : 'Selected Restaurant');

    if (current && current.items.length > 0 && current.restaurantId && itemRestId && current.restaurantId !== itemRestId) {
      if (!forceReset) {
        return {
          success: false,
          differentRestaurant: true,
          currentRestaurant: current.restaurantName || 'Another Restaurant',
        };
      }
    }

    let items: CartItem[] = forceReset || !current ? [] : [...current.items];
    const existingIndex = items.findIndex((i) => i.menu_item_id === menuItemId);

    const priceNum = itemDetails ? Number(itemDetails.price) : 250;

    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const newQty = existing.quantity + quantity;
      items[existingIndex] = {
        ...existing,
        quantity: newQty,
        item_total: Math.round(newQty * Number(existing.price) * 100) / 100,
      };
    } else {
      const newItem: CartItem = {
        cart_item_id: Date.now() + Math.floor(Math.random() * 1000),
        quantity,
        menu_item_id: menuItemId,
        name: itemDetails?.name || 'Delicious Dish',
        price: priceNum,
        image_url: itemDetails?.image_url || '/src/assets/images/biryani_specialty_1793294053906.jpg',
        is_veg: itemDetails ? itemDetails.is_veg : true,
        is_available: true,
        restaurant_id: itemRestId || 1,
        restaurant_name: itemRestName || 'Selected Restaurant',
        item_total: Math.round(quantity * priceNum * 100) / 100,
      };
      items.push(newItem);
    }

    const subtotal = items.reduce((sum, i) => sum + Number(i.item_total), 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    const updatedState: CartState = {
      cartId: 9999,
      restaurantId: itemRestId || 1,
      restaurantName: itemRestName || 'Selected Restaurant',
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      itemCount,
    };

    saveLocalGuestCart(updatedState);
    setCart(updatedState);
    return { success: true };
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    if (isAuthenticated) {
      await api.updateCartItem(cartItemId, quantity);
      await refreshCart();
      return;
    }

    // Guest update
    const current = getLocalGuestCart();
    if (!current) return;

    let items = [...current.items];
    if (quantity <= 0) {
      items = items.filter((i) => i.cart_item_id !== cartItemId);
    } else {
      items = items.map((i) => {
        if (i.cart_item_id === cartItemId) {
          return {
            ...i,
            quantity,
            item_total: Math.round(quantity * Number(i.price) * 100) / 100,
          };
        }
        return i;
      });
    }

    if (items.length === 0) {
      saveLocalGuestCart(null);
      setCart(null);
      return;
    }

    const subtotal = items.reduce((sum, i) => sum + Number(i.item_total), 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    const updatedState: CartState = {
      ...current,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      itemCount,
    };

    saveLocalGuestCart(updatedState);
    setCart(updatedState);
  };

  const removeItem = async (cartItemId: number) => {
    await updateQuantity(cartItemId, 0);
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      await api.clearCart();
      await refreshCart();
    } else {
      saveLocalGuestCart(null);
      setCart(null);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
