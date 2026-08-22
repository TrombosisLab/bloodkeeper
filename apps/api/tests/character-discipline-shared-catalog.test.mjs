import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  characterDisciplineCatalog,
} from '@v5r/character-rules'

function unique(values) {
  return new Set(values).size === values.length
}

test(
  '029-Q publica el catalogo reglamentario compartido de Disciplinas',
  () => {
    assert.equal(
      characterDisciplineCatalog.disciplines.length,
      12,
    )
    assert.equal(
      characterDisciplineCatalog.powers.length,
      106,
    )
    assert.equal(
      characterDisciplineCatalog
        .bloodSorceryRituals.length,
      5,
    )
    assert.equal(
      characterDisciplineCatalog
        .oblivionCeremonies.length,
      9,
    )
    assert.equal(
      characterDisciplineCatalog
        .thinBloodAlchemyFormulas.length,
      36,
    )
  },
)

test(
  '029-Q conserva identidades y relaciones internas coherentes',
  () => {
    const disciplineKeys =
      characterDisciplineCatalog.disciplines.map(
        ({ key }) => key,
      )
    const powerKeys =
      characterDisciplineCatalog.powers.map(
        ({ key }) => key,
      )

    assert.equal(unique(disciplineKeys), true)
    assert.equal(unique(powerKeys), true)

    const disciplineSet = new Set(disciplineKeys)
    const powerSet = new Set(powerKeys)

    for (
      const power of
      characterDisciplineCatalog.powers
    ) {
      assert.equal(
        disciplineSet.has(power.disciplineKey),
        true,
      )
      assert.equal(
        Number.isInteger(power.level) &&
          power.level >= 1 &&
          power.level <= 5,
        true,
      )

      for (
        const prerequisite of
        power.requirements
          ?.prerequisitePowerKeys ?? []
      ) {
        assert.equal(powerSet.has(prerequisite), true)
      }

      const amalgam = power.requirements?.amalgam

      if (amalgam !== undefined) {
        assert.equal(
          disciplineSet.has(amalgam.disciplineKey),
          true,
        )
      }
    }

    for (
      const ceremony of
      characterDisciplineCatalog
        .oblivionCeremonies
    ) {
      for (
        const prerequisite of
        ceremony.requirements
          ?.prerequisitePowerKeys ?? []
      ) {
        assert.equal(powerSet.has(prerequisite), true)
      }
    }
  },
)

test(
  '029-Q expone una instantanea compartida inmutable',
  () => {
    assert.equal(
      Object.isFrozen(characterDisciplineCatalog),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterDisciplineCatalog.disciplines,
      ),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterDisciplineCatalog.powers[0],
      ),
      true,
    )
  },
)

test(
  'SPEC-025 deriva las claves backend del catálogo compartido',
  async () => {
    const source = await readFile(
      new URL(
        '../src/characters/domain/persisted-character.types.ts',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      source,
      /characterDisciplineCatalog\.disciplines\.map/,
    )
    assert.doesNotMatch(
      source,
      /export const CHARACTER_DISCIPLINE_KEYS = \[\s*'animalism'/,
    )
  },
)
