import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export async function getFoods() {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .order('category')
    .order('name');

  if (error) throw error;
  return data;
}
