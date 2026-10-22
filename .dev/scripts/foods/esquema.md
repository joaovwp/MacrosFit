# Gestão da tabela foods

A tabela foods é a fonte central de alimentos padrão do Macrosfit, substituindo a antiga tabela standard_foods.

## Estrutura da tabela

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

### Campos

- `slug`: Chave primaria, identificador unico em formato de URL (minusculas, sem acento, hifens no lugar de espacos)
- `name`: Nome de exibicao
- `aliases`: Lista de nomes alternativos para busca
- `category`: Categoria do alimento
- `kcal_per_100`, `protein_per_100`, `carbs_per_100`, `fat_per_100`: Macros por 100g
- `priority`: 10 para alimentos principais/mais usados, 0 para variações especificas
- `source`: Origem - valores possiveis: "TACO - NEPA/UNICAMP (2011)" (dados oficiais), "manual" (estimativas)

### Permissoes

- RLS habilitado
- Policy de leitura para role authenticated
- GRANT SELECT ON public.foods TO authenticated

## Estrutura do foods.json

Cada item deve ter:
- `slug`: slug unico no formato da regex
- `name`: nome de exibicao (nao vazio)
- `aliases`: array de strings, cada uma nao vazia
- `category`: categoria do alimento
- `kcal_per_100`, `protein_per_100`, `carbs_per_100`, `fat_per_100`: valores numericos >= 0
- `priority`: inteiro (0 ou 10)
- `source`: "TACO - NEPA/UNICAMP (2011)" ou "manual"

## Estrategia de priorizacao

Para reduzir poluicao na busca:
- Itens genericos comuns (priority 10): nomes simples sem especificacoes de preparo
  - Ex: "Frango peito grelhado", "Arroz branco cozido", "Macarrão cozido"
  - Aliases gerais: "frango", "peito de frango", "arroz", "macarrão"
- Variações especificas (priority 0): cru, com pele, integral, tipos especificos
  - Ex: "Frango peito com pele cru", "Arroz integral cru", "Macarrão penne cozido"
  - Aliases especificos: apenas nome TACO original

## Source classification

- `source: "TACO - NEPA/UNICAMP (2011)"` - Dados oficiais da tabela TACO
- `source: "manual"` - Estimativas manuais ou calculadas

## Fluxo de manutenção

Para adicionar, editar ou remover alimentos da tabela foods:

1. Editar `scripts/foods/foods.json`
2. Rodar `node scripts/foods/generate-seed.js`
3. Executar `scripts/foods/seed.sql` no SQL Editor do Supabase

O script `generate-seed.js`:
- Valida o JSON (slug unico e no padrao, nome nao vazio, macros validos, priority inteiro, aliases validos)
- Gera SQL com INSERT ... ON CONFLICT (upsert)
- Permite execucao repetida sem erro - itens existentes sao atualizados, novos sao inseridos

## Busca no app

A busca de alimentos padrão é feita localmente no cliente (no navegador):

- Função: `src/utils/search.js`
- Normaliza query (remove acentos, minusculas)
- Divide em tokens (palavras)
- Busca alimentos onde todos os tokens são prefixo de alguma palavra no nome ou aliases
- Bonus extra se o nome exato começa com o primeiro token
- Bonus extra se o nome exato contém todos os tokens em ordem
- Ordena por: bonus + priority + nome

## Arquivos

- `foods.json`: Fonte de dados versionada no repositorio (338 itens - alimentos comuns no Brasil com marcas populares)
- `generate-seed.js`: Script que converte foods.json em seed.sql
- `seed.sql`: SQL gerado para aplicar no banco
- `schema.sql`: DDL da tabela (para recriar se necessario)
- `esquema.md`: Este arquivo

## Atualizacao (2026-10)

Limpeza completa da tabela foods:
- Removidos alimentos tecnicos TACO (ex: "infusão 10%", alimentos crus nao consumidos)
- Removidos alimentos regionais muito especificos (ex: "Baião de dois", "Tucupi")
- Mantidos apenas alimentos comuns que as pessoas realmente digitam (319 itens)
- Nomes padronizados para o uso real no Brasil
