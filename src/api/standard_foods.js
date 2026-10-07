import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export async function searchStandardFoods(query, showAll = false) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  let queryBuilder = supabase
    .from('standard_foods')
    .select('id, name, display_name, aliases, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100, category, is_standard, source')
    .order('is_standard', { ascending: false })
    .order('name')
    .limit(15);

  // Filtrar apenas itens padrão se showAll = false
  if (!showAll) {
    queryBuilder = queryBuilder.eq('is_standard', true);
  }

  if (query && query.trim().length >= 2) {
    const searchTerm = query.trim().toLowerCase();
    // Busca em name e display_name (aliases não pode usar ilike em array)
    queryBuilder = queryBuilder.or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) throw error;
  return data;
}
