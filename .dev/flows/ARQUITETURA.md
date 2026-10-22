# MacrosFit - Documentação Arquitetural

## Visão Geral

MacrosFit é um rastreador nutricional pessoal PWA (Progressive Web App) para controle de calorias e macronutrientes. É uma SPA (Single Page Application) vanilla JavaScript que utiliza Supabase como backend para autenticação e persistência de dados.

### Stack Tecnológico

- **Frontend**: Vanilla JavaScript (ES6+), Vite como bundler
- **Backend**: Supabase (autenticação + banco de dados PostgreSQL)
- **Estilo**: CSS customizado com variáveis CSS
- **Deploy**: PWA com Service Worker para cache offline

## Estrutura do Projeto

```
src/
├── api/              # Camada de acesso ao Supabase
├── app/              # Core da aplicação (renderização, eventos)
├── components/       # Componentes UI reutilizáveis
├── core/             # Utilitários centrais e configurações
├── handlers/         # Event handlers (data-action)
├── state/            # Gerenciamento de estado
├── supabase/         # Cliente Supabase
├── utils/            # Mappers e utilitários
├── views/            # Views principais (tabs)
└── styles.css        # Estilos globais
```

## Fluxo de Inicialização

### 1. Entry Point (`index.html` → `src/app.js`)

```javascript
// app.js: init()
cleanupOldKeys()              // Limpa localStorage antigo
initializeState()             // Inicializa estado encapsulado
setupEventHandlers(root)      // Configura event delegation
getCurrentUser()              // Verifica autenticação Supabase
loadUserData(state, user)     // Carrega perfil, foods, meals
render(state)                 // Primeira renderização
onAuthStateChange()           // Listener para mudanças de auth
```

### 2. Sistema de Estado

**Arquitetura**: Estado global encapsulado em closure (module pattern)

**Arquivo**: `src/state/state.js`

```javascript
// Estado inicial estruturado
initialState = {
  profile: null,              // Perfil do usuário (metas, biometria)
  library: {},                // Biblioteca de alimentos (user foods)
  diary: {},                  // Diário alimentar (por data)
  tab: "hoje",                // Tab ativa
  sidebarOpen: false,         // Estado da sidebar
  qa: { ... },                // Estado do Quick Add
  lib: { ... },               // Estado da biblioteca
  auth: { ... },              // Estado de autenticação
  expandedMeals: {},          // Refeições expandidas no UI
  // ... outros estados UI
}
```

**Padrão**: Estado mutável direto (sem imutabilidade forçada) - adequado para o tamanho do projeto

## Arquitetura de Renderização

### 1. Virtual DOM Simplificado

**Arquivo**: `src/app/render.js`

```javascript
render(state) {
  // Preserva foco em inputs ativos
  const active = document.activeElement;
  const activeId = active?.id;
  const selStart = active?.selectionStart;
  
  // Reescreve HTML completo
  root.innerHTML = appHTML(state);
  
  // Restaura foco
  if (activeId) {
    const el = document.getElementById(activeId);
    el?.focus();
    el?.setSelectionRange(selStart, selEnd);
  }
}
```

**Características**:
- Re-renderização completa do DOM a cada mudança de estado
- Preservação de foco em inputs
- Debounce via `requestAnimationFrame` para performance

### 2. Sistema de Views

**Arquivo**: `src/app/appShell.js`

```javascript
appHTML(state) {
  if (state.tab === 'auth') return authViewHTML(state);
  
  return `
    <div class="app-container">
      <div class="navbar">...</div>
      <aside class="sidebar">...</aside>
      <main class="main-content">
        ${state.tab === "hoje" ? hojeTabHTML(state) : ""}
        ${state.tab === "historico" ? historicoTabHTML(state) : ""}
        ${state.tab === "alimentos" ? libraryViewHTML(state) : ""}
        ${state.tab === "metas" ? metasTabHTML(state) : ""}
        ${state.tab === "perfil" ? profileViewHTML(state) : ""}
        ${state.tab === "config" ? configViewHTML(state) : ""}
      </main>
    </div>
  `;
}
```

**Padrão**: Component-based com template strings

## Sistema de Eventos

### Event Delegation

**Arquivo**: `src/app/events.js`

```javascript
setupEventHandlers(root) {
  // Click delegation
  root.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const handler = allHandlers[action];
    if (handler) handler(el, ev);
  });
  
  // Input delegation
  root.addEventListener('input', (ev) => {
    const el = ev.target.closest('[data-action]');
    // ... mesma lógica
  });
}
```

