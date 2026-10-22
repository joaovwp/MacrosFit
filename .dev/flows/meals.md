# Sistema de Refeições

## Visão Geral

O sistema gerencia refeições através de duas tabelas no Supabase:
- `meals`: armazena metadados da refeição (date, meal_type, name)
- `meal_items`: armazena os alimentos de cada refeição

Cada refeição tem um `meal_id` único. Múltiplas refeições do mesmo tipo podem existir no mesmo dia.

## Funções API (src/api/meals.js)

### Funções Ativas

- `getMeals(date)` - linha 3: Busca todas as meals de uma data com seus items
- `getMeal(id)` - linha 18: Busca uma meal específica por ID
- `createNewMeal(date, mealType, name)` - linha 86: Cria nova meal sempre (sem buscar existente)
- `deleteMeal(id)` - linha 110: Deleta uma meal e seus items (cascade)
- `createMealItem(item)` - linha 123: Cria um item em uma meal
- `updateMealItem(id, updates)` - linha 148: Atualiza um item
- `deleteMealItem(id)` - linha 164: Deleta um item

### Funções Removidas (Código Morto)

- `getOrCreateMeal(date, mealType)` - REMOVIDA: Buscava meal existente por (date, mealType) e criava se não existia. Substituída por `createNewMeal` para permitir múltiplas meals do mesmo tipo.
- `createMeal(meal)` - REMOVIDA: Criava meal com ID especificado. Não utilizada.

## Funções Mutations (src/state/mutations.js)

### Funções Ativas

- `saveCompleteMeal(state, date, mealType)` - linha 220: Salva refeição completa do quick-add
- `importMeal(state)` - linha 617: Importa refeição individual de JSON
- `exportMeal(state, mealId)` - linha 550: Exporta refeição específica para JSON
- `importData(state)` - linha 441: Importa dados completos (profile, library, diary)
- `deleteEntry(state, id)` - linha 319: Deleta um item individual

### Funções Removidas (Código Morto)

- `addMealItem(state, itemData, date, mealType)` - REMOVIDA: Adicionava item a meal usando `getOrCreateMeal`. Sem call sites.
- `addEntry(state, entry, targetDate)` - REMOVIDA: Compatibilidade com código antigo. Sem call sites.

## Fluxos

### Quick Add

**Função de entrada:** Handler `qa-add-item` em `src/handlers/todayHandlers.js`

**Sequência de chamadas:**
1. Usuário clica em "Adicionar" no quick-add form
2. Handler chama `addTemporaryMealItem(state)` em mutations.js (linha 206)
3. Item é adicionado a `state.qa.currentMealItems` (estado temporário, não persiste no banco)
4. Usuário pode adicionar mais itens, todos ficam em `state.qa.currentMealItems`
5. Usuário clica em "Registrar refeição"
6. Handler chama `saveCompleteMeal(state, date, mealType)` em mutations.js (linha 220)

**saveCompleteMeal:**
1. Chama `authApi.getCurrentUser()` para obter user_id
2. Chama `mealsApi.createNewMeal(date, mealType, null)` - cria nova meal no banco
3. Para cada item em `state.qa.currentMealItems`:
   - Chama `mealsApi.createMealItem()` - cria item no banco vinculado à meal
   - Adiciona entry a `state.diary[date].entries` com `meal_id` gerado
4. Chama `clearTemporaryMealItems(state)` - limpa estado temporário

**Persistência no banco:**
- Tabela `meals`: inserido 1 registro com (date, meal_type, name=null)
- Tabela `meal_items`: inseridos N registros, cada um com (meal_id, user_id, food_id, name, grams, kcal, protein, carbs, fat)

**Agrupamento:** Usa `meal_id` gerado pelo banco. Cada clique em "Registrar refeição" cria uma nova meal separada, mesmo que seja o mesmo `mealType`.

**Arquivos envolvidos:**
- `src/handlers/todayHandlers.js` - handlers UI
- `src/state/mutations.js` linha 206 (addTemporaryMealItem), 220 (saveCompleteMeal)
- `src/api/meals.js` linha 86 (createNewMeal), 123 (createMealItem)

