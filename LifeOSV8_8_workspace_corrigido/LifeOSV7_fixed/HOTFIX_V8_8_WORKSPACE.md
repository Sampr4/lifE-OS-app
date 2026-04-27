# HOTFIX V8.8 — Workspace Inteligente

## O que foi implementado

Foi adicionado um novo módulo **Workspace** antes do Dashboard.

Ele substitui a ideia limitada de uma tabela simples por um espaço mais próximo do Notion, mas focado em ação:

- captura rápida de ideias, tarefas, lembretes, estudos, projetos e notas;
- classificação automática por regras locais;
- área **Agora** com até 5 tarefas importantes;
- criação de páginas guiadas por templates;
- editor em blocos com texto, título, tarefa/checklist, citação, código e divisor;
- extração de tarefas a partir dos blocos de uma página;
- persistência real no Supabase, sem localStorage e sem dados mockados;
- integração best-effort com a tabela `tasks` para aparecer também no dashboard.

## Arquivos alterados/adicionados

### Backend

- `backend/main.py`
  - registra o novo blueprint `workspace_routes`.

- `backend/routes/workspace.py`
  - novo backend completo do Workspace.
  - endpoints principais:
    - `GET /api/workspace`
    - `POST /api/workspace/quick-create`
    - `PATCH /api/workspace/items/:id`
    - `DELETE /api/workspace/items/:id`
    - `POST /api/workspace/pages`
    - `GET /api/workspace/pages/:id`
    - `PATCH /api/workspace/pages/:id`
    - `DELETE /api/workspace/pages/:id`
    - `POST /api/workspace/pages/:pageId/blocks`
    - `PATCH /api/workspace/blocks/:blockId`
    - `DELETE /api/workspace/blocks/:blockId`
    - `PATCH /api/workspace/pages/:pageId/blocks/reorder`
    - `POST /api/workspace/pages/:pageId/extract-tasks`

### Banco de dados

- `db_migrations/2026_04_27_workspace_module.sql`
  - cria/ajusta:
    - `tasks`
    - `workspace_items`
    - `workspace_pages`
    - `workspace_blocks`
    - `workspace_projects`
    - `workspace_tasks`

- `migration_fix_schema.sql`
  - recebeu a mesma migration no final para quem roda o schema consolidado.

### Frontend

- `frontend/index.html`
  - adiciona o módulo `Workspace` antes do `Dashboard`.
  - muda a tela inicial para abrir no `Workspace`.
  - adiciona chamadas reais para `/api/workspace`.
  - adiciona UI completa de captura rápida, páginas, blocos, itens, projetos e área “Agora”.

## Ordem para rodar

1. Execute no Supabase:

```sql
-- arquivo: db_migrations/2026_04_27_workspace_module.sql
```

2. Reinicie o backend Flask.

3. Abra `frontend/index.html`.

4. Teste com frases como:

```txt
Estudar matemática sábado
Comprar material do ENEM amanhã
Ideia: criar roteiro de vídeo sobre produtividade
Projeto app produtividade
```

## Observação

A classificação inicial usa regras locais para não depender de IA externa. Depois você pode plugar IA no mesmo endpoint `POST /api/workspace/quick-create` sem mudar o frontend.
