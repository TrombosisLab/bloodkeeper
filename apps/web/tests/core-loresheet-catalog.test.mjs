import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterCoreLoresheetDefinitions,
  getCharacterCoreLoresheetDefinition,
} from '../src/features/character-creation/data/core-loresheet-definitions.ts'

import {
  validateCharacterLoresheetDefinitions,
} from '../src/features/character-creation/domain/loresheet-definition-rules.ts'

test(
  'el catálogo Core de Fichas de Conocimientos es estructuralmente válido',
  () => {
    const result =
      validateCharacterLoresheetDefinitions(
        characterCoreLoresheetDefinitions,
      )

    assert.equal(
      result.valid,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'el catálogo Core contiene únicamente las Fichas Core implementadas',
  () => {
    assert.deepEqual(
      characterCoreLoresheetDefinitions.map(
        (definition) =>
          definition.key,
      ),
      [
        'cainite-heresy',
        'carna',
        'descendant-of-helena',
        'descendant-of-hardestadt',
        'theo-bell',
        'golconda',
      ],
    )
  },
)

test(
  'el lookup Core devuelve null para una clave inexistente',
  () => {
    assert.equal(
      getCharacterCoreLoresheetDefinition(
        'missing',
      ),
      null,
    )
  },
)

test(
  'todas las futuras definiciones del catálogo dedicado deberán pertenecer a fuente core',
  () => {
    assert.equal(
      characterCoreLoresheetDefinitions.every(
        (definition) =>
          definition.source === 'core',
      ),
      true,
    )
  },
)

test(
  'Golconda está registrada como Ficha de Conocimientos Core de la página 389',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'golconda',
      )

    assert.ok(definition)

    assert.equal(
      definition.name,
      'Golconda',
    )

    assert.equal(
      definition.source,
      'core',
    )

    assert.equal(
      definition.sourcePage,
      389,
    )
  },
)

test(
  'Golconda contiene exactamente sus cinco niveles Core',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'golconda',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.benefits.map(
        (benefit) => ({
          name:
            benefit.name,
          level:
            benefit.level,
        }),
      ),
      [
        {
          name:
            'Semillas de Golconda',
          level: 1,
        },
        {
          name:
            'El Único Camino Verdadero',
          level: 2,
        },
        {
          name:
            'Discípulo de Saulot',
          level: 3,
        },
        {
          name:
            'Satisfacer el Ansia',
          level: 4,
        },
        {
          name:
            'Recibir al Sol',
          level: 5,
        },
      ],
    )
  },
)

test(
  'el lookup Core localiza Golconda por su clave estable',
  () => {
    assert.equal(
      getCharacterCoreLoresheetDefinition(
        'golconda',
      )?.key,
      'golconda',
    )

    assert.equal(
      getCharacterCoreLoresheetDefinition(
        'missing',
      ),
      null,
    )
  },
)

test(
  'Carna está registrada como Ficha de Conocimientos Core de la página 385',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'carna',
      )

    assert.ok(definition)

    assert.equal(
      definition.name,
      'Carna',
    )

    assert.equal(
      definition.source,
      'core',
    )

    assert.equal(
      definition.sourcePage,
      385,
    )
  },
)

test(
  'Carna contiene exactamente sus cinco niveles Core',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'carna',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.benefits.map(
        (benefit) => ({
          name:
            benefit.name,
          level:
            benefit.level,
        }),
      ),
      [
        {
          name:
            'Abrazar la Visión',
          level: 1,
        },
        {
          name:
            'El Rastro Rebelde',
          level: 2,
        },
        {
          name:
            'Rituales Poco Ortodoxos',
          level: 3,
        },
        {
          name:
            'Vínculo Reimaginado',
          level: 4,
        },
        {
          name:
            'Libro de la Guerra de las Tumbas',
          level: 5,
        },
      ],
    )
  },
)

test(
  'Carna y Golconda conservan claves de beneficios globalmente independientes',
  () => {
    const keys =
      characterCoreLoresheetDefinitions.flatMap(
        (definition) =>
          definition.benefits.map(
            (benefit) =>
              benefit.key,
          ),
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'Herejía Cainita está registrada como Ficha de Conocimientos Core de la página 384',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'cainite-heresy',
      )

    assert.ok(definition)

    assert.equal(
      definition.name,
      'Herejía Cainita',
    )

    assert.equal(
      definition.source,
      'core',
    )

    assert.equal(
      definition.sourcePage,
      384,
    )
  },
)

test(
  'Herejía Cainita contiene exactamente sus cinco niveles Core',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'cainite-heresy',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.benefits.map(
        (benefit) => ({
          name: benefit.name,
          level: benefit.level,
        }),
      ),
      [
        {
          name: 'El que Tenga Entendimiento',
          level: 1,
        },
        {
          name: 'Mano de la Herejía',
          level: 2,
        },
        {
          name: 'Contra-Inquisición',
          level: 3,
        },
        {
          name: 'Celebrante Rojo',
          level: 4,
        },
        {
          name: 'El Mencionado en la Profecía',
          level: 5,
        },
      ],
    )
  },
)

