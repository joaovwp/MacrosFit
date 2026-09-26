import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export async function searchStandardFoods(query) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  let queryBuilder = supabase
    .from('standard_foods')
    .select('id, name, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100, category')
    .order('name')
    .limit(15);

  if (query && query.trim().length >= 2) {
    queryBuilder = queryBuilder.ilike('name', `%${query.trim()}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) throw error;
  return data;
}
