import { isSupabaseConfigured } from '../supabase/client.js';
import * as authApi from '../api/auth.js';
import * as foodsApi from '../api/foods.js';
import * as mealsApi from '../api/meals.js';
import * as dailyLogsApi from '../api/daily_logs.js';
import * as profileApi from '../api/profile.js';
import { uid, dateKey, emptyDay } from '../core/utils.js';
import { mapProfileFromDB, mapProfileToDB, mapFoodFromDB, mapFoodToDB } from '../utils/mapper.js';

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

  const foods = await foodsApi.getFoods();
  const foodsMap = {};
  foods.forEach(food => {
    const mapped = mapFoodFromDB(food);
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
    const dbFood = mapFoodToDB(food);
    await foodsApi.upsertFood({
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

  // Load daily logs
  const dailyLogs = await dailyLogsApi.getDailyLogs(
    '1900-01-01',
    dateKey(new Date())
  );

  const dailyLogsMap = {};
  dailyLogs.forEach(log => {
    dailyLogsMap[log.date] = {
      weight: log.weight,
      water: log.water,
      workout: {
        done: log.workout_done,
        note: log.workout_note
      }
    };
  });

  // Load meals with entries
  const meals = await mealsApi.getMeals(dateKey(new Date()));
  const diary = {};

  meals.forEach(meal => {
    const dateKey = meal.date;
    if (!diary[dateKey]) {
      diary[dateKey] = emptyDay();
    }

    if (dailyLogsMap[dateKey]) {
      diary[dateKey] = {
        ...diary[dateKey],
        ...dailyLogsMap[dateKey]
      };
    }

    if (meal.meal_entries) {
      meal.meal_entries.forEach(entry => {
        if (entry.deleted_at) return;

        diary[dateKey].entries.push({
          id: entry.id,
          name: entry.name,
          grams: entry.grams,
          kcal: entry.kcal,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          per100: {
            kcal: entry.kcal_per_100,
            protein: entry.protein_per_100,
            carbs: entry.carbs_per_100,
            fat: entry.fat_per_100
          },
          time: new Date(entry.time).getTime(),
          mealType: meal.meal_type
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
    // Save daily log
    await dailyLogsApi.upsertDailyLog({
      id: uid(),
      user_id: user.id,
      date: date,
      weight: day.weight,
      water: day.water || 0,
      workout_done: day.workout?.done || false,
      workout_note: day.workout?.note
    });

    // Save meals and entries
    for (const entry of day.entries) {
      await mealsApi.createMealEntry({
        id: entry.id,
        meal_id: entry.meal_id || uid(),
        user_id: user.id,
        food_id: entry.food_id,
        date: date,
        name: entry.name,
        grams: entry.grams,
        kcal: entry.kcal,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        kcal_per_100: entry.per100?.kcal,
        protein_per_100: entry.per100?.protein,
        carbs_per_100: entry.per100?.carbs,
        fat_per_100: entry.per100?.fat,
        time: new Date(entry.time).toISOString()
      });
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
