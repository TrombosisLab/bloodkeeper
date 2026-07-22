import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  createEmptyThinBloodAlchemy,
  isThinBloodAlchemyMethod,
  normalizeThinBloodAlchemyForClan,
  thinBloodAlchemyMethods,
} from '../src/features/character-creation/domain/thin-blood-alchemy-rules.ts'

test(
  'CharacterDraft inicial contiene Alquimia de Sangre Débil vacía',
  () => {
    assert.deepEqual(
      initialCharacterDraft
        .thinBloodAlchemy,
      {
        rating: 0,
        method: null,
        formulaKeys: [],
      },
    )
  },
)

test(
  'los tres métodos de destilación tienen claves estables',
  () => {
    assert.deepEqual(
      thinBloodAlchemyMethods,
      [
        'athanorCorporis',
        'calcinatio',
        'fixatio',
      ],
    )
  },
)

test(
  'las claves válidas de método son reconocidas',
  () => {
    for (
      const method of
        thinBloodAlchemyMethods
    ) {
      assert.equal(
        isThinBloodAlchemyMethod(
          method,
        ),
        true,
      )
    }

    assert.equal(
      isThinBloodAlchemyMethod(
        'invalidMethod',
      ),
      false,
    )
  },
)

test(
  'el estado vacío de Alquimia es estable',
  () => {
    assert.deepEqual(
      createEmptyThinBloodAlchemy(),
      {
        rating: 0,
        method: null,
        formulaKeys: [],
      },
    )
  },
)

test(
  'un personaje que no es Sangre Débil no puede conservar Alquimia',
  () => {
    assert.deepEqual(
      normalizeThinBloodAlchemyForClan(
        {
          rating: 1,
          method: 'fixatio',
          formulaKeys: [
            'formula-test',
          ],
        },
        'brujah',
      ),
      {
        rating: 0,
        method: null,
        formulaKeys: [],
      },
    )
  },
)

test(
  'Sangre Débil con Alquimia 0 no conserva método ni fórmulas',
  () => {
    assert.deepEqual(
      normalizeThinBloodAlchemyForClan(
        {
          rating: 0,
          method: 'calcinatio',
          formulaKeys: [
            'formula-test',
          ],
        },
        'thinBlood',
      ),
      {
        rating: 0,
        method: null,
        formulaKeys: [],
      },
    )
  },
)

test(
  'Sangre Débil conserva un estado estructuralmente válido',
  () => {
    assert.deepEqual(
      normalizeThinBloodAlchemyForClan(
        {
          rating: 1,
          method: 'athanorCorporis',
          formulaKeys: [
            'formula-test',
          ],
        },
        'thinBlood',
      ),
      {
        rating: 1,
        method: 'athanorCorporis',
        formulaKeys: [
          'formula-test',
        ],
      },
    )
  },
)

test(
  'normalización limita la puntuación al rango 0 a 5',
  () => {
    assert.equal(
      normalizeThinBloodAlchemyForClan(
        {
          rating: 99,
          method: 'fixatio',
          formulaKeys: [],
        },
        'thinBlood',
      ).rating,
      5,
    )

    assert.equal(
      normalizeThinBloodAlchemyForClan(
        {
          rating: -4,
          method: 'fixatio',
          formulaKeys: [],
        },
        'thinBlood',
      ).rating,
      0,
    )
  },
)

test(
  'normalización elimina fórmulas vacías y duplicadas',
  () => {
    assert.deepEqual(
      normalizeThinBloodAlchemyForClan(
        {
          rating: 1,
          method: 'fixatio',
          formulaKeys: [
            'formula-a',
            '',
            'formula-a',
            'formula-b',
          ],
        },
        'thinBlood',
      ).formulaKeys,
      [
        'formula-a',
        'formula-b',
      ],
    )
  },
)
