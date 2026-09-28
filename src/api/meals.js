import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export async function getMeals(date) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_items(*)')
    .eq('date', date)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAllMeals(userId) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_items(*)')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getMeal(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_items(*)')
    .eq('id', id)
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
      meal_type: meal.meal_type
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createNewMeal(date, mealType, name = null) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const insertData = {
    date: date,
    meal_type: mealType
  };

  if (name) {
    insertData.name = name;
  }

  const { data, error } = await supabase
    .from('meals')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
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

export async function deleteAllMeals(userId) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

export async function createMealItem(item) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meal_items')
    .insert({
      meal_id: item.meal_id,
      user_id: item.user_id,
      food_id: item.food_id,
      name: item.name,
      grams: item.grams,
      kcal: item.kcal,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMealItem(id, updates) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('meal_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMealItem(id) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('meal_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
