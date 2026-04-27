"""
services/data_generation.py
Converts AI-generated life plan text into real database records.
Rule: AI generates structured JSON → this service validates and inserts.
Never insert raw AI output directly into the database.

EXPANDED v2.0: Now uses universal profession attributes for personalization.
        Fallback uses profession_attributes when AI fails.
"""

import logging
from datetime import date, timedelta
from typing import Dict

from utils.database import get_db, query, fetch_one, fetch_list
from utils.dates    import today, week_start
from services.ai    import generate_life_plan, generate_daily_update
from services.context import build_context

log = logging.getLogger("lifeos.data_generation")


def _insert_with_fallback(table_name: str, payload: Dict, optional_keys=None):
    """Insert row while tolerating schemas that are missing newer optional columns."""
    optional_keys = list(optional_keys or [])
    db = get_db()
    tried = []
    for key in [None, *optional_keys]:
        row = dict(payload)
        if key is not None:
            row.pop(key, None)
        sig = tuple(sorted(row.keys()))
        if sig in tried:
            continue
        tried.append(sig)
        res = query(db.table(table_name).insert(row))
        if res is not None:
            return res
    return None


def _upsert_weekly_metric(uid: str, wstart: str, dow: int, productivity_pct: int = 0):
    db = get_db()
    row = {
        "user_id":         uid,
        "week_start":      wstart,
        "day_of_week":     dow,
        "productivity_pct": productivity_pct,
    }
    # Try upsert with 3-column constraint (newer schema)
    res = query(db.table("weekly_metrics").upsert(row, on_conflict="user_id,week_start,day_of_week"))
    if res is not None:
        return res
    # Fallback: try upsert with 2-column constraint (older schema, no day_of_week column)
    row_no_dow = {k: v for k, v in row.items() if k != "day_of_week"}
    res = query(db.table("weekly_metrics").upsert(row_no_dow, on_conflict="user_id,week_start"))
    if res is not None:
        return res
    # Last resort: check if row exists and update or insert
    existing = fetch_one(query(
        db.table("weekly_metrics")
          .select("id")
          .eq("user_id", uid)
          .eq("week_start", wstart)
          .limit(1)
    ))
    if existing.get("id"):
        return query(db.table("weekly_metrics").update({"productivity_pct": productivity_pct}).eq("id", existing["id"]))
    # Insert without day_of_week if upsert failed (schema may lack it)
    try:
        return query(db.table("weekly_metrics").insert(row))
    except Exception:
        return query(db.table("weekly_metrics").insert(row_no_dow))


def _get_onboarding_answers(uid: str) -> Dict:
    """Collects all onboarding answers for a user into a flat dict."""
    rows = fetch_list(query(
        get_db().table("onboarding_answers")
                .select("question_id, raw_answer, parsed_data")
                .eq("user_id", uid)
    ))
    result = {}
    for r in rows:
        qid    = r.get("question_id", "")
        parsed = r.get("parsed_data") or {}
        result[qid] = parsed.get("parsed_value") or r.get("raw_answer", "")
    return result



def _clean_profession_label(context: Dict) -> str:
    """Return a safe, useful profession label for personalization."""
    prof = str(context.get("profession") or context.get("profession_raw") or "").strip()
    prof = " ".join(prof.split())
    return prof[:60] if prof else "sua ocupação"


def _is_sensitive_adult_profession(profession: str) -> bool:
    """Avoid generating operational content for adult/sexual or unsafe occupations."""
    p = (profession or "").lower()
    adult_terms = [
        "prostitut", "garota de programa", "acompanhante", "porn", "adulto", "strip",
        "camgirl", "onlyfans", "sexo", "sexual"
    ]
    return any(t in p for t in adult_terms)


def _answer_text(context: Dict, key: str, default: str = "") -> str:
    answers = context.get("recent_answers") or {}
    return str(answers.get(key) or default or "").strip()


def _main_goal_from_context(context: Dict) -> str:
    profession = _clean_profession_label(context)
    vision = str(context.get("vision") or _answer_text(context, "q_vision") or "").strip()
    goals = _answer_text(context, "q_goals")
    if vision:
        return f"Transformar a visão de vida em uma rotina prática para {profession}"
    if goals:
        return f"Avançar nos objetivos declarados com uma rotina de {profession}"
    return f"Construir uma rotina personalizada para {profession}"


