import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'
import {
  buildCharacterAdvantageReadModel,
} from '../src/features/character-sheet/domain/character-advantage-read-model.ts'

const demoSource = await readFile(
  new URL(
    '../src/features/character-sheet/data/demo-advantages.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '026-D resuelve la ficha desde el catálogo canónico',
  () => {
    const result =
      buildCharacterAdvantageReadModel(
        [
          {
            selectionId: 'beautiful-1',
            definitionKey: 'beautiful',
            category: 'merit',
            rating: 2,
            origin: 'creation',
          },
          {
            selectionId: 'status-1',
            definitionKey: 'status',
            category: 'background',
            rating: 1,
            origin: 'creation',
          },
          {
            selectionId: 'enemy-1',
            definitionKey: 'enemy',
            category: 'flaw',
            rating: 1,
            origin: 'creation',
          },
        ],
        characterAdvantageDefinitions,
      )

    assert.equal(
      result.advantages[0].name,
      'Bello',
    )
    assert.equal(
      result.backgrounds[0].name,
      'Estatus',
    )
    assert.equal(
      result.flaws[0].name,
      'Enemigo',
    )
    assert.equal(
      result.flaws[0].categoryLabel,
      'Defecto',
    )
  },
)

test(
  '026-D conserva selectionId para admitir varias instancias',
  () => {
    const result =
      buildCharacterAdvantageReadModel(
        [
          {
            selectionId: 'contact-1',
            definitionKey: 'contacts',
            category: 'background',
            rating: 2,
            origin: 'creation',
          },
          {
            selectionId: 'contact-2',
            definitionKey: 'contacts',
            category: 'background',
            rating: 3,
            origin: 'creation',
          },
        ],
        characterAdvantageDefinitions,
      )

    assert.deepEqual(
      result.backgrounds.map(
        (trait) => trait.key,
      ),
      ['contact-1', 'contact-2'],
    )
  },
)

test(
  '026-D muestra datos personales tipados sin duplicarlos en catálogo',
  () => {
    const result =
      buildCharacterAdvantageReadModel(
        [
          {
            selectionId: 'languages-1',
            definitionKey: 'linguistics',
            category: 'merit',
            rating: 2,
            origin: 'creation',
            details: {
              kind: 'linguistics',
              languages: [
                'Inglés',
                'Francés',
              ],
            },
          },
        ],
        characterAdvantageDefinitions,
      )

    assert.equal(
      result.advantages[0].detail,
      'Inglés, Francés',
    )
  },
)

test(
  '026-D conserva referencias históricas ausentes del catálogo',
  () => {
    const result =
      buildCharacterAdvantageReadModel(
        [
          {
            selectionId: 'legacy-1',
            definitionKey: 'legacy-merit',
            category: 'merit',
            rating: 1,
            origin: 'creation',
          },
        ],
        characterAdvantageDefinitions,
      )

    assert.deepEqual(
      result.advantages[0],
      {
        key: 'legacy-1',
        definitionKey: 'legacy-merit',
        name: 'legacy-merit',
        value: 1,
        category: 'merit',
        categoryLabel: 'Mérito',
        functionalType: 'fixed',
        functionalTypeLabel: 'Rasgo fijo',
        origin: 'creation',
        originLabel: 'Creación',
        detail: undefined,
        sourceLabel: undefined,
        sourcePage: undefined,
        catalogStatus: 'missing',
        narrativeStatus:
          'notApplicable',
        narrativeStatusLabel:
          'Sin información narrativa pendiente',
      },
    )
  },
)

test(
  '026-D elimina nombres y categorías duplicados del estado de demostración',
  () => {
    assert.match(
      demoSource,
      /buildCharacterAdvantageReadModel/,
    )
    assert.match(
      demoSource,
      /definitionKey: 'beautiful'/,
    )
    assert.doesNotMatch(
      demoSource,
      /name:\s*'Bello'/,
    )
  },
)
