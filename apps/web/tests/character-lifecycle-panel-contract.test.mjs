import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(
  new URL(
    '../src/features/character-sheet/components/PersistedCharacterLifecycle.tsx',
    import.meta.url,
  ),
  'utf8',
)

const sheet = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterSheet.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  '029-L integra controles solo para personajes persistidos',
  () => {
    assert.match(
      sheet,
      /characterId \? \([\s\S]*<PersistedCharacterLifecycle[\s\S]*characterId=\{characterId\}/,
    )
    assert.match(
      component,
      /lifecycleGateway[\s\S]*\.load\(characterId\)/,
    )
  },
)

test(
  '029-L valida en backend antes de activar o reactivar',
  () => {
    assert.match(
      component,
      /validationGateway\.validate\([\s\S]*characterId,[\s\S]*'activation'/,
    )
    assert.match(
      component,
      /if \(!report\.canProceed\)[\s\S]*return[\s\S]*lifecycleGateway\.transition/,
    )
    assert.match(component, /'active',[\s\S]*false/)
  },
)

test(
  '029-L usa la revision persistida en cada transicion',
  () => {
    assert.match(
      component,
      /lifecycleGateway\.transition\([\s\S]*snapshot\.revision/,
    )
    assert.match(component, /Revision \{snapshot\.revision\}/)
  },
)

test(
  '029-L exige confirmacion visible antes de archivar',
  () => {
    assert.match(component, /archiveConfirmation/)
    assert.match(component, /Confirmar archivado/)
    assert.match(component, /'archived',[\s\S]*true/)
    assert.match(component, /Cancelar/)
  },
)

test(
  '029-L conserva los rechazos y conflictos del dominio',
  () => {
    assert.match(component, /error\.status === 409/)
    assert.match(component, /error\.status === 422/)
    assert.match(component, /role="alert"/)
    assert.match(component, /Recargar estado/)
  },
)