def _context_seed_phrases(context: Dict) -> Dict[str, str]:
    """Small snippets from onboarding so deterministic fallback is not fake/static."""
    profession = _clean_profession_label(context)
    goals = _answer_text(context, "q_goals")
    challenge = _answer_text(context, "q_challenges") or ", ".join(context.get("restrictions") or [])
    vision = str(context.get("vision") or _answer_text(context, "q_vision") or "").strip()
    routine_type = str(context.get("routine_type") or "ok")
    return {
        "profession": profession,
        "goals": goals[:90] if goals else f"evoluir em {profession}",
        "challenge": challenge[:90] if challenge else "manter consistência sem depender de motivação",
        "vision": vision[:90] if vision else f"ter uma rotina mais estável atuando como {profession}",
        "routine_type": routine_type,
    }


def _build_sensitive_safe_plan(context: Dict) -> Dict:
    """Safe neutral plan when the declared occupation is adult/unsafe for detailed guidance."""
    name = context.get("name", "Usuário")
    return {
        "goals": [
            {"title": "Organizar uma rotina segura e saudável", "category": "geral", "total_value": 100, "unit": "%", "deadline_days": 30},
            {"title": "Definir objetivos pessoais fora da ocupação informada", "category": "pessoal", "total_value": 100, "unit": "%", "deadline_days": 45},
            {"title": "Criar estabilidade financeira e emocional", "category": "financas", "total_value": 100, "unit": "%", "deadline_days": 60},
        ],
        "tasks": [
            {"title": "Escrever 3 objetivos pessoais seguros para os próximos 30 dias", "category": "pessoal", "priority": "high", "due_days": 1},
            {"title": "Montar uma rotina de sono, alimentação e horários estáveis", "category": "pessoal", "priority": "high", "due_days": 2},
            {"title": "Registrar principais riscos, limites e necessidades de apoio", "category": "pessoal", "priority": "medium", "due_days": 3},
            {"title": "Criar uma meta financeira básica para este mês", "category": "financas", "priority": "medium", "due_days": 4},
            {"title": "Fazer check-in diário no LifeOS para acompanhar bem-estar", "category": "pessoal", "priority": "medium", "due_days": 1},
        ],
        "habits": [
            {"name": "Check-in de bem-estar", "icon": "🧭", "goal_value": 1, "goal_unit": "vez", "frequency_days": "all", "category": "pessoal"},
            {"name": "Registro de limites e energia", "icon": "🛡️", "goal_value": 1, "goal_unit": "nota", "frequency_days": "all", "category": "pessoal"},
            {"name": "Planejamento financeiro simples", "icon": "💰", "goal_value": 1, "goal_unit": "vez", "frequency_days": "weekdays", "category": "financas"},
        ],
        "routine": [
            {"time": "08:00", "activity": "Check-in pessoal e definição de limites do dia", "category": "pessoal"},
            {"time": "10:00", "activity": "Bloco de organização de objetivos pessoais", "category": "pessoal"},
            {"time": "15:00", "activity": "Revisão financeira e planejamento seguro", "category": "financas"},
            {"time": "20:00", "activity": "Encerramento do dia e registro de bem-estar", "category": "pessoal"},
        ],
        "week_status": f"Semana inicial para {name}: foco em segurança, clareza e estabilidade.",
        "summary": "Plano neutro e seguro, sem gerar tarefas operacionais para a ocupação informada.",
        "motivational_message": f"{name}, o LifeOS vai priorizar sua organização, saúde e segurança.",
        "_fallback_used": True,
        "_safety_limited": True,
    }


def _fallback_plan(profession_type: str, context: Dict) -> Dict:
    """
    Deterministic personalized fallback. It is NOT mock data: it uses
    name, profession, goals, challenges, vision, routine type and
    profession attributes collected in onboarding.
    """
    name = context.get("name", "Usuário")
    profession = _clean_profession_label(context)
    if _is_sensitive_adult_profession(profession):
        return _build_sensitive_safe_plan(context)

    seed = _context_seed_phrases(context)
    attrs = context.get("profession_attributes") or {}
    fallback_content = _build_fallback_by_attributes(profession, attrs, context.get("energy_avg", 5))

    goals = [
        {"title": _main_goal_from_context(context), "category": "carreira", "total_value": 100, "unit": "%", "deadline_days": 90},
        {"title": f"Reduzir o desafio atual: {seed['challenge']}", "category": "pessoal", "total_value": 100, "unit": "%", "deadline_days": 45},
        {"title": f"Criar consistência semanal em {profession}", "category": "geral", "total_value": 100, "unit": "%", "deadline_days": 30},
    ]

    tasks = [
        {"title": f"Definir 3 prioridades reais de {profession} para esta semana", "category": "trabalho", "priority": "high", "due_days": 1},
        {"title": f"Executar uma ação ligada ao objetivo: {seed['goals']}", "category": "trabalho", "priority": "high", "due_days": 2},
        {"title": f"Criar plano para enfrentar: {seed['challenge']}", "category": "pessoal", "priority": "medium", "due_days": 3},
        {"title": f"Separar materiais/informações importantes para {profession}", "category": "trabalho", "priority": "medium", "due_days": 2},
        {"title": "Registrar no LifeOS o que funcionou e o que precisa mudar", "category": "pessoal", "priority": "medium", "due_days": 1},
    ]

    plan = {
        "goals": goals,
        "tasks": tasks,
        "habits": fallback_content.get("habits", []),
        "routine": fallback_content.get("routine", []),
        "week_status": f"Semana inicial para {name}: rotina adaptada para {profession}.",
        "summary": f"Plano gerado a partir do onboarding de {name}. Foco em {profession}, objetivos declarados e desafio atual.",
        "motivational_message": f"{name}, comece com ações pequenas e específicas para sua realidade em {profession}.",
        "_fallback_used": True,
    }
    return _ensure_plan_minimums(plan, context)


