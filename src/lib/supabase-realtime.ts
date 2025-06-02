import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Real-time hooks for different data types
export function useRealtimeProducts(onUpdate: (payload: any) => void) {
  return supabase
    .channel('products')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'Product' 
      }, 
      onUpdate
    )
    .subscribe();
}

export function useRealtimeCategories(onUpdate: (payload: any) => void) {
  return supabase
    .channel('categories')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'Category' 
      }, 
      onUpdate
    )
    .subscribe();
}

export function useRealtimeOrders(onUpdate: (payload: any) => void) {
  return supabase
    .channel('orders')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'Order' 
      }, 
      onUpdate
    )
    .subscribe();
}

// Helper to optimize Supabase queries
export const optimizedQuery = {
  products: () => supabase
    .from('Product')
    .select(`
      id,
      name,
      slug,
      price,
      description,
      status,
      featured,
      images,
      Category(id, name, slug)
    `),
    
  categories: () => supabase
    .from('Category')
    .select('id, name, slug, description, parent_id'),
    
  orders: () => supabase
    .from('Order')
    .select(`
      id,
      total,
      status,
      created_at,
      User(id, email, name)
    `)
}; 