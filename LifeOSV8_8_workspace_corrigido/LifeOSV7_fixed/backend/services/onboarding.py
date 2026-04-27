"""
services/onboarding.py
Adaptive onboarding question engine.

Questions adapt based on the profession detected from earlier answers.
The question bank is divided into:
  - CORE: questions everyone answers
  - PROFESSION_EXTRA: extra questions depending on detected profession type

UNIVERSAL PROFESSION MODEL v2.0:
- Supports ANY profession in the world using attribute extraction
- Uses AI to analyze profession and extract structured attributes
- Falls back to keyword detection for offline scenarios
"""

import re
import json
import logging
from typing import Dict, List, Optional, Any
from utils.database import get_db, query, fetch_one, fetch_list
from services.ai    import parse_onboarding_answer as ai_parse, generate_adaptive_question

log = logging.getLogger("lifeos.services.onboarding")

# ── UNIVERSAL PROFESSION MODEL ────────────────────────────────
# This model transforms ANY profession into structured attributes
# The system now works for: street cleaner, teacher, doctor, driver, designer,
# programmer, farmer, freelancer, executive, president, salesperson, etc.

# Legacy profession types (for backwards compatibility)
PROFESSION_TYPES = ["tech", "edu", "health", "business", "creative", "gen"]

# Keyword-based detection as FALLBACK only (works alongside AI)
PROFESSION_KEYWORDS: Dict[str, List[str]] = {
    "tech":     ["desenvolv", "program", "engineer", "software", "dev", "código", "tech",
                 "ti ", "t.i", "data ", "machine learn", "ia ", "computação"],
    "edu":      ["estudant", "alun", "universidade", "faculdade", "professor", "ensino",
                 "pesquisa", "academ", "escola", "mestrad", "doutora"],
    "health":   ["médic", "enferm", "saúde", "hospital", "clínic", "nutricion", "psicolog",
                 "fisio", "terapeut", "farma", "dentist", "biólog", "biolog", "zoolog", "zoólog", "zootecn", "veterin"],
    "business": ["empresár", "empreend", "CEO", "diretor", "gerente", "gestor", "negócio",
                 "startup", "executiv", "administr", "vendas", "comercial",
                 "comerciante", "comerciário", "lojista", "revendedor"],
    "creative": ["design", "artista", "músic", "escritor", "fotograf", "criat", "publicidad",
                 "marketing", "comunicação", "jornalist", "roteirista"],
    "trades":   ["pedreiro", "carpinteiro", "eletricista", "encanador", "mecânic", "pintor",
                 "soldador", "marceneiro", "demolidor", "operador", "gari", "faxin"],
    "service":  ["garçom", "garcon", "cozinheiro", "chef", "bartender", "atendente",
                 "motorista", "entregador", "uber", "mototaxi", "cabeleireiro", "manicure"],
}



# ── PROFESSION NORMALIZATION v8.7 ─────────────────────────────
# Common typo corrections + expanded keyword mapping for real professions
# Preserves raw input and adds normalized + categorized versions

TYPO_MAP = {
    # Common misspellings found in logs
    "cormeciante": "comerciante",
    "comerciante": "comerciante",
    "comerciario": "comerciário",
    "pedreiro": "pedreiro",
    "garçon": "garçom",
    "garzon": "garçom",
    "garzom": "garçom",
    "motorista de app": "motorista",
    "motorista app": "motorista",
    "uber": "motorista",
    "demolidor": "demolidor",
    "mecanico": "mecânico",
    "eletrecista": "eletricista",
    "eletrisista": "eletricista",
    "cabeleireiro": "cabeleireiro",
    "cabeleireira": "cabeleireira",
    "enfermero": "enfermeiro",
    "auxilar": "auxiliar",
    "vendedor": "vendedor",
    "revendedor": "revendedor",
    "autonomo": "autônomo",
    "freelancer": "freelancer",
    "zoologo": "zoólogo",
    "zoólogo": "zoólogo",
    "biologo": "biólogo",
    "biólogo": "biólogo",
    "veterinario": "veterinário",
    "veterinária": "veterinária",
    "escritor": "escritor",
    "escritora": "escritora",
    "professor": "professor",
    "professora": "professora",
}

