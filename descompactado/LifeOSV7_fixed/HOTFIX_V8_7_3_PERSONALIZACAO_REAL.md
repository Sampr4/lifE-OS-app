# LifeOS v8.7.3 — Hotfix de Personalização Real

Correção focada no problema observado nos logs e no print: a aba de Hábitos ainda exibia itens fixos/genéricos como se fossem personalizados.

## Corrigido

1. Removido uso visual de hábitos mockados na aba `Hábitos` do `frontend/index.html`.
   - A tela agora usa apenas o array `HABITS` carregado do backend/Supabase.
   - Se não houver hábitos reais, mostra aviso de “Nenhum hábito gerado ainda”.
   - Métricas falsas como 32 dias, 1.22 consistência e gráficos inventados foram substituídas por dados calculados dos hábitos reais.

2. `LifeOSAPI.loadHabits()` agora chama `/api/habits/current`.
3. `LifeOSAPI.loadRoutine()` agora chama `/api/routine/current`.
4. O fallback do backend deixou de gerar hábitos fixos/genéricos.
   - Não gera mais “Beber 2L de água”, “Treinar”, “Estudar 1 hora”, “Acordar antes das 7h”, “Ler 10 minutos” como padrão.
   - O fallback usa profissão, objetivos, desafios, visão e atributos do onboarding.

5. Corrigido `annual_plans.main_goal`.
   - O backend agora envia `main_goal` ao criar `annual_plans`.
   - A migration agora garante `main_goal`, `description` e `updated_at` e remove o risco de NOT NULL quebrar a geração.

6. Melhorado JSON mode da IA.
   - `generate_life_plan()` passa a pedir JSON object quando disponível.
   - O parser aceita pequenas correções como vírgula sobrando.

7. Melhorada classificação de profissões com acento/variação, como `zoólogo`/`zoologo`.

## Resultado esperado

Depois de rodar `migration_fix_schema.sql`, reiniciar o backend e gerar uma conta/plano novo, a aba de hábitos não deve mais exibir dados fixos de demonstração.
