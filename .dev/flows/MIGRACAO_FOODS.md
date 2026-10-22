# Migracao da tabela standard_foods para foods

## Resumo

A tabela `standard_foods` foi substituida pela tabela `foods`, que e alimentada por um arquivo JSON versionado no repositorio. A busca agora e feita localmente no cliente, eliminando chamadas remotas e melhorando a performance.

## Arquitetura Atual

### Tabela foods (Supabase)

```sql
create table public.foods (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) > 0),
  aliases text[] not null default '{}',
  category text,
  kcal_per_100 numeric not null check (kcal_per_100 >= 0),
  protein_per_100 numeric not null check (protein_per_100 >= 0),
  carbs_per_100 numeric not null check (carbs_per_100 >= 0),
  fat_per_100 numeric not null check (fat_per_100 >= 0),
  priority smallint not null default 0,
  source text not null default 'manual'
);
```

- `slug`: Chave primaria, identificador unico em formato de URL (minusculas, sem acento, hifens no lugar de espacos)
- `name`: Nome de exibicao
- `aliases`: Lista de nomes alternativos para busca
- `category`: Categoria do alimento
- `kcal_per_100`, `protein_per_100`, `carbs_per_100`, `fat_per_100`: Macros por 100g
- `priority`: 10 para alimentos principais/mais usados, 0 para demais
- `source`: Origem (padrao)

### Fonte de dados versionada

- `scripts/foods/foods.json`: Arquivo JSON contendo todos os alimentos
- Este arquivo e versionado no Git, permitindo rastrear mudancas
- Criterio de inclusao: is_standard = true OU display_name diferente de name OU criado fora do lote inicial

### Carregamento de dados

1. No inicio do app, `app.js` carrega `foods` via `getFoods()` (uma unica vez)
2. Os dados sao armazenados em `state.foods`
3. `user_foods` continua sendo carregado separadamente e armazenado em `state.library`

### Busca local

- Arquivo: `src/utils/search.js`
- Funcao: `searchFoods(foods, query)`
- Algoritmo:
  - Normaliza query (remove acentos, minusculas)
  - Divide em tokens (palavras)
  - Busca alimentos onde todos os tokens sao prefixo de alguma palavra no nome ou aliases
  - Bonus extra se o nome exato comeca com o primeiro token
  - Bonus extra se o nome exato contem todos os tokens em ordem
  - Ordena por: bonus + priority + nome

### Mapeamento de source

No banco: `source` e "padrao"
No app: convertido para "taco" nos handlers para compatibilidade com UI existente
Tags na UI:
- "TACO" para alimentos padrao
- "Adicionado" para custom
- "Suplemento" para suplementos
- "Meu" para user foods

## Fluxo de manutencao

Para adicionar, editar ou remover alimentos:

1. Editar `scripts/foods/foods.json`
2. Rodar `node scripts/foods/generate-seed.js`
3. Executar `scripts/foods/seed.sql` no SQL Editor do Supabase

O script `generate-seed.js`:
- Valida o JSON (slug unico, nome nao vazio, macros validos, priority inteiro, aliases validos)
- Gera SQL com INSERT ... ON CONFLICT (upsert)
- Permite execucao repetida sem erro

## Scripts

- `scripts/foods/profile.js`: Diagnostico de dados do JSON original
- `scripts/foods/migrate-once.js`: (removido apos uso) Script descartavel para gerar foods.json
- `scripts/foods/generate-seed.js`: Script permanente para gerar seed.sql
- `scripts/foods/schema.sql`: DDL da tabela
- `scripts/foods/seed.sql`: SQL gerado para popular dados
- `scripts/foods/foods.json`: Fonte de dados versionada

## Diferencas em relacao a standard_foods

1. **Chave primaria**: UUID (standard_foods) -> slug (foods)
2. **Busca**: Remota no Supabase -> Local no cliente
3. **Fonte**: Banco de dados -> JSON versionado
4. **Campos removidos**: `display_name`, `is_standard`, `created_at`
5. **Campos adicionados**: `slug`, `priority`

## Compatibilidade

- `meal_items` mantem `food_id` null para foods padrao
- `user_foods` continua funcionando normalmente
- Macros mantem nomes `*_per_100` no app
- UI mantem tags "TACO", "Adicionado", "Suplemento", "Meu"
