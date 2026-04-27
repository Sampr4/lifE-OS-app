# Alterações aplicadas no LifeOS

## Problemas atacados
1. Onboarding só conclui com plano válido
2. IA com contrato fixo e contexto consolidado
3. Fallback coerente com contexto do usuário
4. Frontend separa plano vazio de plano válido
5. Geração inicial unificada
6. Validação estrutural do plano
7. Context builder consolidado
8. Scheduler fortalecido com logs por decisão
9. First run separado do scheduler diário
10. Logs obrigatórios de geração
11. Endpoint manual `/api/generate-plan-now`
12. Persistência operacional adicional quando tabelas existirem
13. Base para adaptação diária por sinais
14. Regras mais centralizadas em services
15. Camada provider-agnostic inicial para IA

## Arquivos principais alterados
- backend/routes/onboarding.py
- backend/routes/ai.py
- backend/services/ai.py
- backend/services/data_generation.py
- backend/services/user.py
- backend/scheduler.py
- frontend/onboarding.html
- frontend/index.html
- frontend/js/modules/plano.js
- frontend/js/core/api.js

## Observações
- As gravações em tabelas novas (`generation_runs`, `daily_generation_runs`, `ai_requests`, `ai_outputs`, `user_signals`) são best-effort: funcionam se a tabela existir, sem quebrar o projeto atual se ainda não existir.
- O endpoint legado `/api/first-login-data` foi mantido só por compatibilidade, mas não é mais o dono da geração inicial.
