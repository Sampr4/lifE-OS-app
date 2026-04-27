# LifeOS — diagnóstico e reconstrução estrutural

## 1. O que estava incoerente

### Fluxo de dados
- A plataforma tinha backend com várias rotas, mas parte importante da interface ainda estava desacoplada do estado real.
- A dashboard carregava dados reais, porém módulos críticos ainda usavam lógica paralela, local e não integrada.
- Havia funcionalidades visualmente prontas, mas sem persistência real de produto.

### Finanças
- O módulo visual de finanças era sofisticado, porém a lógica principal não representava fluxo financeiro real.
- O sistema antigo dependia de plano local e estrutura de orçamento por categoria, mas não de transações reais.
- Isso impedia saldo confiável, histórico, entradas/saídas e atualização coerente da interface.

### Feedback
- O módulo de feedback era apenas um formulário visual com toast.
- Não havia armazenamento, feed, ordenação ou conceito de produto colaborativo.

### Adaptatividade
- O sistema dizia ter inteligência adaptativa, mas não havia rastreamento objetivo do uso dos módulos.
- Faltava relação entre comportamento do usuário e organização da interface.

## 2. O que foi reconstruído

### Finanças reais
Foi introduzido fluxo baseado em transações:
- `finance_transactions`
- resumo automático com:
  - receitas
  - despesas
  - saldo
  - categorias mais gastas
  - quantidade de transações
- endpoints novos:
  - `GET /api/finances/summary`
  - `GET /api/finances/transactions`
  - `POST /api/finances/transactions`
  - `DELETE /api/finances/transactions/<id>`

O endpoint antigo `/api/finances` foi mantido como compatibilidade para a UI legada de orçamento por categoria.

### Feedback como produto real
Foi criado backend de feedback com persistência e feed global:
- `feedback_posts`
- endpoints:
  - `GET /api/feedbacks?order=recent|relevant`
  - `POST /api/feedbacks`
- renderização dinâmica com:
  - autor
  - conteúdo
  - avaliação
  - categoria
  - ordenação por tempo ou relevância

### Adaptatividade real
Foi criado rastreamento de uso por módulo:
- `user_module_usage`
- endpoints:
  - `POST /api/adaptive/track`
  - `GET /api/adaptive/home`

Com isso, o frontend agora:
- registra abertura de módulos
- prioriza abas mais usadas no carousel
- define módulo inicial com base no uso recente
- gera sugestões simples baseadas em comportamento

## 3. Arquivos principais alterados

### Backend
- `backend/main.py`
- `backend/routes/finances.py`
- `backend/routes/feedback.py`
- `backend/routes/adaptive.py`
- `backend/services/user.py`

### Frontend
- `frontend/js/core/api.js`
- `frontend/js/core/app.js`
- `frontend/js/core/data.js`
- `frontend/js/modules/perfil.js`
- `frontend/js/modules/financas.js`

### Banco / migração
- `db_migrations/lifeos_core_rebuild.sql`

## 4. Nova modelagem de dados

### finance_transactions
Transações reais do usuário.

### feedback_posts
Feed global de feedbacks.

### user_module_usage
Base para personalização adaptativa simples e real.

## 5. Como aplicar

1. Rode a migration SQL em seu banco Supabase.
2. Suba o backend atualizado.
3. Sirva o frontend normalmente.
4. Teste o fluxo:
   - abrir dashboard
   - acessar finanças
   - criar receita/despesa
   - verificar atualização imediata
   - publicar feedback
   - alternar módulos e observar priorização adaptativa

## 6. Limitações atuais
- O módulo visual antigo de finanças era muito grande e parcialmente paralelo à lógica real. Foi simplificado para ficar coerente com os dados verdadeiros.
- O comportamento adaptativo atual é heurístico, não preditivo. Ele é real, mas ainda simples.
- Não houve refatoração completa de todos os módulos legados com armazenamento local; foquei nos pontos centrais pedidos: coerência, finanças, feedback e integração adaptativa.

## 7. Próximos passos para escalar
- consolidar todos os módulos em um store central único
- migrar módulos legados que ainda usam storage local para endpoints reais
- adicionar eventos de domínio no backend
- padronizar contratos de resposta com tipos compartilhados
- criar migrations versionadas
- adicionar testes E2E para onboarding → dashboard → finanças → feedback
