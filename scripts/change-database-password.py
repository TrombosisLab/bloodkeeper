#!/usr/bin/env python3
"""Rotate the Compose database role without placing plaintext in commands/logs."""
import argparse
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import tempfile
import time
from urllib.parse import quote, unquote, urlsplit, urlunsplit


class SafeError(Exception):
    pass


def validate_password(password):
    # ASCII avoids PostgreSQL SASLprep differences. Quotes/backslashes are excluded
    # deliberately; Compose and URL validation below also verifies the round trip.
    if not re.fullmatch(r"[A-Za-z0-9_@%+=:,.!?/$#&*(){}\[\]<>;|~-]{16,128}", password):
        raise SafeError('Usa entre 16 y 128 caracteres ASCII, sin espacios, comillas ni barra invertida.')
    return password


def scram_verifier(password, salt=None):
    salt = os.urandom(16) if salt is None else salt
    salted = hashlib.pbkdf2_hmac('sha256', password.encode('ascii'), salt, 4096)
    stored = hashlib.sha256(hmac.new(salted, b'Client Key', 'sha256').digest()).digest()
    server = hmac.new(salted, b'Server Key', 'sha256').digest()
    b64 = lambda value: base64.b64encode(value).decode('ascii')
    return f'SCRAM-SHA-256$4096:{b64(salt)}${b64(stored)}:{b64(server)}'


def sql_literal(value):
    return "'" + value.replace("'", "''") + "'"


def password_sql(user, verifier):
    identifier = '"' + user.replace('"', '""') + '"'
    return f'ALTER ROLE {identifier} PASSWORD {sql_literal(verifier)};\n'


def replace_credentials(text, password, url):
    for key, value in [('POSTGRES_PASSWORD', password), ('DATABASE_URL', url)]:
        pattern = rf'(?m)^[ \t]*{key}[ \t]*=.*$'
        if len(re.findall(pattern, text)) != 1:
            raise SafeError(f'{key} debe aparecer exactamente una vez y en una sola línea en .env.')
        text = re.sub(pattern, lambda _: f"{key}='{value}'", text)
    return text


def updated_url(url, password, user, database):
    parsed = urlsplit(url)
    if (parsed.scheme not in ('postgres', 'postgresql') or parsed.hostname != 'postgres'
            or parsed.port not in (None, 5432) or unquote(parsed.username or '') != user
            or unquote(parsed.path.lstrip('/')) != database):
        raise SafeError('DATABASE_URL no corresponde al PostgreSQL local esperado; revisión manual necesaria.')
    netloc = f'{quote(user, safe="")}:{quote(password, safe="")}@postgres'
    if parsed.port:
        netloc += f':{parsed.port}'
    return urlunsplit(parsed._replace(netloc=netloc))


