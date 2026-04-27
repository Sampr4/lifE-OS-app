"""
services/ai.py
AI integration using Groq API.
Three isolated clients for rate-limit isolation per pipeline stage.
All AI calls return parsed Python dicts — never raw text inserted to DB.
"""

import os
import json
import re
import logging
from typing import Dict, List, Optional
from groq import Groq
from utils.database import get_db, query
from services.context import build_context

log = logging.getLogger("lifeos.services.ai")

# ── Groq clients (one per pipeline stage for rate-limit isolation) ──
def _make_client(key_env: str) -> Groq:
    key = os.environ.get(key_env) or os.environ.get("GROQ_API_KEY", "")
    return Groq(api_key=key)

_client_onboarding = _make_client("AI_ONBOARDING_KEY")
_client_planning   = _make_client("AI_PLANNING_KEY")
_client_daily      = _make_client("AI_DAILY_KEY")

MODEL_FULL = "llama-3.3-70b-versatile"
MODEL_FAST = "llama-3.1-8b-instant"


# ── Profession-specific detailed guidance for AI prompts ───────────────────
def _get_profession_guidance(profession_type: str, profession: str = "") -> str:
    """
    Returns VERY specific guidance for each profession type.
    This ensures the AI generates content truly specific to the user's profession.
    """
    prof_lower = (profession or "").lower()
    
    guidance = {
        "tech": """
📱 PROFISSÃO: DESENVOLVEDOR/TECH
Rotina típica (use estes horários como base):
- 08:00 Revisão de código/pull requests do dia anterior
- 09:00 Desenvolvimento principal (bloco de 2-3h deep work)
- 11:30 Reunião de standup daily
- 13:00 Code review / pairing session
- 14:30 Estudo de novas tecnologias ou documentação
- 16:00 Deploy, testes ou ajustes finais
- 17:30 Planejamento do próximo dia

Tarefas típicas (gere tarefas específicas):
- Implementar feature X do sistema Y
- Corrigir bug no módulo Z
- Escrever testes unitários
- Revisar PR do colega
- Estudar documentação de API

Hábitos típicos (specific to tech):
- Técnica Pomodoro para código (4 blocos de 25min)
- Commit diário no Git
- Revisão de logs de erro
- Atualização de dependências do projeto
- Leitura de tech blogs/artigos
        """,
        
        "edu": """
🏫 PROFISSÃO: EDUCAÇÃO (Professor, Pesquisador, Estudante)
Rotina típica (use estes horários como base):
- 07:00 Preparação de aula/material didático
- 08:00 Aula ou estudo focado
- 10:00 Atendimento a alunos/estudantes
- 11:30 Correção de provas/trabalhos
- 13:00 Almoço e pausa
- 14:00 Pesquisa ou projeto acadêmico
- 16:00 Reunião pedagógica ou admin
- 17:30 Planejamento das próximas aulas

Tarefas típicas (gere tarefas específicas):
- Preparar slide/aula para amanhã
- Corrigir provas da turma X
- Revisar trabalho de conclusão
- Atualizar plano de ensino
- Publicar artigo ou pesquisa
- Preparar exercício de fixação

Hábitos típicos (specific to education):
- Revisão de conteúdo todo dia
- Feedback personalizado para alunos
- Organização de materiais didáticos
- Leitura de artigos acadêmicos
- Backup de arquivos importantes
        """,
        
        "health": """
🏥 PROFISSÃO: SAÚDE (Médico, Enfermeiro, Nutricionista, etc)
Rotina típica (use estes horários como base):
- 07:00 Revisão de pacientes/agenda do dia
- 08:00 Consultas ou procedimentos
- 10:30 Pausa para coffee break
- 11:00 Mais consultas ou visita hospitalar
- 12:30 Almoço
- 13:30 Retorno de pacientes ou exames
- 15:00 Atualização de prontuários
- 17:00 Planejamento do próximo dia

Tarefas típicas (gere tarefas específicas):
- Atender consulta do paciente X
- Emitir receita/orientação nutricional
- Revisar resultados de exames
- Atualizar prontuário médico
- Ligar para paciente fazer seguimiento
- Preparar para procedimento

Hábitos típicos (specific to health):
- Revisão matinal de agenda
- Checklist de equipamentos
- Atualização de conhecimentos médicos
- Registro de casos interessantes
- Autocuidado para evitar burn-out
        """,
        
        "business": """
💼 PROFISSÃO: NEGÓCIOS (Empresário, Gestor, Vendas)
Rotina típica (use estes horários como base):
- 07:30 Revisão de métricas e indicadores
- 08:30 Reunião de alinhamento com equipe
- 10:00 Prospecção de clientes/ligações
- 11:30 Reunião com clientes ou parceiros
- 13:00 Almoço de negócios
- 14:30 Análise financeira ou relatórios
- 16:00 Follow-up com clientes
- 17:30 Planejamento do próximo dia

Tarefas típicas (gere tarefas específicas):
- Elaborar proposta comercial
- Negociar contrato com cliente
- Revisar fluxo de caixa
- Agendar reuniões importantes
- Analisar métricas de vendas
- Treinar equipe de vendas

Hábitos típicos (specific to business):
- Daily standup com equipe
- Revisão de pipeline de vendas
- Análise de concorrentes
- Networking e prospecção
- Atualização de CRM
        """,
        
        "creative": """
🎨 PROFISSÃO: CRIAÇÃO (Designer, Artista, Escritor, Música)
Rotina típica (use estes horários como base):
- 08:00 Brainstorming/ideação criativa
- 09:00 Trabalho criativo principal (deep work)
- 11:00 Pausa criativa (inspiração)
- 11:30 Produção de conteúdo
- 13:00 Almoço
- 14:00 Edição e refinamento
- 16:00 Postagem em redes sociais
- 17:30 Estudo de referências/tendências

Tarefas típicas (gere tarefas específicas):
- Criar design para cliente X
- Escrever capítulo do livro/artigo
- Produzir peça musical
- Editar vídeo/foto
- Preparar portfólio
- Responder的客户/followers

Hábitos típicos (specific to creative):
- Coleta de referências visuais
- Prática diária de criação
- Backup de projetos
- Postagem em redes
- Estudos de mercado/tendências
- Cronograma de entregas
        """,
        

        "science": """
🔬 PROFISSÃO: CIÊNCIAS DA VIDA / CAMPO (Biólogo, Zoólogo, Veterinária, Zootecnia)
Rotina típica:
- 07:00 Revisão da agenda de campo/laboratório
- 08:00 Preparação de materiais, equipamentos ou registros
- 09:00 Observação, coleta, estudo ou atendimento técnico
- 12:00 Pausa e organização das anotações
- 14:00 Análise de dados, relatórios ou acompanhamento de animais
- 16:00 Atualização de fichas, estudos e planejamento do próximo dia

Tarefas típicas:
- Organizar registros de observação
- Revisar literatura científica da área
- Planejar atividade de campo/laboratório
- Registrar evolução ou comportamento de animais
- Atualizar relatório técnico

Hábitos típicos:
- Registro diário de observações
- Checklist de equipamentos
- Leitura científica curta
- Organização de dados e fotos
""",

        "gen": """
👤 PROFISSÃO: GERAL/OUTROS
Rotina típica (adapte conforme rotina_type):
- 07:00 Rotina matinal
- 12:00 Almoço
- 13:00 Trabalho principal
- 18:00 Check-in e planejamento
- 20:00 Atividades pessoais

Tarefas típicas (gere tarefas relevantes para os objetivos do usuário):
- Tarefas pessoais e profissionais
- Ações relacionadas aos objetivos declarados

Hábitos típicos (adapt to user's goals and routine_type):
- Hábitos que ajudem a atingir objetivos
- Rotina equilibrada entre trabalho e vida pessoal
        """
    }
    
    return guidance.get(profession_type, _generate_generic_guidance(profession))


