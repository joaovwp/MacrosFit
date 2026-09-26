# MacrosFit — Logs de Auditoria + Banco de Alimentos Padrão

## Instruções de Configuração

### 1. Logs de Auditoria

Execute o SQL do arquivo `docs/audit_log_setup.txt` no Supabase SQL Editor.

Isso cria:
- Tabela `audit_log` com RLS
- Função `log_audit()` com security definer
- Triggers automáticos para profiles e user_foods

### 2. Banco de Alimentos Padrão (TACO)

#### 2.1. Criar tabela no Supabase

Execute o SQL do arquivo `docs/standard_foods_setup.txt` no Supabase SQL Editor.

#### 2.2. Baixar dados TACO

Baixe o JSON do repositório:
- URL: https://github.com/marcelosanto/tabela_taco
- Arquivo: `tabela_alimentos.json`
- Salve como: `scripts/taco-data.json`

#### 2.3. Configurar variáveis de ambiente

Crie um arquivo `.env` (ou use variáveis de ambiente do sistema):

```
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_KEY=sua_service_key
```

**IMPORTANTE:** Use a SERVICE KEY (não a ANON KEY) para bypass de RLS durante a importação.

#### 2.4. Executar importação

```bash
node scripts/import-taco.js
```

## Funcionalidades Implementadas

### Logs de Auditoria
- Registro automático de: login, signup, password_change, email_change, data_reset
- Triggers no banco para: profile_update, user_food_delete
- Acesso apenas via dashboard Supabase (usuários não veem)

### Banco de Alimentos Padrão
- Busca unificada no quick add (user_foods + standard_foods)
- Badges visuais: "Meu" (user) e "TACO" (standard)
- Macros completos nas sugestões
- Async search quando usuário digita ≥ 2 caracteres
- Deduplicação: standard foods não mostrados se já existir user_food com mesmo nome
