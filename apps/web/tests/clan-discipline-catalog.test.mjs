import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  clanDefinitions,
  getClanDefinition,
} from '../src/features/character-creation/data/clan-definitions.ts'

import {
  disciplineDefinitions,
  disciplineKeys,
} from '../src/features/character-creation/data/discipline-definitions.ts'

test(
  'las claves de clan son únicas',
  () => {
    const keys =
      clanDefinitions.map(
        (clan) => clan.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'las claves de disciplina son únicas',
  () => {
    const keys =
      disciplineDefinitions.map(
        (discipline) =>
          discipline.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'todas las disciplinas de clan existen en el catálogo',
  () => {
    for (
      const clan of
        clanDefinitions
    ) {
      for (
        const discipline of
          clan.inClanDisciplines
      ) {
        assert.ok(
          disciplineKeys.includes(
            discipline,
          ),
          `${clan.name}: disciplina inexistente ${discipline}`,
        )
      }
    }
  },
)

test(
  'cada clan normal tiene exactamente tres disciplinas de clan',
  () => {
    const normalClans =
      clanDefinitions.filter(
        (clan) =>
          clan.kind === 'clan',
      )

    for (
      const clan of normalClans
    ) {
      assert.equal(
        clan.inClanDisciplines.length,
        3,
        clan.name,
      )

      assert.equal(
        new Set(
          clan.inClanDisciplines,
        ).size,
        3,
        clan.name,
      )
    }
  },
)

test(
  'Caitiff y Sangre Débil quedan modelados como casos especiales',
  () => {
    const caitiff =
      getClanDefinition(
        'caitiff',
      )

    const thinBlood =
      getClanDefinition(
        'thinBlood',
      )

    assert.equal(
      caitiff.kind,
      'caitiff',
    )

    assert.deepEqual(
      caitiff.inClanDisciplines,
      [],
    )

    assert.equal(
      thinBlood.kind,
      'thinBlood',
    )

    assert.deepEqual(
      thinBlood.inClanDisciplines,
      [],
    )
  },
)

test(
  'Brujah conserva sus tres disciplinas de clan',
  () => {
    assert.deepEqual(
      getClanDefinition(
        'brujah',
      ).inClanDisciplines,
      [
        'celerity',
        'potence',
        'presence',
      ],
    )
  },
)

test(
  'el catálogo contiene los clanes y casos especiales previstos',
  () => {
    assert.equal(
      clanDefinitions.length,
      16,
    )
  },
)

test(
  'SPEC-025 deriva las afinidades de Clan del catálogo compartido',
  async () => {
    const source = await readFile(
      new URL(
        '../src/features/character-creation/data/clan-definitions.ts',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      source,
      /characterDisciplineCatalog\.clanAffinities/,
    )
    assert.doesNotMatch(
      source,
      /\{\s*key: 'brujah',[^\n]*inClanDisciplines:/,
    )
    assert.match(
      source,
      /inClanDisciplines:\s*\[\s*\.\.\.affinity\.disciplineKeys/,
    )
  },
)