# ── Dynamic generic guidance for any profession ─────────────────────────────────
def _extract_main_profession(prof_text: str) -> str:
    """Extract main profession from text: 'professor de matemática' → 'professor'"""
    prefixes = [
        "professor", "professora", "médico", "médica", "advogado", "advogada",
        "engenheiro", "engenheira", "desenvolvedor", "desenvolvedora",
        "programador", "programadora", "designer", "arquiteto", "arquiteta",
        "cozinheiro", "cozinheira", "chef", "motorista", "vendedor", "vendedora",
        "gerente", "gestor", "gestora", "empresário", "empresária",
        "estudante", "aluno", "aluna", "pesquisador", "pesquisadora",
        "artista", "músico", "música", "escritor", "escritora", "jornalista",
        "enfermeiro", "enfermeira", "nutricionista", "psicólogo", "psicóloga",
        "fisioterapeuta", "dentista", "farmacêutico", "farmacêutica",
        "ator", "atriz", "fotógrafo", "fotógrafa", "cineasta", "diretor", "diretora",
        "consultor", "consultora", "analista", "técnico", "técnica",
        "mecânico", "mecânica", "eletricista", "carpinteiro", "pedreiro",
        "agricultor", "zoólogo", "veterinário", "piloto", "atleta", "coach", "personal",
    ]
    for prefix in prefixes:
        if prefix in prof_text:
            return prefix
    return prof_text.split()[0] if prof_text.split() else "profissional"


