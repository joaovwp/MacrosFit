import { isSupabaseConfigured } from '../supabase/client.js';
import * as authApi from '../api/auth.js';
import * as foodsApi from '../api/foods.js';
import * as mealsApi from '../api/meals.js';
import * as dailyLogsApi from '../api/daily_logs.js';
import * as profileApi from '../api/profile.js';
import { STORAGE_KEYS, DEFAULT_PROFILE } from '../core/constants.js';
import { uid, dateKey, emptyDay } from '../core/utils.js';

// LocalStorage functions
function loadLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Error loading from localStorage:', e);
    return null;
  }
}

function saveLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
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

// Check if online
function isOnline() {
  return navigator.onLine;
}

// Adapter functions - simplified: use Supabase when authenticated, localStorage when not
export async function loadProfile() {
  if (!isSupabaseConfigured) {
    return loadLocalStorage(STORAGE_KEYS.profile) || DEFAULT_PROFILE;
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return loadLocalStorage(STORAGE_KEYS.profile) || DEFAULT_PROFILE;
  }

  try {
    const profile = await profileApi.getProfile();
    if (!profile) return DEFAULT_PROFILE;

    const result = {
      display_name: profile.display_name,
      goals: {
        calories: profile.calories,
        protein: profile.protein,
        carbs: profile.carbs,
        fat: profile.fat
      },
      biometrics: {
        weight: profile.weight,
        height: profile.height,
        birthDate: profile.birth_date,
        gender: profile.gender,
        activityLevel: profile.activity_level
      },
      settings: {
        trackWeight: profile.track_weight,
        trackWater: profile.track_water,
        trackWorkout: profile.track_workout,
        theme: profile.theme,
        language: profile.language
      },
      deactivated_at: profile.deactivated_at
    };

    return result;
  } catch (e) {
    console.error('Error loading profile from Supabase:', e);
    return loadLocalStorage(STORAGE_KEYS.profile) || DEFAULT_PROFILE;
  }
}

export async function saveProfile(profile) {
  if (!isSupabaseConfigured) {
    saveLocalStorage(STORAGE_KEYS.profile, profile);
    return;
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    saveLocalStorage(STORAGE_KEYS.profile, profile);
    return;
  }

  try {
    await profileApi.updateProfile({
      display_name: profile.display_name,
      calories: profile.goals?.calories,
      protein: profile.goals?.protein,
      carbs: profile.goals?.carbs,
      fat: profile.goals?.fat,
      weight: profile.biometrics?.weight,
      height: profile.biometrics?.height,
      birth_date: profile.biometrics?.birthDate,
      gender: profile.biometrics?.gender,
      activity_level: profile.biometrics?.activityLevel,
      track_weight: profile.settings?.trackWeight,
      track_water: profile.settings?.trackWater,
      track_workout: profile.settings?.trackWorkout,
      theme: profile.settings?.theme,
      language: profile.settings?.language
    });
  } catch (e) {
    console.error('Error saving profile to Supabase:', e);
    saveLocalStorage(STORAGE_KEYS.profile, profile);
  }
}

export async function loadFoods() {
  if (!isSupabaseConfigured) {
    return loadLocalStorage(STORAGE_KEYS.library) || {};
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return loadLocalStorage(STORAGE_KEYS.library) || {};
  }

  try {
    const foods = await foodsApi.getFoods();
    const foodsMap = {};
    foods.forEach(food => {
      foodsMap[food.id] = {
        id: food.id,
        name: food.name,
        kcal: food.kcal_per_100,
        protein: food.protein_per_100,
        carbs: food.carbs_per_100,
        fat: food.fat_per_100,
        is_favorite: food.is_favorite,
        category: food.category,
        is_active: food.is_active
      };
    });

    return foodsMap;
  } catch (e) {
    console.error('Error loading foods from Supabase:', e);
    return loadLocalStorage(STORAGE_KEYS.library) || {};
  }
}

export async function saveFoods(foods) {
  if (!isSupabaseConfigured) {
    saveLocalStorage(STORAGE_KEYS.library, foods);
    return;
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    saveLocalStorage(STORAGE_KEYS.library, foods);
    return;
  }

  try {
    const user = await authApi.getCurrentUser();
    if (!user) return;

    for (const food of Object.values(foods)) {
      await foodsApi.upsertFood({
        id: food.id,
        user_id: user.id,
        name: food.name,
        kcal_per_100: food.kcal,
        protein_per_100: food.protein,
        carbs_per_100: food.carbs,
        fat_per_100: food.fat,
        is_favorite: food.is_favorite,
        category: food.category,
        is_active: food.is_active !== false
      });
    }
  } catch (e) {
    console.error('Error saving foods to Supabase:', e);
    saveLocalStorage(STORAGE_KEYS.library, foods);
  }
}

export async function loadDiary() {
  if (!isSupabaseConfigured) {
    return loadLocalStorage(STORAGE_KEYS.diary) || {};
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return loadLocalStorage(STORAGE_KEYS.diary) || {};
  }

  try {
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
  } catch (e) {
    console.error('Error loading diary from Supabase:', e);
    return loadLocalStorage(STORAGE_KEYS.diary) || {};
  }
}

export async function saveDiary(diary) {
  if (!isSupabaseConfigured) {
    saveLocalStorage(STORAGE_KEYS.diary, diary);
    return;
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    saveLocalStorage(STORAGE_KEYS.diary, diary);
    return;
  }

  try {
    const user = await authApi.getCurrentUser();
    if (!user) return;

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
  } catch (e) {
    console.error('Error saving diary to Supabase:', e);
    saveLocalStorage(STORAGE_KEYS.diary, diary);
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
  switch (key) {
    case STORAGE_KEYS.profile:
      await saveProfile(value);
      break;
    case STORAGE_KEYS.library:
      await saveFoods(value);
      break;
    case STORAGE_KEYS.diary:
      await saveDiary(value);
      break;
    default:
      saveLocalStorage(key, value);
  }
}

// Clear all data (for logout/account deletion)
export async function clearAll() {
  localStorage.clear();
}
