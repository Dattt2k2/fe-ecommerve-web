'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/types';
import { cartAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

interface CartContextType extends CartState {
  addToCart: (product: Product, quantity?: number, options?: { size?: string; color?: string }) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (itemId: string) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => Promise<{ success: boolean; message?: string }>;
  isInCart: (productId: string) => boolean;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number; options?: { size?: string; color?: string } } }
  | { type: 'REMOVE_FROM_CART'; payload: { itemId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: { items: CartItem[]; total: number; itemCount: number } };

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, quantity, options } = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => item.product.id === product.id && 
        item.size === options?.size && 
        item.color === options?.color
      );

      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += quantity;
        const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
        return { items: newItems, total, itemCount };
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity,
          size: options?.size,
          color: options?.color,
        };
        const newItems = [...state.items, newItem];
        const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
        return { items: newItems, total, itemCount };
      }
    }
    case 'REMOVE_FROM_CART': {
      const newItems = state.items.filter(item => item.id !== action.payload.itemId);
      const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      return { items: newItems, total, itemCount };
    }
    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_FROM_CART', payload: { itemId } });
      }
      const newItems = state.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      return { items: newItems, total, itemCount };
    }
    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };
    case 'SET_CART':
      return action.payload;
    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  });
  
  const { user } = useAuth();

  // Fetch cart data from backend on mount or when user changes
  useEffect(() => {
    const fetchCart = async () => {
      // If user is not logged in, clear cart
      if (!user) {
        dispatch({ type: 'CLEAR_CART' });
        return;
      }

      try {
        const response = await cartAPI.getCart();
        
        // Backend returns { products: [...], user_id: "..." }
        if (response.products && Array.isArray(response.products)) {
          const items = response.products;
          
          // Calculate total from products
          const total = items.reduce((sum: number, item: any) => 
            sum + (item.price || 0) * (item.quantity || 0), 0
          );
          const itemCount = items.reduce((sum: number, item: any) => 
            sum + (item.quantity || 0), 0
          );
          
          dispatch({ 
            type: 'SET_CART', 
            payload: { 
              items: items.map((item: any) => ({
                id: item.product_id || `${item.product_id}-${Date.now()}`,
                product: {
                  id: item.product_id,
                  name: item.name,
                  price: item.price,
                  image: item.image_url || '/placeholder-product.jpg',
                  description: item.description || '',
                  stock: 100, // Default value
                  category: '',
                  rating: 0,
                  reviews: 0,
                },
                quantity: item.quantity || 1,
                size: item.size,
                color: item.color,
              })),
              total,
              itemCount
            }
          });
        }
      } catch (error) {
        // Silently fail - user might not be logged in or cart might be empty
      }
    };

    fetchCart();
  }, [user]); // Re-run when user changes (login/logout)

  const addToCart = async (product: Product, quantity = 1, options?: { size?: string; color?: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      // Call API to add to cart
      const response = await cartAPI.addToCart({
        product_id: product.id,
        quantity,
        size: options?.size,
        color: options?.color,
      });

      // If API call succeeds, update local state
      dispatch({ type: 'ADD_TO_CART', payload: { product, quantity, options } });
      
      return { 
        success: true, 
        message: response.message || 'Đã thêm vào giỏ hàng' 
      };
    } catch (error: any) {
      // Parse error message
      let errorMessage = 'Có lỗi xảy ra khi thêm vào giỏ hàng';
      let statusCode = 500;

      try {
        const errorData = JSON.parse(error.message);
        statusCode = errorData.status;
        
        // Try to extract error message from different possible locations
        errorMessage = errorData.data?.error 
          || errorData.data?.message 
          || errorData.message 
          || errorData.error
          || errorMessage;

        console.log('Parsed error:', { statusCode, errorMessage, errorData }); // Debug

        // Handle specific error cases
        if (statusCode === 403 || statusCode === 500) {
          // Backend returns 500 with error: "cannot add your own product to cart"
          if (errorMessage.toLowerCase().includes('your own product') || 
              errorMessage.toLowerCase().includes('cannot add your own')) {
            errorMessage = 'Bạn không thể thêm sản phẩm của chính mình vào giỏ hàng';
          }
        } else if (statusCode === 401) {
          errorMessage = 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng';
        }
        
        console.log('Final error message:', errorMessage); // Debug
      } catch (parseError) {
        // If error is not JSON, use default message
        console.log('Failed to parse error:', error.message); // Debug
        errorMessage = error.message || errorMessage;
      }

      return { 
        success: false, 
        message: errorMessage 
      };
    }
  };

  const removeFromCart = async (itemId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // Call API to remove from cart
      await cartAPI.removeFromCart(itemId);
      
      // If API call succeeds, update local state
      dispatch({ type: 'REMOVE_FROM_CART', payload: { itemId } });
      return { success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng' };
    } catch (error: any) {
      console.error('Failed to remove item from cart:', error);
      
      // Parse error message
      let errorMessage = 'Có lỗi xảy ra khi xóa sản phẩm';
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.data?.message || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }
      
      // Don't update local state if API fails
      return { success: false, message: errorMessage };
    }
  };

  const updateQuantity = async (itemId: string, quantity: number): Promise<{ success: boolean; message?: string }> => {
    try {
      // Call API to update quantity
      await cartAPI.updateCartItem(itemId, quantity);
      
      // If API call succeeds, update local state
      dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
      return { success: true, message: 'Đã cập nhật số lượng' };
    } catch (error: any) {
      console.error('Failed to update cart quantity:', error);
      
      // Parse error message
      let errorMessage = 'Có lỗi xảy ra khi cập nhật số lượng';
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.data?.message || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const clearCart = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      // Call API to clear cart
      await cartAPI.clearCart();
      
      // If API call succeeds, update local state
      dispatch({ type: 'CLEAR_CART' });
      return { success: true, message: 'Đã xóa tất cả sản phẩm' };
    } catch (error: any) {
      console.error('Failed to clear cart:', error);
      
      // Parse error message
      let errorMessage = 'Có lỗi xảy ra khi xóa giỏ hàng';
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.data?.message || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const isInCart = (productId: string) => {
    return state.items.some(item => item.product.id === productId);
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
