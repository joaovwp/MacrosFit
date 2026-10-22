# Importação/Exportação de Refeições

## Fluxo

### Exportar Refeição
1. Na aba "Hoje" ou "Histórico", expanda uma refeição
2. Clique no ícone de download no canto superior direito
3. Sistema busca refeição no banco via `mealsApi.getMeal(mealId)`
4. Gera JSON com schema `meals` array contendo `meal_items`
5. Faz download do arquivo `.json`

### Importar Refeição
1. Na aba "Hoje", clique no botão "Importar refeição"
2. Cole o JSON no textarea
3. (Opcional) Clique em "Mostrar exemplo" para ver o formato esperado
4. Clique em "Importar refeição"
5. Sistema valida o JSON
6. Cria nova meal via `mealsApi.createNewMeal`
7. Cria meal_items via `mealsApi.createMealItem`
8. Recarrega dados do banco via `loadUserDataAfterImport`

## Schema JSON

### Estrutura
```json
{
  "schemaVersion": "4.0",
  "meals": [
    {
      "date": "YYYY-MM-DD",
      "meal_type": "cafe|almoco|lanche|jantar|ceia|outro",
      "name": "Nome opcional",
      "meal_items": [
        {
          "name": "Nome do alimento",
          "grams": 100,
          "kcal": 155,
          "protein": 13,
          "carbs": 1.1,
          "fat": 11
        }
      ]
    }
  ]
}
```

## Exemplos

### Exportar uma refeição simples
**Entrada:** Refeição do dia com arroz e frango

**Saída JSON:**
```json
{
  "schemaVersion": "4.0",
  "meals": [
    {
      "date": "2026-09-28",
      "meal_type": "almoco",
      "name": "Almoço",
      "meal_items": [
        {
          "name": "Arroz integral",
          "grams": 100,
          "kcal": 110,
          "protein": 2.6,
          "carbs": 23,
          "fat": 0.9
        },
        {
          "name": "Frango grelhado",
          "grams": 150,
          "kcal": 248,
          "protein": 31,
          "carbs": 0,
          "fat": 12
        }
      ]
    }
  ],
  "exportDate": "2026-09-28T10:30:00.000Z"
}
```

### Importar refeição de café da manhã
**JSON colado:**
```json
{
  "schemaVersion": "4.0",
  "meals": [
    {
      "date": "2026-09-28",
      "meal_type": "cafe",
      "name": "Café da manhã",
      "meal_items": [
        {
          "name": "Ovos cozidos",
          "grams": 100,
          "kcal": 155,
          "protein": 13,
          "carbs": 1.1,
          "fat": 11
        },
        {
          "name": "Pão integral",
          "grams": 50,
          "kcal": 135,
          "protein": 5,
          "carbs": 25,
          "fat": 2
        }
      ]
    }
  ]
}
```

**Resultado:** Nova refeição criada no banco com 2 itens

### Importar múltiplas refeições
**JSON colado:**
```json
{
  "schemaVersion": "4.0",
  "meals": [
    {
      "date": "2026-09-28",
      "meal_type": "cafe",
      "name": "Café",
      "meal_items": [
        {
          "name": "Ovos",
          "grams": 100,
          "kcal": 155,
          "protein": 13,
          "carbs": 1.1,
          "fat": 11
        }
      ]
    },
    {
      "date": "2026-09-28",
      "meal_type": "almoco",
      "name": "Almoço",
      "meal_items": [
        {
          "name": "Arroz",
          "grams": 100,
          "kcal": 110,
          "protein": 2.6,
          "carbs": 23,
          "fat": 0.9
        }
      ]
    }
  ]
}
```

**Resultado:** 2 refeições criadas no banco (café + almoço)

## Tipos de Refeição (meal_type)
- `cafe` - Café da manhã
- `almoco` - Almoço
- `lanche` - Lanche
- `jantar` - Jantar
- `ceia` - Ceia
- `outro` - Outro

## Validações
- `schemaVersion` obrigatório
- `meals` array obrigatório
- `date` formato YYYY-MM-DD obrigatório
- `meal_type` deve ser um dos 4 tipos válidos
- `meal_items` array obrigatório
- Cada item precisa de `name`, `grams`, `kcal`, `protein`, `carbs`, `fat`
- Valores numéricos validados conforme `VALIDATION_LIMITS`