# Expanded keyword map covering real-world Brazilian professions
EXPANDED_PROFESSION_KEYWORDS: Dict[str, List[str]] = {
    "tech":     ["desenvolv", "program", "engineer", "software", "dev", "código", "tech",
                 "ti ", "t.i", "data ", "machine learn", "ia ", "computação", "analista de sistema",
                 "analista de ti", "suporte técnico", "infraestrutura"],
    "edu":      ["estudant", "alun", "universidade", "faculdade", "professor", "ensino",
                 "pesquisa", "academ", "escola", "mestrad", "doutora", "pedagogia", "pedagogo",
                 "instrutor", "tutor", "coach"],
    "health":   ["médic", "enferm", "saúde", "hospital", "clínic", "nutricion", "psicolog",
                 "fisio", "terapeut", "farma", "dentist", "cuidador", "técnico de enfermagem",
                 "agente de saúde", "biomédic", "biólog", "biolog", "zoolog", "zoólog", "zootecn", "veterin"],
    "business": ["empresár", "empreend", "CEO", "diretor", "gerente", "gestor", "negócio",
                 "startup", "executiv", "administr", "vendas", "comercial", "comerciante",
                 "comerciário", "lojista", "revendedor", "vendedor", "representante comercial",
                 "corretor", "agente"],
    "creative": ["design", "artista", "músic", "escritor", "fotograf", "criat", "publicidad",
                 "marketing", "comunicação", "jornalist", "roteirista", "produtor", "editor",
                 "ilustrador", "animador"],
    "trades":   ["pedreiro", "carpinteiro", "eletricista", "encanador", "mecânico", "pintor",
                 "soldador", "serralheiro", "marceneiro", "montador", "operador", "demolidor",
                 "jardineiro", "faxineiro", "gari", "coletor"],
    "service":  ["garçom", "garçom", "cozinheiro", "chef", "bartender", "atendente", "recepcionista",
                 "caixa", "segurança", "vigilante", "porteiro", "motorista", "entregador",
                 "mototaxista", "uber", "auxiliar de serviços", "cabeleireiro", "manicure"],
}


def normalize_profession(raw: str) -> Dict[str, str]:
    """
    v8.7: Normalize raw profession text from user input.
    
    Returns dict with:
    - raw: original text untouched
    - normalized: corrected spelling
    - category: one of tech/edu/health/business/creative/trades/service/gen
    """
    if not raw:
        return {"raw": "", "normalized": "", "category": "gen"}

    raw_clean = raw.strip()
    lower     = raw_clean.lower()

    # Step 1: Typo correction
    normalized = raw_clean
    for typo, correct in TYPO_MAP.items():
        if typo in lower:
            # Replace case-insensitively, keep original casing style
            normalized = re.sub(re.escape(typo), correct, lower, flags=re.IGNORECASE)
            lower = normalized.lower()
            break

    # Step 2: Category detection from expanded keyword map
    category = "gen"
    best_score = 0
    for cat, keywords in EXPANDED_PROFESSION_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in lower)
        if score > best_score:
            best_score = score
            category   = cat

    # Map new categories to legacy ones for backwards compat
    category_legacy = {
        "trades":  "gen",   # No legacy equivalent — keep as gen for old code
        "service": "gen",   # No legacy equivalent — keep as gen for old code
    }.get(category, category)

    return {
        "raw":        raw_clean,
        "normalized": normalized,
        "category":   category,
        "category_legacy": category_legacy,
    }


