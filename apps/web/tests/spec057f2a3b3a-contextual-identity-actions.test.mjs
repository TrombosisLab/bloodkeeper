import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  CharacterInitialVampireApiError,
} from '../src/features/character-sheet/infrastructure/character-initial-vampire.api.ts'

import {
  messageForInitialVampireTransitionError,
} from '../src/features/character-sheet/domain/initial-vampire-transition-ui-state.ts'

const component =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/PersistedInitialVampireTransition.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const sheet =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/CharacterSheet.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const persisted =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/PersistedCharacterSheet.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const transitionTypes =
  await readFile(
    new URL(
      '../src/features/character-sheet/types/character-transition-read-model.types.ts',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '057-F2A3B3A usa pendingDecisions como autoridad de presentación',
  () => {
    assert.match(
      component,
      /pending\.includes\('clan'\)/,
    )
    assert.match(
      component,
      /pending\.includes\(\s*'generation'/,
    )
    assert.match(
      component,
      /pending\.includes\('sire'\)/,
    )

    assert.doesNotMatch(
      component,
      /transition\.identity\.clanKey\s*===\s*null[\s\S]*resolveClan/,
    )
  },
)

test(
  '057-F2A3B3A reutiliza catálogos canónicos para Clan y Generación',
  () => {
    assert.match(
      component,
      /clanKeys/,
    )
    assert.match(
      component,
      /getClanName/,
    )
    assert.match(
      component,
      /generationOptions/,
    )

    assert.doesNotMatch(
      component,
      /const\s+clanKeys\s*=/,
    )
    assert.doesNotMatch(
      component,
      /const\s+generationOptions\s*=/,
    )
  },
)

test(
  '057-F2A3B3A conecta las tres operaciones dedicadas existentes',
  () => {
    assert.match(
      component,
      /resolvedGateway\.resolveClan\(/,
    )
    assert.match(
      component,
      /resolvedGateway\s*\.resolveGeneration\(/,
    )
    assert.match(
      component,
      /resolvedGateway\.resolveSire\(/,
    )

    assert.match(
      component,
      /transition\.revision/,
    )
  },
)

test(
  '057-F2A3B3A no inventa valores por defecto',
  () => {
    assert.match(
      component,
      /useState\(''\)/,
    )
    assert.match(
      component,
      /<option value="">/,
    )
    assert.match(
      component,
      /sire\.trim\(\)/,
    )

    assert.doesNotMatch(
      component,
      /bloodPotency\s*:\s*1/,
    )
    assert.doesNotMatch(
      component,
      /hunger\s*:\s*1/,
    )
  },
)

test(
  '057-F2A3B3A fuerza recarga autoritativa tras cada escritura',
  () => {
    assert.match(
      component,
      /await operation\(\)[\s\S]*onResolved\(\)/,
    )

    assert.doesNotMatch(
      component,
      /setTransition/,
    )
    assert.doesNotMatch(
      component,
      /setPendingDecisions/,
    )
  },
)

test(
  '057-F2A3B3A sólo se monta en transición activa no archivada',
  () => {
    assert.match(
      sheet,
      /model\?\.profilePhase ===\s*'TRANSITIONAL_VAMPIRE'/,
    )
    assert.match(
      sheet,
      /model\.status !== 'archived'/,
    )
    assert.match(
      sheet,
      /<PersistedInitialVampireTransition/,
    )

    assert.match(
      persisted,
      /transition=\{\s*loadState\.transition\s*\}/,
    )
  },
)

test(
  '057-F2A3B3A mantiene pending fuera de CharacterSheetModel',
  () => {
    assert.match(
      transitionTypes,
      /pendingDecisions:/,
    )

    assert.doesNotMatch(
      sheet,
      /model\.pendingDecisions/,
    )
  },
)

test(
  '057-F2A3B3A presenta errores backend sin inferir permisos',
  () => {
    assert.equal(
      messageForInitialVampireTransitionError(
        new CharacterInitialVampireApiError(
          403,
          'FORBIDDEN',
        ),
      ),
      'No tienes permiso para resolver esta decisión vampírica.',
    )

    assert.equal(
      messageForInitialVampireTransitionError(
        new CharacterInitialVampireApiError(
          422,
          'INITIAL_VAMPIRE_PREREQUISITE_PENDING',
          {
            prerequisite:
              'generation',
          },
        ),
      ),
      'Antes debes resolver: Generación.',
    )
  },
)

test(
  '057-F2A3B3A no incorpora aún reglas complejas de bloques posteriores',
  () => {
    for (
      const forbidden of [
        'predatorTypeDefinitions',
        'disciplineDefinitions',
        'characterAdvantageDefinitions',
        'thinBloodTraitDefinitions',
        'applyPredatorTypeEffects',
        'validateThinBlood',
      ]
    ) {
      assert.equal(
        component.includes(forbidden),
        false,
      )
    }
  },
)
