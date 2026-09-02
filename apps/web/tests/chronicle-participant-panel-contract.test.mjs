import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const panel = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleDetail.tsx',
    import.meta.url,
  ),
  'utf8',
)

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
  '031-D muestra participantes y personajes asociados en el workspace operativo',
  () => {
    assert.match(panel, /ChronicleParticipantsWorkspace/)
    assert.match(panel, /associatedCharacters/)
    assert.match(panel, /retireParticipant/)
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

test(
  'UX Participantes pliega la incorporación contextual por defecto',
  () => {
    assert.match(
      detail,
      /showParticipantAdmin[\s\S]*useState\(false\)/,
    )
    assert.match(
      detail,
      /aria-expanded=\{showParticipantAdmin\}/,
    )
    assert.match(
      detail,
      /showParticipantAdmin \? \([\s\S]*chronicle-detail__participant-form/,
    )
  },
)

test(
  'UX Participantes pliega la asociación de personajes por defecto',
  () => {
    assert.match(
      detail,
      /showCharacterAssociation[\s\S]*useState\(false\)/,
    )
    assert.match(
      detail,
      /aria-expanded=\{showCharacterAssociation\}/,
    )
    assert.match(
      detail,
      /showCharacterAssociation \? \([\s\S]*independentOwnCharacters/,
    )
  },
)

test(
  'UX Participantes mantiene ids estables pero no imprime ids técnicos en el selector',
  () => {
    assert.match(
      detail,
      /key=\{candidate\.id\}[\s\S]*value=\{candidate\.id\}/,
    )
    assert.match(
      detail,
      /value=\{candidate\.id\}[\s\S]*\{candidate\.displayName\}/,
    )
    assert.doesNotMatch(
      detail,
      /\{'\s*'\}\(@\{candidate\.username\}\)/,
    )
    assert.match(
      detail,
      /readableUsername[\s\S]*normalized\.length > 32/,
    )
  },
)

test(
  'UX Participantes compacta filas y reutiliza launcher plegable responsive',
  () => {
    assert.match(
      styles,
      /chronicle-detail__fold-launcher/,
    )
    assert.match(
      styles,
      /chronicle-detail__fold-content/,
    )
    assert.match(
      styles,
      /chronicle-detail__participants,[\s\S]*chronicle-detail__character-list[\s\S]*gap:\s*var\(--space-2\)/,
    )
    assert.match(
      styles,
      /@media \(max-width: 760px\)[\s\S]*chronicle-detail__fold-launcher/,
    )
  },
)
