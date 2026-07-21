import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BLOOD_SORCERY_RITUAL_DEFINITIONS,
  getBloodSorceryRitualDefinition,
  getBloodSorceryRitualDefinitionsByLevel,
} from '../src/features/character-creation/data/blood-sorcery-ritual-definitions.ts'

import {
  canLearnRitualAtDisciplineLevel,
  canSelectRitualAtCharacterCreation,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-rules.ts'

const expectedNames = [
  'Adherencia del Insecto',
  'Camino de la Sangre',
  'Crear Piedrasangre',
  'Despertar con la Frescura de la Tarde',
  'Protección contra Ghouls',
]

test(
  'el catálogo inicial contiene exactamente los 5 Rituales de nivel 1 del manual básico',
  () => {
    assert.equal(
      BLOOD_SORCERY_RITUAL_DEFINITIONS.length,
      5,
    )
  },
)

test(
  'los nombres de los Rituales de nivel 1 son correctos',
  () => {
    assert.deepEqual(
      BLOOD_SORCERY_RITUAL_DEFINITIONS.map(
        (ritual) => ritual.name,
      ),
      expectedNames,
    )
  },
)

test(
  'todos los Rituales del catálogo inicial son de nivel 1',
  () => {
    assert.equal(
      BLOOD_SORCERY_RITUAL_DEFINITIONS.every(
        (ritual) =>
          ritual.level === 1,
      ),
      true,
    )
  },
)

test(
  'todos los Rituales proceden del manual básico V5 en español',
  () => {
    assert.equal(
      BLOOD_SORCERY_RITUAL_DEFINITIONS.every(
        (ritual) =>
          ritual.sourceKey ===
          'core-v5-es',
      ),
      true,
    )
  },
)

test(
  'las referencias bibliográficas de los Rituales de nivel 1 están entre las páginas 276 y 277',
  () => {
    assert.equal(
      BLOOD_SORCERY_RITUAL_DEFINITIONS.every(
        (ritual) =>
          ritual.sourcePage >= 276 &&
          ritual.sourcePage <= 277,
      ),
      true,
    )
  },
)

test(
  'las claves de los Rituales son únicas',
  () => {
    const keys =
      BLOOD_SORCERY_RITUAL_DEFINITIONS.map(
        (ritual) => ritual.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'todos los Rituales de nivel 1 son aprendibles con Hechicería de Sangre 1',
  () => {
    for (
      const ritual of
      BLOOD_SORCERY_RITUAL_DEFINITIONS
    ) {
      assert.equal(
        canLearnRitualAtDisciplineLevel(
          ritual,
          1,
        ).valid,
        true,
      )
    }
  },
)

test(
  'todos los Rituales del catálogo inicial son seleccionables durante creación con Hechicería de Sangre 1 pero no con nivel 0',
  () => {
    for (
      const ritual of
      BLOOD_SORCERY_RITUAL_DEFINITIONS
    ) {
      assert.equal(
        canSelectRitualAtCharacterCreation(
          ritual,
          1,
        ).valid,
        true,
      )

      assert.equal(
        canSelectRitualAtCharacterCreation(
          ritual,
          0,
        ).valid,
        false,
      )
    }
  },
)

test(
  'las funciones de consulta recuperan correctamente Rituales por clave y nivel',
  () => {
    const bloodWalk =
      getBloodSorceryRitualDefinition(
        'blood-sorcery-ritual-blood-walk',
      )

    assert.equal(
      bloodWalk?.name,
      'Camino de la Sangre',
    )

    assert.equal(
      getBloodSorceryRitualDefinitionsByLevel(
        1,
      ).length,
      5,
    )

    assert.deepEqual(
      getBloodSorceryRitualDefinitionsByLevel(
        2,
      ),
      [],
    )
  },
)