def _build_fallback_by_attributes(profession: str, attrs: Dict, energy: float) -> Dict:
    """
    Build profession-aware fallback content without generic fake habits.
    Every habit/routine references the user's occupation or its work attributes.
    """
    profession = " ".join(str(profession or "sua ocupação").split())[:60]
    attrs = attrs if isinstance(attrs, dict) else {}
    env = attrs.get("work_environment", "mixed")
    contact = attrs.get("public_contact_level", "limited")
    schedule = attrs.get("schedule_rigidity", "semi_rigid")
    phys_load = attrs.get("physical_load", "medium")
    mental_load = attrs.get("mental_load", "medium")
    focus_req = attrs.get("deep_focus_requirement", "medium")

    habits = [
        {"name": f"Planejamento de {profession}", "icon": "📋", "goal_value": 1, "goal_unit": "vez", "frequency_days": "all", "category": "trabalho"},
        {"name": f"Registro de progresso em {profession}", "icon": "📝", "goal_value": 1, "goal_unit": "nota", "frequency_days": "all", "category": "trabalho"},
        {"name": f"Revisão técnica de {profession}", "icon": "🔎", "goal_value": 15, "goal_unit": "min", "frequency_days": "weekdays", "category": "desenvolvimento"},
    ]

    if focus_req == "high" or mental_load == "high":
        habits.append({"name": f"Bloco de foco para {profession}", "icon": "🎯", "goal_value": 1, "goal_unit": "bloco", "frequency_days": "weekdays", "category": "trabalho"})
    if contact == "frequent":
        habits.append({"name": f"Registro de contatos de {profession}", "icon": "🤝", "goal_value": 3, "goal_unit": "nota", "frequency_days": "weekdays", "category": "trabalho"})
    if phys_load == "high" or env in ("outdoor", "dangerous"):
        habits.append({"name": f"Checklist de segurança para {profession}", "icon": "🛡️", "goal_value": 1, "goal_unit": "vez", "frequency_days": "all", "category": "seguranca"})

    start_time = "06:30" if schedule == "rigid" else "08:00" if schedule == "semi_rigid" else "09:00"
    routine = [
        {"time": start_time, "activity": f"Preparar o dia de {profession}", "category": "trabalho"},
        {"time": "10:00", "activity": f"Executar prioridade principal de {profession}", "category": "trabalho"},
        {"time": "14:00", "activity": f"Organizar registros e pendências de {profession}", "category": "trabalho"},
        {"time": "17:30", "activity": f"Revisar resultados do dia em {profession}", "category": "pessoal"},
    ]
    if env in ("outdoor", "dangerous"):
        routine.insert(1, {"time": "07:30", "activity": f"Conferir materiais e segurança de {profession}", "category": "trabalho"})
    if contact == "frequent":
        routine.insert(2, {"time": "11:00", "activity": f"Organizar atendimentos/contatos de {profession}", "category": "trabalho"})

    return {"habits": habits[:6], "routine": routine[:8]}


