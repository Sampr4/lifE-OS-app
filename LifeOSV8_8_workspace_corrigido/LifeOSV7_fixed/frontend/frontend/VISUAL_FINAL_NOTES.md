# LifeOS Frontend — Visual Final

Alterações feitas:
- Mantida a estrutura HTML e os handlers/funções visuais existentes.
- Removida a chamada do mascote em todos os módulos.
- Mascote/animação agora toca somente quando o módulo ativo é `dashboard`.
- Login redesenhado com visual premium/dark, mantendo IDs e funções: `loginGoogle`, `submitEmail`, `toggleMode`, `showOverlay`, `hideOverlay`.
- Onboarding redesenhado no mesmo nível visual da plataforma, mantendo IDs e funções: `goBack`, `goNext`, `skipQuestion`, `selectChoice`.
- Dashboard refinado com polish visual: cards mais premium, dark mode melhorado, logo sem contorno branco estranho, header/carousel em glassmorphism e botões mais vivos.
- CSS externo recebeu fallback visual para builds modulares.

Arquivos principais alterados:
- `frontend/index.html`
- `frontend/login.html`
- `frontend/onboarding.html`
- `frontend/css/main.css`
- `frontend/css/components.css`
