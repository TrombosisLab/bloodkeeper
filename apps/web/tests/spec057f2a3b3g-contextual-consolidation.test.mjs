import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const parentSource =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/PersistedInitialVampireTransition.tsx',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '057-F2A3B3G consolida tras cada resolución con la revisión devuelta',
  () => {
    assert.match(
      parentSource,
      /const resolution =\s*await operation\(\)[\s\S]*resolvedGateway\.consolidate\([\s\S]*transition\.characterId[\s\S]*resolution\.character\.revision/,
    )
  },
)

test(
  '057-F2A3B3G sólo considera incompleto el perfil como estado esperado',
  () => {
    assert.match(
      parentSource,
      /error instanceof[\s\S]*CharacterInitialVampireApiError[\s\S]*error\.code ===[\s\S]*'INITIAL_VAMPIRE_PROFILE_INCOMPLETE'/,
    )

    assert.match(
      parentSource,
      /onResolved\(\)[\s\S]*throw error/,
    )
  },
)

test(
  '057-F2A3B3G recarga el estado autoritativo tras la consolidación',
  () => {
    assert.match(
      parentSource,
      /resolvedGateway\.consolidate\([\s\S]*onResolved\(\)/,
    )
  },
)