def _build_fallback_by_profile(prof_type: str, energy: float, 
                                routine_type: str, profession: str) -> Dict:
    """Build profession-specific fallback content."""
    
    # Normalize profession for detection
    prof_lower = (profession or "").lower() + " " + prof_type.lower()
    
    # Tech/freelancer profile
    if any(k in prof_lower for k in ["dev", "program", "tech", "software", "desenvolvedor"]):
        return {
            "habits": [
                {"name": "Técnica Pomodoro", "icon": "⏱️", "goal_value": 4, "goal_unit": "bloco", "frequency_days": "all"},
                {"name": "Code review rápido", "icon": "👀", "goal_value": 1, "goal_unit": "vez", "frequency_days": "weekdays"},
            ],
            "routine": [
                {"time": "08:00", "activity": "Planejamento técnico", "category": "trabalho"},
                {"time": "14:00", "activity": "Standup/reunião", "category": "trabalho"},
            ]
        }
    
    # Health/medical profile
    if any(k in prof_lower for k in ["médic", "enferm", "saúde", "clínic", "nutri"]):
        return {
            "habits": [
                {"name": "Revisão de pacientes", "icon": "📋", "goal_value": 1, "goal_unit": "vez", "frequency_days": "all"},
                {"name": "Atualização profissional", "icon": "📚", "goal_value": 30, "goal_unit": "min", "frequency_days": "weekdays"},
            ],
            "routine": [
                {"time": "07:00", "activity": "Preparação do dia", "category": "trabalho"},
                {"time": "12:00", "activity": "Pausa recuperação", "category": "saude"},
            ]
        }
    
    # Business/entrepreneur profile
    if any(k in prof_lower for k in ["empres", "negóc", "vendas", "comerc", "gestor"]):
        return {
            "habits": [
                {"name": "Prospecção de clientes", "icon": "📞", "goal_value": 5, "goal_unit": "contato", "frequency_days": "weekdays"},
                {"name": "Revisão financeira", "icon": "💰", "goal_value": 1, "goal_unit": "vez", "frequency_days": "weekdays"},
            ],
            "routine": [
                {"time": "08:00", "activity": "Reunião daily", "category": "trabalho"},
                {"time": "17:00", "activity": "Follow-up clientes", "category": "trabalho"},
            ]
        }
    
    # Creative profile
    if any(k in prof_lower for k in ["design", "artista", "criat", "músic", "fotógra"]):
        return {
            "habits": [
                {"name": "Criação de conteúdo", "icon": "🎨", "goal_value": 1, "goal_unit": "projeto", "frequency_days": "all"},
                {"name": "Estudo de referências", "icon": "🔍", "goal_value": 30, "goal_unit": "min", "frequency_days": "all"},
            ],
            "routine": [
                {"time": "09:00", "activity": "Deep work criativo", "category": "trabalho"},
                {"time": "16:00", "activity": "Post-production", "category": "trabalho"},
            ]
        }
    
    # Student/education profile
    if any(k in prof_lower for k in ["estud", "alun", "universi", "faculd", "mestrad"]):
        return {
            "habits": [
                {"name": "Estudo focado", "icon": "📖", "goal_value": 2, "goal_unit": "hora", "frequency_days": "weekdays"},
                {"name": "Revisão de notas", "icon": "📝", "goal_value": 1, "goal_unit": "vez", "frequency_days": "all"},
            ],
            "routine": [
                {"time": "07:00", "activity": "Estudo matinal", "category": "trabalho"},
                {"time": "19:00", "activity": "Revisão semanal", "category": "trabalho"},
            ]
        }
    
    # Natural sciences / zoology / biology / animal care profile
    if any(k in prof_lower for k in ["zoolog", "zoólogo", "biólog", "biolog", "zootecn", "veterin"]):
        return {
            "habits": [
                {"name": "Registro de observações", "icon": "📝", "goal_value": 1, "goal_unit": "vez", "frequency_days": "all"},
                {"name": "Leitura científica curta", "icon": "🔬", "goal_value": 20, "goal_unit": "min", "frequency_days": "weekdays"},
                {"name": "Checklist de equipamentos", "icon": "🎒", "goal_value": 1, "goal_unit": "vez", "frequency_days": "weekdays"},
            ],
            "routine": [
                {"time": "07:30", "activity": "Revisar agenda de campo/laboratório", "category": "trabalho"},
                {"time": "08:30", "activity": "Preparar materiais e registros", "category": "trabalho"},
                {"time": "14:00", "activity": "Analisar observações e dados", "category": "trabalho"},
                {"time": "17:30", "activity": "Atualizar relatório técnico", "category": "trabalho"},
            ]
        }

    # Default fallback still uses the exact profession text; never returns fixed mock habits.
    prof_label = (profession or "sua ocupação").strip()[:60]
    return _build_fallback_by_attributes(prof_label, {
        "work_nature": "mixed",
        "work_environment": "mixed",
        "public_contact_level": "limited",
        "schedule_rigidity": "semi_rigid",
        "physical_load": "medium",
        "mental_load": "medium",
        "deep_focus_requirement": "medium",
    }, energy)


