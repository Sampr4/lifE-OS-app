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


def _fallback_plan(profession_type: str, context: Dict) -> Dict:
    """
    SMART FALLBACK v2.0 that uses ALL available context data.
    This is a last-resort fallback when AI completely fails.
    
    NOW USES UNIVERSAL PROFESSION ATTRIBUTES for truly personalized content.
    Works for ANY profession: driver, teacher, doctor, street cleaner, etc.
    """
    name = context.get("name", "Usuário")
    profession = context.get("profession", "")
    energy_avg = context.get("energy_avg", 5)
    restrictions = context.get("restrictions", [])
    routine_type = context.get("routine_type", "ok")
    goals_titles = context.get("goals_titles", [])
    vision = context.get("vision", "")
    
    # NEW v2.0: Try universal attribute-based fallback first
    profession_attrs = context.get("profession_attributes", {})
    if profession_attrs:
        # Use the new universal attribute-based builder
        fallback_content = _build_fallback_by_attributes(
            profession, profession_attrs, energy_avg
        )
    else:
        # Fallback to legacy keyword-based detection
        fallback_content = _build_fallback_by_profile(
            profession_type, energy_avg, routine_type, profession
        )
    
    # Adjust for energy level
    if energy_avg <= 3:
        # Low energy: reduce ambition, focus on basics
        tasks = [
            {"title": "Completar check-in diário", "category": "pessoal", "priority": "high", "due_days": 1},
            {"title": "Revisar objetivos principais", "category": "pessoal", "priority": "medium", "due_days": 3},
        ]
    elif energy_avg >= 8:
        # High energy: ambitious but specific
        tasks = [
            {"title": f"Avançar em: {goals_titles[0] if goals_titles else 'meta principal'}", "category": "trabalho", "priority": "high", "due_days": 1},
            {"title": "Planejar próxima semana", "category": "pessoal", "priority": "high", "due_days": 2},
        ]
    else:
        # Normal energy: balanced
        tasks = [
            {"title": "Check-in diário LifeOS", "category": "pessoal", "priority": "high", "due_days": 1},
            {"title": "Revisar plano semanal", "category": "pessoal", "priority": "medium", "due_days": 2},
        ]
    
    # Add restriction-based tasks if available
    for r in restrictions[:2]:
        tasks.append({
            "title": f"lidar com: {r}", 
            "category": "pessoal", 
            "priority": "medium", 
            "due_days": 5
        })
    
    # Goals based on vision if available
    if vision:
        goals = [
            {"title": f"Prosseguir com: {vision[:50]}...", "category": "geral", "total_value": 100, "unit": "%", "deadline_days": 90},
            {"title": "Estabelecer rotina semanal", "category": "pessoal", "total_value": 100, "unit": "%", "deadline_days": 30},
        ]
    else:
        goals = [
            {"title": f"Começar jornada em {profession or 'nova área'}", "category": "geral", "total_value": 100, "unit": "%", "deadline_days": 90},
            {"title": "Adaptar rotina ao perfil", "category": "pessoal", "total_value": 100, "unit": "%", "deadline_days": 30},
        ]
    
    # Use fallback content mixed with context
    habits = fallback_content.get("habits", [])[:4]
    routine = fallback_content.get("routine", [])[:4]
    
    # Add common routine if needed
    if len(routine) < 4:
        routine.extend([
            {"time": "07:00", "activity": "Rotina matinal", "category": "pessoal"},
            {"time": "12:00", "activity": "Almoço", "category": "saude"},
            {"time": "19:00", "activity": "Check-in diário", "category": "pessoal"},
        ])
    
    return {
        "goals": goals,
        "tasks": tasks[:6],
        "habits": habits,
        "routine": routine[:6],
        "week_status": f"Semana de recomeço para {name}! Vamos evoluir gradualmente. 💪",
        "summary": f"Plano inicial para {name} ({profession or profession_type}). Foco em consistência e progresso.",
        "motivational_message": f"Bem-vindo(a) ao LifeOS, {name}! Vamos construir sua rotina ideal. 🚀",
        "_fallback_used": True,  # Flag to track fallback usage
    }


