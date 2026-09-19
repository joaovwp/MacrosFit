import * as indexedDB from './indexeddb.js';
import * as authApi from '../api/auth.js';
import * as foodsApi from '../api/foods.js';
import * as mealsApi from '../api/meals.js';
import * as dailyLogsApi from '../api/daily_logs.js';
import * as profileApi from '../api/profile.js';
import { uid } from '../core/utils.js';

let syncInProgress = false;

export async function processSyncQueue() {
  if (syncInProgress) return;

  if (!navigator.onLine) return;

  try {
    syncInProgress = true;

    const queue = await indexedDB.getSyncQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} sync operations`);

    for (const item of queue) {
      try {
        await processOperation(item.operation);
        await indexedDB.removeFromSyncQueue(item.id);
      } catch (e) {
        console.error('Error processing sync operation:', e);
        // Keep item in queue for retry
      }
    }
  } finally {
    syncInProgress = false;
  }
}

async function processOperation(operation) {
  const user = await authApi.getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  switch (operation.type) {
    case 'saveProfile':
      await profileApi.updateProfile({
        display_name: operation.data.display_name,
        calories: operation.data.goals?.calories,
        protein: operation.data.goals?.protein,
        carbs: operation.data.goals?.carbs,
        fat: operation.data.goals?.fat,
        weight: operation.data.biometrics?.weight,
        height: operation.data.biometrics?.height,
        birth_date: operation.data.biometrics?.birthDate,
        gender: operation.data.biometrics?.gender,
        activity_level: operation.data.biometrics?.activityLevel,
        track_weight: operation.data.settings?.trackWeight,
        track_water: operation.data.settings?.trackWater,
        track_workout: operation.data.settings?.trackWorkout,
        theme: operation.data.settings?.theme,
        language: operation.data.settings?.language
      });
      break;

    case 'saveFoods':
      for (const food of Object.values(operation.data)) {
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
      break;

    case 'saveDiary':
      for (const [date, day] of Object.entries(operation.data)) {
        await dailyLogsApi.upsertDailyLog({
          id: uid(),
          user_id: user.id,
          date: date,
          weight: day.weight,
          water: day.water || 0,
          workout_done: day.workout?.done || false,
          workout_note: day.workout?.note
        });

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
      break;

    default:
      console.warn('Unknown sync operation type:', operation.type);
  }
}

export function setupSyncListeners() {
  window.addEventListener('online', () => {
    console.log('Connection restored, syncing...');
    processSyncQueue();
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost, using offline mode');
  });

  // Sync periodically when online
  setInterval(() => {
    if (navigator.onLine) {
      processSyncQueue();
    }
  }, 60000); // Every minute
}
