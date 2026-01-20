import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: 'genre' | 'category';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async (type?: 'genre' | 'category') => {
    setIsLoading(true);
    try {
      const url = type ? `/categories?type=${type}` : '/categories';
      const data = await apiClient.get<Category[]>(url);
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const data = await apiClient.post<Category>('/categories', category);
      setCategories(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      await apiClient.put(`/categories/${id}`, updates);
      setCategories(prev =>
        prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat)
      );
      return true;
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      return true;
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }, []);

  return {
    categories,
    isLoading,
    refresh: fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
