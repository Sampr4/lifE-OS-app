"""Gera docs/tutorial-react.pdf (texto ASCII para compatibilidade Helvetica)."""
from pathlib import Path

try:
    from fpdf import FPDF
except ImportError:
    raise SystemExit("Instale: python -m pip install fpdf2")

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "tutorial-react.pdf"


class PDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 10, "Tutorial React - LifeOS", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Pagina {self.page_no()}", align="C")


def add_section(pdf, title, lines):
    w = pdf.w - pdf.l_margin - pdf.r_margin
    pdf.set_font("Helvetica", "B", 12)
    pdf.multi_cell(w, 8, title)
    pdf.set_font("Helvetica", "", 10)
    for line in lines:
        pdf.multi_cell(w, 6, line)
    pdf.ln(3)


def main():
    pdf = PDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    add_section(
        pdf,
        "1. Instalar Node.js (npm)",
        [
            "Baixe o instalador LTS em https://nodejs.org/ e adicione ao PATH.",
            "No terminal: node -v e npm -v devem mostrar versoes.",
        ],
    )
    add_section(
        pdf,
        "2. Abrir no VS Code",
        ["File - Open Folder - selecione a pasta LifeOSV7."],
    )
    add_section(
        pdf,
        "3. Dependencias do shell React",
        ["cd frontend\\react-app", "npm install"],
    )
    add_section(
        pdf,
        "4. Rodar React",
        [
            "Com o Flask em http://127.0.0.1:5000:",
            "npm run dev",
            "Abre http://localhost:5173 (proxy /api para Flask).",
        ],
    )
    add_section(
        pdf,
        "5. Ligar ao backend",
        [
            "O login no index.html grava lifeos_token no localStorage.",
            "Requisicoes: Authorization: Bearer <token>.",
            "Em producao defina VITE_API_URL se o API tiver outro URL.",
        ],
    )
    add_section(
        pdf,
        "6. Testar a dashboard",
        [
            "Inicie o Flask (python main.py na pasta backend).",
            "Use index.html com servidor HTTP local; faca login e onboarding.",
            "A dashboard deve carregar (nao fica em 'Iniciando dashboard').",
        ],
    )
    add_section(
        pdf,
        "7. Problema 'Iniciando dashboard' resolvido quando",
        [
            "O loader muda para 'Carregando seus dados' e some.",
            "O nome aparece no header e na saudacao.",
            "Dados do onboarding aparecem em profissao / visao / plano no banco.",
        ],
    )

    pdf.output(str(OUT))
    print("Escrito:", OUT)


if __name__ == "__main__":
    main()
