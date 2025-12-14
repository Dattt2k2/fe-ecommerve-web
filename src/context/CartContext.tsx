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
  addToCart: (product: Product, quantity?: number, options?: { size?: string; color?: string; variant_id?: string }) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (itemId: string) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => Promise<{ success: boolean; message?: string }>;
  isInCart: (productId: string) => boolean;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number; options?: { size?: string; color?: string; variant_id?: string } } }
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
          id: product.id, 
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

      // Admin and seller don't have carts, skip API call
      const userRole = user.role?.toLowerCase();
      if (userRole === 'admin' || userRole === 'seller') {
        dispatch({ type: 'CLEAR_CART' });
        return;
      }

      try {
        const response = await cartAPI.getCart();
        
        // Backend returns { data: [{ items: [...] }] }
        let cartItems: any[] = [];
        
        // Handle different response structures
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Extract items from data[0].items
          cartItems = response.data[0].items || [];
        } else if (response.products && Array.isArray(response.products)) {
          // Fallback: old structure
          cartItems = response.products;
        } else if (response.items && Array.isArray(response.items)) {
          // Fallback: direct items
          cartItems = response.items;
        }
        
        if (cartItems.length > 0) {
          // Calculate total from cart items
          const total = cartItems.reduce((sum: number, item: any) => {
            // Use variant price if available, otherwise use product price
            const price = item.variant?.price || item.variant_price || item.price || 0;
            return sum + price * (item.quantity || 0);
          }, 0);
          const itemCount = cartItems.reduce((sum: number, item: any) => 
            sum + (item.quantity || 0), 0
          );
          
          dispatch({ 
            type: 'SET_CART', 
            payload: { 
              items: cartItems.map((item: any) => {
                // Get variant info if available
                const variant = item.variant || {};
                const variantPrice = variant.price || item.variant_price || item.price || 0;
                const variantStock = variant.quantity || item.variant_quantity || item.stock || 100;
                
                // Get product info
                const product = item.product || {};
                const productImage = product.image_path?.[0] || product.image || item.image_url || '/placeholder-product.jpg';
                
                const variantId = variant.id || item.variant_id;
                
                return {
                  id: item.id || item.cart_item_id || item.product_id,
                  product: {
                    id: product.id || item.product_id,
                    name: product.name || item.name || item.product_name,
                    price: variantPrice,
                    image: productImage,
                    images: product.image_path || [productImage],
                    description: product.description || item.description || '',
                    stock: variantStock,
                    category: product.category || item.category || '',
                    rating: product.rating || 0,
                    reviews: product.reviews || 0,
                    variants: product.variants || [],
                  },
                  quantity: item.quantity || 1,
                  size: variant.size || item.size,
                  color: variant.color || item.color,
                  variant_id: variantId,
                  // Store cart_item_id separately for reference
                  cart_item_id: item.id || item.cart_item_id,
                };
              }),
              total,
              itemCount
            }
          });
        } else {
          // No items in cart
          dispatch({ type: 'CLEAR_CART' });
        }
      } catch (error) {
        console.error('Failed to fetch cart:', error);
        // Silently fail - user might not be logged in or cart might be empty
      }
    };

    fetchCart();
  }, [user]); // Re-run when user changes (login/logout)

  const addToCart = async (product: Product, quantity = 1, options?: { size?: string; color?: string; variant_id?: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      // Call API to add to cart
      const response = await cartAPI.addToCart({
        product_id: product.id,
        quantity,
        variant_id: options?.variant_id,
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
        if (errorMessage.toLowerCase().includes('already exists in cart')) {
          errorMessage = 'Sản phẩm này đã có trong giỏ hàng của bạn. Vui lòng cập nhật số lượng trong giỏ hàng.';
        } else if (statusCode === 403 || statusCode === 500) {
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

  const updateQuantity = async (itemId: string, quantity: number, variantId?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // Find the cart item to get variant_id
      const cartItem = state.items.find(item => item.id === itemId);
      const idToUse = variantId || cartItem?.variant_id || itemId;
      
      // Call API to update quantity using variant_id
      await cartAPI.updateCartItem(idToUse, quantity);
      
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
