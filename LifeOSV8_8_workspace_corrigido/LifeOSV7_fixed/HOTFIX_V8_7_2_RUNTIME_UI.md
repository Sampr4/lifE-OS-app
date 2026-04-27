# Hotfix v8.7.2 — runtime + dashboard

Correções aplicadas nesta versão:

1. `services/context.py` agora busca `users.name`, evitando plano com nome genérico "Usuário".
2. `services/data_generation.py` não usa mais `.insert(...).select(...).single()`, que quebrava com `SyncQueryRequestBuilder object has no attribute select`.
3. Persistência estruturada agora grava `annual_plans`, `weekly_plans`, `plan_tasks` e `plan_habits` quando a migration existe.
4. A IA não é descartada só por retornar poucos itens; o backend completa mínimos seguros antes de validar.
5. Melhor suporte para profissões como zoólogo/biólogo/veterinário.
6. Dashboard não mostra mais `-0% pendência`.
7. Gráfico de consistência não fica vazio quando todos os dias estão em 0%; mostra uma mensagem clara.
8. Card Sistema Adaptativo passa a mostrar prévia das primeiras tarefas pendentes.

Depois de substituir os arquivos:
- reinicie o backend;
- rode `migration_fix_schema.sql` se ainda não rodou;
- use uma conta nova ou regenere o plano do usuário atual para ver os dados estruturados novos.
