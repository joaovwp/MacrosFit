import { isSupabaseConfigured } from '../supabase/client.js';
import * as authApi from '../api/auth.js';
import * as userFoodsApi from '../api/user_foods.js';
import * as mealsApi from '../api/meals.js';
import * as profileApi from '../api/profile.js';
import { dateKey, emptyDay } from '../core/utils.js';
import { mapProfileFromDB, mapProfileToDB, mapUserFoodFromDB, mapUserFoodToDB } from '../utils/mapper.js';

// UI preferences localStorage (with user id prefix)
const UI_PREFIX = 'ft-ui-';

function loadUIPref(key, userId) {
  try {
    const data = localStorage.getItem(`${UI_PREFIX}${userId}-${key}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function saveUIPref(key, userId, value) {
  try {
    localStorage.setItem(`${UI_PREFIX}${userId}-${key}`, JSON.stringify(value));
  } catch (e) {
    // Silencioso
  }
}

function clearUIPrefs(userId) {
  Object.keys(localStorage)
    .filter(k => k.startsWith(`${UI_PREFIX}${userId}`))
    .forEach(k => localStorage.removeItem(k));
}

// Check if user is authenticated
async function isAuthenticated() {
  try {
    const user = await authApi.getCurrentUser();
    return !!user;
  } catch (e) {
    // 403 means session is invalid (expected after deletion)
    return false;
  }
}

// Adapter functions - Supabase only (online-only)
export async function loadProfile() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return null;
  }

  const profile = await profileApi.getProfile();
  if (!profile) return null;

  return mapProfileFromDB(profile);
}

export async function saveProfile(profile) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error('Not authenticated');
  }

  const dbProfile = mapProfileToDB(profile);
  await profileApi.updateProfile(dbProfile);
}

export async function loadFoods() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return {};
  }

  const foods = await userFoodsApi.getUserFoods();
  const foodsMap = {};
  foods.forEach(food => {
    const mapped = mapUserFoodFromDB(food);
    if (mapped) {
      foodsMap[mapped.id] = mapped;
    }
  });

  return foodsMap;
}

export async function saveFoods(foods) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error('Not authenticated');
  }

  const user = await authApi.getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  for (const food of Object.values(foods)) {
    const dbFood = mapUserFoodToDB(food);
    await userFoodsApi.createUserFood({
      ...dbFood,
      user_id: user.id
    });
  }
}

export async function loadDiary() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return {};
  }

  const user = await authApi.getCurrentUser();
  if (!user) return {};

  // Load meals with items
  const meals = await mealsApi.getMeals(dateKey(new Date()));
  const diary = {};

  meals.forEach(meal => {
    const dateKeyStr = meal.date;
    if (!diary[dateKeyStr]) {
      diary[dateKeyStr] = emptyDay();
    }

    if (meal.meal_items) {
      meal.meal_items.forEach(item => {
        diary[dateKeyStr].entries.push({
          id: item.id,
          name: item.name,
          grams: item.grams,
          kcal: item.kcal,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          per100: null, // Valores finais já calculados, não depende de per100
          meal_id: meal.id,
          mealType: meal.meal_type,
          food_id: item.food_id
        });
      });
    }
  });

  return diary;
}

export async function saveDiary(diary) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error('Not authenticated');
  }

  const user = await authApi.getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  for (const [date, day] of Object.entries(diary)) {
    // Group entries by mealType
    const entriesByMealType = {};
    day.entries.forEach(entry => {
      const mealType = entry.mealType || 'outro';
      if (!entriesByMealType[mealType]) {
        entriesByMealType[mealType] = [];
      }
      entriesByMealType[mealType].push(entry);
    });

    // For each meal type, get or create meal and add items
    for (const [mealType, entries] of Object.entries(entriesByMealType)) {
      const meal = await mealsApi.getOrCreateMeal(date, mealType);

      for (const entry of entries) {
        await mealsApi.createMealItem({
          id: entry.id,
          meal_id: meal.id,
          user_id: user.id,
          food_id: entry.food_id,
          name: entry.name,
          grams: entry.grams,
          kcal: entry.kcal,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat
        });
      }
    }
  }
}

export async function loadAll() {
  const [profile, library, diary] = await Promise.all([
    loadProfile(),
    loadFoods(),
    loadDiary()
  ]);

  return { profile, library, diary };
}

export async function persist(key, value) {
  if (key === 'profile') {
    await saveProfile(value);
  } else if (key === 'library') {
    await saveFoods(value);
  } else if (key === 'diary') {
    await saveDiary(value);
  }
}

// Clear app data (for logout) - only removes app keys, not localStorage.clear()
export async function clearAppData(userId) {
  // Remove old global keys if they exist
  localStorage.removeItem('ft-profile');
  localStorage.removeItem('ft-food-library');
  localStorage.removeItem('ft-diary');

  // Remove UI preferences for this user
  clearUIPrefs(userId);
}
