import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const detail = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleDetail.tsx',
    import.meta.url,
  ),
  'utf8',
)

const sessions = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleSessionPanel.tsx',
    import.meta.url,
  ),
  'utf8',
)

const attendance = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleSessionAttendancePanel.tsx',
    import.meta.url,
  ),
  'utf8',
)

const styles = await readFile(
  new URL(
    '../src/features/chronicles/components/chronicle-session-attendance-panel.css',
    import.meta.url,
  ),
  'utf8',
)

test(
  'Attendance A2 reutiliza personajes asociados ya cargados por ChronicleDetail',
  () => {
    assert.match(
      detail,
      /<ChronicleSessionPanel[\s\S]*associatedCharacters=\{[\s\S]*associatedCharacters[\s\S]*\}/,
    )
    assert.match(
      sessions,
      /readonly associatedCharacters:[\s\S]*ChronicleCharacterApiSummary/,
    )
    assert.match(
      sessions,
      /<ChronicleSessionAttendancePanel[\s\S]*associatedCharacters=\{[\s\S]*associatedCharacters/,
    )
  },
)

test(
  'Attendance A2 vive en el detalle de la Sesion seleccionada',
  () => {
    assert.match(
      sessions,
      /selectedSession !== null[\s\S]*chronicle-session-panel__detail/,
    )
    assert.match(
      sessions,
      /<ChronicleSessionAttendancePanel/,
    )
    assert.match(
      attendance,
      />\s*Asistencia\s*</,
    )
  },
)

test(
  'Attendance A2 permite marcar solo personajes ACTIVE y no filtra naturaleza',
  () => {
    assert.match(
      attendance,
      /character\.status === 'active'/,
    )
    assert.match(
      attendance,
      /type="checkbox"/,
    )
    assert.match(
      attendance,
      /gateway\.addSessionAttendance/,
    )
    assert.match(
      attendance,
      /gateway\.removeSessionAttendance/,
    )
    assert.doesNotMatch(
      attendance,
      /nature|HUMAN|VAMPIRE|clan/i,
    )
  },
)

test(
  'Attendance A2 conserva asistentes historicos no activos o ya no asociados',
  () => {
    assert.match(
      attendance,
      /attendingIds\.has/,
    )
    assert.match(
      attendance,
      /unresolvedAttendances/,
    )
    assert.match(
      attendance,
      /Personaje ya no asociado/,
    )
  },
)

test(
  'Attendance A2 hace ARCHIVED solo lectura y explica el XP al completar',
  () => {
    assert.match(
      attendance,
      /session\.status !== 'archived'/,
    )
    assert.match(
      attendance,
      /solo lectura/,
    )
    assert.match(
      attendance,
      /Al completar la Sesión, cada personaje presente recibe 1 punto de Experiencia/,
    )
    assert.doesNotMatch(
      attendance,
      /experienceGateway|grantExperience|session_played|fast_session|story_end/,
    )
  },
)

test(
  'Attendance A2 refresca estado autoritativo tras cada escritura',
  () => {
    assert.match(
      attendance,
      /await gateway\.sessionAttendances\([\s\S]*chronicleId[\s\S]*session\.id/,
    )
    assert.match(
      attendance,
      /await gateway\.addSessionAttendance[\s\S]*setAttendances\([\s\S]*await gateway\.sessionAttendances/,
    )
    assert.match(
      attendance,
      /await gateway\.removeSessionAttendance[\s\S]*setAttendances\([\s\S]*await gateway\.sessionAttendances/,
    )
  },
)

test(
  'Attendance A2 reutiliza tokens visuales y responsive',
  () => {
    for (const token of [
      'var(--color-border-subtle)',
      'var(--color-surface-emphasis)',
      'var(--radius-pill)',
      '@media (max-width: 760px)',
    ]) {
      assert.match(
        styles,
        new RegExp(
          token.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&',
          ),
        ),
      )
    }
  },
)
