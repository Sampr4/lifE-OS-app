# LifeOS V7

Estrutura pensada para escalar como um produto com backend Flask, frontend estático rico e shell React opcional para desenvolvimento modular.

## Layout

```
LifeOSV7/
├── backend/           # Flask, blueprints, serviços Supabase, IA
├── frontend/
│   ├── index.html     # App principal (mesmo visual; dashboard corrigida)
│   ├── login.html, onboarding.html
│   ├── js/core/       # config, api (referência), app.js legado se usado
│   └── react-app/     # Vite + React (prévia API / módulos futuros)
├── docs/              # Tutoriais (HTML imprimível como PDF)
├── scripts/           # Atalhos para subir o backend
└── README.md
```

## Fluxo de dados (onboarding → dashboard)

1. `POST /api/onboarding/finalize` grava perfil, metas e plano gerados.
2. O usuário abre `index.html`: Firebase autentica → `GET /api/user` (pré-fetch no `<head>`).
3. `init()` chama `GET /api/dashboard` uma vez e preenche `USER`, tarefas, métricas, `window.__PLAN__`, etc.
4. A dashboard renderiza nome, profissão, visão e trecho do plano quando disponíveis.

## Correção principal (“Iniciando dashboard…” infinito)

O `<head>` chamava `init()` antes do script do `<body>` existir. Agora o `<head>` só define `__LIFEOS_AUTH_READY__` e chama `window.__LIFEOS_BOOT__()` **depois** que o `<body>` registrou essa função.

## Backend

```powershell
cd backend
# Python 3.12+ recomendado
pip install -r requirements.txt   # se existir; senão: pip install flask flask-cors python-dotenv supabase ...
$env:FIREBASE_CREDENTIALS = "serviceAccountKey.json"
python main.py
```

Saúde: `GET http://127.0.0.1:5000/health`

## Frontend estático

Abra `frontend/index.html` via servidor local (evita CORS estrito em alguns navegadores):

```powershell
cd frontend
python -m http.server 8080
```

Configure `js/core/config.js` → `API_URL` apontando para o Flask.

## React (opcional)

```powershell
cd frontend/react-app
npm install
npm run dev
```

O proxy do Vite encaminha `/api` para `http://127.0.0.1:5000`. Cole o token (`lifeos_token`) para testar `GET /api/dashboard` isoladamente.

## Como saber se o problema sumiu

- Após o onboarding, a tela **não** fica presa em “Iniciando dashboard…”.
- O texto do loader muda para “Carregando seus dados…” e depois some.
- Nome e dados do perfil aparecem no header e na dashboard.

## Tutorial React (PDF)

Abra `docs/tutorial-react.html` no navegador e use **Imprimir → Salvar como PDF**.