test(
  'las Fichas Core implementadas conservan claves de beneficios globalmente únicas',
  () => {
    const keys =
      characterCoreLoresheetDefinitions.flatMap(
        (definition) =>
          definition.benefits.map(
            (benefit) =>
              benefit.key,
          ),
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'Descendiente de Hardestadt está registrada como Ficha Core de la página 390',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'descendant-of-hardestadt',
      )

    assert.ok(definition)

    assert.equal(
      definition.name,
      'Descendiente de Hardestadt',
    )

    assert.equal(
      definition.source,
      'core',
    )

    assert.equal(
      definition.sourcePage,
      390,
    )

    assert.deepEqual(
      definition.requirements,
      {
        clanKeys: [
          'ventrue',
        ],
      },
    )
  },
)

test(
  'Descendiente de Hardestadt contiene exactamente sus cinco niveles Core',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'descendant-of-hardestadt',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.benefits.map(
        (benefit) => ({
          name:
            benefit.name,
          level:
            benefit.level,
        }),
      ),
      [
        {
          name:
            'Voz de Hardestadt',
          level: 1,
        },
        {
          name:
            'Líder Supremo',
          level: 2,
        },
        {
          name:
            'Pilar Ventrue',
          level: 3,
        },
        {
          name:
            'Línea con los Fundadores',
          level: 4,
        },
        {
          name:
            'Heredero de Hardestadt',
          level: 5,
        },
      ],
    )
  },
)

test(
  'Descendiente de Hardestadt conserva la restricción exclusiva de clan Ventrue',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'descendant-of-hardestadt',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.requirements?.clanKeys,
      [
        'ventrue',
      ],
    )

    assert.equal(
      definition.requirements
        ?.excludedClanKeys,
      undefined,
    )
  },
)

test(
  'Descendiente de Helena está registrada como Ficha Core de la página 391',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'descendant-of-helena',
      )

    assert.ok(definition)

    assert.equal(
      definition.name,
      'Descendiente de Helena',
    )

    assert.equal(
      definition.source,
      'core',
    )

    assert.equal(
      definition.sourcePage,
      391,
    )

    assert.deepEqual(
      definition.requirements,
      {
        clanKeys: [
          'toreador',
        ],
      },
    )
  },
)

test(
  'Descendiente de Helena contiene exactamente sus cinco niveles Core',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'descendant-of-helena',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.benefits.map(
        (benefit) => ({
          name:
            benefit.name,
          level:
            benefit.level,
        }),
      ),
      [
        {
          name:
            'A Flor de Piel',
          level: 1,
        },
        {
          name:
            'Talento Real',
          level: 2,
        },
        {
          name:
            'Abraza el Estereotipo',
          level: 3,
        },
        {
          name:
            'Pureza Divina',
          level: 4,
        },
        {
          name:
            'Franquicia del Succubus Club',
          level: 5,
        },
      ],
    )
  },
)

test(
  'Descendiente de Helena conserva la restricción exclusiva de clan Toreador',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'descendant-of-helena',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.requirements?.clanKeys,
      [
        'toreador',
      ],
    )

    assert.equal(
      definition.requirements
        ?.excludedClanKeys,
      undefined,
    )
  },
)

test(
  'las restricciones de linaje Hardestadt y Helena permanecen independientes',
  () => {
    const hardestadt =
      getCharacterCoreLoresheetDefinition(
        'descendant-of-hardestadt',
      )

    const helena =
      getCharacterCoreLoresheetDefinition(
        'descendant-of-helena',
      )

    assert.ok(hardestadt)
    assert.ok(helena)

    assert.deepEqual(
      hardestadt.requirements?.clanKeys,
      [
        'ventrue',
      ],
    )

    assert.deepEqual(
      helena.requirements?.clanKeys,
      [
        'toreador',
      ],
    )
  },
)

test(
  'Theo Bell está registrada como Ficha Core de la página 383',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'theo-bell',
      )

    assert.ok(definition)

    assert.equal(
      definition.name,
      'Theo Bell',
    )

    assert.equal(
      definition.source,
      'core',
    )

    assert.equal(
      definition.sourcePage,
      383,
    )
  },
)

test(
  'Theo Bell contiene exactamente sus cinco niveles Core',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'theo-bell',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.benefits.map(
        (benefit) => ({
          name: benefit.name,
          level: benefit.level,
        }),
      ),
      [
        {
          name: 'Rebeldes a la Causa',
          level: 1,
        },
        {
          name: 'Verdadero Anarquista',
          level: 2,
        },
        {
          name: 'Información de Contacto',
          level: 3,
        },
        {
          name: 'Círculo de Bell',
          level: 4,
        },
        {
          name: 'Neutralidad de Secta',
          level: 5,
        },
      ],
    )
  },
)

test(
  'Theo Bell no impone una restricción de clan no indicada por la ficha Core',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'theo-bell',
      )

    assert.ok(definition)

    assert.equal(
      definition.requirements,
      undefined,
    )
  },
)
