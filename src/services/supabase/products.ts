import { supabase } from './client';
import type { Database } from '../../types/database';
import { sanitizeText } from '../../utils/sanitization';
import Logger from '../../utils/logger';

type ProductRow = Database['public']['Tables']['products']['Row'];

export class ProductsService {
  /**
   * Search products by name prefix (for autocomplete).
   * Returns up to `limit` results ordered by name.
   */
  static async searchProducts(query: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `${query.trim()}%`)
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        Logger.error('Error searching products:', error);
        throw error;
      }

      return { data: data as ProductRow[], error: null };
    } catch (error) {
      Logger.error('Failed to search products:', error);
      return { data: null, error };
    }
  }

  /**
   * Find a product by exact name (case-insensitive).
   * Used before creating to avoid duplicates.
   */
  static async findByName(name: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', name.trim())
        .maybeSingle();

      if (error) {
        Logger.error('Error finding product by name:', error);
        throw error;
      }

      return { data: data as ProductRow | null, error: null };
    } catch (error) {
      Logger.error('Failed to find product by name:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new product in the shared catalog.
   * Caller should check for duplicates with findByName first.
   */
  static async createProduct(name: string) {
    try {
      if (!name || name.trim().length === 0) {
        throw new Error('Product name cannot be empty');
      }
      if (name.trim().length > 200) {
        throw new Error('Product name too long (max 200 characters)');
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: sanitizeText(name.trim()),
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) {
        Logger.error('Error creating product:', error);
        throw error;
      }

      Logger.log('Product created successfully:', data.id);
      return { data: data as ProductRow, error: null };
    } catch (error) {
      Logger.error('Failed to create product:', error);
      return { data: null, error };
    }
  }

  /**
   * Find or create a product by name.
   * Returns the existing product if found, otherwise creates a new one.
   */
  static async findOrCreate(name: string) {
    const { data: existing, error: findError } = await ProductsService.findByName(name);

    if (findError) {
      return { data: null, error: findError };
    }

    if (existing) {
      return { data: existing, error: null };
    }

    return ProductsService.createProduct(name);
  }

  /**
   * Update a product name.
   */
  static async updateProduct(productId: string, name: string) {
    try {
      if (!name || name.trim().length === 0) {
        throw new Error('Product name cannot be empty');
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          name: sanitizeText(name.trim()),
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        Logger.error('Error updating product:', error);
        throw error;
      }

      Logger.log('Product updated successfully:', productId);
      return { data: data as ProductRow, error: null };
    } catch (error) {
      Logger.error('Failed to update product:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a product from the catalog.
   * Cascades to stock rows; items.product_id is SET NULL.
   */
  static async deleteProduct(productId: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        Logger.error('Error deleting product:', error);
        throw error;
      }

      Logger.log('Product deleted successfully:', productId);
      return { error: null };
    } catch (error) {
      Logger.error('Failed to delete product:', error);
      return { error };
    }
  }
}