def detect_profession_attributes(profession: str) -> Dict[str, Any]:
    """
    NEW: Universal profession attribute extraction.
    Transforms ANY profession into structured attributes.
    
    This is the core of the universal profession model.
    Works for: street cleaner, teacher, doctor, driver, designer, 
    programmer, farmer, freelancer, executive, president, salesperson.
    
    Args:
        profession: Free-text profession description
        
    Returns:
        Dict with these keys:
        - profession_type: legacy type for backwards compat
        - work_nature: manual/mental/mixed
        - physical_load: low/medium/high
        - mental_load: low/medium/high
        - responsibility_level: low/medium/high/critical
        - mobility_requirement: stationary/mobile/travel
        - schedule_rigidity: flexible/semi_rigid/rigid
        - autonomy_level: low/medium/high
        - public_contact_level: none/limited/frequent
        - deep_focus_requirement: low/medium/high
        - stress_intensity: low/medium/high
        - work_environment: indoor/outdoor/mixed/dangerous
        - risk_exposure: none/minor/moderate/high
    """
    # Default attributes
    attrs = {
        "profession_type": "gen",
        "work_nature": "mental",
        "physical_load": "low",
        "mental_load": "medium",
        "responsibility_level": "medium",
        "mobility_requirement": "stationary",
        "schedule_rigidity": "flexible",
        "autonomy_level": "medium",
        "public_contact_level": "limited",
        "deep_focus_requirement": "medium",
        "stress_intensity": "medium",
        "work_environment": "indoor",
        "risk_exposure": "none",
    }
    
    if not profession:
        return attrs
    
    prof_lower = profession.lower()

    # Natural sciences / animal care / field research.
    # This covers inputs like "zoologo", "zoólogo", "biólogo" and "veterinário" so the LifeOS
    # does not fall back to a vague generic routine.
    if any(kw in prof_lower for kw in ["zoolog", "zoólog", "biólog", "biolog", "zootecn", "veterin"]):
        attrs.update({
            "profession_type": "health",
            "work_nature": "mixed",
            "physical_load": "medium",
            "mental_load": "high",
            "responsibility_level": "high",
            "mobility_requirement": "mobile",
            "schedule_rigidity": "semi_rigid",
            "autonomy_level": "medium",
            "public_contact_level": "limited",
            "deep_focus_requirement": "high",
            "stress_intensity": "medium",
            "work_environment": "mixed",
            "risk_exposure": "minor",
        })

    # ── ANALYZE WORK NATURE ─────────────────────────────────
    # Manual work detection
    manual_keywords = [
        "limpeza", "cleaner", "pedreiro", "carpinteiro", "mecânico", "eletricista",
        "encanador", "jardineiro", "agricultor", "faxineiro", "garis", "coletor",
        "motorista", "operador", "montador", "fabricação", "produção", "construção",
        "cozinheiro", "chef", "bartender", "pintor", "soldador", "torneiro",
        "zootecn", "veterin"
    ]
    mental_keywords = [
        "desenvolvedor", "programador", "analista", "advogado", "médico", "dentista",
        "professor", "pesquisador", "contador", "gestor", "gerente", "diretor", "ceo",
        "设计师", "escritor", "jornalista", "consultor", "arquiteto", "engenheiro",
        "biólogo", "biologo", "zoologo", "zoólogo", "pesquisador"
    ]
    
    manual_count = sum(1 for kw in manual_keywords if kw in prof_lower)
    mental_count = sum(1 for kw in mental_keywords if kw in prof_lower)
    
    if manual_count > mental_count:
        attrs["work_nature"] = "manual"
        attrs["physical_load"] = "high"
    elif mental_count > manual_count:
        attrs["work_nature"] = "mental"
    else:
        attrs["work_nature"] = "mixed"
    
    # ── ANALYZE MOBILITY REQUIREMENT ───────────────────────────
    mobile_keywords = ["motorista", "driver", "entregador", "vendedor", "representante",
                      "consultor", "tecnico", "técnico", "enfermeiro", "fisioterapeuta",
                      "represent", "viajante", "freelancer", "uber", "entrega",
                      "zoolog", "zoólog", "biólog", "biolog", "veterin"]
    travel_keywords = ["piloto", "comissario", "aeromoco", "naval", "capitao"]
    
    if any(kw in prof_lower for kw in mobile_keywords):
        attrs["mobility_requirement"] = "mobile"
    if any(kw in prof_lower for kw in travel_keywords):
        attrs["mobility_requirement"] = "travel"
    
    # ── ANALYZE RESPONSIBILITY LEVEL ───────────────────────────
    # High responsibility
    high_resp = ["ceo", "diretor", "gerente geral", "proprietario", "patrao", "chefe",
                "supervisor", "coordenador", "lider", "capita", "comandante",
                "juiz", "promotor", "delegado"]
    # Critical responsibility
    critical_resp = ["medico", "cirurgiao", "piloto", "bombeiro", "policia", 
                    "engenheiro", "advogado", "ceo", "diretor", "veterin", "zoolog", "zoólog"]
                    
    if any(kw in prof_lower for kw in critical_resp):
        attrs["responsibility_level"] = "critical"
        attrs["stress_intensity"] = "high"
    elif any(kw in prof_lower for kw in high_resp):
        attrs["responsibility_level"] = "high"
        attrs["stress_intensity"] = "high"
    
    # ── ANALYZE SCHEDULE RIGIDITY ──────────────────────────────
    rigid_schedule = ["hospital", "fabrica", "fabrica", "turno", "plantao", "guardia",
                 "seguranca", "vigilante", "recepcao", "caixa", "atendente"]
    flexible_schedule = ["freelancer", "freelance", "autonomo", "consultor", "criativo",
                     "artista", "escritor", "design"]
    
    if any(kw in prof_lower for kw in rigid_schedule):
        attrs["schedule_rigidity"] = "rigid"
    elif any(kw in prof_lower for kw in flexible_schedule):
        attrs["schedule_rigidity"] = "flexible"
    
    # ── ANALYZE PUBLIC CONTACT ──────────────────────────────
    public_contact = ["vendedor", "atendente", "caixa", "recepcionista", "professor",
                      "medico", "enfermeiro", "advogado", "consultor", "garcom",
                      "bartender", "taxista", "uber", "motorista", "guia", "veterin"]
    no_contact = ["desenvolvedor", "programador", "analista", "escritor", "designer",
                 "editor", "tradutor", "engenheiro", "arquiteto"]
    
    public_count = sum(1 for kw in public_contact if kw in prof_lower)
    no_count = sum(1 for kw in no_contact if kw in prof_lower)
    
    if public_count > no_count:
        attrs["public_contact_level"] = "frequent"
    elif no_count > 0:
        attrs["public_contact_level"] = "none"
    
    # ── ANALYZE WORK ENVIRONMENT ────────────────────────────────
    outdoor_work = ["agricultor", "jardineiro", "pedreiro", "pintor", "construcao",
                  "entregador", "motorista", "taxista", "garis", "limpeza",
                  "zoolog", "zoólog", "biólog", "biolog", "veterin"]
    dangerous_work = ["bombeiro", "policia", "exercito", "militar", "minerio",
                    "construcao", "montagem", "altura"]
    
    if any(kw in prof_lower for kw in outdoor_work):
        attrs["work_environment"] = "outdoor"
    if any(kw in prof_lower for kw in dangerous_work):
        attrs["work_environment"] = "dangerous"
        attrs["risk_exposure"] = "moderate"
    
    # ── DETERMINE LEGACY PROFESSION TYPE ────────────────────
    scores: Dict[str, int] = {pt: 0 for pt in PROFESSION_KEYWORDS}
    for prof_type, keywords in PROFESSION_KEYWORDS.items():
        for kw in keywords:
            if kw in prof_lower:
                scores[prof_type] += 1
    best = max(scores, key=lambda k: scores[k])
    attrs["profession_type"] = best if scores[best] > 0 else "gen"
    
    return attrs


