from __future__ import annotations

import os
import sys
from datetime import date

from dotenv import load_dotenv
from supabase import create_client


REQUIRED_TABLES = {
    "users": ["id", "firebase_uid", "onboarding_done"],
    "user_profiles": ["user_id", "profession_type", "profession_attributes"],
    "user_settings": ["user_id"],
    "onboarding_progress": ["user_id", "current_index"],
    "onboarding_answers": ["user_id", "question_id", "raw_answer"],
    "plans": ["id", "user_id"],
    "goals": ["id", "user_id"],
    "habits": ["id", "user_id"],
    "routine_templates": ["id", "user_id"],
    "ai_generations": ["id", "user_id", "generation_type"],
    "finance_entries": ["user_id", "reference_month"],
    "checkin_sessions": ["user_id"],
}

FORBIDDEN_OLD_TABLES = ["checkins"]


def fail(msg: str) -> None:
    print(f"[FAIL] {msg}")


def ok(msg: str) -> None:
    print(f"[ OK ] {msg}")


def warn(msg: str) -> None:
    print(f"[WARN] {msg}")


def get_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Variável de ambiente ausente: {name}")
    return value


def get_client():
    load_dotenv()
    url = get_env("SUPABASE_URL")
    key = get_env("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)


def try_select_one(sb, table: str, columns: list[str]) -> tuple[bool, str]:
    try:
        sb.table(table).select(",".join(columns)).limit(1).execute()
        return True, ""
    except Exception as exc:
        return False, str(exc)


def verify_tables_and_columns(sb) -> bool:
    print("\n=== Verificando tabelas e colunas ===")
    all_good = True

    for table, columns in REQUIRED_TABLES.items():
        success, err = try_select_one(sb, table, columns)
        if success:
            ok(f"{table}: colunas essenciais encontradas -> {columns}")
        else:
            fail(f"{table}: problema ao acessar colunas {columns}")
            print(f"       detalhe: {err}")
            all_good = False

    for old_table in FORBIDDEN_OLD_TABLES:
        success, _ = try_select_one(sb, old_table, ["id"])
        if success:
            warn(f"Tabela legada encontrada: {old_table} (confirme se não está sendo usada por engano)")
        else:
            ok(f"Tabela legada não utilizada: {old_table}")

    return all_good


def verify_reference_month(sb) -> bool:
    print("\n=== Verificando finance_entries.reference_month ===")
    all_good = True

    try:
        month_start = date.today().replace(day=1).isoformat()
        sb.table("finance_entries").select("user_id,reference_month").eq("reference_month", month_start).limit(1).execute()
        ok(f"Consulta por reference_month com data completa funcionando ({month_start})")
    except Exception as exc:
        fail("Consulta por reference_month com data completa falhou")
        print(f"       detalhe: {exc}")
        all_good = False

    try:
        broken_value = date.today().strftime("%Y-%m")
        sb.table("finance_entries").select("user_id,reference_month").eq("reference_month", broken_value).limit(1).execute()
        warn(f'Consulta com formato antigo "{broken_value}" não falhou. Revise se a coluna é realmente DATE.')
    except Exception:
        ok("Formato antigo YYYY-MM rejeitado, como esperado")

    return all_good


def verify_profession_attributes_write(sb) -> bool:
    print("\n=== Verificando escrita em profession_attributes ===")
    all_good = True

    try:
        rows = sb.table("user_profiles").select("user_id").limit(1).execute().data
        if not rows:
            warn("Nenhum registro em user_profiles para validar update real")
            return all_good

        user_id = rows[0]["user_id"]
        payload = {
            "profession_type": "test",
            "profession_attributes": {
                "profession_type": "test",
                "work_nature": "mental",
                "mental_load": "medium",
            },
        }

        sb.table("user_profiles").update(payload).eq("user_id", user_id).execute()
        ok("Update em profession_attributes funcionando")
    except Exception as exc:
        fail("Update em profession_attributes falhou")
        print(f"       detalhe: {exc}")
        all_good = False

    return all_good


def verify_ai_generations_columns(sb) -> bool:
    print("\n=== Verificando colunas de ai_generations ===")
    success, err = try_select_one(
        sb,
        "ai_generations",
        ["id", "user_id", "generation_type", "status", "raw_output", "error_message", "input_context"],
    )
    if success:
        ok("ai_generations possui colunas de rastreio da IA")
        return True

    fail("ai_generations não possui todas as colunas esperadas")
    print(f"       detalhe: {err}")
    return False


def main() -> int:
    print("LifeOS Integrity Check\n")

    try:
        sb = get_client()
    except Exception as exc:
        fail(str(exc))
        return 1

    checks = [
        verify_tables_and_columns(sb),
        verify_reference_month(sb),
        verify_profession_attributes_write(sb),
        verify_ai_generations_columns(sb),
    ]

    if all(checks):
        print("\nRESULTADO FINAL: SISTEMA ALINHADO")
        return 0

    print("\nRESULTADO FINAL: SISTEMA COM INCONSISTÊNCIAS")
    return 2


if __name__ == "__main__":
    sys.exit(main())