def atomic_write(path, data, owner=None):
    fd, name = tempfile.mkstemp(prefix='.bloodkeeper-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(name, 0o600)
        if owner is not None:
            os.chown(name, *owner)
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


class Rotation:
    def __init__(self, repo):
        self.repo = Path(repo).resolve()
        self.envfile = self.repo / '.env'
        self.backup = None
        self.touched = False
        self.original = None
        self.old_verifier = None
        self.ids = {}
        self.environment = dict(os.environ)
        for key in ('POSTGRES_USER', 'POSTGRES_DB', 'POSTGRES_PASSWORD', 'DATABASE_URL',
                    'COMPOSE_FILE', 'COMPOSE_PROJECT_NAME', 'COMPOSE_PROFILES', 'COMPOSE_ENV_FILES'):
            self.environment.pop(key, None)

    def run(self, argv, data=None, output=None, timeout=120, input_stream=None):
        try:
            result = subprocess.run(argv, cwd=self.repo, env=self.environment,
                                    input=data, stdin=input_stream, stdout=output or subprocess.PIPE,
                                    stderr=subprocess.PIPE, timeout=timeout, check=False)
        except (OSError, subprocess.TimeoutExpired):
            raise SafeError('No se pudo completar una operación; las credenciales no se muestran.') from None
        if result.returncode:
            # Never echo Docker config, SQL errors, container environments or URLs.
            raise SafeError('Una operación devolvió un error; se omite su salida para proteger las credenciales.')
        return result.stdout or b''

    def compose(self, *args, envfile=None, **kwargs):
        return self.run(['docker', 'compose', '--project-directory', str(self.repo),
                         '--env-file', str(envfile or self.envfile), '-f', str(self.repo / 'compose.yaml'),
                         *args], **kwargs)

    def config(self, envfile=None):
        return json.loads(self.compose('config', '--format', 'json', envfile=envfile))

    def container(self, service):
        ident = self.compose('ps', '-q', service).decode().strip()
        if not ident or '\n' in ident:
            raise SafeError(f'{service} debe tener exactamente un contenedor en ejecución.')
        return ident

    def local_sql(self, sql, output=None):
        return self.run(['docker', 'exec', '-i', self.container('postgres'),
                         'psql', '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1',
                         '-U', self.user, '-d', self.database], data=sql.encode(), output=output)

    def tcp_check(self, container, password):
        # Password travels via stdin, never in host process arguments or a file.
        command = 'IFS= read -r PGPASSWORD; export PGPASSWORD; exec psql -X -w -h postgres -p 5432 -U "$1" -d "$2" -A -t -c "SELECT 1"'
        result = self.run(['docker', 'exec', '-i', container, 'sh', '-c', command,
                           'password-check', self.user, self.database], data=(password + '\n').encode())
        if result.strip() != b'1':
            raise SafeError('La prueba de autenticación no devolvió el resultado esperado.')

    def worker_check(self):
        result = self.run(['docker', 'exec', self.container('backup-worker'),
                           'psql', '-X', '-w', '-A', '-t', '-c', 'SELECT 1'])
        if result.strip() != b'1':
            raise SafeError('Las credenciales instaladas en el trabajador de backups no funcionan.')

    def check_config(self, cfg, password):
        services = cfg['services']
        expected = {'postgres': 'POSTGRES_PASSWORD', 'backup-worker': 'PGPASSWORD'}
        for service, key in expected.items():
            env = services[service].get('environment', {})
            if env.get(key) != password:
                raise SafeError(f'Credenciales inconsistentes en {service}.')
        api_url = services['api']['environment']['DATABASE_URL']
        updated_url(api_url, password, self.user, self.database)
        if unquote(urlsplit(api_url).password or '') != password:
            raise SafeError('DATABASE_URL y POSTGRES_PASSWORD no coinciden.')
        worker = services['backup-worker']['environment']
        if (worker.get('PGUSER') != self.user or worker.get('PGDATABASE') != self.database
                or worker.get('PGHOST') != 'postgres'):
            raise SafeError('Configuración del trabajador de backups inesperada.')
        for name, service in services.items():
            if name not in ('postgres', 'api', 'backup-worker'):
                if any(k in service.get('environment', {}) for k in ('PGPASSWORD', 'DATABASE_URL', 'POSTGRES_PASSWORD')):
                    raise SafeError(f'{name} también utiliza credenciales: requiere revisión antes de rotar.')
        return api_url

    def preflight(self):
        if self.envfile.is_symlink() or not self.envfile.is_file() or not (self.repo / 'compose.yaml').is_file():
            raise SafeError('Falta compose.yaml o un .env regular (no enlace simbólico).')
        for name in ('compose.override.yaml', 'compose.override.yml', 'docker-compose.override.yml', 'docker-compose.override.yaml'):
            if (self.repo / name).exists():
                raise SafeError('Hay un archivo Compose override; revisión manual necesaria.')
        tracked = subprocess.run(['git', '-C', str(self.repo), 'ls-files', '--', '.env'],
                                 capture_output=True, check=True)
        if tracked.stdout.strip():
            raise SafeError('.env está seguido por Git; no se escribirán secretos en él.')
        self.original = self.envfile.read_bytes()
        self.owner = (self.envfile.stat().st_uid, self.envfile.stat().st_gid)
        if self.owner[0] != (self.repo / '.git').stat().st_uid:
            raise SafeError('El propietario de .env no coincide con el del repositorio. Revisa permisos antes de fijar .env a 0600.')
        cfg = self.config()
        pg = cfg['services']['postgres']['environment']
        self.user, self.database, self.old_password = pg['POSTGRES_USER'], pg['POSTGRES_DB'], pg['POSTGRES_PASSWORD']
        self.url = self.check_config(cfg, self.old_password)
        for service in ('postgres', 'api', 'backup-worker'):
            self.ids[service] = self.container(service)
        self.old_verifier = self.local_sql('SELECT rolpassword FROM pg_authid WHERE rolname = ' + sql_literal(self.user) + ';').decode().strip()
        if not (self.old_verifier.startswith('SCRAM-SHA-256$') or re.fullmatch(r'md5[0-9a-f]{32}', self.old_verifier)):
            raise SafeError('No se pudo obtener el verificador actual para recuperación.')
        self.tcp_check(self.ids['postgres'], self.old_password)
        self.worker_check()
        self.run(['docker', 'exec', self.ids['backup-worker'], 'test', '!', '-e', '/requests/manual-backup.processing'])
        self.health('api')

    def health(self, service):
        ident = self.container(service)
        for _ in range(60):
            state = json.loads(self.run(['docker', 'inspect', '--format', '{{json .State}}', ident]))
            if not state.get('Running'):
                raise SafeError(f'{service} se detuvo durante la comprobación.')
            if state.get('Health', {}).get('Status') == 'healthy':
                return
            time.sleep(2)
        raise SafeError(f'{service} no alcanzó estado healthy dentro del plazo.')

    def save_backup(self):
        parent = self.repo.parent / (self.repo.name + '_backups') / 'credential-rotations'
        if parent.is_symlink() or any(p.is_symlink() for p in parent.parents):
            raise SafeError('La ruta de copias no puede contener enlaces simbólicos.')
        parent.mkdir(parents=True, exist_ok=True)
        self.backup = Path(tempfile.mkdtemp(prefix='rotation-', dir=parent))
        atomic_write(self.backup / 'environment.env', self.original)
        atomic_write(self.backup / 'restore-role.sql', password_sql(self.user, self.old_verifier).encode())
        metadata = {'repo': str(self.repo), 'user': self.user, 'database': self.database,
                    'uid': self.owner[0], 'gid': self.owner[1]}
        atomic_write(self.backup / 'metadata.json', json.dumps(metadata).encode())
        with (self.backup / 'database.dump').open('xb') as stream:
            self.run(['docker', 'exec', self.ids['postgres'], 'pg_dump', '-U', self.user,
                      '-d', self.database, '-Fc'], output=stream, timeout=1800)
        if (self.backup / 'database.dump').stat().st_size == 0:
            raise SafeError('La copia de PostgreSQL está vacía.')
        with (self.backup / 'database.dump').open('rb') as stream:
            self.run(['docker', 'exec', '-i', self.ids['postgres'], 'pg_restore', '--list'],
                     input_stream=stream, timeout=1800)
        print(f'Copia protegida: {self.backup}', flush=True)

    def deploy(self):
        self.compose('up', '-d', '--no-deps', '--no-build', '--force-recreate', 'postgres', timeout=180)
        self.health('postgres')
        self.compose('up', '-d', '--no-deps', '--no-build', '--force-recreate', 'api', 'backup-worker', timeout=180)
        self.health('api')
        self.health('backup-worker')

    def rollback(self):
        # Credential rollback only. The database dump is NEVER restored automatically.
        self.compose('stop', 'api', 'backup-worker', timeout=180)
        self.local_sql(password_sql(self.user, self.old_verifier))
        atomic_write(self.envfile, self.original, self.owner)
        self.deploy()
        self.tcp_check(self.container('postgres'), self.old_password)
        self.worker_check()
        self.report('Credenciales anteriores restauradas; no se restauraron datos.')

    def report(self, message):
        if self.backup:
            atomic_write(self.backup / 'result.txt', (message + '\n').encode())

    def rotate(self, password):
        validate_password(password)
        if password == self.old_password:
            raise SafeError('La nueva contraseña es igual a la actual.')
        url = updated_url(self.url, password, self.user, self.database)
        proposed = replace_credentials(self.original.decode('utf-8'), password, url).encode('utf-8')
        print('[1/5] Guardando copia protegida de configuración y base de datos…', flush=True)
        self.save_backup()
        candidate = self.backup / 'candidate.env'
        atomic_write(candidate, proposed)
        try:
            self.check_config(self.config(candidate), password)
            print('[2/5] Deteniendo API y trabajador de backups…', flush=True)
            self.run(['docker', 'exec', self.container('backup-worker'), 'test', '!', '-e', '/requests/manual-backup.processing'])
            # Set before stopping: partial stop/recreate is also recoverable.
            self.touched = True
            self.compose('stop', 'api', 'backup-worker', timeout=180)
            print('[3/5] Cambiando credenciales y actualizando .env…', flush=True)
            self.local_sql(password_sql(self.user, scram_verifier(password)))
            self.tcp_check(self.container('postgres'), password)
            atomic_write(self.envfile, proposed, self.owner)
            self.check_config(self.config(), password)
            print('[4/5] Recreando PostgreSQL, API y trabajador con imágenes existentes…', flush=True)
            self.deploy()
            print('[5/5] Verificando autenticación y disponibilidad…', flush=True)
            self.tcp_check(self.container('postgres'), password)
            self.worker_check()
            self.report('Cambio correcto: PostgreSQL, API y autenticación de backups comprobados.')
        except (Exception, KeyboardInterrupt):
            if not self.touched:
                raise
            print('Fallo o interrupción. Intentando restaurar las credenciales anteriores…', flush=True)
            try:
                self.rollback()
            except (Exception, KeyboardInterrupt):
                self.report('RECUPERACIÓN MANUAL NECESARIA. No se restauraron datos.')
                raise SafeError(f'No se completó la recuperación. Conserva {self.backup}; usa --recover con esa ruta.') from None
            raise SafeError('El cambio no terminó; se restauraron las credenciales anteriores.') from None
        finally:
            if candidate.exists():
                candidate.unlink()


def main():
    parser = argparse.ArgumentParser(description='Rotación coordinada de contraseña PostgreSQL. Ejecutar con sudo. Entrada visible, doble confirmación. Sin borrar volúmenes.')
    parser.add_argument('--repo', default=str(Path(__file__).resolve().parent.parent))
    parser.add_argument('--check', action='store_true', help='Solo comprobaciones; no cambia archivos ni servicios')
    parser.add_argument('--recover', type=Path, help='Recupera credenciales de una copia anterior; nunca restaura datos')
    args = parser.parse_args()
    if args.check and args.recover:
        raise SafeError('No combines --check y --recover.')
    if os.geteuid() != 0:
        raise SafeError('Ejecuta con sudo bash scripts/change-database-password.sh')
    import fcntl
    repo = Path(args.repo).resolve()
    lock_name = hashlib.sha256(str(repo).encode()).hexdigest()[:24]
    lock_fd = os.open('/run/lock/bloodkeeper-password-' + lock_name,
                      os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(lock_fd, 'a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SafeError('Ya hay un cambio de contraseña en curso.') from None
        task = Rotation(repo)
        if args.recover:
            backup = args.recover.resolve()
            if backup.stat().st_uid != 0 or backup.stat().st_mode & 0o077:
                raise SafeError('La copia debe pertenecer a root y ser privada (0700).')
            meta = json.loads((backup / 'metadata.json').read_text())
            if meta['repo'] != str(repo):
                raise SafeError('La copia pertenece a otro repositorio.')
            if not sys.stdin.isatty() or input('Restaurar las credenciales anteriores (no datos). Escribe RECUPERAR: ') != 'RECUPERAR':
                raise SafeError('Recuperación cancelada.')
            task.backup = backup
            task.original = (backup / 'environment.env').read_bytes()
            task.owner = (meta['uid'], meta['gid'])
            task.user, task.database = meta['user'], meta['database']
            cfg = task.config(backup / 'environment.env')
            task.old_password = cfg['services']['postgres']['environment']['POSTGRES_PASSWORD']
            task.old_verifier = re.search(r"PASSWORD '([^']+)';", (backup / 'restore-role.sql').read_text()).group(1)
            task.rollback()
            candidate = backup / 'candidate.env'
            if candidate.exists():
                candidate.unlink()
            print('Recuperación de credenciales completada.')
            return
        print(f'Repositorio: {repo}\nComprobando configuración y conexión…', flush=True)
        task.preflight()
        if args.check:
            print('Comprobaciones correctas. No se modificaron archivos, credenciales ni servicios.')
            return
        if not sys.stdin.isatty():
            raise SafeError('Se requiere una terminal interactiva para introducir la contraseña.')
        print('La contraseña será VISIBLE. Habrá una interrupción de API y backups; también se recreará PostgreSQL.')
        first = validate_password(input('Nueva contraseña: '))
        second = input('Repite la nueva contraseña: ')
        if not hmac.compare_digest(first, second):
            raise SafeError('Las contraseñas no coinciden. No se modificó nada.')
        if input('Para proceder escribe CAMBIAR: ') != 'CAMBIAR':
            raise SafeError('Cancelado. No se modificó nada.')
        task.rotate(first)
        print('Contraseña actualizada. API healthy y conexión del trabajador de backups comprobadas.')
        print('Las copias contienen credenciales y datos: no las publiques ni las subas a Git.')


if __name__ == '__main__':
    os.umask(0o077)
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
    try:
        main()
    except (SafeError, KeyboardInterrupt) as exc:
        print('ERROR: ' + (str(exc) or 'Operación interrumpida.'), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('ERROR: comprobación inesperada fallida; no se imprime información sensible.', file=sys.stderr)
        sys.exit(1)