**Handlers organizados por domínio**:
- `authHandlers.js` - Login, registro, logout
- `todayHandlers.js` - Quick add, adicionar refeições
- `libraryHandlers.js` - CRUD de alimentos
- `settingsHandlers.js` - Metas e biometria
- `historyHandlers.js` - Navegação histórica
- `profileHandlers.js` - Perfil do usuário
- `navigationHandlers.js` - Tabs e sidebar
- `entriesHandlers.js` - Edição/deleção de entries

## Camada de API (Supabase)

### Estrutura de Tabelas

**profiles**:
- `id` (UUID, PK)
- `display_name` (text)
- `calorie_goal` (integer)
- `protein_goal_g` (integer)
- `carbs_goal_g` (integer)
- `fat_goal_g` (integer)
- `weight_kg` (numeric)
- `height_cm` (integer)
- `birth_date` (date)
- `gender` (text)
- `activity_level` (integer 1-5)
- `deactivated_at` (timestamp)

**user_foods**:
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `name` (text)
- `kcal_per_100` (numeric)
- `protein_per_100` (numeric)
- `carbs_per_100` (numeric)
- `fat_per_100` (numeric)

**meals**:
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `date` (date, formato YYYY-MM-DD)
- `meal_type` (text: cafe, almoco, lanche, jantar, ceia, outro)
- `name` (text, opcional)

**meal_items**:
- `id` (UUID, PK)
- `meal_id` (UUID, FK)
- `user_id` (UUID, FK)
- `food_id` (UUID, FK, opcional)
- `name` (text)
- `grams` (numeric)
- `kcal` (numeric)
- `protein` (numeric)
- `carbs` (numeric)
- `fat` (numeric)

**standard_foods** (somente leitura, tabela TACO):
- `id` (UUID, PK)
- `name` (text)
- `kcal_per_100` (numeric)
- `protein_per_100` (numeric)
- `carbs_per_100` (numeric)
- `fat_per_100` (numeric)

### Padrão de Acesso

**Arquivos**: `src/api/*.js`

```javascript
// Exemplo: src/api/meals.js
export async function getAllMeals(userId) {
  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_items(*)')  // Join automático
    .eq('user_id', userId)
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data;
}
```

**Características**:
- Funções puras, sem side effects
- Error handling com throw (tratado em camada superior)
- Uso de RLS (Row Level Security) do Supabase

## Sistema de Mutations

**Arquivo**: `src/state/mutations.js`

### Fluxo Típico de Mutação

```javascript
// 1. Handler chama mutation
export async function createUserFood(state, foodData) {
  // 2. Validação
  if (!foodData.name?.trim()) throw new Error('Nome obrigatório');
  
  // 3. Mapeamento camelCase → snake_case
  const dbFood = mapUserFoodToDB(foodData);
  
  // 4. Chamada API
  const created = await userFoodsApi.createUserFood({
    ...dbFood,
    user_id: user.id
  });
  
  // 5. Atualização estado local (optimistic update)
  state.library = { 
    ...state.library, 
    [created.id]: mapUserFoodFromDB(created) 
  };
  
  return created;
}
```

### Padrões de Mutação

- **Validação**: Sempre antes de enviar para API
- **Mapeamento**: camelCase (app) ↔ snake_case (DB)
- **Optimistic Update**: Atualiza estado local antes de confirmar API
- **Error Handling**: Centralizado em `handleError()`

## Sistema de Selectors

**Arquivo**: `src/state/selectors.js`

```javascript
// Busca exata na biblioteca
export function qaBasis(state) {
  const n = normalize(state.qa.name);
  const exact = Object.values(state.library)
    .find((f) => normalize(f.name) === n);
  return exact ? { kcal: exact.kcal, protein: exact.protein, ... } : null;
}

// Sugestões de busca
export function qaSuggestions(state) {
  const n = normalize(state.qa.name);
  const userFoods = Object.values(state.library)
    .filter((f) => normalize(f.name).includes(n));
  return userFoods.slice(0, 10);
}

// Agrupamento de entries por refeição
export function groupEntriesByMealId(day) {
  const entries = day.entries || [];
  const grouped = {};
  entries.forEach(e => {
    const mealId = e.meal_id || e.mealType || 'outro';
    if (!grouped[mealId]) {
      grouped[mealId] = { meal_id: mealId, mealType: e.mealType, entries: [] };
    }
    grouped[mealId].entries.push(e);
  });
  return Object.values(grouped);
}
```