def _generate_generic_guidance(profession: str) -> str:
    """Generates dynamic guidance for ANY profession not in predefined categories."""
    main_prof = _extract_main_profession((profession or "").lower())
    prof_name = profession.upper() if profession else "PROFISSIONAL"
    
    return f"""
👤 PROFISSÃO: {prof_name}
Rotina adaptada para {main_prof}:
- 07:00 Rotina matinal específica para {main_prof}
- 08:00 Atividade principal da manhã (trabalho/core)
- 10:00 Pausa e planejamento
- 12:00 Almoço
- 13:00 Atividade principal da tarde
- 15:00 Revisões, ajustes e follow-up
- 17:00 Planejamento do próximo dia
- 18:00 Check-in de progresso

Tarefas específicas para {main_prof}:
- Ações diretamente relacionadas à atividade de {main_prof}
- Tarefas que impulsionem objetivos como {main_prof}
- Prioridades do trabalho/serviço de {main_prof}

Hábitos específicos para {main_prof}:
- Hábitos que apoiem a rotina de {main_prof}
- Práticas que melhorem a performance como {main_prof}
- Rotinas que equilibrem trabalho e vida pessoal de {main_prof}

IMPORTANTE: Gere tarefas, hábitos e rotina específicos para {main_prof}, não genéricos!
    """


def _call(client: Groq, system: str, user: str,
          max_tokens: int = 1200, fast: bool = False, json_mode: bool = False) -> str:
    """Makes a Groq API call. Returns the response text.

    json_mode=True asks the OpenAI-compatible API for a JSON object.
    If a selected model/account rejects response_format, it falls back automatically.
    """
    model = MODEL_FAST if fast else MODEL_FULL
    kwargs = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": 0.25 if json_mode else 0.7,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    try:
        r = client.chat.completions.create(**kwargs)
    except TypeError:
        kwargs.pop("response_format", None)
        r = client.chat.completions.create(**kwargs)
    except Exception:
        if not json_mode:
            raise
        kwargs.pop("response_format", None)
        r = client.chat.completions.create(**kwargs)
    return r.choices[0].message.content


def _parse_json(raw: str) -> Dict:
    """Strips markdown fences and parses JSON safely.

    Groq models sometimes return a valid JSON object wrapped in a sentence or markdown.
    This extractor first tries the clean text and then the first JSON object found.
    """
    text = str(raw or "").strip()
    candidates = [
        text.removeprefix("```json").removeprefix("```").removesuffix("```").strip(),
    ]
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        candidates.append(match.group(0).strip())

    for cleaned in candidates:
        repaired = cleaned
        # Common LLM JSON mistakes: trailing commas before ] or }
        repaired = re.sub(r",\s*([}\]])", r"\1", repaired)
        try:
            parsed = json.loads(repaired)
            return parsed if isinstance(parsed, dict) else {"raw": parsed, "parse_error": True}
        except Exception:
            pass
    return {"raw": raw, "parse_error": True}


def _log_generation(uid: str, gen_type: str, prompt: str, content, ti: int = 0, to: int = 0):
    """Enhanced logging using new database helpers."""
    success = not bool(content.get("parse_error", False)) if isinstance(content, dict) else True
    from utils.database import log_ai_call
    log_ai_call(uid, gen_type, success, ti, to)
    
    # Legacy ai_generations table (tolerate missing)
    try:
        payload = {
            "user_id": uid,
            "generation_type": gen_type,
            "content": content if isinstance(content, dict) else {"raw": str(content)},
        }
        query(get_db().table("ai_generations").insert(payload))
    except:
        pass


