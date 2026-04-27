"""
services/context.py
Builds consolidated user context for AI prompts.
Combines user_profiles, onboarding_answers, goals, habits, recent activity.
Returns JSON-ready dict for prompts.

EXPANDED v2.0: Now includes profession_attributes (universal model).
        Uses ANY profession to generate truly personalized plans.
"""

import json
import logging
from typing import Dict, Any
from utils.database import get_db, query, fetch_one, fetch_list
from utils.dates import today, week_start
# v8.7: Import normalize_profession for better AI context
try:
    from services.onboarding import normalize_profession
except ImportError:
    normalize_profession = None

log = logging.getLogger("lifeos.services.context")


# ── PROFESSION ATTRIBUTE EXAMPLES ────────────────────────────────
# Used to guide AI when generating personalized tasks/habits

# Activity examples by work nature
WORK_NATURE_EXAMPLES = {
    "manual": "trabalhar com as mãos, operar máquinas, trabalhar ao ar livre, esforço físico",
    "mental": "analisar dados, tomar decisões, reuniões, planejamento, concentração intensa",
    "mixed": "alternar entre trabalho físico e mental, múltiplas responsabilidades",
}

# Environment examples
ENVIRONMENT_EXAMPLES = {
    "indoor": "escritório, ambiente climatizado, workstation",
    "outdoor": "rua, canteiro de obras, fazenda, veículos",
    "mixed": "variado, múltiplos ambientes",
    "dangerous": "áreas de risco, equipamentos pesados, altura",
}

# Public contact examples
CONTACT_EXAMPLES = {
    "none": "trabalho独立, sem interação com clientes",
    "limited": "atendimento eventual, reuniões rápidas",
    "frequent": "contato constante com clientes/público, atendimento",
}

# Schedule rigidity examples
SCHEDULE_EXAMPLES = {
    "flexible": "horários flexíveis, trabalho por resultado",
    "semi_rigid": "horários parcialmente definidos, folgas variáveis",
    "rigid": "turnos fixos, plantões, horários rígidos",
}


def _parse_profession_attributes(attr_json: str) -> Dict[str, Any]:
    """Parse profession attributes from JSON string."""
    if not attr_json:
        return {}
    try:
        return json.loads(attr_json) if isinstance(attr_json, str) else attr_json
    except:
        return {}


def _get_profession_guidance(attrs: Dict[str, Any]) -> str:
    """
    Build guidance string from profession attributes.
    This makes AI generate TRULY personalized tasks/habits.
    """
    if not attrs:
        return ""
    
    parts = []
    
    # Work nature guidance
    work_nature = attrs.get("work_nature", "mental")
    if work_nature in WORK_NATURE_EXAMPLES:
        parts.append(f"Trabalho predominantemente {work_nature}: {WORK_NATURE_EXAMPLES[work_nature]}")
    
    # Physical load guidance
    phys = attrs.get("physical_load", "low")
    if phys == "high":
        parts.append("Requer esforço físico regular")
    elif phys == "medium":
        parts.append("Atividade física moderada")
    
    # Mental load
    mental = attrs.get("mental_load", "medium")
    if mental == "high":
        parts.append("Alta demanda mental/decisória")
    
    # Schedule rigidity
    sched = attrs.get("schedule_rigidity", "flexible")
    if sched in SCHEDULE_EXAMPLES:
        parts.append(f"Rigidez de horário: {SCHEDULE_EXAMPLES[sched]}")
    
    # Public contact
    contact = attrs.get("public_contact_level", "limited")
    if contact in CONTACT_EXAMPLES:
        parts.append(f"Contato com público: {CONTACT_EXAMPLES[contact]}")
    
    # Environment
    env = attrs.get("work_environment", "indoor")
    if env in ENVIRONMENT_EXAMPLES:
        parts.append(f"Ambiente de trabalho: {ENVIRONMENT_EXAMPLES[env]}")
    
    # Responsibility level
    resp = attrs.get("responsibility_level", "medium")
    if resp in ["high", "critical"]:
        parts.append(f"Nível de responsabilidade: {resp}")
    
    # Focus requirement
    focus = attrs.get("deep_focus_requirement", "medium")
    if focus == "high":
        parts.append("Requer deep work/foco profundo")
    
    return " | ".join(parts)


