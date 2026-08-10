import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const detail =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleDetail.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const styles =
  await readFile(
    new URL(
      '../src/features/chronicles/components/chronicle-detail.css',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '031-D muestra Narradores Jugadores y Personajes asociados',
  () => {
    assert.match(
      detail,
      />\s*Narradores\s*</,
    )
    assert.match(
      detail,
      />\s*Jugadores\s*</,
    )
    assert.match(
      detail,
      />\s*Personajes asociados\s*</,
    )
    assert.match(
      detail,
      /participantStatusLabels/,
    )
    assert.match(
      detail,
      /characterStatusLabels/,
    )
  },
)

test(
  '031-D deriva acciones administrativas del rol contextual',
  () => {
    assert.match(
      detail,
      /currentMembership/,
    )
    assert.match(
      detail,
      /currentMembership\?\.role ===[\s\S]*'narrator'/,
    )
    assert.match(
      detail,
      /canManageParticipants/,
    )
    assert.match(
      detail,
      /gateway\.addParticipant/,
    )
    assert.match(
      detail,
      /gateway\.retireParticipant/,
    )
    assert.match(
      detail,
      />\s*Incorporar participante\s*</,
    )
  },
)

test(
  '031-D asociación sólo ofrece personajes propios independientes',
  () => {
    assert.match(
      detail,
      /independentOwnCharacters/,
    )
    assert.match(
      detail,
      /character\.chronicleId ===[\s\S]*null/,
    )
    assert.match(
      detail,
      /updateChronicleAssociation/,
    )
    assert.match(
      detail,
      />\s*Asociar uno de tus personajes\s*</,
    )
    assert.match(
      detail,
      /Para mover uno desde otra crónica debes[\s\S]*resolver primero su relación allí/,
    )
  },
)

test(
  '031-D desasociación con historial exige confirmación explícita',
  () => {
    assert.match(
      detail,
      /CHARACTER_CHRONICLE_CONFIRMATION_REQUIRED/,
    )
    assert.match(
      detail,
      /pendingConfirmationCharacterId/,
    )
    assert.match(
      detail,
      />\s*Confirmar desasociación\s*</,
    )
    assert.match(
      detail,
      /confirmChange/,
    )
  },
)

test(
  '031-D representa conflicto de retirada con relaciones activas',
  () => {
    assert.match(
      detail,
      /CHRONICLE_PARTICIPANT_ACTIVE_CHARACTER_RELATION/,
    )
    assert.match(
      detail,
      /resolver sus personajes no archivados asociados/,
    )
  },
)

test(
  '031-D lifecycle vive en detalle y depende de Narrador contextual',
  () => {
    assert.match(
      detail,
      /gateway\.transition/,
    )
    assert.match(
      detail,
      /canManageParticipants\s*\?\s*\(/,
    )
    assert.match(
      detail,
      /Activar crónica/,
    )
    assert.match(
      detail,
      /Archivar crónica/,
    )
    assert.match(
      detail,
      /Reactivar crónica/,
    )
  },
)

test(
  '031-D mantiene diseño responsive con tokens existentes',
  () => {
    assert.match(
      styles,
      /var\(--color-border-default\)/,
    )
    assert.match(
      styles,
      /var\(--color-surface-translucent\)/,
    )
    assert.match(
      styles,
      /var\(--radius-xl\)/,
    )
    assert.match(
      styles,
      /@media \(max-width: 900px\)/,
    )
    assert.match(
      styles,
      /@media \(max-width: 760px\)/,
    )
    assert.doesNotMatch(
      styles,
      /#[0-9a-f]{3,8}\b/i,
    )
    assert.doesNotMatch(
      styles,
      /rgba?\(/,
    )
  },
)
