import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'
import {
  getActiveCharacterAdvantageDefinitions,
} from '../src/features/character-creation/domain/advantage-catalog-rules.ts'
import {
  validateCharacterAdvantageSelectionsAgainstDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'
import {
  canShowAdvantageDefinition,
} from '../src/features/character-creation/domain/advantage-visibility-rules.ts'

const advantagesStep = await readFile(
  new URL(
    '../src/features/character-creation/components/AdvantagesStep.tsx',
    import.meta.url,
  ),
  'utf8',
)

const activeDefinition = {
  key: 'active-background',
  name: 'Trasfondo activo',
  category: 'background',
  allowedRatings: [1],
  source: 'core',
  allowMultiple: false,
  requiresInstanceDetails: false,
  active: true,
}

const inactiveDefinition = {
  ...activeDefinition,
  key: 'inactive-background',
  name: 'Trasfondo inactivo',
  active: false,
}

test(
  '026-A materializa el estado activo del catálogo canónico',
  () => {
    assert.equal(
      characterAdvantageDefinitions.every(
        (definition) =>
          typeof definition.active === 'boolean',
      ),
      true,
    )
  },
)

test(
  '026-A excluye definiciones inactivas de nuevas consultas',
  () => {
    assert.deepEqual(
      getActiveCharacterAdvantageDefinitions(
        [activeDefinition, inactiveDefinition],
      ).map(
        (definition) => definition.key,
      ),
      [activeDefinition.key],
    )
  },
)

test(
  '026-A impide mostrar y validar una selección inactiva',
  () => {
    assert.equal(
      canShowAdvantageDefinition(
        inactiveDefinition,
        { selections: [] },
      ),
      false,
    )

    const validation =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'inactive-1',
              definitionKey:
                inactiveDefinition.key,
              category: 'background',
              rating: 1,
              origin: 'creation',
            },
          ],
        },
        [inactiveDefinition],
      )

    assert.equal(validation.valid, false)
    assert.match(
      validation.errors.join(' '),
      /no está activa/,
    )
  },
)

test(
  '026-A conserva la consulta histórica por clave',
  () => {
    const knownDefinition =
      characterAdvantageDefinitions[0]

    assert.equal(
      getCharacterAdvantageDefinition(
        knownDefinition.key,
      )?.key,
      knownDefinition.key,
    )
  },
)

test(
  '026-A el creador filtra el catálogo activo de forma centralizada',
  () => {
    assert.match(
      advantagesStep,
      /getActiveCharacterAdvantageDefinitions\(/,
    )
  },
)