## Fluxo Principal: Quick Add (Adicionar Refeição)

### 1. Usuário digita nome do alimento

```javascript
// todayHandlers.js: qa-name-input
'qa-name-input': (el, ev) => {
  getState().qa.name = el.value;
  getState().qa.showSuggest = !!el.value.trim();
  
  // Debounce de busca
  clearTimeout(qaSearchTimeout);
  qaSearchTimeout = setTimeout(async () => {
    if (el.value.trim().length >= 2) {
      const standardFoods = await searchStandardFoods(el.value);
      getState().qa.standardSuggestions = standardFoods.map(mapStandardFoodFromDB);
      render(getState());
    }
  }, 200);
}
```

### 2. Sistema busca sugestões

**Selector**: `qaSuggestions(state)` combina:
- Biblioteca pessoal (`state.library`)
- Alimentos padrão TACO (`state.qa.standardSuggestions`)

### 3. Usuário seleciona sugestão

```javascript
// todayHandlers.js: qa-pick-suggestion
'qa-pick-suggestion': (el, ev) => {
  const id = el.dataset.id;
  const source = el.dataset.source; // 'user' ou 'standard'
  
  let food;
  if (source === 'user') {
    food = getState().library[id];
  } else if (source === 'standard') {
    food = getState().qa.standardSuggestions?.find(f => f.id === id);
  }
  
  if (food) {
    getState().qa.name = food.name;
    getState().qa.grams = "100";
    getState().qa.manualOpen = false;
    getState().qa.showSuggest = false;
    render(getState());
  }
}
```

### 4. Usuário ajusta gramas (cálculo automático)

```javascript
// todayHandlers.js: qa-grams-input
'qa-grams-input': (el, ev) => {
  getState().qa.grams = el.value;
  const basis = qaBasis(getState());
  const g = parseFloat(getState().qa.grams) || 0;
  
  if (basis && g > 0) {
    const computed = {
      kcal: (basis.kcal * g) / 100,
      protein: (basis.protein * g) / 100,
      carbs: (basis.carbs * g) / 100,
      fat: (basis.fat * g) / 100
    };
    // Atualiza UI diretamente (DOM diff)
    const macrosEl = document.querySelector('[data-qa-computed-macros]');
    if (macrosEl) {
      macrosEl.innerHTML = `
        <span class="mono">${Math.round(computed.kcal)} kcal</span>
        <span class="mono">P ${round(computed.protein)}g</span>
        ...
      `;
    }
  }
}
```

### 5. Usuário adiciona item à refeição temporária

```javascript
// todayHandlers.js: qa-add-item
'qa-add-item': (el, ev) => {
  const name = getState().qa.name.trim();
  const grams = parseFloat(getState().qa.grams) || 0;
  const basis = qaBasis(getState());
  
  let totals, per100, food_id = null;
  if (basis) {
    const exact = Object.values(getState().library)
      .find((f) => normalize(f.name) === normalize(name));
    food_id = exact ? exact.id : null;
    totals = { 
      kcal: (basis.kcal * grams) / 100, 
      protein: (basis.protein * grams) / 100, 
      ...
    };
    per100 = basis;
  } else {
    // Valores manuais
    totals = { kcal: k, protein: p, carbs: c, fat: f };
    per100 = { kcal: (k/grams)*100, ... };
  }
  
  // Adiciona à lista temporária
  addTemporaryMealItem(getState(), { 
    id: uid(), 
    food_id, 
    name, 
    grams, 
    ...totals, 
    per100 
  });
  
  // Limpa form
  getState().qa.name = "";
  getState().qa.grams = "";
  render(getState());
}
```

### 6. Usuário salva refeição completa

```javascript
// mutations.js: saveCompleteMeal
export async function saveCompleteMeal(state, date, mealType) {
  // 1. Cria nova meal
  const meal = await mealsApi.createNewMeal(date, mealType);
  
  // 2. Cria todos os meal_items
  for (const item of state.qa.currentMealItems) {
    await mealsApi.createMealItem({
      meal_id: meal.id,
      user_id: user.id,
      food_id: item.food_id,
      name: item.name,
      grams: item.grams,
      kcal: item.kcal,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat
    });
  }
  
  // 3. Atualiza estado local
  const dateKeyStr = date;
  if (!state.diary[dateKeyStr]) {
    state.diary[dateKeyStr] = emptyDay();
  }
  
  state.qa.currentMealItems.forEach(item => {
    state.diary[dateKeyStr].entries.push({
      id: item.id,
      name: item.name,
      grams: item.grams,
      kcal: item.kcal,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      per100: item.per100,
      meal_id: meal.id,
      mealType: mealType,
      food_id: item.food_id
    });
  });
  
  // 4. Limpa itens temporários
  clearTemporaryMealItems(state);
  return meal;
}
```