def parse_onboarding_answer(uid: str, question_id: str, answer: str) -> Dict:
    """
    Parses a free-text onboarding answer using AI.
    Returns structured data: parsed_value, tags, profession_type, confidence.
    """
    system = (
        "You are an onboarding data extraction assistant. "
        "Respond ONLY with valid JSON, no markdown, no extra text.\n"
        "Extract structured data from the user's answer."
    )
    user_prompt = (
        f"Question ID: {question_id}\n"
        f"User's answer: {answer}\n\n"
        "Return JSON with:\n"
        '{"parsed_value": "main extracted value", '
        '"tags": ["tag1","tag2"], '
        '"profession_type": "tech|edu|health|business|creative|gen", '
        '"confidence": 0.0-1.0}'
    )
    try:
        raw    = _call(_client_onboarding, system, user_prompt, max_tokens=400, fast=True)
        result = _parse_json(raw)
        return result
    except Exception as e:
        log.warning("[AI/PARSE] Failed for %s: %s", question_id, e)
        return {"parsed_value": answer, "parse_error": True}


def generate_life_plan(uid: str, context: Dict = None) -> Dict:
    """
    Generates a complete structured life plan using the planning AI client.
    Auto-builds full context if not provided.
    
    ANTI-REPETITION: Now includes:
    - past_generation_titles: avoid same goal/habit names
    - profession-specific constraints
    - restrictions from onboarding
    - routine type adaptation
    """
    if context is None:
        context = build_context(uid)
    
    rules = context.get("system_rules", {})
    past_types = context.get("past_generations_types", [])
    
    # Anti-repetition: gather titles to avoid
    goals_titles = context.get("goals_titles", [])
    habit_names = context.get("habit_names", [])
    
    # Build anti-rep strings
    anti_rep_types = f"EVITE: tipos recentes {past_types}" if past_types else ""
    anti_rep_goals = f"EVITE metas repetidas: {goals_titles[:3]}" if goals_titles else ""
    anti_rep_habits = f"EVITE hábitos repetidos: {habit_names[:3]}" if habit_names else ""
    
    # Get restrictions
    restrictions = context.get("restrictions", [])
    restrictions_str = f"RESTRIÇÕES do usuário: {restrictions}" if restrictions else ""
    
    # Get vision
    vision = context.get("vision", "")
    vision_str = f"VISÃO do usuário: {vision}" if vision else ""
    
    # Get routine type
    routine_type = context.get("routine_type", "ok")
    
    # Profession-specific constraints
    profession = context.get("profession", "")
    profession_type = context.get("profession_type", "gen")
    
    # Energy-aware suggestions
    energy_avg = context.get("energy_avg", 5)
    energy_hint = ""
    if energy_avg <= 3:
        energy_hint = "ENERGIA BAIXA: plano leve, pouco esforço, foco em bem-estar básico"
    elif energy_avg >= 8:
        energy_hint = "ENERGIA ALTA: plano ambicioso, desafios, múltiplas metas"
    else:
        energy_hint = "ENERGIA NORMAL: plano equilibrado, progressão gradual"
    
    # Profession-specific detailed examples (VERY specific for each profession)
    prof_l = (profession or "").lower()
    if any(k in prof_l for k in ["zoolog", "zoólog", "biólog", "biolog", "zootecn", "veterin"]):
        profession_specific_guidance = _get_profession_guidance("science", profession)
    else:
        profession_specific_guidance = _get_profession_guidance(profession_type, profession)
    
    system = (
        "You are a personal life coach and productivity expert. "
        "OBEDEÇA todas as regras abaixo:\n"
        f"1. {restrictions_str}\n"
        f"2. {vision_str}\n"
        f"3. {energy_hint}\n"
        f"4. ROTINA ATUAL: {routine_type} → adapte o plano a esse nível\n"
        f"5. {anti_rep_types}\n"
        f"6. {anti_rep_goals}\n"
        f"7. {anti_rep_habits}\n\n"
        "=== GUIA ESPECÍFICO POR PROFISSÃO ===\n"
        f"{profession_specific_guidance}\n"
        "=====================================\n\n"
        "REGRAS OBRIGATÓRIAS:\n"
        "• Use SOMENTE atividades deste guia para a profissão específica\n"
        "• NÃO use atividades genéricas (como 'beber água', 'exercício', 'meditar') a menos que seja relevante para a profissão\n"
        "• A rotina deve ter no mínimo 4 horários específicos relacionados à PROFISSÃO DO USUÁRIO\n"
        "• As tarefas devem ser ações específicas que alguém com essa profissão faria\n"
        "• NÚMEROS: min_goals=3 max=5, min_tasks=5 max=10, min_habits=3 max=6, min_routine=4 max=8\n"
        "• Textos em Português Brasileiro, personalizados, únicos\n\n"
        "Responda SOMENTE com JSON válido. Não use markdown. Não escreva explicações.\n\nSchema JSON obrigatório:\n"
        '{"goals": [{"title":"...","category":"saude|carreira|financas|educacao|geral","total_value":100,"unit":"%","deadline_days":90}],'
        '"tasks": [{"title":"...","category":"pessoal|trabalho|saude","priority":"high|medium|low","due_days":7}],'
        '"habits": [{"name":"...","icon":"emoji","goal_value":1,"goal_unit":"vez","frequency_days":"all|weekdays"}],'
        '"routine": [{"time":"HH:MM","activity":"...","category":"pessoal|trabalho|saude"}],'
        '"week_status":"One motivational sentence about this week",'
        '"summary":"2-3 sentence summary of the plan",'
        '"motivational_message":"Personal message to the user"}'
    )
    user_prompt = (
        f"CONTEXTO COMPLETO DO USUÁRIO:\n"
        f"{json.dumps(context, ensure_ascii=False, indent=2)}\n\n"
        "GERE um plano 100% ÚNICO e REALISTA para este usuário.\n"
        "O plano deve refletir a profissão, objetivos específicos, restrições e momento atual.\n"
        "Não gere conteúdo genérico ou repetido."
    )
    try:
        raw    = _call(_client_planning, system, user_prompt, max_tokens=2000, json_mode=True)
        result = _parse_json(raw)
        _log_generation(uid, "life_plan", user_prompt, result, 0, 0)
        return result
    except Exception as e:
        log.error("[AI/PLAN] Failed for uid=%s: %s", uid, e)
        return {"parse_error": True}