def validate_plan(plan: Dict, context: Dict) -> bool:
    """
    Strong validation before persisting AI plan.
    Checks structure, min counts, non-empty, basic profession fit.
    """
    rules = context.get("system_rules", {})
    
    # Structure checks
    if plan.get("parse_error"):
        return False
    
    goals = plan.get("goals", [])
    tasks = plan.get("tasks", [])
    habits = plan.get("habits", [])
    routine = plan.get("routine", [])
    
    # Min counts
    if len(goals) < rules.get("min_goals", 3):
        log.warning("[VALIDATE] Too few goals: %d", len(goals))
        return False
    if len(tasks) < rules.get("min_tasks", 5):
        return False
    if len(habits) < rules.get("min_habits", 3):
        return False
    if len(routine) < rules.get("min_routine", 4):
        return False
    
    # Non-empty titles
    if any(not str(g.get("title", "")).strip() for g in goals):
        return False
    if any(not str(t.get("title", "")).strip() for t in tasks):
        return False
    
    # Basic profession fit (avoid generic mismatch)
    prof_type = context.get("profession_type", "gen")
    generic_habits = ["Beber 2L de água", "Exercício físico"]  # Add more
    if prof_type != "atleta":
        for h in habits:
            if h.get("name") in generic_habits and "agua" in h.get("name", "").lower():
                log.warning("[VALIDATE] Generic habit for prof %s", prof_type)
                return False
    
    log.debug("[VALIDATE] OK for uid=%s", context.get("user_id"))
    return True



def _safe_time(value: str, default: str = "08:00") -> str:
    """Normalize any AI/fallback time to HH:MM so DB inserts never receive text."""
    import re
    text = str(value or "").strip()
    match = re.search(r"(\d{1,2})[:hH](\d{2})", text)
    if not match:
        match = re.search(r"\b(\d{1,2})\b", text)
        if not match:
            return default
        hour, minute = int(match.group(1)), 0
    else:
        hour, minute = int(match.group(1)), int(match.group(2))
    if hour < 0 or hour > 23 or minute < 0 or minute > 59:
        return default
    return f"{hour:02d}:{minute:02d}"


def _ensure_plan_minimums(plan: Dict, context: Dict) -> Dict:
    """
    Guarantees enough rows without inserting static fake content.
    Missing items are filled using profession + onboarding answers.
    """
    plan = dict(plan or {})
    profession = _clean_profession_label(context)
    name = context.get("name", "Usuário")
    if _is_sensitive_adult_profession(profession):
        plan = _build_sensitive_safe_plan(context)

    seed = _context_seed_phrases(context)
    attrs = context.get("profession_attributes") or {}
    prof_content = _build_fallback_by_attributes(profession, attrs, context.get("energy_avg", 5))

    goals = list(plan.get("goals") or [])
    tasks = list(plan.get("tasks") or [])
    habits = list(plan.get("habits") or [])
    routine = list(plan.get("routine") or [])

    goal_defaults = [
        {"title": _main_goal_from_context(context), "category": "carreira", "total_value": 100, "unit": "%", "deadline_days": 90},
        {"title": f"Transformar objetivo em ação: {seed['goals']}", "category": "geral", "total_value": 100, "unit": "%", "deadline_days": 45},
        {"title": f"Superar obstáculo atual: {seed['challenge']}", "category": "pessoal", "total_value": 100, "unit": "%", "deadline_days": 30},
    ]
    task_defaults = [
        {"title": f"Listar prioridades reais de {profession} para hoje", "category": "trabalho", "priority": "high", "due_days": 1},
        {"title": f"Executar uma ação prática sobre: {seed['goals']}", "category": "trabalho", "priority": "high", "due_days": 2},
        {"title": f"Criar solução para o desafio: {seed['challenge']}", "category": "pessoal", "priority": "medium", "due_days": 3},
        {"title": f"Organizar materiais ou registros de {profession}", "category": "trabalho", "priority": "medium", "due_days": 2},
        {"title": f"Revisar evolução da semana como {profession}", "category": "pessoal", "priority": "medium", "due_days": 5},
    ]
    habit_defaults = prof_content.get("habits", [])
    routine_defaults = prof_content.get("routine", [])

    banned = {
        "beber 2l de água", "beber agua", "beber água", "hidratação diária",
        "estudar 1 hora", "treinar", "acordar antes das 7h", "trabalhar no projeto",
        "ler 10 minutos", "exercício físico", "rotina matinal",
    }
    banned_contains = ["beber", "água", "agua", "treinar", "exercício", "exercicio", "meditar", "ler 10", "acordar antes"]

    def item_key(x):
        return str(x.get("title") or x.get("name") or x.get("activity") or "").strip().lower()

    def is_banned_generic(x):
        key = item_key(x)
        if key in banned:
            return True
        # Only block broad wellness clichés when they do not mention the profession.
        return any(term in key for term in banned_contains) and profession.lower() not in key

    def remove_banned(items):
        return [x for x in items if not is_banned_generic(x)]

    goals = remove_banned(goals)
    tasks = remove_banned(tasks)
    habits = remove_banned(habits)
    routine = remove_banned(routine)

    def fill(items, defaults, min_len):
        seen = {item_key(x) for x in items}
        for d in defaults:
            key = item_key(d)
            if key and key not in seen and not is_banned_generic(d):
                items.append(dict(d))
                seen.add(key)
            if len(items) >= min_len:
                break
        return items

    goals = fill(goals, goal_defaults, 3)
    tasks = fill(tasks, task_defaults, 5)
    habits = fill(habits, habit_defaults, 3)
    routine = fill(routine, routine_defaults, 4)

    for r in routine:
        r["time"] = _safe_time(r.get("time", ""), "08:00")

    plan["goals"] = goals[:5]
    plan["tasks"] = tasks[:10]
    plan["habits"] = habits[:6]
    plan["routine"] = routine[:8]
    plan["main_goal"] = str(plan.get("main_goal") or _main_goal_from_context(context))[:240]
    plan["week_status"] = str(plan.get("week_status") or f"Semana inicial para {name}: foco em {profession}.")[:240]
    plan["summary"] = str(plan.get("summary") or f"Plano personalizado para {name}, baseado em {profession}, objetivos e desafios do onboarding.")[:1000]
    plan["motivational_message"] = str(plan.get("motivational_message") or f"{name}, avance com pequenas ações reais ligadas à sua rotina de {profession}.")[:500]
    return plan


