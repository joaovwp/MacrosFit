-- ============================================
-- MacrosFit Supabase Setup
-- ============================================
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- 1. Tabelas (ordem correta para FKs)
-- ============================================

-- profiles (unificado: goals + biometrics + settings)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  -- goals
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  -- biometrics
  weight NUMERIC,
  height NUMERIC,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  -- settings
  track_weight BOOLEAN DEFAULT FALSE,
  track_water BOOLEAN DEFAULT FALSE,
  track_workout BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'pt-BR',
  deactivated_at TIMESTAMPTZ, -- soft delete de conta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- foods (alimento único por usuário)
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kcal_per_100 NUMERIC NOT NULL,
  protein_per_100 NUMERIC NOT NULL,
  carbs_per_100 NUMERIC NOT NULL,
  fat_per_100 NUMERIC NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  category TEXT, -- opcional, prioridade baixa
  is_active BOOLEAN DEFAULT TRUE, -- soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- daily_logs (dados do dia - peso, água, treino)
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC,
  water INTEGER DEFAULT 0,
  workout_done BOOLEAN DEFAULT FALSE,
  workout_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- meals (refeições do dia)
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('cafe', 'almoco', 'lanche', 'jantar', 'ceia', 'outro')),
  name TEXT, -- opcional para refeições customizadas
  time TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- tombstone para sync de deletes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- meal_entries (alimento em uma refeição - snapshot)
CREATE TABLE meal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL, -- referência mas com snapshot
  date DATE NOT NULL, -- denormalizado da meals para agregação no calendário
  name TEXT NOT NULL, -- snapshot do nome
  grams NUMERIC NOT NULL CHECK (grams > 0),
  kcal NUMERIC NOT NULL, -- calculado no momento
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  kcal_per_100 NUMERIC NOT NULL, -- snapshot
  protein_per_100 NUMERIC NOT NULL,
  carbs_per_100 NUMERIC NOT NULL,
  fat_per_100 NUMERIC NOT NULL,
  time TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- tombstone para sync de deletes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- meal_templates (refeições pré-definidas - prioridade baixa)
CREATE TABLE meal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('cafe', 'almoco', 'lanche', 'jantar', 'ceia', 'outro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- meal_template_items (itens de templates - prioridade baixa)
CREATE TABLE meal_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES meal_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
  grams NUMERIC NOT NULL CHECK (grams > 0)
);

-- 2. Índices
-- ============================================

CREATE INDEX idx_foods_user_active ON foods(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_foods_user_favorite ON foods(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_meals_user_date ON meals(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_meal_entries_meal ON meal_entries(meal_id);
CREATE INDEX idx_meal_entries_user_date ON meal_entries(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date);

-- 3. RLS Policies
-- ============================================

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- foods
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own foods"
  ON foods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own foods"
  ON foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own foods"
  ON foods FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own foods"
  ON foods FOR DELETE
  USING (auth.uid() = user_id);

-- daily_logs
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily logs"
  ON daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily logs"
  ON daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs"
  ON daily_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- meals
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  USING (auth.uid() = user_id);

-- meal_entries
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal entries"
  ON meal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal entries"
  ON meal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal entries"
  ON meal_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal entries"
  ON meal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- meal_templates (prioridade baixa)
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal templates"
  ON meal_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal templates"
  ON meal_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal templates"
  ON meal_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal templates"
  ON meal_templates FOR DELETE
  USING (auth.uid() = user_id);

-- meal_template_items (prioridade baixa)
ALTER TABLE meal_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal template items"
  ON meal_template_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal template items"
  ON meal_template_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal template items"
  ON meal_template_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal template items"
  ON meal_template_items FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Triggers
-- ============================================

-- Trigger para Auto-criar Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para Auto-atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicar em todas as tabelas com updated_at
CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_foods_updated BEFORE UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_daily_logs_updated BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_meals_updated BEFORE UPDATE ON meals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_meal_entries_updated BEFORE UPDATE ON meal_entries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_meal_templates_updated BEFORE UPDATE ON meal_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Ao apagar uma refeição, marque também as entries dela com deleted_at
-- 2. Filtrar deleted_at IS NULL nas somas e no calendário
-- 3. daily_logs: usar upsert com onConflict: 'user_id,date' (conflito multi-dispositivo)
-- 4. Se permitir mover refeição de dia, atualizar date denormalizado nas entries
-- 5. No signup do frontend, enviar display_name em options.data.display_name
-- 6. Após login, verificar se profile.deactivated_at está setado e deslogar se estiver
-- 7. Configurar Site URL e Redirect URLs no Supabase (localhost + domínio Vercel)
-- 8. Usar apenas anon key no frontend, nunca service role
