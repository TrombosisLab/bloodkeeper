"""Unit and simulated transaction tests. These never contact a real database."""
import base64
import contextlib
import hashlib
import hmac
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import unquote, urlsplit

SCRIPT = Path(__file__).resolve().parents[1] / 'change-database-password.py'
spec = importlib.util.spec_from_file_location('rotation', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
OLD = 'previous_password_1234'
NEW = 'New$Password#2026&%/?=+'
URL = f'postgresql://v5r_app:{OLD}@postgres:5432/vampiro_v5?schema=public'


def configuration(password, url=None):
    return {'services': {
        'postgres': {'environment': {'POSTGRES_USER': 'v5r_app', 'POSTGRES_DB': 'vampiro_v5', 'POSTGRES_PASSWORD': password}},
        'api': {'environment': {'DATABASE_URL': url or module.updated_url(URL, password, 'v5r_app', 'vampiro_v5')}},
        'backup-worker': {'environment': {'PGPASSWORD': password, 'PGUSER': 'v5r_app', 'PGDATABASE': 'vampiro_v5', 'PGHOST': 'postgres'}},
        'backup-scheduler': {'environment': {'BACKUP_REQUEST_DIR': '/requests'}},
    }}


class Simulated(module.Rotation):
    def __init__(self, repo, failure=None):
        super().__init__(repo)
        self.user, self.database = 'v5r_app', 'vampiro_v5'
        self.original = f'OTHER=untouched\nPOSTGRES_PASSWORD={OLD}\nDATABASE_URL={URL}\n'.encode()
        self.envfile.write_bytes(self.original)
        self.owner = None
        self.url, self.old_password = URL, OLD
        self.old_verifier = module.scram_verifier(OLD)
        self.current_verifier = self.old_verifier
        self.events = []
        self.failure = failure
        self.failed = False

    def save_backup(self):
        self.backup = self.repo / 'protected-backup'
        self.backup.mkdir()
        (self.backup / 'environment.env').write_bytes(self.original)

    def config(self, envfile=None):
        text = Path(envfile or self.envfile).read_text()
        values = dict(line.split('=', 1) for line in text.splitlines())
        return configuration(values['POSTGRES_PASSWORD'].strip("'"), values['DATABASE_URL'].strip("'"))

    def compose(self, *args, **kwargs):
        self.events.append(args)
        return b''

    def run(self, *args, **kwargs):
        return b''

    def container(self, service):
        return service

    def local_sql(self, sql, output=None):
        self.events.append(('sql', sql))
        self.current_verifier = sql.split("PASSWORD '", 1)[1].split("';", 1)[0]
        return b''

    def tcp_check(self, container, password):
        self.events.append(('tcp', container))
        self.assert_authenticated(password)

    def assert_authenticated(self, password):
        salt = base64.b64decode(self.current_verifier.split(':', 1)[1].split('$')[0])
        if module.scram_verifier(password, salt) != self.current_verifier:
            raise module.SafeError('Invalid simulated authentication')

    def worker_check(self):
        self.events.append(('worker-auth',))
        self.assert_authenticated(self.config()['services']['backup-worker']['environment']['PGPASSWORD'])
        if self.failure == 'worker' and not self.failed:
            self.failed = True
            raise module.SafeError('Simulated worker failure')

    def deploy(self):
        self.events.append(('deploy',))
        if self.failure == 'deploy' and not self.failed:
            self.failed = True
            raise module.SafeError('Simulated deployment failure')


class PasswordTests(unittest.TestCase):
    def test_special_characters_are_percent_encoded_and_roundtrip(self):
        result = module.updated_url(URL, NEW, 'v5r_app', 'vampiro_v5')
        self.assertEqual(unquote(urlsplit(result).password), NEW)
        self.assertEqual(urlsplit(result).query, 'schema=public')
        self.assertNotIn(NEW, result)

    def test_external_database_is_rejected(self):
        with self.assertRaises(module.SafeError):
            module.updated_url(URL.replace('@postgres:', '@external:'), NEW, 'v5r_app', 'vampiro_v5')

    def test_wrong_role_is_rejected(self):
        with self.assertRaises(module.SafeError):
            module.updated_url(URL, NEW, 'other', 'vampiro_v5')

    def test_password_policy(self):
        for value in ('short', 'a' * 15, 'a' * 129, "quotes'are_forbidden", 'spaces are forbidden', 'á' * 20, 'back\\slash_forbidden'):
            with self.subTest(value=value), self.assertRaises(module.SafeError):
                module.validate_password(value)
        self.assertEqual(module.validate_password(NEW), NEW)

    def test_env_preserves_unrelated_settings(self):
        text = '# comment\nOTHER=value\nPOSTGRES_PASSWORD=old\nDATABASE_URL=oldurl\n'
        out = module.replace_credentials(text, NEW, 'newurl')
        self.assertIn('# comment\nOTHER=value\n', out)
        self.assertIn(f"POSTGRES_PASSWORD='{NEW}'", out)

    def test_duplicate_or_missing_keys_fail(self):
        for text in ('POSTGRES_PASSWORD=1\nPOSTGRES_PASSWORD=2\nDATABASE_URL=3', 'DATABASE_URL=3'):
            with self.assertRaises(module.SafeError):
                module.replace_credentials(text, NEW, 'url')

    def test_verifier_matches_independent_scram_keys(self):
        salt = bytes(range(16))
        value = module.scram_verifier(NEW, salt)
        prefix, salted, keys = value.split('$')
        self.assertEqual(prefix, 'SCRAM-SHA-256')
        self.assertEqual(salted, '4096:' + base64.b64encode(salt).decode())
        stored, server = [base64.b64decode(k) for k in keys.split(':')]
        salted_password = hashlib.pbkdf2_hmac('sha256', NEW.encode(), salt, 4096)
        self.assertEqual(stored, hashlib.sha256(hmac.digest(salted_password, b'Client Key', 'sha256')).digest())
        self.assertEqual(server, hmac.digest(salted_password, b'Server Key', 'sha256'))
        self.assertNotIn(NEW, value)

    def test_sql_quotes_identifiers_and_never_contains_plaintext(self):
        query = module.password_sql('name";DROP ROLE other;--', module.scram_verifier(NEW))
        self.assertIn('"name"";DROP ROLE other;--"', query)
        self.assertNotIn(NEW, query)

    def test_inconsistent_api_config_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            task = Simulated(tmp)
            with self.assertRaises(module.SafeError):
                task.check_config(configuration(NEW, URL), NEW)

    def test_unknown_credential_consumer_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            task = Simulated(tmp)
            cfg = configuration(OLD)
            cfg['services']['another'] = {'environment': {'PGPASSWORD': OLD}}
            with self.assertRaises(module.SafeError):
                task.check_config(cfg, OLD)

    def test_success_preserves_backup_and_removes_candidate(self):
        with tempfile.TemporaryDirectory() as tmp:
            task = Simulated(tmp)
            task.rotate(NEW)
            self.assertEqual(task.config()['services']['postgres']['environment']['POSTGRES_PASSWORD'], NEW)
            self.assertEqual((task.backup / 'environment.env').read_bytes(), task.original)
            self.assertFalse((task.backup / 'candidate.env').exists())
            self.assertNotIn(NEW, (task.backup / 'result.txt').read_text())
            self.assertTrue(any(e[0] == 'worker-auth' for e in task.events))

    def test_failed_deploy_rolls_back_credentials_not_data(self):
        with tempfile.TemporaryDirectory() as tmp, contextlib.redirect_stdout(io.StringIO()):
            task = Simulated(tmp, 'deploy')
            with self.assertRaises(module.SafeError):
                task.rotate(NEW)
            self.assertEqual(task.envfile.read_bytes(), task.original)
            self.assertEqual(task.current_verifier, task.old_verifier)
            self.assertFalse((task.backup / 'candidate.env').exists())
            self.assertFalse(any('pg_restore' in str(e) for e in task.events))

    def test_prechange_failure_never_stops_services_and_cleans_candidate(self):
        with tempfile.TemporaryDirectory() as tmp, contextlib.redirect_stdout(io.StringIO()):
            task = Simulated(tmp)
            with patch.object(task, 'check_config', side_effect=module.SafeError('precheck')):
                with self.assertRaises(module.SafeError):
                    task.rotate(NEW)
            self.assertEqual(task.envfile.read_bytes(), task.original)
            self.assertEqual(task.events, [])
            self.assertFalse((task.backup / 'candidate.env').exists())

    def test_failed_worker_auth_rolls_back(self):
        with tempfile.TemporaryDirectory() as tmp, contextlib.redirect_stdout(io.StringIO()):
            task = Simulated(tmp, 'worker')
            with self.assertRaises(module.SafeError):
                task.rotate(NEW)
            self.assertEqual(task.envfile.read_bytes(), task.original)

    def test_failed_recovery_leaves_actionable_report(self):
        with tempfile.TemporaryDirectory() as tmp, contextlib.redirect_stdout(io.StringIO()):
            task = Simulated(tmp, 'deploy')
            with patch.object(task, 'rollback', side_effect=module.SafeError('failure')):
                with self.assertRaisesRegex(module.SafeError, '--recover'):
                    task.rotate(NEW)
            self.assertIn('RECUPERACIÓN MANUAL', (task.backup / 'result.txt').read_text(encoding='utf-8'))

    def test_same_password_makes_no_backup_or_changes(self):
        with tempfile.TemporaryDirectory() as tmp:
            task = Simulated(tmp)
            with self.assertRaises(module.SafeError):
                task.rotate(OLD)
            self.assertIsNone(task.backup)
            self.assertEqual(task.events, [])

    def test_subprocess_error_does_not_disclose_credentials(self):
        with tempfile.TemporaryDirectory() as tmp:
            task = Simulated(tmp)
            result = type('Result', (), {'returncode': 1, 'stdout': NEW.encode(), 'stderr': OLD.encode()})()
            with patch.object(module.subprocess, 'run', return_value=result):
                with self.assertRaises(module.SafeError) as caught:
                    module.Rotation.run(task, ['docker', 'config'])
            self.assertNotIn(NEW, str(caught.exception))
            self.assertNotIn(OLD, str(caught.exception))


if __name__ == '__main__':
    unittest.main()
