# LifeOS V8.7.1 — Hotfix visual + schema

Correções aplicadas nesta versão:

1. Corrigido erro do Supabase: `profession_raw` não existia em `user_profiles`.
2. Adicionadas colunas faltantes em `user_profiles` usadas pelo onboarding, contexto IA e dashboard.
3. Corrigido `/api/auth/register` para não quebrar com 500 quando duas requisições de registro chegam ao mesmo tempo.
4. Corrigido `get_weekly()` para sempre retornar `{ day, pct }`, evitando `undefined%` no gráfico de Consistência da Semana.
5. Corrigido `svgBar()` no frontend para tratar dados vazios ou campos antigos como `productivity_pct`.
6. Corrigido contexto financeiro que consultava `reference_month = YYYY-MM` em uma coluna do tipo date; agora usa `YYYY-MM-01`.
7. Criada tabela `user_events`, usada pelos logs internos de IA.
8. Removida tentativa de consultar `habit_logs.completed` quando a base já usa `habit_logs.done`.

Rode novamente `migration_fix_schema.sql` no Supabase antes de testar.
