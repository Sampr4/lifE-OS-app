# LifeOS Stabilization TODO
Status: [IN PROGRESS] Phase 1 - Detailed Steps

## Phase 1: Core Generation Fixes (Priorities 1-5)

### 1. services/context.py (full context builder) [x]
   - [x] Read current content
   - [x] Implement: user profile + history + energy + rules → single context dict
   - [x] Export build_context(uid: str) → Dict

### 2. services/data_generation.py (validation + retry + smart fallback) [x]
   - [x] Add plan validation (required fields, unique per profession)
   - [x] Retry logic (3x) on parse_error
   - [x] Smart fallback: template + randomization

### 3. services/ai.py (prompts with full context + anti-rep) [x]
   - [x] Inject context into generate_life_plan/daily_update prompts (auto-build)
   - [x] Anti-repetition: past_generations_types in prompts
   - [x] Enhanced specificity (streak/energy/prof/recent_answers)

### 4. utils/database.py (event logging) [x]
   - [x] Add log_ai_call(uid, type, success, tokens)
   - [ ] Integrate into ai.py (next)

### 5. routes/onboarding.py (minor logs) [ ]
   - [ ] Log AI question gen + parse results

## Phase 2-4: Later

## Testing
- [ ] Backend run + /api/debug/db OK
- [ ] Onboarding → plan gen (no parse_error)
- [ ] Dashboard real data

Updated: $(date)