## Sistema de Autenticação

### Fluxo de Login

```javascript
// app.js: init()
const user = await getCurrentUser();
if (user) {
  const loaded = await loadUserData(state, user);
  if (loaded) {
    setupInactivityTracking(async () => {
      await signOut();
      state.auth.user = null;
      state.auth.mode = 'login';
      state.tab = 'auth';
      state.auth.error = 'Sessão expirada por inatividade';
      endSession();
      render(state);
    });
  }
}
```

### Inactivity Tracking

**Arquivo**: `src/core/session.js`

```javascript
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export function setupInactivityTracking(onTimeout) {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const reset = () => resetInactivityTimer(onTimeout);
  
  events.forEach(event => {
    window.addEventListener(event, reset);
  });
  
  reset();
}
```

### Supabase Auth

**Arquivo**: `src/api/auth.js`

```javascript
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  await logAction('login');
  return data;
}

export async function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  
  return () => subscription.unsubscribe();
}
```

## Sistema de Biometria e Metas

### Cálculo de TDEE

**Arquivo**: `src/core/utils.js`

```javascript
// Fórmula Mifflin-St Jeor
export function calculateBMR(weight, height, birthDate, gender) {
  const age = calculateAge(birthDate);
  if (gender === "male") {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
}

export function calculateTDEE(bmr, activityLevel) {
  const level = ACTIVITY_LEVELS.find(l => l.id === activityLevel);
  return Math.round(bmr * level.multiplier);
}
```

### Distribuição de Macros

**Arquivo**: `src/core/constants.js`

```javascript
export const MACRO_DISTRIBUTIONS = [
  {
    id: "balanced",
    label: "Equilibrado",
    proteinPercent: 0.30,
    carbsPercent: 0.40,
    fatPercent: 0.30
  },
  {
    id: "high_protein",
    label: "Alta proteína",
    proteinPercent: 0.40,
    carbsPercent: 0.35,
    fatPercent: 0.25
  },
  {
    id: "fitness_standard",
    label: "Padrão",
    type: "per_kg",
    proteinPerKg: 2.2,
    fatPerKg: 0.8
  }
  // ...
];
```

## Sistema de Histórico

### Visualização

**Arquivo**: `src/views/historicoTab.js`

```javascript
export function historicoTabHTML(state) {
  return `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px">Calendário</div>
        ${calendarMonthHTML(state)}
      </div>
      ${dayDetailHTML(state)}
      ${trendChartHTML(state)}
      ${macroDistributionHTML(state)}
      ${insightsGridHTML(state)}
    </div>
  `;
}
```

### Componentes de Histórico

- **calendar.js**: Calendário mensal com score de aderência
- **trendChart.js**: Gráfico de tendência de calorias/macros
- **macroDistribution.js**: Distribuição média de macros
- **insights.js**: Insights baseados em padrões
- **dayDetail.js**: Detalhes de um dia específico

## Sistema de Biblioteca de Alimentos

### Busca e Filtragem

**Arquivo**: `src/components/library/libraryView.js`

```javascript
export function libraryViewHTML(state) {
  const q = normalize(state.lib.query);
  
  // Filtra biblioteca pessoal
  const libraryList = Object.values(state.library)
    .filter((f) => (!q || normalize(f.name).includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Filtra alimentos padrão TACO
  const standardList = (state.lib.standardFoods || [])
    .filter((f) => (!q || normalize(f.name).includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Renderiza listas
  return `...`;
}
```

### CRUD de Alimentos

**Arquivo**: `src/handlers/libraryHandlers.js`