def detect_profession_type(answer: str) -> str:
    """
    Legacy function maintained for backwards compatibility.
    Now uses universal attribute extraction internally.
    Returns one of: tech, edu, health, business, creative, gen.
    """
    attrs = detect_profession_attributes(answer)
    return attrs["profession_type"]


# ── QUESTION BANK ────────────────────────────────────────────

CORE_QUESTIONS = [
    {
        "id": "q_name", "type": "text",
        "title": "Qual é o seu nome?",
        "hint": "Como você quer ser chamado dentro do LifeOS.",
        "placeholder": "Ex: Maria, João...",
        "block": "Identidade", "blockName": "Identidade", "blockIcon": "👤",
        "required": True,
    },
    {
        "id": "q_profession", "type": "text",
        "title": "Qual é a sua profissão ou ocupação atual?",
        "hint": "Pode ser estudante, empresário, professor — qualquer coisa.",
        "placeholder": "Ex: Desenvolvedor, estudante de medicina...",
        "block": "Identidade", "blockName": "Identidade", "blockIcon": "👤",
        "required": True,
    },
    {
        "id": "q_goals", "type": "textarea",
        "title": "Quais são seus 2 ou 3 objetivos mais importantes agora?",
        "hint": "Escreva livremente. A IA vai entender.",
        "placeholder": "Ex: Quero lançar meu app em 3 meses, melhorar minha saúde...",
        "block": "Objetivos", "blockName": "Objetivos", "blockIcon": "🎯",
        "required": True,
    },
    {
        "id": "q_challenges", "type": "textarea",
        "title": "Qual é o seu maior desafio atual?",
        "hint": "O que está impedindo você de alcançar seus objetivos?",
        "placeholder": "Ex: Procrastinação, falta de foco, pouco tempo...",
        "block": "Desafios", "blockName": "Desafios", "blockIcon": "⚡",
        "required": False,
    },
    {
        "id": "q_routine", "type": "choice",
        "title": "Como você descreveria sua rotina atual?",
        "hint": "Seja honesto — sem julgamento aqui.",
        "block": "Rotina", "blockName": "Rotina", "blockIcon": "📅",
        "options": [
            {"value": "caotica",    "label": "🌀 Caótica",             "desc": "Vivo no modo apagar incêndio"},
            {"value": "irregular",  "label": "📉 Irregular",            "desc": "Às vezes funciona, às vezes não"},
            {"value": "ok",         "label": "📊 Ok, mas pode melhorar", "desc": "Tenho estrutura básica"},
            {"value": "organizada", "label": "✅ Bem organizada",       "desc": "Sou bastante disciplinado(a)"},
        ],
        "required": True,
    },
    {
        "id": "q_energy", "type": "dual-slider",
        "title": "Como está sua energia e disposição de 1 a 10?",
        "hint": "1 = esgotado(a), 10 = no pico da forma",
        "block": "Energia", "blockName": "Energia", "blockIcon": "⚡",
        "min": 1, "max": 10, "default": 6,
        "required": True,
    },
    {
        "id": "q_vision", "type": "textarea",
        "title": "Descreva sua vida ideal daqui a 1 ano.",
        "hint": "Seja específico(a). O que você conquistou? Como você se sente?",
        "placeholder": "Daqui a 1 ano, eu...",
        "block": "Visão", "blockName": "Visão", "blockIcon": "🔭",
        "required": False,
    },
    {
        "id": "q_focus_time", "type": "choice",
        "title": "Qual é o melhor horário do seu dia para trabalho focado?",
        "hint": "Isso vai otimizar sua rotina no LifeOS.",
        "block": "Produtividade", "blockName": "Produtividade", "blockIcon": "🧠",
        "options": [
            {"value": "manha_cedo", "label": "🌅 Madrugada/cedo", "desc": "Antes das 7h"},
            {"value": "manha",      "label": "☀️ Manhã",          "desc": "7h às 12h"},
            {"value": "tarde",      "label": "🌤️ Tarde",          "desc": "12h às 18h"},
            {"value": "noite",      "label": "🌙 Noite",          "desc": "Após 18h"},
        ],
        "required": True,
    },
    {
        "id": "q_ai_style", "type": "choice",
        "title": "Como você prefere que a IA se comunique com você?",
        "hint": "Isso define a personalidade do seu assistente.",
        "block": "Preferências", "blockName": "Preferências", "blockIcon": "🤖",
        "options": [
            {"value": "coach_motivacional", "label": "🔥 Coach intenso",  "desc": "Direto, motivador, desafiador"},
            {"value": "mentor_calmo",        "label": "🧘 Mentor calmo",   "desc": "Tranquilo, equilibrado, paciente"},
            {"value": "parceiro_real",       "label": "🤝 Parceiro real",  "desc": "Honesto, prático, sem enrolação"},
            {"value": "analitico",           "label": "📊 Analítico",      "desc": "Dados, lógica, precisão"},
        ],
        "required": True,
    },
]

