export const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const FULL_WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
export const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const TREND_DAYS = 21;
export const AMBER_SCALE = ["var(--amber0)", "var(--amber1)", "var(--amber2)", "var(--amber3)", "var(--amber4)"];

export const MEAL_TYPES = [
  { id: "cafe", label: "Café da manhã", icon: "sun" },
  { id: "almoco", label: "Almoço", icon: "flame" },
  { id: "lanche", label: "Lanche", icon: "sparkles" },
  { id: "jantar", label: "Jantar", icon: "moon" },
  { id: "ceia", label: "Ceia", icon: "star" },
  { id: "outro", label: "Outro", icon: "plus" }
];

export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentário", multiplier: 1.2, description: "0-1 treinos por semana" },
  { id: "light", label: "Levemente ativo", multiplier: 1.375, description: "1-3 treinos por semana" },
  { id: "moderate", label: "Moderadamente ativo", multiplier: 1.55, description: "3-5 treinos por semana" },
  { id: "active", label: "Muito ativo", multiplier: 1.725, description: "6-7 treinos por semana" },
  { id: "very_active", label: "Extremamente ativo", multiplier: 1.9, description: "2 treinos por dia ou muito intenso" }
];

export const TABS = [
  { id: "hoje", label: "Hoje" },
  { id: "historico", label: "Histórico" },
  { id: "alimentos", label: "Alimentos" },
  { id: "metas", label: "Metas" },
  { id: "config", label: "Configurações" }
];

// LIMITES DE VALIDAÇÃO
export const VALIDATION_LIMITS = {
  KCAL_MAX: 10000,
  MACRO_MAX: 1000,
  GRAMS_MAX: 10000
};

// TEMPOS
export const TIMEOUTS = {
  AUDIT_LOG: 1500
};