```javascript
'lib-submit': (el, ev) => {
  (async () => {
    try {
      getState().lib.saving = true;
      render(getState());
      
      const foodData = {
        name: getState().lib.form.name,
        kcal: parseFloat(getState().lib.form.kcal),
        protein: parseFloat(getState().lib.form.protein),
        carbs: parseFloat(getState().lib.form.carbs),
        fat: parseFloat(getState().lib.form.fat)
      };
      const inputGrams = parseFloat(getState().lib.form.grams) || 100;
      
      if (getState().lib.editingId) {
        await updateUserFood(getState(), getState().lib.editingId, foodData, inputGrams);
      } else {
        await createUserFoodWithDetection(getState(), foodData, inputGrams);
      }
      
      getState().lib.adding = false;
      getState().lib.editingId = null;
      getState().lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
      getState().lib.saving = false;
      showNotification("Alimento salvo!", 'success');
      render(getState());
    } catch (e) {
      const error = handleError(e, 'lib-submit');
      getState().lib.saving = false;
      showNotification(error.message, 'error');
      render(getState());
    }
  })();
}
```

## Sistema de Import/Export

### Export

**Arquivo**: `src/state/mutations.js`

```javascript
export function exportData(state) {
  const data = {
    schemaVersion: "4.0",
    profile: state.profile,
    library: state.library,
    diary: state.diary,
    exportDate: new Date().toISOString(),
    version: "3.0"
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: "application/json" 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `macrosfit-${dateKey(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### Import com Validação

```javascript
export async function importData(state) {
  const data = JSON.parse(state.importExport.importData);
  
  // Validação de schema
  if (!data.schemaVersion) throw new Error('Versão inválida');
  
  // Validação de dados
  if (data.library) {
    for (const [id, food] of Object.entries(data.library)) {
      if (typeof food.kcal !== 'number' || food.kcal < 0 || food.kcal > VALIDATION_LIMITS.KCAL_MAX) {
        throw new Error(`Calorias inválidas para: ${food.name}`);
      }
      // ... mais validações
    }
  }
  
  // Importação para banco
  for (const [id, food] of Object.entries(data.library)) {
    const dbFood = mapUserFoodToDB(food);
    await userFoodsApi.createUserFood({ ...dbFood, user_id: user.id });
  }
  
  // Reload completo
  await loadUserDataAfterImport(state, user);
}
```

## Sistema de UI State Persistence

**Arquivo**: `src/core/uiState.js**

### Allowlist de Chaves

```javascript
const ALLOWLIST = [
  'tab',
  'viewMonth',
  'selectedKey',
  'qa.name',
  'qa.grams',
  'qa.mealType',
  'lib.query'
];

const BLOCKLIST = [
  'auth.password',
  'auth.email',
  'importExport.importData',
  'importExport.mealImportData'
];
```

### Salvar/Restaurar

```javascript
export function saveUIState(state) {
  const allowed = extractAllowedState(state);
  
  const data = {
    schemaVersion: SCHEMA_VERSION,
    timestamp: Date.now(),
    state: allowed
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function restoreUIState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  
  const data = JSON.parse(raw);
  
  // Valida schema version
  if (data.schemaVersion !== SCHEMA_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  
  // Valida expiração (30 minutos)
  if (Date.now() - data.timestamp > EXPIRY_MS) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  
  return data.state;
}
```

## Sistema de Notificações

**Arquivo**: `src/state/state.js`

```javascript
export function showNotification(message, type = 'info', duration = 3000) {
  appState.notification = { message, type };
  
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }
  
  notificationTimeout = setTimeout(() => {
    clearNotification();
    render(getState());
  }, duration);
}
```

## Sistema de Error Handling

**Arquivo**: `src/core/errorHandler.js`

```javascript
export function handleError(error, context) {
  console.error(`Error in ${context}:`, error);
  
  // Mapeamento de erros comuns
  if (error.message?.includes('Failed to fetch')) {
    return { message: 'Erro de conexão. Verifique sua internet.' };
  }
  
  if (error.message?.includes('JWT')) {
    return { message: 'Sessão expirada. Faça login novamente.' };
  }
  
  return { message: error.message || 'Erro desconhecido' };
}
```

## Sistema de Logging/Audit

**Arquivo**: `src/api/audit.js`

```javascript
export async function logAction(action, metadata = {}) {
  if (!isSupabaseConfigured) return;
  
  const user = await getCurrentUser();
  if (!user) return;
  
  // Log de ações sensíveis (signup, login, password_change, etc.)
  // Implementação futura com tabela de audit logs
}
```

## Padrões de Código

### 1. Nomenclatura

- **Variáveis**: camelCase
- **Funções**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Componentes**: PascalCase (quando exportados)
- **Data attributes**: kebab-case (`data-action`, `data-field`)

### 2. Organização de Arquivos

- **Handlers**: Agrupados por domínio (today, library, settings, etc.)
- **Components**: Agrupados por feature (shared, today, history, library)
- **API**: Um arquivo por entidade (auth, profile, meals, user_foods)
- **Utils**: Funções puras reutilizáveis

### 3. Validação

```javascript
// Sempre validar antes de enviar para API
if (!foodData.name?.trim()) {
  throw new Error('Nome do alimento é obrigatório');
}

if (foodData.kcal_per_100 === null || foodData.kcal_per_100 < 0) {
  throw new Error('Calorias por 100g é obrigatório');
}
```

### 4. Mapeamento de Dados

```javascript
// Sempre usar mappers para conversão camelCase ↔ snake_case
const dbFood = mapUserFoodToDB(foodData);
const created = await userFoodsApi.createUserFood(dbFood);
state.library[created.id] = mapUserFoodFromDB(created);
```

### 5. Renderização

```javascript
// Sempre usar esc() para escape de HTML
<input value="${esc(state.lib.form.name)}" />
<div>${esc(food.name)}</div>
```

## Performance Considerations

### 1. Debounce de Busca

```javascript
clearTimeout(qaSearchTimeout);
qaSearchTimeout = setTimeout(async () => {
  // Busca após 200ms de inatividade
}, 200);
```

### 2. Debounce de Render

```javascript
export function scheduleRender(state) {
  if (renderTimeout) return;
  renderTimeout = requestAnimationFrame(() => {
    renderTimeout = null;
    render(state);
  });
}
```

### 3. Lazy Loading de APIs

```javascript
// Carrega APIs apenas quando necessário
const [{ getProfile }, { getUserFoods }, { getAllMeals }] = await Promise.all([
  import('./api/profile.js'),
  import('./api/user_foods.js'),
  import('./api/meals.js')
]);
```

## Segurança

### 1. Row Level Security (RLS)

- Supabase RLS garante que usuários só acessem seus próprios dados
- Policies configuradas no banco de dados

### 2. Validação de Input

```javascript
// Validação no frontend (defesa em profundidade)
const errors = validateForm(rules, data);
if (errors.length > 0) {
  throw new Error(errors.join(', '));
}
```

### 3. Escape de HTML

```javascript
// Sempre usar esc() para prevenir XSS
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}
```

### 4. Bloqueio de Dados Sensíveis

```javascript
// Nunca salvar senhas ou dados sensíveis no localStorage
const BLOCKLIST = [
  'auth.password',
  'auth.email',
  'importExport.importData'
];
```

## PWA Features

### 1. Service Worker

**Arquivo**: `sw.js`

- Cache de assets estáticos
- Estratégia cache-first para recursos offline
- Limpeza de caches antigos

### 2. Manifest

**Arquivo**: `manifest.json`

```json
{
  "name": "MacrosFit",
  "short_name": "MacrosFit",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#f59e0b",
  "orientation": "portrait"
}
```

### 3. Instalação

```javascript
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // Pode mostrar botão de instalação customizado
});
```

## Deploy e Build

### Comandos

```bash
npm run dev      # Servidor de desenvolvimento (Vite)
npm run build    # Build para produção
npm run preview  # Preview do build de produção
```

### Variáveis de Ambiente

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Fluxo de Desenvolvimento

### Adicionar Nova Feature

1. **Definir estado** em `src/state/state.js`
2. **Criar handlers** em `src/handlers/*.js`
3. **Adicionar mutations** em `src/state/mutations.js` (se necessário)
4. **Criar components** em `src/components/*` (se necessário)
5. **Integrar view** em `src/views/*.js`
6. **Testar fluxo completo**

### Debug

```javascript
// Log de estado
console.log(getState());

// Log de erro
console.error('Error:', error);

// Log de ação
console.log('Action:', action, el.dataset);
```

## Conclusão

MacrosFit é uma SPA bem estruturada com separação clara de responsabilidades:

- **State Management**: Centralizado e encapsulado
- **Renderização**: Virtual DOM simplificado com template strings
- **Event Handling**: Delegation pattern com data attributes
- **API Layer**: Abstração limpa sobre Supabase
- **Data Flow**: Unidirecional (action → mutation → state → render)
- **Security**: RLS + validação + escape
- **Performance**: Debounce + lazy loading + RAF

A arquitetura prioriza simplicidade e manutenibilidade sobre frameworks complexos, adequada para o tamanho e escopo do projeto.
