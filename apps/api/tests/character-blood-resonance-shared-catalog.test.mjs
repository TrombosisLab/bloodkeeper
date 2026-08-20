import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

import {
  characterBloodResonanceCatalog,
  characterDisciplineCatalog,
  deriveCharacterBloodResonanceBaseDiceBonus,
} from '@v5r/character-rules'

const require = createRequire(import.meta.url)
const commonJsRules = require('@v5r/character-rules')

function sorted(values) {
  return [...values].sort()
}

test(
  '058-A publica exactamente cuatro Resonancias y tres Temperamentos',
  () => {
    assert.deepEqual(
      sorted(
        characterBloodResonanceCatalog.resonances.map(
          ({ key }) => key,
        ),
      ),
      [
        'choleric',
        'melancholy',
        'phlegmatic',
        'sanguine',
      ],
    )

    assert.deepEqual(
      sorted(
        characterBloodResonanceCatalog.temperaments.map(
          ({ key }) => key,
        ),
      ),
      [
        'acute',
        'fleeting',
        'intense',
      ],
    )
  },
)

test(
  '058-A conserva las asociaciones canonicas de Resonancia a Disciplina',
  () => {
    const associations = Object.fromEntries(
      characterBloodResonanceCatalog.resonances.map(
        ({ key, disciplineKeys }) => [
          key,
          [...disciplineKeys],
        ],
      ),
    )

    assert.deepEqual(
      associations,
      {
        choleric: ['celerity', 'potence'],
        melancholy: ['fortitude', 'obfuscate'],
        phlegmatic: ['auspex', 'dominate'],
        sanguine: ['bloodSorcery', 'presence'],
      },
    )
  },
)

test(
  '058-A mantiene sangre animal y sangre libre fuera de las cuatro Resonancias',
  () => {
    const resonanceKeys = new Set(
      characterBloodResonanceCatalog.resonances.map(
        ({ key }) => key,
      ),
    )
    const affinities = Object.fromEntries(
      characterBloodResonanceCatalog
        .specialAffinities
        .map((definition) => [
          definition.key,
          definition,
        ]),
    )

    assert.equal(resonanceKeys.has('animalBlood'), false)
    assert.equal(resonanceKeys.has('resonanceFree'), false)

    assert.deepEqual(
      affinities.animalBlood.disciplineKeys,
      ['animalism', 'protean'],
    )
    assert.equal(
      affinities.animalBlood
        .usesTemperamentDiceBonus,
      true,
    )

    assert.deepEqual(
      affinities.resonanceFree.disciplineKeys,
      ['oblivion'],
    )
    assert.equal(
      affinities.resonanceFree
        .usesTemperamentDiceBonus,
      false,
    )
  },
)

test(
  '058-A referencia exclusivamente claves de Disciplina existentes',
  () => {
    const disciplineKeys = new Set(
      characterDisciplineCatalog.disciplines.map(
        ({ key }) => key,
      ),
    )

    for (
      const definition of [
        ...characterBloodResonanceCatalog.resonances,
        ...characterBloodResonanceCatalog
          .specialAffinities,
      ]
    ) {
      for (const disciplineKey of definition.disciplineKeys) {
        assert.equal(
          disciplineKeys.has(disciplineKey),
          true,
          `${definition.key}:${disciplineKey}`,
        )
      }
    }
  },
)

test(
  '058-A deriva el bonus base sin inventar beneficios adicionales',
  () => {
    assert.equal(
      deriveCharacterBloodResonanceBaseDiceBonus(
        'fleeting',
      ),
      0,
    )
    assert.equal(
      deriveCharacterBloodResonanceBaseDiceBonus(
        'intense',
      ),
      1,
    )
    assert.equal(
      deriveCharacterBloodResonanceBaseDiceBonus(
        'acute',
      ),
      1,
    )

    assert.throws(
      () =>
        deriveCharacterBloodResonanceBaseDiceBonus(
          'unknown',
        ),
      /Unsupported character blood temperament/,
    )
  },
)

test(
  '058-A publica una instantanea inmutable y equivalente en ESM/CJS',
  () => {
    assert.equal(
      Object.isFrozen(characterBloodResonanceCatalog),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterBloodResonanceCatalog.resonances,
      ),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterBloodResonanceCatalog
          .resonances[0],
      ),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterBloodResonanceCatalog
          .resonances[0].disciplineKeys,
      ),
      true,
    )

    assert.deepEqual(
      commonJsRules.characterBloodResonanceCatalog,
      characterBloodResonanceCatalog,
    )
    assert.equal(
      commonJsRules
        .deriveCharacterBloodResonanceBaseDiceBonus(
          'acute',
        ),
      1,
    )
  },
)

test(
  '058-A conserva referencias normativas estructuradas',
  () => {
    for (
      const resonance of
      characterBloodResonanceCatalog.resonances
    ) {
      assert.equal(resonance.source, 'core')
      assert.equal(resonance.sourcePage, 227)
    }

    for (
      const temperament of
      characterBloodResonanceCatalog.temperaments
    ) {
      assert.equal(temperament.source, 'core')
      assert.equal(temperament.sourcePage, 228)
    }

    const resonanceFree =
      characterBloodResonanceCatalog
        .specialAffinities
        .find(({ key }) => key === 'resonanceFree')

    assert.equal(resonanceFree?.source, 'playersGuide')
    assert.equal(resonanceFree?.sourcePage, 84)
  },
)
