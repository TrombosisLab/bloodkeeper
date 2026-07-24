import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  getThinBloodTraitDefinition,
  getThinBloodTraitDefinitionsByCategory,
  thinBloodTraitDefinitions,
} from '../src/features/character-creation/data/thin-blood-trait-definitions.ts'

const EXPECTED_FLAWS = [
  'Carne Muerta',
  'Dependencia de Vitae',
  'Dientes de Leche',
  'Fragilidad Mortal',
  'Maldición de Clan',
  'Marcado por la Camarilla',
  'Rechazado por los Anarquistas',
  'Temperamento Bestial',
]

const EXPECTED_MERITS = [
  'Alquimista de Sangre Débil',
  'Bebedor Diurno',
  'Camaradas Anarquistas',
  'Contacto de la Camarilla',
  'Disciplina Afín',
  'Resiliencia Vampírica',
  'Sangre Vinculante',
  'Vívido',
]

test(
  'CharacterDraft inicial contiene los rasgos de Sangre Débil vacíos',
  () => {
    assert.deepEqual(
      initialCharacterDraft.thinBloodTraits,
      {
        selections: [],
      },
    )
  },
)

test(
  'el catálogo CORE contiene exactamente 16 rasgos de Sangre Débil',
  () => {
    assert.equal(
      thinBloodTraitDefinitions.length,
      16,
    )
  },
)

test(
  'el catálogo CORE contiene exactamente 8 Méritos y 8 Defectos',
  () => {
    const merits =
      getThinBloodTraitDefinitionsByCategory(
        'merit',
      )

    const flaws =
      getThinBloodTraitDefinitionsByCategory(
        'flaw',
      )

    assert.equal(
      merits.length,
      8,
    )

    assert.equal(
      flaws.length,
      8,
    )

    assert.deepEqual(
      merits.map(
        (definition) =>
          definition.name,
      ),
      EXPECTED_MERITS,
    )

    assert.deepEqual(
      flaws.map(
        (definition) =>
          definition.name,
      ),
      EXPECTED_FLAWS,
    )
  },
)

test(
  'las claves del catálogo de Sangre Débil son únicas y estables',
  () => {
    const keys =
      thinBloodTraitDefinitions.map(
        (definition) =>
          definition.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )

    assert.equal(
      keys.every(
        (key) =>
          typeof key === 'string' &&
          key.trim().length > 0,
      ),
      true,
    )
  },
)

test(
  'todos los rasgos del primer catálogo proceden del Libro Básico CORE',
  () => {
    assert.equal(
      thinBloodTraitDefinitions.every(
        (definition) =>
          definition.source === 'core',
      ),
      true,
    )
  },
)

test(
  'el catálogo permite localizar un rasgo por clave sin introducir ratings',
  () => {
    const alchemist =
      getThinBloodTraitDefinition(
        'thin-blood-alchemist',
      )

    assert.ok(alchemist)

    assert.equal(
      alchemist.name,
      'Alquimista de Sangre Débil',
    )

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        alchemist,
        'rating',
      ),
      false,
    )

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        alchemist,
        'allowedRatings',
      ),
      false,
    )
  },
)