### Registrar Refeição (saveCompleteMeal)

**Função de entrada:** Handler `qa-save-meal` em `src/handlers/todayHandlers.js`

**Sequência de chamadas:**
1. Handler chama `saveCompleteMeal(state, date, mealType)` em mutations.js (linha 220)
2. Verifica se `state.qa.currentMealItems` está vazio - se sim, não faz nada
3. Chama `mealsApi.createNewMeal(date, mealType, null)` - sempre cria nova meal
4. Para cada item em `state.qa.currentMealItems`:
   - Chama `mealsApi.createMealItem()` com meal_id da nova meal
   - Adiciona entry a `state.diary[date].entries` com meal_id
5. Chama `clearTemporaryMealItems(state)`

**Persistência no banco:**
- Tabela `meals`: 1 insert
- Tabela `meal_items`: N inserts (um por item)

**Agrupamento:** Sempre cria nova meal com `meal_id` único. Não reutiliza meals existentes do mesmo (date, mealType).

**Arquivos envolvidos:**
- `src/handlers/todayHandlers.js` - handler
- `src/state/mutations.js` linha 220
- `src/api/meals.js` linha 86, 123

### Importar Refeição (importMeal)

**Função de entrada:** Handler `import-meal` em `src/handlers/settingsHandlers.js`

**Sequência de chamadas:**
1. Handler chama `importMeal(state)` em mutations.js (linha 617)
2. Parse JSON de `state.importExport.mealImportData`
3. Valida schema version, items array, e cada item (nome, grams, kcal, protein, carbs, fat)
4. Extrai `mealType`, `date`, `mealName` do JSON (ou usa defaults)
5. Chama `mealsApi.createNewMeal(date, mealType, mealName)` - cria nova meal
6. Para cada item no JSON:
   - Chama `mealsApi.createMealItem()` com meal_id da nova meal
   - Adiciona entry a `state.diary[date].entries` com meal_id

**Persistência no banco:**
- Tabela `meals`: 1 insert
- Tabela `meal_items`: N inserts

**Agrupamento:** Cada importação cria uma nova meal separada. Importar o mesmo JSON duas vezes cria duas meals distintas. Não mescla com meals existentes do mesmo (date, mealType).

**Arquivos envolvidos:**
- `src/handlers/settingsHandlers.js` - handler
- `src/state/mutations.js` linha 617
- `src/api/meals.js` linha 86, 123

### Exportar Refeição (exportMeal)

**Função de entrada:** Handler `export-meal` em `src/handlers/settingsHandlers.js`

**Sequência de chamadas:**
1. Handler extrai `mealId` de `el.dataset.mealId`
2. Chama `exportMeal(state, mealId)` em mutations.js (linha 550)
3. Percorre `state.diary` para encontrar entries com o `meal_id` especificado
4. Extrai `mealType` e `date` da primeira entry encontrada
5. Calcula totais (kcal, protein, carbs, fat) somando as entries
6. Monta JSON com schema version 4.0, mealType, mealName, date, items, totals
7. Cria Blob e inicia download do arquivo

**Persistência no banco:** Nenhuma alteração (apenas leitura de estado local)

**Agrupamento:** Exporta apenas entries com o `meal_id` especificado. Se existirem múltiplas meals do mesmo tipo no mesmo dia, cada uma pode ser exportada independentemente.

**Arquivos envolvidos:**
- `src/handlers/settingsHandlers.js` - handler
- `src/state/mutations.js` linha 550
- `src/components/today/todayEntries.js` - UI que passa data-meal-id

### Importar Dados Completos (importData)

**Função de entrada:** Handler `import-data` em `src/handlers/settingsHandlers.js`