# Extra questions per profession type (appended after core questions)
PROFESSION_EXTRA: Dict[str, List[Dict]] = {
    "tech": [
        {
            "id": "q_tech_stack", "type": "text",
            "title": "Qual é a sua stack principal de tecnologia?",
            "hint": "Linguagens, frameworks ou ferramentas que usa mais.",
            "placeholder": "Ex: Python, React, AWS...",
            "block": "Tecnologia", "blockName": "Tecnologia", "blockIcon": "💻",
            "required": False,
        },
    ],
    "edu": [
        {
            "id": "q_edu_level", "type": "choice",
            "title": "Em qual estágio você está na sua jornada educacional?",
            "hint": "Isso ajuda a montar um plano de estudos realista.",
            "block": "Educação", "blockName": "Educação", "blockIcon": "📚",
            "options": [
                {"value": "graduacao",  "label": "🎓 Graduação",    "desc": "Ensino superior"},
                {"value": "posgrad",    "label": "📖 Pós-graduação", "desc": "Mestrado ou doutorado"},
                {"value": "cursando",   "label": "✏️ Cursando",      "desc": "Em andamento"},
                {"value": "professor",  "label": "🏫 Professor",     "desc": "Ensino ou pesquisa"},
            ],
            "required": False,
        },
    ],
    "health": [
        {
            "id": "q_health_area", "type": "text",
            "title": "Em qual área da saúde você atua?",
            "hint": "Ex: Medicina geral, nutrição, psicologia...",
            "placeholder": "Sua especialidade ou área de atuação",
            "block": "Saúde", "blockName": "Saúde", "blockIcon": "🩺",
            "required": False,
        },
    ],
    "business": [
        {
            "id": "q_biz_stage", "type": "choice",
            "title": "Em que estágio está seu negócio ou carreira?",
            "hint": "Isso define metas e prioridades diferentes para você.",
            "block": "Negócio", "blockName": "Negócio", "blockIcon": "🏢",
            "options": [
                {"value": "ideia",     "label": "💡 Fase de ideia",     "desc": "Ainda planejando"},
                {"value": "lancando",  "label": "🚀 Lançando",          "desc": "Primeiros passos"},
                {"value": "crescendo", "label": "📈 Crescendo",         "desc": "Em expansão"},
                {"value": "escalando", "label": "⚡ Escalando",         "desc": "Consolidado"},
            ],
            "required": False,
        },
    ],
    "creative": [
        {
            "id": "q_creative_medium", "type": "text",
            "title": "Qual é o seu meio criativo principal?",
            "hint": "Ex: Design digital, fotografia, escrita, música...",
            "placeholder": "Seu foco criativo",
            "block": "Criatividade", "blockName": "Criatividade", "blockIcon": "🎨",
            "required": False,
        },
    ],
}