def build_context(uid: str) -> Dict[str, Any]:
    """
    Builds complete user context for AI generation.
    Aggregates profile, history, energy, restrictions, vision, signals.
    
    EXPANDED v2.0: Now includes profession_attributes for universal personalization.
    """
    db = get_db()
    
    # 1. User profile + base user identity
    # user_profiles normally does not own the display name; the users table does.
    # Without this, generated plans can say "Usuário" even when the dashboard knows the real name.
    base_user = fetch_one(query(
        db.table("users")
          .select("name, email")
          .eq("id", uid)
          .limit(1)
    ))
    base_user = base_user or {}

    profile = fetch_one(query(db.table("user_profiles").select("*").eq("user_id", uid).limit(1)))
    profile = profile or {}
    profession_type = profile.get("profession_type", "gen") or "gen"
    profession_raw  = profile.get("profession_raw", "") or profile.get("profession", "") or ""
    profession      = profile.get("profession", "") or ""  # Normalized profession text
    energy_pattern  = profile.get("energy_pattern", "normal") or "normal"

    # Se uma migration antiga impediu salvar user_profiles.profession_raw,
    # recupera a profissão diretamente da resposta do onboarding.
    if not profession_raw:
        prof_answer = fetch_one(query(
            db.table("onboarding_answers")
              .select("raw_answer")
              .eq("user_id", uid)
              .eq("question_id", "q_profession")
              .limit(1)
        ))
        profession_raw = prof_answer.get("raw_answer", "") if prof_answer else ""
    
    # v8.7: Use normalize_profession for richer AI context
    if normalize_profession and profession_raw:
        norm = normalize_profession(profession_raw)
        if norm["normalized"]:
            profession = norm["normalized"]
        if profession_type == "gen" and norm["category"] not in ("gen",):
            profession_type = norm.get("category_legacy", profession_type)
    
    # 1.1. Get profession attributes (universal model)
    profession_attributes = _parse_profession_attributes(profile.get("profession_attributes", ""))
    profession_guidance = _get_profession_guidance(profession_attributes)
    
    # 2. Get vision from profile
    vision = profile.get("vision", "") or ""
    
    # 3. Get restrictions (from onboarding answers)
    restrictions = _get_restrictions(uid)
    
    # 4. Get routine type from onboarding
    routine_type = _get_routine_type(uid)
    
    # 5. Recent onboarding answers summary (last 15)
    answers_res = query(
        db.table("onboarding_answers")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(15)
    )
    answers = fetch_list(answers_res)
    answers_summary = {}
    for ans in answers:
        qid = ans.get("question_id")
        if not qid:
            continue
        parsed = ans.get("parsed_data") or {}
        value = parsed.get("parsed_value") if isinstance(parsed, dict) else None
        answers_summary[qid] = str(value or ans.get("raw_answer", ""))[:150]
    
    # 6. Recent goals (active, top 5)
    goals_res = query(
        db.table("goals")
        .select("*")
        .eq("user_id", uid)
        .eq("is_active", True)
        .order("created_at", desc=True)
        .limit(5)
    )
    goals = fetch_list(goals_res)
    goals_titles = [g.get("title", "") for g in goals if g.get("title")]
    
    # 7. Habits (current week)
    habits_res = query(
        db.table("habits")
        .select("*")
        .eq("user_id", uid)
        .eq("is_active", True)
        .gte("created_at", week_start())
        .limit(10)
    )
    habits = fetch_list(habits_res)
    habit_names = [h.get("name", "") for h in habits if h.get("name")]
    
    # 8. Recent checkins (energy avg, streak, signals)
    checkins_res = query(
        db.table("checkin_sessions")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(7)
    )
    checkins = fetch_list(checkins_res)
    streak = sum(1 for c in checkins[:7] if c.get("is_complete", c.get("done", False)))
    energy_avg = sum(c.get("energy_level", 5) for c in checkins) / max(1, len(checkins))
    
    # Recent signals (last 3 checkins for negative patterns)
    recent_signals = []
    for c in checkins[:3]:
        energy = c.get("energy_level", 5)
        if energy <= 3:
            recent_signals.append("baixa energia")
        elif energy >= 8:
            recent_signals.append("alta energia")
    
    # 9. Recent AI generations (anti-rep: last plan/tasks)
    gens_res = query(
        db.table("ai_generations")
        .select("*")
        .eq("user_id", uid)
        .in_("generation_type", ["life_plan", "daily_update"])
        .order("created_at", desc=True)
        .limit(3)
    )
    past_gens = fetch_list(gens_res)
    
    # 10. Financial context (if available)
    fin_context = _get_financial_context(uid)
    
    # 11. System rules (profession-specific variation)
    rules = {
        "min_goals": 3, 
        "max_goals": 5,
        "min_tasks": 5,
        "max_tasks": 10,
        "min_habits": 3,
        "max_habits": 6,
        "min_routine": 4,
        "max_routine": 8,
        "vary_by_profession": True,
        "adapt_energy": energy_pattern,
        "recent_energy_avg": round(energy_avg, 1),
        "streak_days": streak,
        "avoid_repetition": [g.get("generation_type") for g in past_gens],
        "profession_examples": profession_guidance,  # NEW v2.0: Uses universal guidance
        "restrictions": restrictions,
    }
    
    # Remove old PROFESSION_EXAMPLES constant (no longer needed)
    # It's now replaced by dynamic _get_profession_guidance()
    
    context = {
        "user_id": uid,
        "name": base_user.get("name") or profile.get("name") or "Usuário",
        "email": base_user.get("email", ""),
        "profession": profession,           # Normalized profession text
        "profession_raw": profession_raw,   # Raw input (preserved exactly)
        "profession_type": profession_type,
        # NEW v2.0: Universal profession attributes
        "profession_attributes": profession_attributes,
        "profession_guidance": profession_guidance,
        "energy_pattern": energy_pattern,
        "streak_days": streak,
        "energy_avg": energy_avg,
        "system_rules": rules,
        "recent_answers": answers_summary,
        "active_goals": goals,
        "goals_titles": goals_titles,
        "current_habits": habits,
        "habit_names": habit_names,
        "recent_checkins": checkins,
        "recent_signals": recent_signals,
        "past_generations_types": [g.get("generation_type") for g in past_gens],
        "vision": vision,
        "restrictions": restrictions,
        "routine_type": routine_type,
        "financial_context": fin_context,
        "today": today(),
        "week_start": week_start(),
    }
    
    log.info("[CONTEXT] Built for uid=%s (prof=%s, attrs=%s, streak=%d, energy=%.1f)", 
             uid, profession_type, bool(profession_attributes), streak, energy_avg)
    
    return context


