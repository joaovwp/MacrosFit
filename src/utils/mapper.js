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
      calories: profile.calorie_goal,
      protein: profile.protein_goal_g,
      carbs: profile.carbs_goal_g,
      fat: profile.fat_goal_g
    },
    biometrics: {
      weight: profile.weight_kg,
      height: profile.height_cm,
      birthDate: profile.birth_date,
      gender: profile.gender,
      activityLevel: profile.activity_level
    },
    deactivatedAt: profile.deactivated_at
  };
}

// Mapear perfil do app (camelCase) para Supabase (snake_case)
export function mapProfileToDB(profile) {
  if (!profile) return null;

  const result = {};

  if (profile.displayName !== undefined) result.display_name = profile.displayName;
  if (profile.goals?.calories !== undefined) result.calorie_goal = profile.goals.calories;
  if (profile.goals?.protein !== undefined) result.protein_goal_g = profile.goals.protein;
  if (profile.goals?.carbs !== undefined) result.carbs_goal_g = profile.goals.carbs;
  if (profile.goals?.fat !== undefined) result.fat_goal_g = profile.goals.fat;
  if (profile.biometrics?.weight !== undefined) result.weight_kg = profile.biometrics.weight;
  if (profile.biometrics?.height !== undefined) result.height_cm = profile.biometrics.height;
  if (profile.biometrics?.birthDate !== undefined) result.birth_date = profile.biometrics.birthDate;
  if (profile.biometrics?.gender !== undefined) result.gender = profile.biometrics.gender;
  if (profile.biometrics?.activityLevel !== undefined) result.activity_level = profile.biometrics.activityLevel;

  return result;
}

// Mapear user_food do Supabase (snake_case) para app (camelCase)
export function mapUserFoodFromDB(food) {
  if (!food) return null;

  return {
    id: food.id,
    name: food.name,
    kcal: food.kcal_per_100,
    protein: food.protein_per_100,
    carbs: food.carbs_per_100,
    fat: food.fat_per_100,
    source: 'user'
  };
}

// Mapear user_food do app (camelCase) para Supabase (snake_case)
export function mapUserFoodToDB(food) {
  if (!food) return null;

  const result = {
    id: food.id,
    name: food.name,
    kcal_per_100: food.kcal,
    protein_per_100: food.protein,
    carbs_per_100: food.carbs,
    fat_per_100: food.fat
  };

  return result;
}

// Mapear standard_food do Supabase (snake_case) para app (camelCase)
export function mapStandardFoodFromDB(row) {
  return {
    id:      row.id,
    name:    row.name,
    kcal:    row.kcal_per_100,
    protein: row.protein_per_100,
    carbs:   row.carbs_per_100,
    fat:     row.fat_per_100,
    source:  'standard'
  };
}
