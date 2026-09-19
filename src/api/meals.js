import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export async function getMeals(date) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_entries(*)')
    .eq('date', date)
    .is('deleted_at', null)
    .order('time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getMeal(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_entries(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data;
}

export async function createMeal(meal) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meals')
    .insert({
      id: meal.id,
      user_id: meal.user_id,
      date: meal.date,
      meal_type: meal.meal_type,
      name: meal.name,
      time: meal.time || new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMeal(id, updates) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meals')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function softDeleteMeal(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meals')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Also soft delete all entries in this meal
  await supabase
    .from('meal_entries')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('meal_id', id);

  return data;
}

export async function deleteMeal(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createMealEntry(entry) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meal_entries')
    .insert({
      id: entry.id,
      meal_id: entry.meal_id,
      user_id: entry.user_id,
      food_id: entry.food_id,
      date: entry.date,
      name: entry.name,
      grams: entry.grams,
      kcal: entry.kcal,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      kcal_per_100: entry.kcal_per_100,
      protein_per_100: entry.protein_per_100,
      carbs_per_100: entry.carbs_per_100,
      fat_per_100: entry.fat_per_100,
      time: entry.time || new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMealEntry(id, updates) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meal_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function softDeleteMealEntry(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meal_entries')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMealEntry(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('meal_entries')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
