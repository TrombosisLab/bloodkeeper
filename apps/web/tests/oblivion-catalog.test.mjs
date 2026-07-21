import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  canLearnDisciplinePower,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

const powers =
  disciplinePowerDefinitions.filter(
    (power) =>
      power.disciplineKey ===
      'oblivion',
  )

function getPower(key) {
  const power =
    powers.find(
      (candidate) =>
        candidate.key === key,
    )

  assert.ok(
    power,
    `No existe el poder ${key}`,
  )

  return power
}

test(
  'Olvido contiene 8 poderes reales en niveles 1 y 2',
  () => {
    const initialPowers =
      powers.filter(
        (power) =>
          power.level === 1 ||
          power.level === 2,
      )

    assert.equal(
      initialPowers.length,
      8,
    )

    assert.equal(
      initialPowers.filter(
        (power) =>
          power.level === 1,
      ).length,
      4,
    )

    assert.equal(
      initialPowers.filter(
        (power) =>
          power.level === 2,
      ).length,
      4,
    )
  },
)

test(
  'Olvido no conserva placeholders DEV',
  () => {
    assert.equal(
      powers.some(
        (power) =>
          power.key.includes('-dev-') ||
          power.sourceKey ===
            'development',
      ),
      false,
    )
  },
)

test(
  'todos los poderes actuales de Olvido proceden de la Guía de Juego',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          power.sourceKey ===
          'players-guide-v5-es',
      ),
      true,
    )
  },
)

test(
  'los poderes de niveles 1 y 2 de Olvido tienen referencia bibliográfica correcta',
  () => {
    const initialPowers =
      powers.filter(
        (power) =>
          power.level === 1 ||
          power.level === 2,
      )

    assert.equal(
      initialPowers.every(
        (power) =>
          Number.isInteger(
            power.sourcePage,
          ) &&
          power.sourcePage >= 85 &&
          power.sourcePage <= 88,
      ),
      true,
    )
  },
)

test(
  'los cuatro poderes de nivel 1 son los esperados',
  () => {
    assert.deepEqual(
      powers
        .filter(
          (power) =>
            power.level === 1,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Cenizas a las Cenizas',
        'El Grillete Vinculante',
        'Manto de Sombras',
        'Visión del Olvido',
      ],
    )
  },
)

test(
  'los cuatro poderes de nivel 2 son los esperados',
  () => {
    assert.deepEqual(
      powers
        .filter(
          (power) =>
            power.level === 2,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Arrojar Sombras',
        'Brazos de Ahrimán',
        'Donde el Velo se Adelgaza',
        'Predicción Fatal',
      ],
    )
  },
)

test(
  'las claves de Olvido son únicas',
  () => {
    const keys =
      powers.map(
        (power) =>
          power.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'Brazos de Ahrimán requiere Potencia 2',
  () => {
    const power =
      getPower(
        'oblivion-arms-of-ahriman',
      )

    assert.deepEqual(
      power.requirements?.amalgam,
      {
        disciplineKey:
          'potence',
        minimumLevel:
          2,
      },
    )
  },
)

test(
  'Brazos de Ahrimán no es aprendible sin Potencia 2',
  () => {
    const power =
      getPower(
        'oblivion-arms-of-ahriman',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'oblivion',
            value: 2,
          },
        ],
        [],
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'Brazos de Ahrimán es aprendible con Olvido 2 y Potencia 2',
  () => {
    const power =
      getPower(
        'oblivion-arms-of-ahriman',
      )

    const result =
      canLearnDisciplinePower(
        power,
        [
          {
            key: 'oblivion',
            value: 2,
          },
          {
            key: 'potence',
            value: 2,
          },
        ],
        [],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'Predicción Fatal requiere Auspex 2',
  () => {
    const power =
      getPower(
        'oblivion-fatal-prediction',
      )

    assert.deepEqual(
      power.requirements?.amalgam,
      {
        disciplineKey:
          'auspex',
        minimumLevel:
          2,
      },
    )
  },
)

test(
  'las claves necesarias para futuras Ceremonias son estables',
  () => {
    assert.ok(
      getPower(
        'oblivion-ashes-to-ashes',
      ),
    )

    assert.ok(
      getPower(
        'oblivion-binding-fetter',
      ),
    )

    assert.ok(
      getPower(
        'oblivion-where-the-shroud-thins',
      ),
    )
  },
)

test(
  'Olvido completo contiene exactamente 18 poderes',
  () => {
    assert.equal(
      powers.length,
      18,
    )
  },
)

test(
  'la distribución completa de Olvido por niveles es correcta',
  () => {
    const distribution =
      Object.fromEntries(
        [1, 2, 3, 4, 5].map(
          (level) => [
            level,
            powers.filter(
              (power) =>
                power.level === level,
            ).length,
          ],
        ),
      )

    assert.deepEqual(
      distribution,
      {
        1: 4,
        2: 4,
        3: 5,
        4: 2,
        5: 3,
      },
    )
  },
)

test(
  'los poderes de nivel 3 de Olvido son los esperados',
  () => {
    assert.deepEqual(
      powers
        .filter(
          (power) =>
            power.level === 3,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Aura de Descomposición',
        'Festín de Pasión',
        'Perspectiva de Sombra',
        'Sirviente Sombrío',
        'Toque de Olvido',
      ],
    )
  },
)

test(
  'los poderes de nivel 4 de Olvido son Manto Estigio y Plaga Necrótica',
  () => {
    assert.deepEqual(
      powers
        .filter(
          (power) =>
            power.level === 4,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Manto Estigio',
        'Plaga Necrótica',
      ],
    )
  },
)

test(
  'los poderes de nivel 5 de Olvido son los esperados',
  () => {
    assert.deepEqual(
      powers
        .filter(
          (power) =>
            power.level === 5,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Avatar Tenebroso',
        'Caminar por las Sombras',
        'Skuld Cumplido',
      ],
    )
  },
)

test(
  'Festín de Pasión requiere Fortaleza 2',
  () => {
    const power =
      getPower(
        'oblivion-passion-feast',
      )

    assert.deepEqual(
      power.requirements?.amalgam,
      {
        disciplineKey:
          'fortitude',
        minimumLevel:
          2,
      },
    )
  },
)

test(
  'Sirviente Sombrío requiere Auspex 1',
  () => {
    const power =
      getPower(
        'oblivion-shadow-servant',
      )

    assert.deepEqual(
      power.requirements?.amalgam,
      {
        disciplineKey:
          'auspex',
        minimumLevel:
          1,
      },
    )
  },
)

test(
  'todos los poderes de Olvido proceden de la Guía de Juego',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          power.sourceKey ===
          'players-guide-v5-es',
      ),
      true,
    )
  },
)

test(
  'todo el catálogo de Olvido tiene trazabilidad entre las páginas 85 y 91',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          Number.isInteger(
            power.sourcePage,
          ) &&
          power.sourcePage >= 85 &&
          power.sourcePage <= 91,
      ),
      true,
    )
  },
)

test(
  'las claves requeridas por futuras Ceremonias de niveles altos son estables',
  () => {
    assert.ok(
      getPower(
        'oblivion-aura-of-decay',
      ),
    )

    assert.ok(
      getPower(
        'oblivion-necrotic-plague',
      ),
    )

    assert.ok(
      getPower(
        'oblivion-skuld-fulfilled',
      ),
    )
  },
)