def _persist_structured_week_plan(uid: str, plan: Dict) -> Dict[str, int]:
    """
    Writes a structured active plan for endpoints /api/routine/current and /api/habits/current.
    This is best-effort: if the database has not run the migration yet, the legacy flat
    tables still keep the dashboard working.
    """
    counts = {"plan_tasks": 0, "plan_habits": 0}
    db = get_db()
    try:
        main_goal = str(plan.get("main_goal") or "Plano LifeOS inicial")[:240]
        annual_payload = {
            "user_id": uid,
            "title": "Plano LifeOS inicial",
            "main_goal": main_goal,
            "description": str(plan.get("summary", ""))[:1000],
            "plan_start_date": date.today().isoformat(),
            "is_active": True,
        }
        annual = fetch_one(query(db.table("annual_plans").insert(annual_payload)))
        if not annual.get("id"):
            # Some fresh installations may not have optional columns yet.
            annual = fetch_one(query(db.table("annual_plans").insert({
                "user_id": uid,
                "title": "Plano LifeOS inicial",
                "plan_start_date": date.today().isoformat(),
                "is_active": True,
            })))
        annual_id = annual.get("id")
        if not annual_id:
            # Some Supabase/PostgREST versions do not return inserted rows for insert().
            annual = fetch_one(query(
                db.table("annual_plans")
                  .select("id")
                  .eq("user_id", uid)
                  .eq("is_active", True)
                  .order("created_at", desc=True)
                  .limit(1)
            ))
            annual_id = annual.get("id")
        if not annual_id:
            return counts

        weekly_payload = {
            "annual_plan_id": annual_id,
            "user_id": uid,
            "week_start": week_start(),
            "week_number": 1,
            "focus_theme": str(plan.get("week_status", "Semana inicial"))[:200],
            "weekly_goal": str(plan.get("summary", "Organizar a primeira semana"))[:500],
        }
        # Try the clean schema first. Some old databases still have legacy monthly_plan_id/user_id columns.
        weekly = fetch_one(query(db.table("weekly_plans").insert(weekly_payload)))
        if not weekly.get("id"):
            legacy_payload = dict(weekly_payload)
            legacy_payload["monthly_plan_id"] = annual_id
            weekly = fetch_one(query(db.table("weekly_plans").insert(legacy_payload)))
        if not weekly.get("id"):
            no_user_payload = {k: v for k, v in weekly_payload.items() if k != "user_id"}
            weekly = fetch_one(query(db.table("weekly_plans").insert(no_user_payload)))
        weekly_id = weekly.get("id")
        if not weekly_id:
            weekly = fetch_one(query(
                db.table("weekly_plans")
                  .select("id")
                  .eq("annual_plan_id", annual_id)
                  .eq("week_start", week_start())
                  .limit(1)
            ))
            weekly_id = weekly.get("id")
        if not weekly_id:
            return counts

        for t in plan.get("routine", [])[:8]:
            title = str(t.get("activity") or t.get("title") or "").strip()
            if not title:
                continue
            res = _insert_with_fallback("plan_tasks", {
                "weekly_plan_id": weekly_id,
                "user_id": uid,
                "title": title[:200],
                "description": str(t.get("description", ""))[:500],
                "category": str(t.get("category", "trabalho")),
                "priority": str(t.get("priority", "medium")),
                "time_of_day": _safe_time(t.get("time", "08:00")),
            }, optional_keys=["user_id"])
            if res is not None:
                counts["plan_tasks"] += 1

        for h in plan.get("habits", [])[:6]:
            name = str(h.get("name", "")).strip()
            if not name:
                continue
            res = _insert_with_fallback("plan_habits", {
                "weekly_plan_id": weekly_id,
                "user_id": uid,
                "name": name[:150],
                "icon": str(h.get("icon", "⭐")),
                "goal_value": float(h.get("goal_value", 1)),
                "goal_unit": str(h.get("goal_unit", "vez")),
                "frequency_days": str(h.get("frequency_days", "all")),
                "category": str(h.get("category", "geral")),
                "is_active": True,
            }, optional_keys=["user_id", "is_active"])
            if res is not None:
                counts["plan_habits"] += 1
    except Exception as e:
        log.warning("[GEN] Structured plan persistence skipped: %s", e)
    return counts


