#!/usr/bin/env python3
"""Menu tests use a stub tool; never Docker, .env or a real database."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

MENU = Path(sys.argv.pop(1)) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'admin-menu.sh'
SOURCE = MENU.read_text(encoding='utf-8').replace('\r\n', '\n')


class ContractTests(unittest.TestCase):
    def test_option_eight_is_unique(self):
        self.assertEqual(SOURCE.count("printf '[8] Cambiar contraseña de PostgreSQL\\n'"), 1)
        self.assertEqual(SOURCE.count('8) database_password_menu_action ;;'), 1)

    def test_tool_receives_repository_not_password(self):
        self.assertIn('if bash "$ROOT/scripts/change-database-password.sh" --repo "$ROOT"; then', SOURCE)
        self.assertNotIn('POSTGRES_PASSWORD=', SOURCE)
        self.assertNotIn('DATABASE_URL=', SOURCE)

    def test_failures_are_handled_without_exiting_menu(self):
        function = SOURCE.split('database_password_menu_action() {', 1)[1].split('operations_menu() {', 1)[0]
        self.assertIn('result=$?', function)
        self.assertIn('pause_menu', function)
        self.assertIn('change-database-password.py', function)
        self.assertNotIn('exit ', function)

    def test_main_menu_and_database_action_remain_wired(self):
        self.assertIn('database_password_menu_action() {', SOURCE)
        self.assertIn('operations_menu() {', SOURCE)
        self.assertIn("printf 'BLOODKEEPER — PANEL GENERAL DE ADMINISTRACIÓN\\n'", SOURCE)
        self.assertIn("printf '[8] Cambiar contraseña de PostgreSQL\\n'", SOURCE)
        self.assertIn('8) database_password_menu_action ;;', SOURCE)


@unittest.skipIf(os.name == 'nt' or shutil.which('bash') is None, 'Las pruebas de ejecución requieren Bash en Linux')
class RuntimeTests(unittest.TestCase):
    def exercise(self, exit_code=0, missing=False, choice='8'):
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            scripts = repo / 'scripts'
            scripts.mkdir()
            # The real menu still enforces sudo. Only this isolated test bypasses it.
            source = SOURCE.replace('if [ "${EUID:-$(id -u)}" -ne 0 ]; then', 'if false; then', 1)
            (scripts / 'admin-menu.sh').write_text(source, encoding='utf-8')
            argsfile = repo / 'args.txt'
            if not missing:
                (scripts / 'change-database-password.sh').write_text(
                    '#!/bin/bash\nprintf "%s\\n" "$@" > "$BK_TEST_ARGS_FILE"\nexit "$BK_TEST_EXIT"\n', encoding='utf-8')
                (scripts / 'change-database-password.py').write_text('# test stub\n', encoding='utf-8')
            env = dict(os.environ, BK_TEST_ARGS_FILE=str(argsfile), BK_TEST_EXIT=str(exit_code))
            response = subprocess.run(['bash', str(scripts / 'admin-menu.sh')],
                                      input=f'{choice}\n\nq\n', capture_output=True,
                                      text=True, env=env, timeout=10)
            recorded = argsfile.read_text().splitlines() if argsfile.exists() else None
            return response, recorded, str(repo)

    def test_success_returns_to_main_menu(self):
        response, recorded, repo = self.exercise()
        self.assertEqual(response.returncode, 0)
        self.assertEqual(recorded, ['--repo', repo])
        self.assertIn('Panel cerrado.', response.stdout)

    def test_tool_failure_does_not_close_panel(self):
        response, _, _ = self.exercise(exit_code=1)
        self.assertEqual(response.returncode, 0)
        self.assertIn('código 1', response.stderr)
        self.assertIn('Panel cerrado.', response.stdout)

    def test_missing_tool_is_safe(self):
        response, recorded, _ = self.exercise(missing=True)
        self.assertEqual(response.returncode, 0)
        self.assertIsNone(recorded)
        self.assertIn('falta la herramienta', response.stderr)

    def test_unknown_option_never_launches_tool(self):
        response, recorded, _ = self.exercise(choice='invalid')
        self.assertEqual(response.returncode, 0)
        self.assertIsNone(recorded)


if __name__ == '__main__':
    unittest.main()