def get_motivational_message(uid: str, context: Dict) -> str:
    """Generates a short motivational message for the user."""
    system = (
        "You are a motivational life coach. "
        "Generate a short (2-3 sentences), personal, energetic message in Brazilian Portuguese. "
        "Respond with ONLY the message text, no quotes, no labels."
    )
    user_prompt = (
        f"User: {context.get('name', 'friend')}, "
        f"profession: {context.get('profession', '')}, "
        f"streak: {context.get('streak', 0)} days."
    )
    try:
        return _call(_client_daily, system, user_prompt, max_tokens=200, fast=True)
    except Exception as e:
        log.warning("[AI/MOTIVATIONAL] Failed: %s", e)
        return "Continue firme! Cada dia é uma nova oportunidade. 💪"


def analyze_goals(uid: str, goals: List[Dict], checkin: Dict) -> Dict:
    """Analyzes the user's current goals and check-in data."""
    system = (
        "You are a goal analysis assistant. "
        "Analyze the user's goals and check-in and return a JSON object with: "
        '{"insights": ["insight1", "insight2"], '
        '"next_actions": ["action1", "action2"], '
        '"overall_score": 0-100, '
        '"message": "brief motivational summary"}. '
        "All text in Brazilian Portuguese. Respond ONLY with JSON."
    )
    user_prompt = (
        f"Goals: {json.dumps(goals[:5], ensure_ascii=False)}\n"
        f"Today's check-in done: {checkin.get('done', False)}"
    )
    try:
        raw = _call(_client_daily, system, user_prompt, max_tokens=600, fast=True)
        return _parse_json(raw)
    except Exception as e:
        log.warning("[AI/GOALS] Failed: %s", e)
        return {"insights": [], "next_actions": [], "overall_score": 0, "message": ""}


