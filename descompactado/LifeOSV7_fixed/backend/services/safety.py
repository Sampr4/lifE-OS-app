"""
services/safety.py — LifeOS V8
Input sanitization, profession normalization, and content policy enforcement.
This layer MUST run before any AI generation call.

Three categories:
  A. Normal professions → pass through
  B. Adult/sensitive professions → neutralize to safe label
  C. Illegal/harmful content → block entirely
"""

import re
import logging
from typing import Dict, Tuple

log = logging.getLogger("lifeos.services.safety")

# ── Patterns that BLOCK generation entirely (illegal/violent) ────────────────
_BLOCK_RE = re.compile(
    r"""
    \b(
        assassin[ao]?  | homicid   | serial[\s_-]?kill  |
        matar\s+algu   | mat[ao]\s+|
        roubar         | roubo     | furtar    | furto     |
        assalt[ao]?    | armar\s+  |
        fraude[s]?     | golpista  | estelion  | extors[aã]o |
        tráfico        | trafico\s+de        |
        terroris       | ataque\s+bomb       |
        fabricar\s+(bomb|explos)   | explosiv  |
        pedofil        | abuso\s+(infantil|de\s+menor) |
        snuff          | tortura\s+(algu|de\s+)
    )\b
    """,
    re.IGNORECASE | re.VERBOSE,
)

# ── Patterns that NEUTRALIZE (adult but not explicitly illegal) ───────────────
_NEUTRALIZE: list[tuple[re.Pattern, str]] = [
    (re.compile(r'\b(porn[oô]grafia?|pornô?|adult.content)\b', re.I),
     "criador(a) de conteúdo digital"),
    (re.compile(r'\b(strip(per)?|danç[ao]\.?erótic[ao]?)\b', re.I),
     "artista de entretenimento adulto"),
    (re.compile(r'\b(escort|acompanhante\s+sexual)\b', re.I),
     "prestador(a) de serviços pessoais"),
    (re.compile(r'\b(prostitui[çc][aã]o|prostitut[ao]|garota\s+de\s+programa)\b', re.I),
     "profissional autônomo(a)"),
    (re.compile(r'\bweb\s*cam\s*(sex|adult|erotic)\b', re.I),
     "criador(a) de conteúdo digital"),
    (re.compile(r'\bsex\s+worker\b', re.I),
     "profissional autônomo(a)"),
    (re.compile(r'\b(ator|atriz)\s+(porn[oô]|xxx)\b', re.I),
     "criador(a) de conteúdo digital"),
]

# ── Words to strip from narrative fields before sending to AI ────────────────
_STRIP_RE = re.compile(
    r'\b(kill|matar|roubar|furtar|fraude|golpe|tráfico|bomba|terroris|assassin)\b',
    re.IGNORECASE,
)


def sanitize_string(text: str, max_len: int = 2000) -> str:
    """Remove control characters, trim whitespace, enforce max length."""
    if not isinstance(text, str):
        return ""
    text = text.strip()
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    return text[:max_len]


def _is_blocked(text: str) -> bool:
    """Returns True if text contains blocked illegal/violent patterns."""
    if not text:
        return False
    return bool(_BLOCK_RE.search(text))


def normalize_profession(raw: str) -> Tuple[str, bool]:
    """
    Normalizes a profession string.
    Returns (normalized_profession, was_neutralized).
    - If the profession matches adult patterns, it is replaced with a safe label.
    - Otherwise the original is returned unchanged.
    """
    if not raw:
        return "profissional", False

    for pattern, replacement in _NEUTRALIZE:
        if pattern.search(raw):
            log.info("[SAFETY] Profession neutralized: '%s' → '%s'", raw[:60], replacement)
            return replacement, True

    return raw, False


def sanitize_context_for_ai(context: Dict) -> Tuple[Dict, bool, str]:
    """
    Validates and sanitizes a generation context dict before sending to AI.

    Returns:
      (sanitized_context, is_safe, block_reason)

    - is_safe=False → generation must be blocked; block_reason is the reason.
    - is_safe=True  → proceed with the sanitized context.
    """
    # Build combined text for global check
    combined = " ".join(str(v) for v in context.values() if isinstance(v, str))

    # Hard block check
    if _is_blocked(combined):
        log.warning("[SAFETY] Generation blocked for context: %s…", combined[:120])
        return context, False, (
            "O LifeOS não gera planos para atividades ilegais ou que causem dano a terceiros."
        )

    # Build sanitized copy
    safe: Dict = {}
    for key, val in context.items():
        if isinstance(val, str):
            cleaned = sanitize_string(val)
            # Strip dangerous words from narrative fields
            if key in ("goals", "challenges", "vision", "profession"):
                cleaned = _STRIP_RE.sub("", cleaned).strip()
            safe[key] = cleaned
        else:
            safe[key] = val

    # Normalize profession specifically
    prof, changed = normalize_profession(safe.get("profession", ""))
    safe["profession"] = prof
    if changed:
        safe["_profession_neutralized"] = True

    return safe, True, ""
