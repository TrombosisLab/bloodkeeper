import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'
import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'
import {
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'
import {
  buildCharacterAdvantageReadModel,
} from '../src/features/character-sheet/domain/character-advantage-read-model.ts'

const creatorSource = await readFile(
  new URL(
    '../src/features/character-creation/components/AdvantagesStep.tsx',
    import.meta.url,
  ),
  'utf8',
)

const sheetRowSource = await readFile(
  new URL(
    '../src/features/character-sheet/components/RatedTraitRow.tsx',
    import.meta.url,
  ),
  'utf8',
)

function buildStatusTrait(
  sphere,
) {
  return buildCharacterAdvantageReadModel(
    [
      {
        selectionId: 'status-1',
        definitionKey: 'status',
        category: 'background',
        rating: 5,
        origin: 'creation',
        details: {
          kind: 'status',
          ...(sphere === undefined
            ? {}
            : { sphere }),
        },
      },
    ],
    characterAdvantageDefinitions,
  ).backgrounds[0]
}

test(
  '026-G deriva información narrativa pendiente sin alterar el catálogo',
  () => {
    const trait =
      buildStatusTrait()

    assert.equal(
      trait.narrativeStatus,
      'pending',
    )
    assert.equal(
      trait.narrativeStatusLabel,
      'Información narrativa pendiente',
    )
  },
)

test(
  '026-G reconoce la información narrativa completada',
  () => {
    const trait =
      buildStatusTrait(
        'Camarilla de Madrid',
      )

    assert.equal(
      trait.narrativeStatus,
      'complete',
    )
  },
)

test(
  '026-G mantiene la narrativa pendiente fuera de la validación reglamentaria',
  () => {
    const draft = {
      ...initialCharacterDraft,
      advantages: {
        selections: [
          {
            selectionId: 'status-1',
            definitionKey: 'status',
            category: 'background',
            rating: 5,
            origin: 'creation',
            details: {
              kind: 'status',
            },
          },
          {
            selectionId: 'contacts-1',
            definitionKey: 'contacts',
            category: 'background',
            rating: 2,
            origin: 'creation',
            details: {
              kind: 'contact',
            },
          },
          {
            selectionId: 'illiterate-1',
            definitionKey: 'illiterate',
            category: 'flaw',
            rating: 2,
            origin: 'creation',
          },
        ],
      },
    }

    assert.equal(
      validateStep(
        'advantages',
        draft,
      ).valid,
      true,
    )
  },
)

test(
  '026-G muestra el aviso no bloqueante en creador y ficha',
  () => {
    assert.match(
      creatorSource,
      /getCharacterAdvantageNarrativeState/,
    )
    assert.match(
      creatorSource,
      /Puedes completar la información narrativa más adelante/,
    )
    assert.match(
      sheetRowSource,
      /trait\.narrativeStatus === 'pending'/,
    )
    assert.match(
      sheetRowSource,
      /trait\.narrativeStatusLabel/,
    )
  },
)
