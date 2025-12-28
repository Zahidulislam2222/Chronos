import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { Product } from '@/lib/mockData';

// --- Types ---
interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'SET_CART'; payload: CartItem[] };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean; // Tells the Checkout page if we are still working
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload };
    case 'ADD_ITEM': {
      if (!action.payload || !action.payload.id) return state;
      const existingItem = state.items.find((item) => item.product.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
          isOpen: true,
        };
      }
      return { ...state, items: [...state.items, { product: action.payload, quantity: 1 }], isOpen: true };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((item) => item.product.id !== action.payload) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });
  const [isInitialized, setIsInitialized] = useState(false); // <--- THE SAFETY LOCK

  // 1. LOAD DATA (Runs once)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('chronos_cart');
      if (storedCart) {
        try {
          const parsed = JSON.parse(storedCart);
          if (Array.isArray(parsed)) {
            dispatch({ type: 'SET_CART', payload: parsed });
          }
        } catch (error) {
          console.error("Cart corrupted", error);
        }
      }
      setIsInitialized(true); // <--- UNLOCK SAVING
    }
  }, []);

  // 2. SAVE DATA (Runs only when UNLOCKED)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('chronos_cart', JSON.stringify(state.items));
    }
  }, [state.items, isInitialized]);

  // Actions...
  const addToCart = (product: Product) => dispatch({ type: 'ADD_ITEM', payload: product });
  const removeFromCart = (productId: string) => dispatch({ type: 'REMOVE_ITEM', payload: productId });
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) removeFromCart(productId);
    else dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
  };
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' });
  const closeCart = () => dispatch({ type: 'CLOSE_CART' });

  // Safe Calculations
  const totalItems = state.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = state.items.reduce((sum, item) => sum + (item.product?.price || 0) * (item.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        state, dispatch, addToCart, removeFromCart, updateQuantity, clearCart, toggleCart, closeCart,
        totalItems, totalPrice,
        isLoading: !isInitialized // Export this so Checkout knows to wait
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};