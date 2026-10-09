# MacrosFit

O **MacrosFit** é um rastreador nutricional pessoal desenvolvido para facilitar o controle de calorias e macronutrientes (proteínas, carboidratos e gorduras). Funciona como uma PWA (Progressive Web App), permitindo uso offline com sincronização em tempo real via Supabase.

---

## Funcionalidades Principais

1. **Diário Alimentar**
   - Registro de refeições por categoria (café da manhã, almoço, lanche, jantar, ceia, outro).
   - Adição rápida de itens com cálculo automático de macros.
   - Totais consolidados por refeição e diários.
   - Edição e remoção flexível de itens ou refeições completas.

2. **Biblioteca de Alimentos**
   - Base de dados padrão com centenas de alimentos baseados na tabela brasileira TACO.
   - Suporte para criação e gerenciamento de alimentos personalizados.
   - Busca em tempo real com sugestões automáticas.

3. **Metas e Planejamento**
   - Metas calóricas para manutenção, perda (-150 kcal) ou ganho de peso (+150 kcal).
   - Distribuições de macros pré-configuradas (Equilibrado, Alta Proteína, Baixo Carboidrato, Cetogênica e Padrão Fitness).
   - Cálculo automático do TDEE a partir da biometria e nível de atividade física.

4. **Histórico e Insights**
   - Visão panorâmica dos últimos 21 dias.
   - Calendário interativo para navegação rápida entre datas.
   - Gráficos de tendência de calorias e distribuição de macros.

5. **Perfil e Biometria**
   - Gestão de dados corporais (peso, altura, idade, gênero e nível de atividade).
   - Ajuste dinâmico de metas e gerenciamento completo de conta.

6. **Autenticação e Segurança**
   - Sistema seguro de login e cadastro via Supabase.
   - Controle de sessão com timeout por inatividade.

---

## Características Técnicas

- **Frontend:** JavaScript puro (Vanilla JS), sem frameworks.
- **Build Tool:** Vite.
- **Backend & Banco de Dados:** Supabase (PostgreSQL).
- **PWA:** Service Worker (suporte offline e instalável em dispositivos móveis).
- **Deploy:** Vercel.
- **Arquitetura:** Gerenciamento de estado centralizado, event delegation e re-renderização reativa.
- **Interface:** Tema escuro nativo e design responsivo (mobile e desktop).

---

## Estrutura do Banco de Dados

- `profiles`: Armazena biometria e metas do usuário.
- `meals`: Contém os registros de refeições por data.
- `meal_items`: Detalha os itens alimentares de cada refeição.
- `user_foods`: Alimentos criados e personalizados pelo usuário.
- `standard_foods`: Banco de dados oficial de alimentos (TACO).

---

## Fluxo Principal de Uso

1. Realizar login ou cadastro na plataforma.
2. Configurar o perfil com dados biométricos e nível de atividade.
3. Definir metas de calorias e a divisão ideal de macronutrientes.
4. Registrar o consumo diário no diário alimentar.
5. Acompanhar a evolução e os gráficos na aba de histórico.
