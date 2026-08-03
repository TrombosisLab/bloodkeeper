import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterDisciplineCatalog,
} from '@v5r/character-rules'

import {
  disciplineDefinitions,
} from '../src/features/character-creation/data/discipline-definitions.ts'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  BLOOD_SORCERY_RITUAL_DEFINITIONS,
} from '../src/features/character-creation/data/blood-sorcery-ritual-definitions.ts'

import {
  oblivionCeremonyDefinitions,
} from '../src/features/character-creation/data/oblivion-ceremony-definitions.ts'

import {
  thinBloodAlchemyFormulaCatalog,
} from '../src/features/character-creation/data/thin-blood-alchemy-formulas.ts'

test(
  '029-Q la web resuelve Disciplinas y Poderes desde el paquete compartido',
  () => {
    assert.deepEqual(
      disciplineDefinitions,
      characterDisciplineCatalog.disciplines,
    )
    assert.deepEqual(
      disciplinePowerDefinitions,
      characterDisciplineCatalog.powers,
    )
  },
)

test(
  '029-Q la web resuelve adquisiciones relacionadas desde la misma fuente',
  () => {
    assert.deepEqual(
      BLOOD_SORCERY_RITUAL_DEFINITIONS,
      characterDisciplineCatalog
        .bloodSorceryRituals,
    )
    assert.deepEqual(
      oblivionCeremonyDefinitions,
      characterDisciplineCatalog
        .oblivionCeremonies,
    )
    assert.deepEqual(
      thinBloodAlchemyFormulaCatalog,
      characterDisciplineCatalog
        .thinBloodAlchemyFormulas,
    )
  },
)

test(
  '029-Q la interfaz recibe copias sin poder mutar la fuente compartida',
  () => {
    assert.notEqual(
      disciplineDefinitions,
      characterDisciplineCatalog.disciplines,
    )
    assert.notEqual(
      disciplinePowerDefinitions,
      characterDisciplineCatalog.powers,
    )
    assert.equal(
      Object.isFrozen(
        characterDisciplineCatalog.powers,
      ),
      true,
    )
  },
)
