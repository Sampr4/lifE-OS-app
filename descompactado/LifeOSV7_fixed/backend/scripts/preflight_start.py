from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv


def main() -> int:
    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env")

    verify_script = backend_dir / "scripts" / "verify_system_integrity.py"
    main_script = backend_dir / "main.py"

    result = subprocess.run(
        [sys.executable, str(verify_script)],
        cwd=str(backend_dir),
        check=False,
        env=os.environ.copy(),
    )

    if result.returncode != 0:
        print("\n[BLOCKED] O backend não vai iniciar porque o banco está desalinhado.")
        return result.returncode

    print("\n[START] Integridade validada. Iniciando backend...")
    return subprocess.call([sys.executable, str(main_script)], cwd=str(backend_dir), env=os.environ.copy())


if __name__ == "__main__":
    raise SystemExit(main())