def generate_initial_data(uid: str) -> Dict:
    """
    Called after onboarding completes.
    1. Builds FULL context
    2. Calls AI (retry max 2x)
    3. Validates STRICTLY
    4. Smart fallback if needed
    5. Inserts + snapshot
    """
    db = get_db()
    log.info("[GEN] Generating initial data for uid=%s", uid)

    # ── Build FULL context ────────────────────────────────────
    context = build_context(uid)

    # ── Generate + Validate + Retry ──────────────────────────
    plan = None
    for attempt in range(3):  # Max 2 retries + final fallback
        candidate = generate_life_plan(uid, context)
        if not candidate or candidate.get("parse_error"):
            log.warning("[GEN] AI parse failed attempt %d/%d for uid=%s", attempt+1, 3, uid)
            continue

        # Do not discard an otherwise useful AI plan just because it returned too few items.
        # Complete it with safe defaults, then validate.
        candidate = _ensure_plan_minimums(candidate, context)
        plan = candidate
        if validate_plan(candidate, context):
            log.info("[GEN] AI plan VALID after attempt %d", attempt+1)
            break
        log.warning("[GEN] Validation failed attempt %d/%d for uid=%s", attempt+1, 3, uid)

    if not plan or plan.get("parse_error"):
        log.warning("[GEN] All AI attempts failed → smart fallback")
        plan = _fallback_plan(context["profession_type"], context)

    # Never persist an empty/weak plan.
    plan = _ensure_plan_minimums(plan, context)

    counts = {"goals": 0, "tasks": 0, "habits": 0, "routine": 0}
    today_str = today()

    # ── Insert Goals ─────────────────────────────────────────
    for i, g in enumerate(plan.get("goals", [])[:5]):
        title = str(g.get("title", "")).strip()
        if not title:
            continue
        deadline = (date.today() + timedelta(days=int(g.get("deadline_days", 90)))).isoformat()
        res = _insert_with_fallback("goals", {
            "user_id":       uid,
            "title":         title[:200],
            "category":      str(g.get("category", "geral")),
            "current_value": 0,
            "total_value":   float(g.get("total_value", 100)),
            "unit":          str(g.get("unit", "%")),
            "pct":           0,
            "deadline":      deadline,
            "is_active":     True,
            "sort_order":    i,
            "source":        "ai",
        }, optional_keys=["source"])
        if res is not None:
            counts["goals"] += 1

    # ── Insert Tasks ─────────────────────────────────────────
    for t in plan.get("tasks", [])[:8]:
        title = str(t.get("title", "")).strip()
        if not title:
            continue
        due = (date.today() + timedelta(days=int(t.get("due_days", 7)))).isoformat()
        task_row = {
            "user_id":  uid,
            "title":    title[:300],
            "category": str(t.get("category", "pessoal")),
            "priority": str(t.get("priority", "medium")),
            "done":     False,
            "source":   "ai",
        }
        # Try with due_date first; fall back without it if column doesn't exist
        res = _insert_with_fallback("tasks", {**task_row, "due_date": due}, optional_keys=["source", "due_date"])
        if res is not None:
            counts["tasks"] += 1

    # ── Insert Habits ─────────────────────────────────────────
    for i, h in enumerate(plan.get("habits", [])[:5]):
        name = str(h.get("name", "")).strip()
        if not name:
            continue
        habit_row = {
            "user_id":        uid,
            "name":           name[:150],
            "icon":           str(h.get("icon", "⭐")),
            "goal_unit":      str(h.get("goal_unit", "vez")),
            "frequency_days": str(h.get("frequency_days", "all")),
            "sort_order":     i,
            "is_active":      True,
            "source":         "ai",
        }
        # Try with goal_value first; fall back without it if column doesn't exist
        res = _insert_with_fallback("habits", {**habit_row, "goal_value": float(h.get("goal_value", 1))}, optional_keys=["source", "goal_value"])
        if res is not None:
            counts["habits"] += 1

    # ── Insert Routine Templates ──────────────────────────────
    for i, r in enumerate(plan.get("routine", [])[:6]):
        activity = str(r.get("activity", "")).strip()
        if not activity:
            continue
        res = _insert_with_fallback("routine_templates", {
            "user_id":     uid,
            "time_of_day": _safe_time(r.get("time", "08:00")),
            "activity":    activity[:200],
            "category":    str(r.get("category", "pessoal")),
            "sort_order":  i,
            "is_active":   True,
            "source":      "ai",
        }, optional_keys=["source"])
        if res is not None:
            counts["routine"] += 1

    # ── Structured Week Plan (feeds /api/routine/current and /api/habits/current) ──
    structured_counts = _persist_structured_week_plan(uid, plan)
    counts.update(structured_counts)

    # ── Update User Profile ───────────────────────────────────
    week_status = str(plan.get("week_status", ""))[:200]
    if week_status:
        query(db.table("user_profiles").update({
            "week_status": week_status,
            # The user has a generated plan and first tasks now; start at 5 instead of a discouraging 0.
            "progress_pct": 5,
        }).eq("user_id", uid))

    # ── Save Plan Snapshot ────────────────────────────────────
    query(db.table("plans").insert({
        "user_id": uid,
        "content": {
            "summary":              plan.get("summary", ""),
            "motivational_message": plan.get("motivational_message", ""),
            "generated_at":         today_str,
            "context":              context,
        },
        "context": context,      # flat column for legacy reads
        "generated_at": today_str,
    }))

    # ── Initialize Weekly Metrics (zeros for the week) ────────
    wstart = week_start()
    for dow in range(7):
        _upsert_weekly_metric(uid, wstart, dow, 0)

    log.info("[GEN] Done for uid=%s — %s", uid, counts)
    return {
        "counts": counts,
        "summary":  plan.get("summary", ""),
        "message":  plan.get("motivational_message", ""),
    }


