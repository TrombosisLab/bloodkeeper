import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

const powers =
  disciplinePowerDefinitions.filter(
    (power) =>
      power.disciplineKey ===
      'fortitude',
  )

const expectedInventory = [
  {
    key: 'fortitude-resilience',
    name: 'Resiliencia',
    level: 1,
    sourcePage: 258,
  },
  {
    key: 'fortitude-unswayable-mind',
    name: 'Mente Imperturbable',
    level: 1,
    sourcePage: 258,
  },
  {
    key: 'fortitude-enduring-beasts',
    name: 'Bestias Resistentes',
    level: 2,
    sourcePage: 258,
  },
  {
    key: 'fortitude-toughness',
    name: 'Dureza',
    level: 2,
    sourcePage: 259,
  },
  {
    key: 'fortitude-defy-bane',
    name: 'Desafiar Prohibición',
    level: 3,
    sourcePage: 259,
  },
  {
    key: 'fortitude-fortify-inner-facade',
    name: 'Fortificar la Fachada Interior',
    level: 3,
    sourcePage: 259,
  },
  {
    key: 'fortitude-draught-of-endurance',
    name: 'Sorbo de Aguante',
    level: 4,
    sourcePage: 259,
  },
  {
    key: 'fortitude-prowess-from-pain',
    name: 'Arrojo por el Dolor',
    level: 5,
    sourcePage: 259,
  },
  {
    key: 'fortitude-flesh-of-marble',
    name: 'Carne de Mármol',
    level: 5,
    sourcePage: 260,
  },
]

test(
  '025-A8-R3 Fortaleza CORE contiene exactamente 9 Poderes',
  () => {
    assert.equal(
      powers.length,
      9,
    )
  },
)

test(
  '025-A8-R3 la distribución CORE de Fortaleza es 2 2 2 1 2',
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
        1: 2,
        2: 2,
        3: 2,
        4: 1,
        5: 2,
      },
    )
  },
)

test(
  '025-A8-R3 Fortaleza CORE usa el inventario canónico reconciliado',
  () => {
    assert.deepEqual(
      powers.map(
        (power) => ({
          key: power.key,
          name: power.name,
          level: power.level,
          sourcePage:
            power.sourcePage,
        }),
      ),
      expectedInventory,
    )
  },
)

test(
  '025-A8-R3 Bestias Resistentes requiere Animalismo 1',
  () => {
    const power =
      powers.find(
        (candidate) =>
          candidate.key ===
          'fortitude-enduring-beasts',
      )

    assert.ok(power)

    assert.deepEqual(
      power.requirements,
      {
        amalgam: {
          disciplineKey:
            'animalism',
          minimumLevel: 1,
        },
      },
    )
  },
)

test(
  '025-A8-R3 Piel de Sarcófago deja de formar parte del CORE',
  () => {
    assert.equal(
      powers.some(
        (power) =>
          power.key ===
          'fortitude-skin-of-the-sarcophagus',
      ),
      false,
    )
  },
)

test(
  '025-A8-R3 Fortaleza usa exclusivamente fuente core y páginas 258 a 260',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          power.sourceKey ===
            'core-v5-es' &&
          power.sourcePage >=
            258 &&
          power.sourcePage <=
            260,
      ),
      true,
    )
  },
)

test(
  '025-A8-R3 las claves de Fortaleza son únicas y no contienen DEV',
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

    assert.equal(
      keys.some(
        (key) =>
          key.includes(
            '-dev-',
          ),
      ),
      false,
    )
  },
)

test(
  '025-A8-R3 Fortaleza sigue sin mechanics ni diceCheck antes de M1 M2',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          power.mechanics ===
            undefined &&
          power.diceCheck ===
            undefined,
      ),
      true,
    )
  },
)
