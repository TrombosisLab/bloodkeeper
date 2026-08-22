import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  disciplineDefinitions,
} from '../src/features/character-creation/data/discipline-definitions.ts'
import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'
import {
  contentSources,
} from '../src/features/character-creation/data/content-sources.ts'
import {
  demoDisciplines,
} from '../src/features/character-sheet/data/demo-disciplines.ts'
import {
  buildCharacterDisciplineReadModel,
} from '../src/features/character-sheet/domain/character-discipline-read-model.ts'

const demoSource = await readFile(
  new URL(
    '../src/features/character-sheet/data/demo-disciplines.ts',
    import.meta.url,
  ),
  'utf8',
)

const sheetComponent = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterDisciplines.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  '025-D resuelve la ficha desde los catálogos canónicos',
  () => {
    const result =
      buildCharacterDisciplineReadModel(
        demoDisciplines,
        disciplineDefinitions,
        disciplinePowerDefinitions,
        contentSources,
      )

    assert.equal(result[0].name, 'Celeridad')
    assert.equal(
      result[0].powers[0].name,
      'Gracia Felina',
    )
    assert.equal(result[0].powers[0].level, 1)
  },
)

test(
  '025-D mantiene en el estado solo claves y puntuaciones',
  () => {
    assert.doesNotMatch(demoSource, /\bname:/)
    assert.doesNotMatch(demoSource, /\blevel:/)
    assert.match(demoSource, /powerKeys:/)
  },
)

test(
  '025-D conserva referencias desconocidas sin inventar datos',
  () => {
    const result =
      buildCharacterDisciplineReadModel(
        [
          {
            key: 'future-discipline',
            value: 1,
            powerKeys: ['future-power'],
          },
        ],
        disciplineDefinitions,
        disciplinePowerDefinitions,
        contentSources,
      )

    assert.equal(
      result[0].catalogStatus,
      'missing',
    )
    assert.equal(
      result[0].powers[0].catalogStatus,
      'missing',
    )
    assert.equal(result[0].powers[0].level, null)
  },
)

test(
  '025-D no atribuye un Poder a la Disciplina equivocada',
  () => {
    const result =
      buildCharacterDisciplineReadModel(
        [
          {
            key: 'potence',
            value: 1,
            powerKeys: ['presence-awe'],
          },
        ],
        disciplineDefinitions,
        disciplinePowerDefinitions,
        contentSources,
      )

    assert.equal(
      result[0].powers[0].catalogStatus,
      'missing',
    )
    assert.equal(
      result[0].powers[0].name,
      'presence-awe',
    )
  },
)

test(
  '025-D conecta la ficha con el modelo de lectura',
  () => {
    assert.match(
      sheetComponent,
      /buildCharacterDisciplineReadModel\(/,
    )
    assert.match(
      sheetComponent,
      /disciplineDefinitions/,
    )
    assert.match(
      sheetComponent,
      /disciplinePowerDefinitions/,
    )
  },
)

test(
  '025-A1-M3 transporta mecánicas presentadas desde el catálogo compartido',
  () => {
    const result =
      buildCharacterDisciplineReadModel(
        [
          {
            key: 'obfuscate',
            value: 4,
            powerKeys: [
              'obfuscate-conceal',
            ],
          },
          {
            key: 'celerity',
            value: 1,
            powerKeys: [
              'celerity-cats-grace',
            ],
          },
        ],
        disciplineDefinitions,
        disciplinePowerDefinitions,
        contentSources,
      )

    const conceal =
      result[0].powers[0]
    const catsGrace =
      result[1].powers[0]

    assert.ok(conceal.mechanics)
    assert.equal(
      conceal.mechanics.cost,
      '1 Control de Enardecimiento',
    )
    assert.equal(
      conceal.mechanics.checks[0].detail,
      'Inteligencia + Ofuscación · Dificultad 2–6',
    )

    /* A4-M2: eliminada expectativa histórica de ausencia de mechanics;
     las Disciplinas futuras pueden incorporarlas sin romper el read-model. */
  },
)