**Sequência de chamadas:**
1. Handler chama `importData(state)` em mutations.js (linha 441)
2. Parse JSON de `state.importExport.importData`
3. Valida schema version, profile, library, diary
4. Valida cada alimento na library (nome, kcal, protein, carbs, fat)
5. Valida cada entry no diary (nome, grams, kcal, protein, carbs, fat)
6. Valida goals e biometrics do profile
7. Se profile existe: atualiza `state.profile`
8. Se library existe: atualiza `state.library`
9. Se diary existe:
   - Obtém user_id via `authApi.getCurrentUser()`
   - Para cada data no diary:
     - Agrupa entries por `meal_id` ou `mealType`
     - Para cada grupo:
       - Chama `mealsApi.createNewMeal(date, mealType, null)`
       - Para cada entry do grupo:
         - Chama `mealsApi.createMealItem()` com meal_id gerado
         - Atualiza entry com `meal_id` gerado
   - Atualiza `state.diary` com entries atualizadas

**Persistência no banco:**
- Tabela `meals`: N inserts (um por grupo de entries)
- Tabela `meal_items`: M inserts (um por entry)

**Agrupamento:** Agrupa entries por `meal_id` se existir, senão por `mealType`. Cria uma meal por grupo. Preserva estrutura do JSON importado.

**Risco de perda de dados:** Nenhum. Dados são persistidos no banco e não se perdem ao recarregar.

**Arquivos envolvidos:**
- `src/handlers/settingsHandlers.js` - handler
- `src/state/mutations.js` linha 441
- `src/api/meals.js` linha 86, 123

### Agrupamento Visual (groupEntriesByMealId)

**Função:** `groupEntriesByMealId(day)` em `src/state/selectors.js` (linha 49)

**Comportamento:**
1. Recebe um dia com array de entries
2. Para cada entry:
   - Usa `meal_id` como chave de agrupamento se existir
   - Se não tem `meal_id`, usa `mealType` como fallback
   - Se não tem `mealType`, usa 'outro' como fallback
3. Retorna array de grupos, cada um com `{ meal_id, mealType, name, entries[] }`

**Comportamento atual de agrupamento:**
- Entries COM `meal_id`: agrupadas por `meal_id` (refeições separadas)
- Entries SEM `meal_id`: agrupadas por `mealType` (fallback para legado)
- Limitação: Dados legados sem `meal_id` não conseguem distinguir múltiplas refeições do mesmo tipo no mesmo dia - todas ficam no mesmo grupo

**Arquivos envolvidos:**
- `src/state/selectors.js` linha 49
- `src/components/today/todayEntries.js` - usa o resultado para renderizar cards de refeição

## Estado das Funções

### getOrCreateMeal
- **Status:** REMOVIDA
- **Motivo:** Substituída por `createNewMeal` para permitir múltiplas meals do mesmo tipo
- **Call sites:** Nenhum após remoção

### createNewMeal
- **Status:** ATIVA
- **Call sites:** `saveCompleteMeal` (mutations.js 249), `importMeal` (mutations.js 646), `importData` (mutations.js 582)
- **Comportamento:** Sempre cria nova meal, sem buscar existente

### addMealItem
- **Status:** REMOVIDA
- **Motivo:** Código morto, único chamador (`addEntry`) também removido
- **Call sites:** Nenhum após remoção

### addEntry
- **Status:** REMOVIDA
- **Motivo:** Código morto de compatibilidade, sem call sites
- **Call sites:** Nenhum após remoção

## Coluna name na tabela meals

- **Status:** Migration documentada em `docs/MEAL_NAME_MIGRATION.md`
- **Situação:** Precisa ser executada manualmente no painel Supabase
- **SQL:** `ALTER TABLE meals ADD COLUMN name text;`
- **Uso:** Opcional, para nome customizado de refeição. Se null, usa label do `mealType`

## Comportamento de Agrupamento (date, mealType) vs meal_id

### Modelo antigo (removido):
- Buscava meal por (date, mealType)
- Se existia, adicionava item à meal existente
- Se não existia, criava nova meal
- **Problema:** Não permitia múltiplas meals do mesmo tipo no mesmo dia

### Modelo atual:
- Cada operação (saveCompleteMeal, importMeal, importData) usa `createNewMeal`
- Sempre cria nova meal com `meal_id` único
- Agrupamento visual usa `meal_id` como chave primária
- Fallback para `mealType` apenas para dados legados sem `meal_id`
- **Vantagem:** Permite múltiplas meals do mesmo tipo no mesmo dia
