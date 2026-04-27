# LifeOS Frontend Reset — Visual Shell Only

## Removido/desativado

- Firebase/Auth no `index.html`, `login.html` e `onboarding.html`.
- Chamadas `fetch`, wrappers de API, descoberta de backend, health check e endpoints `/api/*`.
- Redirecionamentos automáticos entre login, onboarding, aviso e dashboard.
- Dados locais inventados de tarefas, hábitos, metas, rotina, finanças, check-in e analytics.
- Persistência antiga ligada a token, sessão, onboarding e estados locais.
- Preview React que exigia token e chamava `/api/dashboard`.

## Convertido para shell visual

- Dashboard: hero, cards e estrutura preservados com contadores zerados.
- Hábitos: layout preservado em estado vazio.
- Rotina: layout preservado em estado vazio.
- Plano IA: sem geração local; estado aguardando conexão.
- Metas / Analytics / Finanças / Energia / Agenda / Exportar / Feedback / Suporte / Perfil / Configurações: telas visuais vazias e seguras.
- Login e onboarding: telas visuais preservadas, sem autenticação real ou navegação forçada.
- Aviso: página neutralizada sem storage e sem redirect.

## Arquivos principais alterados

- `index.html`
- `login.html`
- `onboarding.html`
- `aviso.html`
- `js/core/config.js`
- `js/core/api.js`
- `js/core/data.js`
- `js/core/utils.js`
- `js/core/app.js`
- `js/modules/*.js`
- `react-app/src/App.tsx`
- `react-app/src/pages/DashboardPreview.tsx`
- `react-app/src/services/api.ts`

Resultado: frontend abre como protótipo visual, sem backend, sem auth, sem redirects e sem dados inventados.

## Correção pós-reset: removido blur permanente

- `index.html`: removido `filter: blur(4px)` permanente do `#module-stage` e garantido `stage.style.filter = 'none'` no render.
- `css/layout.css`: mesma regra ajustada para evitar efeito borrado em builds que usem CSS externo.


## Visual upgrade adicional
- Melhorias estéticas no `index.html` sem alterar a estrutura principal.
- Refinamento de cores, brilhos, profundidade, gradientes e sombras do shell visual.
- Adicionada animação de abertura do dashboard com robô 2D em overlay.
- Mantida a abordagem UI-only shell, sem recolocar backend/auth/mock data.

- Mascote robô 2D transformado em identidade visual de navegação.
- O mascote agora aparece em toda troca de módulo por 3 segundos com texto contextual da aba.
- Adicionada variação visual dark do mascote para combinar com o tema escuro.
