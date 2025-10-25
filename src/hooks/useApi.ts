// Custom hooks for API data fetching
'use client';

import { useState, useEffect, useMemo } from 'react';
import { productsAPI, ordersAPI, usersAPI, adminAPI } from '@/lib/api';

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Convert dependencies to strings to avoid object reference issues
  const depsString = JSON.stringify(dependencies);

  useEffect(() => {
    fetchData();
  }, [depsString]);

  return { data, loading, error, refetch: fetchData };
}

// Products hooks
export function useProducts(params?: any) {
  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => params, [JSON.stringify(params)]);
  return useApi(() => productsAPI.getProducts(memoizedParams), [memoizedParams]);
}

export function useProduct(id: string) {
  return useApi(() => productsAPI.getProduct(id), [id]);
}

export function useProductCategories() {
  return useApi(() => productsAPI.getCategories(), []);
}

// Orders hooks
export function useOrders(params?: any) {
  return useApi(() => ordersAPI.getOrders(params), [params]);
}

export function useOrder(id: string) {
  return useApi(() => ordersAPI.getOrder(id), [id]);
}

export function useUserOrders(userId: string) {
  return useApi(() => ordersAPI.getUserOrders(userId), [userId]);
}

// Users/Customers hooks
export function useUsers(params?: any) {
  return useApi(() => usersAPI.getUsers(params), [params]);
}

export function useUser(id: string) {
  return useApi(() => usersAPI.getUser(id), [id]);
}

// Admin hooks
export function useAdminDashboard() {
  return useApi(() => adminAPI.getDashboard(), []);
}

export function useAdminAnalytics(params?: any) {
  return useApi(() => adminAPI.getAnalytics(params), [params]);
}

export function useAdminCustomers(params?: any) {
  return useApi(() => adminAPI.getCustomers(params), [params]);
}

// Mutation hooks for create/update/delete operations
export function useMutation<T, P>(
  mutationFn: (params: P) => Promise<T>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (params: P): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutationFn(params);
      return result;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}

// Product mutations
export function useCreateProduct() {
  return useMutation(productsAPI.createProduct);
}

export function useUpdateProduct() {
  return useMutation(({ id, data }: { id: string; data: any }) => 
    productsAPI.updateProduct(id, data)
  );
}

export function useDeleteProduct() {
  return useMutation((id: string) => productsAPI.deleteProduct(id));
}

// Order mutations
export function useCreateOrder() {
  return useMutation(ordersAPI.createOrder);
}

export function useUpdateOrder() {
  return useMutation(({ id, data }: { id: string; data: any }) => 
    ordersAPI.updateOrder(id, data)
  );
}

// User mutations
export function useUpdateUser() {
  return useMutation(({ id, data }: { id: string; data: any }) => 
    usersAPI.updateUser(id, data)
  );
}

export function useDeleteUser() {
  return useMutation((id: string) => usersAPI.deleteUser(id));
}