def _build_flow(profession_type: str) -> List[Dict]:
    """Builds the complete question flow for a given profession type."""
    flow = list(CORE_QUESTIONS)
    extra = PROFESSION_EXTRA.get(profession_type, [])
    # Insert extra questions before q_ai_style (last question)
    if extra:
        flow = flow[:-1] + extra + [flow[-1]]
    # Attach index to each question
    for i, q in enumerate(flow):
        q = dict(q)
        q["index"] = i
        flow[i] = q
    return flow


def _get_previous_answers(uid: str) -> Dict:
    """Loads all saved onboarding answers for a user as a flat dict."""
    rows = fetch_list(query(
        get_db().table("onboarding_answers")
                .select("question_id, raw_answer")
                .eq("user_id", uid)
    ))
    return {r["question_id"]: r["raw_answer"] for r in rows if r.get("question_id")}


def get_next_question(index: int, profession_type: str) -> Optional[Dict]:
    """
    Returns the question at the given index.
    - Indexes 0-1: always static (name + profession) so we can detect profession first
    - Index 2+: pulled from the static flow or None if past end
    This is the fallback used only during onboarding/start (no uid context).
    For the real adaptive flow, use get_next_question_adaptive() in the answer endpoint.
    """
    flow = _build_flow(profession_type)
    if index >= len(flow):
        return None
    return flow[index]