def _build_fallback_by_attributes(profession: str, attrs: Dict, energy: float) -> Dict:
    """
    NEW v2.0: Build truly personalized fallback using universal profession attributes.
    This ensures personalization works for ANY profession in the world.
    
    Args:
        profession: Raw profession text
        attrs: Universal profession attributes from onboarding
        energy: User's energy level (1-10)
        
    Returns:
        Dict with habits and routine tailored to profession attributes
    """
    work_nature = attrs.get("work_nature", "mental")
    env = attrs.get("work_environment", "indoor")
    contact = attrs.get("public_contact_level", "none")
    schedule = attrs.get("schedule_rigidity", "flexible")
    phys_load = attrs.get("physical_load", "low")
    mental_load = attrs.get("mental_load", "medium")
    focus_req = attrs.get("deep_focus_requirement", "medium")
    
    habits = []
    routine = []
    
    # ── HABITS based on work nature ────────────────────────────
    if work_nature == "manual":
        habits.extend([
            {"name": "Alongamento muscular", "icon": "🧘", "goal_value": 10, "goal_unit": "min", "frequency_days": "all"},
            {"name": "Hidratação", "icon": "💧", "goal_value": 2, "goal_unit": "L", "frequency_days": "all"},
        ])
    elif work_nature == "mental":
        if focus_req == "high":
            habits.extend([
                {"name": "Pausas ativas", "icon": "⏱️", "goal_value": 5, "goal_unit": "min", "frequency_days": "all"},
                {"name": "Técnica Pomodoro", "icon": "🍅", "goal_value": 4, "goal_unit": "bloco", "frequency_days": "weekdays"},
            ])
        else:
            habits.extend([
                {"name": "Revisão diária", "icon": "📋", "goal_value": 1, "goal_unit": "vez", "frequency_days": "all"},
            ])
    else:  # mixed
        habits.extend([
            {"name": "Transição trabalho-vida", "icon": "🔄", "goal_value": 15, "goal_unit": "min", "frequency_days": "all"},
        ])
    
    # ── HABITS based on contact level ────────────────────────────
    if contact == "frequent":
        habits.append({"name": "Registro de interações", "icon": "📝", "goal_value": 3, "goal_unit": "nota", "frequency_days": "all"})
    
    # ── HABITS based on physical load ────────────────────────────
    if phys_load == "high":
        habits.append({"name": "Alongamento pós-trabalho", "icon": "💆", "goal_value": 10, "goal_unit": "min", "frequency_days": "all"})
    
    # ── ROUTINE based on schedule ────────────────────────────────
    if schedule == "rigid":
        routine.extend([
            {"time": "06:00", "activity": "Rotina matinal", "category": "pessoal"},
            {"time": "12:00", "activity": "Almoço", "category": "saude"},
            {"time": "18:00", "activity": "Transição para casa", "category": "pessoal"},
        ])
    elif schedule == "flexible":
        routine.extend([
            {"time": "09:00", "activity": "Planejamento do dia", "category": "pessoal"},
            {"time": "13:00", "activity": "Pausa recuperação", "category": "saude"},
            {"time": "19:00", "activity": "Check-in diário", "category": "pessoal"},
        ])
    else:  # semi_rigid
        routine.extend([
            {"time": "07:00", "activity": "Rotina matinal", "category": "pessoal"},
            {"time": "12:00", "activity": "Almoço", "category": "saude"},
            {"time": "18:30", "activity": "Revisão do dia", "category": "pessoal"},
        ])
    
    # ── ROUTINE based on environment ─────────────────────────────
    if env == "outdoor":
        routine.insert(1, {"time": "Entrada trabalho", "activity": "Preparação ambiente", "category": "trabalho"})
    elif env == "dangerous":
        routine.insert(0, {"time": "05:30", "activity": "Verificação equipamentos", "category": "trabalho"})
    
    # Add default habits if empty
    if len(habits) < 2:
        habits.extend([
            {"name": "Check-in LifeOS", "icon": "✅", "goal_value": 1, "goal_unit": "vez", "frequency_days": "all"},
            {"name": "Planejamento", "icon": "📅", "goal_value": 1, "goal_unit": "vez", "frequency_days": "all"},
        ])
    
    # Add default routine if empty
    if len(routine) < 3:
        routine.extend([
            {"time": "07:00", "activity": "Rotina matinal", "category": "pessoal"},
            {"time": "12:00", "activity": "Almoço", "category": "saude"},
            {"time": "19:00", "activity": "Check-in", "category": "pessoal"},
        ])
    
    return {
        "habits": habits[:5],
        "routine": routine[:6],
    }


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
    
    # Default fallback
    return {
        "habits": [
            {"name": "Planejamento diário", "icon": "📅", "goal_value": 1, "goal_unit": "vez", "frequency_days": "all"},
            {"name": "Check-in de progresso", "icon": "✅", "goal_value": 1, "goal_unit": "vez", "frequency_days": "all"},
        ],
        "routine": [
            {"time": "07:00", "activity": "Rotina matinal", "category": "pessoal"},
            {"time": "12:00", "activity": "Pausa e alinhamento", "category": "pessoal"},
        ]
    }


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
        plan = generate_life_plan(uid, context)
        if validate_plan(plan, context):
            log.info("[GEN] AI plan VALID after attempt %d", attempt+1)
            break
        log.warning("[GEN] Validation failed attempt %d/%d for uid=%s", attempt+1, 2, uid)
    
    if not plan or plan.get("parse_error"):
        log.warning("[GEN] All attempts failed → smart fallback")
        plan = _fallback_plan(context["profession_type"], context)

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
            "time_of_day": str(r.get("time", "08:00"))[:5],
            "activity":    activity[:200],
            "category":    str(r.get("category", "pessoal")),
            "sort_order":  i,
            "is_active":   True,
            "source":      "ai",
        }, optional_keys=["source"])
        if res is not None:
            counts["routine"] += 1

    # ── Update User Profile ───────────────────────────────────
    week_status = str(plan.get("week_status", ""))[:200]
    if week_status:
        query(db.table("user_profiles").update({
            "week_status": week_status,
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