def _get_restrictions(uid: str) -> list:
    """Extract restrictions from onboarding answers."""
    rows = fetch_list(query(
        get_db().table("onboarding_answers")
                .select("question_id, raw_answer, parsed_data")
                .eq("user_id", uid)
                .in_("question_id", ["q_challenges", "q_restrictions"])
    ))
    restrictions = []
    for r in rows:
        answer = r.get("parsed_data", {}).get("parsed_value") or r.get("raw_answer", "")
        if answer:
            # Split by comma or newlines
            parts = [p.strip() for p in answer.replace("\n", ",").split(",") if p.strip()]
            restrictions.extend(parts[:3])  # Limit to 3
    return restrictions[:5]  # Max 5 restrictions


def _get_routine_type(uid: str) -> str:
    """Get routine type from onboarding answer."""
    row = fetch_one(query(
        get_db().table("onboarding_answers")
                .select("raw_answer")
                .eq("user_id", uid)
                .eq("question_id", "q_routine")
                .limit(1)
    ))
    return row.get("raw_answer", "ok") if row else "ok"


def _get_financial_context(uid: str) -> Dict:
    """Get financial context if available."""
    try:
        month = today()[:8] + "01"  # YYYY-MM-01, coluna date
        res = query(
            get_db().table("finance_entries")
                    .select("category_name, budget, spent")
                    .eq("user_id", uid)
                    .eq("reference_month", month)
        )
        entries = fetch_list(res)
        if entries:
            total_budget = sum(e.get("budget", 0) for e in entries)
            total_spent = sum(e.get("spent", 0) for e in entries)
            return {
                "has_financial_data": True,
                "total_budget": total_budget,
                "total_spent": total_spent,
                "pct_used": round((total_spent / max(total_budget, 1)) * 100, 1),
            }
    except Exception as e:
        log.debug("[CONTEXT] Financial data not available: %s", e)
    return {"has_financial_data": False}