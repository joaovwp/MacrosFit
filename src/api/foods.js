import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export async function getFoods() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data;
}

export async function getFood(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function upsertFood(food) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('foods')
    .upsert({
      id: food.id,
      user_id: food.user_id,
      name: food.name,
      kcal_per_100: food.kcal_per_100,
      protein_per_100: food.protein_per_100,
      carbs_per_100: food.carbs_per_100,
      fat_per_100: food.fat_per_100,
      is_favorite: food.is_favorite || false,
      category: food.category,
      is_active: food.is_active !== false,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function softDeleteFood(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('foods')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFood(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('foods')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
