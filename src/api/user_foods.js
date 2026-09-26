import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export async function getUserFoods() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('user_foods')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getUserFood(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('user_foods')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createUserFood(food) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('user_foods')
    .insert({
      name: food.name,
      user_id: food.user_id,
      kcal_per_100: food.kcal_per_100,
      protein_per_100: food.protein_per_100,
      carbs_per_100: food.carbs_per_100,
      fat_per_100: food.fat_per_100
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserFood(id, updates) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('user_foods')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserFood(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('user_foods')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
