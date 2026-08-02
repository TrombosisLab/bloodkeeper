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
