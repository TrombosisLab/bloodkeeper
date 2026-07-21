import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  getOblivionCeremoniesByLevel,
  getOblivionCeremony,
  oblivionCeremonyDefinitions,
} from '../src/features/character-creation/data/oblivion-ceremony-definitions.ts'

import {
  canLearnOblivionCeremony,
} from '../src/features/character-creation/domain/oblivion-ceremony-rules.ts'

test(
  'el catálogo contiene exactamente 9 Ceremonias de Olvido',
  () => {
    assert.equal(
      oblivionCeremonyDefinitions.length,
      9,
    )
  },
)

test(
  'la distribución por niveles de Ceremonias es correcta',
  () => {
    const distribution =
      Object.fromEntries(
        [1, 2, 3, 4, 5].map(
          (level) => [
            level,
            getOblivionCeremoniesByLevel(
              level,
            ).length,
          ],
        ),
      )

    assert.deepEqual(
      distribution,
      {
        1: 2,
        2: 2,
        3: 2,
        4: 2,
        5: 1,
      },
    )
  },
)

test(
  'los nombres de las Ceremonias son los esperados',
  () => {
    assert.deepEqual(
      oblivionCeremonyDefinitions.map(
        (ceremony) =>
          ceremony.name,
      ),
      [
        'Don de Falsa Vida',
        'Invocar Espíritu',
        'Compeler Espíritu',
        'Despertar al Sirviente Homuncular',
        'Hordas Tambaleantes',
        'Hospedar Espíritu',
        'Partir el Velo',
        'Vincular al Espíritu',
        'Bendición Lazarena',
      ],
    )
  },
)

test(
  'todas las Ceremonias proceden de la Guía de Juego',
  () => {
    assert.equal(
      oblivionCeremonyDefinitions.every(
        (ceremony) =>
          ceremony.sourceKey ===
          'players-guide-v5-es',
      ),
      true,
    )
  },
)

test(
  'todas las Ceremonias tienen referencia bibliográfica',
  () => {
    assert.equal(
      oblivionCeremonyDefinitions.every(
        (ceremony) =>
          Number.isInteger(
            ceremony.sourcePage,
          ) &&
          ceremony.sourcePage >= 92 &&
          ceremony.sourcePage <= 96,
      ),
      true,
    )
  },
)

test(
  'las claves de Ceremonias son únicas',
  () => {
    const keys =
      oblivionCeremonyDefinitions.map(
        (ceremony) =>
          ceremony.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'cada Ceremonia tiene exactamente un Poder de Olvido como prerrequisito',
  () => {
    for (
      const ceremony of
      oblivionCeremonyDefinitions
    ) {
      assert.equal(
        ceremony.requirements
          ?.prerequisitePowerKeys
          ?.length,
        1,
        ceremony.name,
      )
    }
  },
)

test(
  'todos los prerrequisitos de Ceremonias existen como Poderes reales de Olvido',
  () => {
    const oblivionPowerKeys =
      new Set(
        disciplinePowerDefinitions
          .filter(
            (power) =>
              power.disciplineKey ===
              'oblivion',
          )
          .map(
            (power) =>
              power.key,
          ),
      )

    for (
      const ceremony of
      oblivionCeremonyDefinitions
    ) {
      const prerequisite =
        ceremony.requirements
          ?.prerequisitePowerKeys?.[0]

      assert.ok(
        prerequisite,
        ceremony.name,
      )

      assert.equal(
        oblivionPowerKeys.has(
          prerequisite,
        ),
        true,
        `${ceremony.name}: ${prerequisite}`,
      )
    }
  },
)

test(
  'las Ceremonias de nivel 1 tienen los prerrequisitos correctos',
  () => {
    assert.deepEqual(
      getOblivionCeremony(
        'oblivion-ceremony-gift-of-false-life',
      )?.requirements
        ?.prerequisitePowerKeys,
      [
        'oblivion-ashes-to-ashes',
      ],
    )

    assert.deepEqual(
      getOblivionCeremony(
        'oblivion-ceremony-summon-spirit',
      )?.requirements
        ?.prerequisitePowerKeys,
      [
        'oblivion-binding-fetter',
      ],
    )
  },
)

test(
  'las Ceremonias de nivel 2 requieren Donde el Velo se Adelgaza',
  () => {
    for (
      const ceremony of
      getOblivionCeremoniesByLevel(
        2,
      )
    ) {
      assert.deepEqual(
        ceremony.requirements
          ?.prerequisitePowerKeys,
        [
          'oblivion-where-the-shroud-thins',
        ],
      )
    }
  },
)

test(
  'las Ceremonias de nivel 3 requieren Aura de Descomposición',
  () => {
    for (
      const ceremony of
      getOblivionCeremoniesByLevel(
        3,
      )
    ) {
      assert.deepEqual(
        ceremony.requirements
          ?.prerequisitePowerKeys,
        [
          'oblivion-aura-of-decay',
        ],
      )
    }
  },
)

test(
  'las Ceremonias de nivel 4 requieren Plaga Necrótica',
  () => {
    for (
      const ceremony of
      getOblivionCeremoniesByLevel(
        4,
      )
    ) {
      assert.deepEqual(
        ceremony.requirements
          ?.prerequisitePowerKeys,
        [
          'oblivion-necrotic-plague',
        ],
      )
    }
  },
)

test(
  'Bendición Lazarena requiere Skuld Cumplido',
  () => {
    assert.deepEqual(
      getOblivionCeremony(
        'oblivion-ceremony-lazarene-blessing',
      )?.requirements
        ?.prerequisitePowerKeys,
      [
        'oblivion-skuld-fulfilled',
      ],
    )
  },
)

test(
  'Don de Falsa Vida es aprendible con Olvido 1 y Cenizas a las Cenizas',
  () => {
    const ceremony =
      getOblivionCeremony(
        'oblivion-ceremony-gift-of-false-life',
      )

    assert.ok(ceremony)

    assert.equal(
      canLearnOblivionCeremony(
        ceremony,
        1,
        [
          'oblivion-ashes-to-ashes',
        ],
      ).valid,
      true,
    )
  },
)

test(
  'Don de Falsa Vida no es aprendible sin su Poder prerrequisito',
  () => {
    const ceremony =
      getOblivionCeremony(
        'oblivion-ceremony-gift-of-false-life',
      )

    assert.ok(ceremony)

    assert.equal(
      canLearnOblivionCeremony(
        ceremony,
        1,
        [],
      ).valid,
      false,
    )
  },
)

test(
  'una Ceremonia no puede aprenderse por encima del nivel actual de Olvido',
  () => {
    const ceremony =
      getOblivionCeremony(
        'oblivion-ceremony-compel-spirit',
      )

    assert.ok(ceremony)

    assert.equal(
      canLearnOblivionCeremony(
        ceremony,
        1,
        [
          'oblivion-where-the-shroud-thins',
        ],
      ).valid,
      false,
    )

    assert.equal(
      canLearnOblivionCeremony(
        ceremony,
        2,
        [
          'oblivion-where-the-shroud-thins',
        ],
      ).valid,
      true,
    )
  },
)