def generate_daily_update(uid: str, context: Dict = None) -> Dict:
    """
    Generates a daily update: new tasks, motivational message, week status.
    Auto-builds full context if not provided.
    
    ANTI-REPETITION: Uses full context including goals_titles, habit_names, restrictions.
    """
    if context is None:
        context = build_context(uid)
    
    rules = context.get("system_rules", {})
    past_types = context.get("past_generations_types", [])
    
    # Anti-repetition improvements
    goals_titles = context.get("goals_titles", [])
    habit_names = context.get("habit_names", [])
    restrictions = context.get("restrictions", [])
    
    # Build anti-rep constraints
    anti_rep = f"EVITE: tipos recentes {past_types}" if past_types else ""
    anti_goals = f"EVITE: metas já existentes {goals_titles[:3]}" if goals_titles else ""
    anti_habits = f"EVITE: hábitos atuais {habit_names[:3]}" if habit_names else ""
    restr_str = f"RESTRIÇÕES: {restrictions}" if restrictions else ""
    
    # Energy awareness
    energy_avg = context.get("energy_avg", 5)
    if energy_avg <= 3:
        energy_hint = "ENERGIA BAIXA: tarefa leve, simples, pouco esforço"
    elif energy_avg >= 8:
        energy_hint = "ENERGIA ALTA: tarefa desafiadora, múltiplas metas possíveis"
    else:
        energy_hint = "ENERGIA NORMAL: tarefa equilibrada"
    
    system = (
        "You are a daily planner for LifeOS.\n"
        f"REGRAS: {restr_str}\n"
        f"{energy_hint}\n"
        f"{anti_rep}\n"
        f"{anti_goals}\n"
        f"{anti_habits}\n\n"
        "GERE APENAS 1-2 tarefas ÚNICAS e específicas para hoje.\n"
        "Adapte a profession_type e recent_energy_avg.\n"
        "Textos em Português Brasileiro.\n\n"
        "Responda SOMENTE com JSON válido. Não use markdown. Não escreva explicações.\n\nSchema JSON obrigatório:\n"
        '{"tasks": [{"title":"...","category":"pessoal|trabalho|saude","priority":"high|medium|low","due_days":1}], '
        '"week_status": "Uma frase sobre esta semana", '
        '"motivational_message": "Mensagem personalizada"}'
    )
    user_prompt = (
        f"CONTEXTO DIÁRIO:\n"
        f"{json.dumps(context, ensure_ascii=False, indent=2)}\n\n"
        "GERE atualização diária única e personalizada."
    )
    try:
        raw = _call(_client_daily, system, user_prompt, max_tokens=500, fast=True)
        return _parse_json(raw)
    except Exception as e:
        log.warning("[AI/DAILY] Failed for uid=%s: %s", uid, e)
        return {"parse_error": True}


def generate_adaptive_question(uid: str, profession_type: str,
                                previous_answers: Dict, question_index: int) -> Optional[Dict]:
    """
    Uses AI to generate the next onboarding question adapted to the user's
    profession and previous answers. Returns a question dict or None if done.

    The question dict matches the frontend schema:
    { id, type, title, hint, placeholder?, options?, block, blockName, blockIcon, required, index }
    """
    answered_ids = list(previous_answers.keys())
    answers_summary = "\n".join(
        f"- {qid}: {str(ans)[:120]}" for qid, ans in previous_answers.items()
    )

    system = (
        "You are an onboarding assistant for LifeOS, a personal productivity app. "
        "Generate the NEXT adaptive onboarding question for a new user "
        "based on their profession and what they have already answered.\n\n"
        "Return ONLY a JSON object with this exact schema (no markdown, no extra text):\n"
        '{"id":"q_unique_snake_case_id","type":"text|textarea|choice",'
        '"title":"Question text in Brazilian Portuguese",'
        '"hint":"Short helper text in pt-BR",'
        '"placeholder":"Example answer in pt-BR",'
        '"options":[{"value":"val","label":"emoji Label","desc":"short description"}],'
        '"block":"Block name","blockName":"Block name","blockIcon":"single emoji",'
        '"required":true}\n\n'
        "Rules:\n"
        "- type 'choice' MUST include 'options' with 3-4 items, no 'placeholder'\n"
        "- type 'text'/'textarea' MUST include 'placeholder', no 'options'\n"
        "- 'id' must be unique and NOT in the already_answered list\n"
        "- All user-visible text must be in Brazilian Portuguese\n"
        "- If 8+ questions have already been answered, return exactly: {\"done\": true}"
    )

    user_prompt = (
        f"Profession type detected: {profession_type}\n"
        f"Already answered ({len(answered_ids)} questions): {', '.join(answered_ids)}\n"
        f"Answers so far:\n{answers_summary}\n\n"
        f"Question index needed: {question_index}\n\n"
        "Generate the single most useful next question to understand this user's "
        "life, goals, habits, and challenges — tailored to their profession. "
        "Avoid repeating topics already covered."
    )

    try:
        raw    = _call(_client_onboarding, system, user_prompt, max_tokens=600, fast=False)
        result = _parse_json(raw)
        if result.get("parse_error"):
            log.warning("[AI/ONBOARDING] Bad JSON for uid=%s index=%d", uid, question_index)
            return None
        if result.get("done"):
            log.info("[AI/ONBOARDING] Flow complete at index=%d for uid=%s", question_index, uid)
            return None
        # Validate required fields
        if not result.get("id") or not result.get("title") or not result.get("type"):
            log.warning("[AI/ONBOARDING] Incomplete question returned for uid=%s: %s", uid, result)
            return None
        result["index"] = question_index
        return result
    except Exception as e:
        log.warning("[AI/ONBOARDING] generate_adaptive_question failed for uid=%s: %s", uid, e)
        return None