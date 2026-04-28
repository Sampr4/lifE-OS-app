# LifeOS v8.7.5 — Novo módulo Tabela estilo Notion

Adicionado um novo módulo chamado **Tabela** antes do Dashboard no carrossel inferior.

## O que foi adicionado

- Novo módulo frontend `life-table` em `frontend/index.html`.
- Nova tabela no Supabase: `life_table_rows`.
- Novo backend CRUD em `backend/routes/life_table.py`.
- Registro do blueprint em `backend/main.py`.
- Migration atualizada em `migration_fix_schema.sql`.

## Endpoints

- `GET /api/life-table`
- `POST /api/life-table`
- `PATCH /api/life-table/<row_id>`
- `DELETE /api/life-table/<row_id>`

## Campos da tabela

- Nome
- Status
- Prioridade
- Área
- Prazo
- Observações
- Ícone

## Como testar

1. Substitua os arquivos pelo ZIP novo.
2. Rode `migration_fix_schema.sql` no Supabase.
3. Reinicie o backend.
4. Aperte `Ctrl + F5` no navegador.
5. Abra o módulo **Tabela** antes do Dashboard.

Esse módulo não usa dados mockados: se não houver linhas no banco, ele mostra uma tela vazia para criar a primeira linha.