def run_daily_update(uid: str, name: str) -> bool:
    """
    Runs the daily AI update for a user at 4AM their timezone.
    Adds 1-2 new tasks and updates motivational message.
    Returns True if successful.
    """
    context = build_context(uid)
    name = context.get("name", name)
    
    update = generate_daily_update(uid, context)

    if update.get("parse_error"):
        log.warning("[DAILY] Parse error for uid=%s → fallback", uid)
        update = {
            "tasks": [{"title": "Check-in diário", "category": "pessoal", "priority": "high", "due_days": 1}],
            "week_status": "Semana forte! 🚀",
            "motivational_message": "Dia novo, conquistas novas!"
        }

    if update.get("parse_error"):
        return False

    today_str = today()

    # Insert daily tasks
    for t in update.get("tasks", [])[:2]:
        title = str(t.get("title", "")).strip()
        if not title:
            continue
        due = (date.today() + timedelta(days=int(t.get("due_days", 1)))).isoformat()
        _insert_with_fallback("tasks", {
            "user_id":  uid,
            "title":    title[:300],
            "category": str(t.get("category", "pessoal")),
            "priority": str(t.get("priority", "medium")),
            "due_date": due,
            "done":     False,
            "source":   "ai_daily",
        }, optional_keys=["source", "due_date"])

    # Update week_status if provided
    week_status = str(update.get("week_status", "")).strip()
    if week_status:
        query(db.table("user_profiles").update({
            "week_status": week_status[:200],
        }).eq("user_id", uid))

    return True 