def get_next_question_adaptive(uid: str, index: int,
                                profession_type: str,
                                previous_answers: Dict) -> Optional[Dict]:
    """
    Returns the next onboarding question.
    - Indexes 0-1: static (name, profession) — always asked first
    - Index 2+: AI-generated, adapted to profession and prior answers
    - Falls back to static flow if AI fails
    """
    static_flow = _build_flow(profession_type)

    # Always use static questions for the first two (name + profession)
    if index < 2:
        return static_flow[index] if index < len(static_flow) else None

    # Try AI-adaptive question for index 2+
    if previous_answers:
        try:
            ai_q = generate_adaptive_question(uid, profession_type, previous_answers, index)
            if ai_q is not None:
                return ai_q
            # ai_q is None → AI says flow is done
            return None
        except Exception as e:
            log.warning("[ONBOARDING] AI adaptive failed, using static fallback: %s", e)

    # Fallback: use static question bank
    if index < len(static_flow):
        return static_flow[index]
    return None


def save_onboarding_answer(uid: str, question_id: str,
                           answer: str, profession_type: str) -> Dict:
    """
    Saves one onboarding answer to the database.
    Optionally calls AI to parse the free-text answer.
    Returns the parsed data (or raw) for the frontend.
    """
    parsed = {}
    # AI parse only for text/textarea questions (not choices/sliders)
    if question_id in ("q_name", "q_goals", "q_challenges", "q_vision",
                       "q_profession", "q_tech_stack", "q_health_area", "q_creative_medium"):
        try:
            parsed = ai_parse(uid, question_id, answer)
        except Exception as e:
            log.warning("[ONBOARDING] AI parse failed for %s: %s", question_id, e)
            parsed = {"parsed_value": answer, "parse_error": True}

    # Upsert the answer into onboarding_answers
    query(get_db().table("onboarding_answers").upsert({
        "user_id":     uid,
        "question_id": question_id,
        "raw_answer":  answer[:2000],
        "parsed_data": parsed,
    }, on_conflict="user_id,question_id"))

    # Update profession column in user_profiles if q_profession
    if question_id == "q_profession":
        # v8.7: Normalize profession (fix typos, detect category)
        norm = normalize_profession(answer)
        normalized_text = norm["normalized"] or answer
        
        # Extract profession attributes for universal personalization
        # Use normalized text for better attribute detection
        prof_attrs = detect_profession_attributes(normalized_text)
        
        # Use the richer category from normalize_profession if not gen
        if norm["category"] not in ("gen",) and prof_attrs.get("profession_type") == "gen":
            prof_attrs["profession_type"] = norm.get("category_legacy", "gen")
        
        query(get_db().table("user_profiles").update({
            "profession":            normalized_text[:200],  # Save normalized text
            "profession_raw":        answer[:200],           # Preserve raw input
            "profession_type":       prof_attrs["profession_type"],
            # Save all universal attributes as JSON
            "profession_attributes": json.dumps(prof_attrs),
        }).eq("user_id", uid))
        
        log.info(
            "[ONBOARDING] v8.7 Saved profession uid=%s raw=%r norm=%r type=%s",
            uid, answer[:50], normalized_text[:50], prof_attrs["profession_type"]
        )

    # Update AI personality if q_ai_style
    if question_id == "q_ai_style":
        query(get_db().table("user_settings").update({
            "ai_personality": answer,
        }).eq("user_id", uid))

    # Update name if q_name
    if question_id == "q_name":
        name = answer[:100]
        initials = "".join(w[0].upper() for w in name.split()[:2]) or "U"
        query(get_db().table("users").update({
            "name":     name,
            "initials": initials,
        }).eq("id", uid))

    return parsed


def finalize_onboarding(uid: str):
    """
    Marks the user's onboarding as complete.
    FIX: Called BEFORE generate_initial_data so even if AI fails,
         the user is not stuck in onboarding.
    """
    query(get_db().table("users").update({
        "onboarding_done": True,
    }).eq("id", uid))
    log.info("[ONBOARDING] Marked complete for uid=%s", uid)


def get_progress(uid: str) -> Dict:
    return fetch_one(query(
        get_db().table("onboarding_progress")
                .select("*")
                .eq("user_id", uid)
                .limit(1)
    ))