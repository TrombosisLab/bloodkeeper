import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageCatalog,
  characterDependencyCatalog,
  characterDisciplineCatalog,
} from '@v5r/character-rules'

const expectedKeys = [
  'bagger',
  'osiris',
  'sandman',
  'scene-queen',
  'siren',
  'blood-leech',
  'cleaver',
  'consensualist',
  'alleycat',
  'farmer',
]

test(
  '029-T publica los diez Tipos de Depredador Core',
  () => {
    assert.deepEqual(
      characterDependencyCatalog.predatorTypes.map(
        (definition) => definition.key,
      ),
      expectedKeys,
    )
  },
)

test(
  '029-T resuelve todas las referencias cruzadas del catalogo',
  () => {
    const advantages = new Set(
      characterAdvantageCatalog.definitions.map(
        (definition) => definition.key,
      ),
    )
    const disciplines = new Set(
      characterDisciplineCatalog.disciplines.map(
        (definition) => definition.key,
      ),
    )

    for (
      const predatorType of
        characterDependencyCatalog.predatorTypes
    ) {
      assert.deepEqual(
        predatorType.pendingReferences ?? [],
        [],
      )

      for (
        const grant of
          predatorType.fixedGrants?.advantages ?? []
      ) {
        assert.equal(
          advantages.has(grant.definitionKey),
          true,
        )
      }

      for (const choice of predatorType.choices ?? []) {
        for (const option of choice.options) {
          const grant = option.grant

          if (grant.type === 'advantage') {
            assert.equal(
              advantages.has(grant.definitionKey),
              true,
            )
          }

          if (grant.type === 'discipline') {
            assert.equal(
              disciplines.has(grant.disciplineKey),
              true,
            )
          }
        }
      }
    }
  },
)

test(
  '029-T expone una instantanea compartida inmutable',
  () => {
    assert.equal(
      Object.isFrozen(characterDependencyCatalog),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterDependencyCatalog.predatorTypes,
      ),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterDependencyCatalog.predatorTypes[0],
      ),
      true,
    )
  },
)
