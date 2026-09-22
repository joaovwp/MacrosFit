// Mapper único para conversão entre camelCase e snake_case

// camelCase -> snake_case
export function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// snake_case -> camelCase
export function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Converter objeto snake_case -> camelCase
export function toCamelCaseObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCaseObj(item));
  }

  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = toCamelCase(key);
      result[camelKey] = toCamelCaseObj(obj[key]);
    }
  }
  return result;
}

// Converter objeto camelCase -> snake_case
export function toSnakeCaseObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCaseObj(item));
  }

  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = toSnakeCase(key);
      result[snakeKey] = toSnakeCaseObj(obj[key]);
    }
  }
  return result;
}

// Mapear perfil do Supabase (snake_case) para app (camelCase)
export function mapProfileFromDB(profile) {
  if (!profile) return null;

  return {
    displayName: profile.display_name || profile.email?.split('@')[0] || 'Usuário',
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
      trackWeight: profile.track_weight ?? false,
      trackWater: profile.track_water ?? false,
      trackWorkout: profile.track_workout ?? false,
      theme: profile.theme || 'dark',
      language: profile.language || 'pt-BR'
    },
    deactivatedAt: profile.deactivated_at
  };
}

// Mapear perfil do app (camelCase) para Supabase (snake_case)
export function mapProfileToDB(profile) {
  if (!profile) return null;

  const result = {};

  if (profile.displayName !== undefined) result.display_name = profile.displayName;
  if (profile.goals?.calories !== undefined) result.calories = profile.goals.calories;
  if (profile.goals?.protein !== undefined) result.protein = profile.goals.protein;
  if (profile.goals?.carbs !== undefined) result.carbs = profile.goals.carbs;
  if (profile.goals?.fat !== undefined) result.fat = profile.goals.fat;
  if (profile.biometrics?.weight !== undefined) result.weight = profile.biometrics.weight;
  if (profile.biometrics?.height !== undefined) result.height = profile.biometrics.height;
  if (profile.biometrics?.birthDate !== undefined) result.birth_date = profile.biometrics.birthDate;
  if (profile.biometrics?.gender !== undefined) result.gender = profile.biometrics.gender;
  if (profile.biometrics?.activityLevel !== undefined) result.activity_level = profile.biometrics.activityLevel;
  if (profile.settings?.trackWeight !== undefined) result.track_weight = profile.settings.trackWeight;
  if (profile.settings?.trackWater !== undefined) result.track_water = profile.settings.trackWater;
  if (profile.settings?.trackWorkout !== undefined) result.track_workout = profile.settings.trackWorkout;
  if (profile.settings?.theme !== undefined) result.theme = profile.settings.theme;
  if (profile.settings?.language !== undefined) result.language = profile.settings.language;

  return result;
}

// Mapear food do Supabase (snake_case) para app (camelCase)
export function mapFoodFromDB(food) {
  if (!food) return null;

  return {
    id: food.id,
    name: food.name,
    kcal: food.kcal_per_100,
    protein: food.protein_per_100,
    carbs: food.carbs_per_100,
    fat: food.fat_per_100,
    isFavorite: food.is_favorite,
    category: food.category,
    isActive: food.is_active !== false
  };
}

// Mapear food do app (camelCase) para Supabase (snake_case)
export function mapFoodToDB(food) {
  if (!food) return null;

  const result = {
    id: food.id,
    name: food.name,
    kcal_per_100: food.kcal,
    protein_per_100: food.protein,
    carbs_per_100: food.carbs,
    fat_per_100: food.fat,
    is_favorite: food.isFavorite,
    category: food.category,
    is_active: food.isActive !== false
  };

  return result;
}
