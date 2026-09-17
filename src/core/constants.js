export const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const FULL_WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
export const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const TREND_DAYS = 21;
export const AMBER_SCALE = ["var(--amber0)", "var(--amber1)", "var(--amber2)", "var(--amber3)", "var(--amber4)"];
export const STORAGE_KEYS = { profile: "ft-profile", library: "ft-food-library", diary: "ft-diary" };

export const MEAL_TYPES = [
  { id: "cafe", label: "Café da manhã", icon: "sun" },
  { id: "almoco", label: "Almoço", icon: "flame" },
  { id: "lanche", label: "Lanche", icon: "sparkles" },
  { id: "jantar", label: "Jantar", icon: "moon" },
  { id: "ceia", label: "Ceia", icon: "star" },
  { id: "outro", label: "Outro", icon: "plus" }
];

export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentário", multiplier: 1.2 },
  { id: "light", label: "Levemente ativo", multiplier: 1.375 },
  { id: "moderate", label: "Moderadamente ativo", multiplier: 1.55 },
  { id: "active", label: "Muito ativo", multiplier: 1.725 },
  { id: "very_active", label: "Extremamente ativo", multiplier: 1.9 }
];

export const DEFAULT_PROFILE = { 
  goals: null, 
  settings: { trackWeight: false, trackWater: false, trackWorkout: false },
  biometrics: { weight: null, height: null, age: null, gender: null, activityLevel: null }
};

export const TABS = [
  { id: "hoje", label: "Hoje" }, 
  { id: "historico", label: "Histórico" }, 
  { id: "alimentos", label: "Alimentos" }, 
  { id: "metas", label: "Metas" }, 
  { id: "config", label: "Configurações" }
];
