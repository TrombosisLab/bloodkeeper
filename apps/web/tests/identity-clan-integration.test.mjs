import assert from 'node:assert/strict'
import test from 'node:test'

import {
  clanDefinitions,
  getClanDefinition,
  getClanName,
} from '../src/features/character-creation/data/clan-definitions.ts'

test(
  'todos los clanes tienen nombre visible',
  () => {
    for (
      const clan of clanDefinitions
    ) {
      assert.ok(
        clan.name.trim().length > 0,
        clan.key,
      )
    }
  },
)

test(
  'la clave de clan resuelve siempre a su definición',
  () => {
    for (
      const clan of clanDefinitions
    ) {
      assert.equal(
        getClanDefinition(
          clan.key,
        ).key,
        clan.key,
      )
    }
  },
)

test(
  'getClanName devuelve el nombre visible correcto',
  () => {
    assert.equal(
      getClanName(
        'banuHaqim',
      ),
      'Banu Haqim',
    )

    assert.equal(
      getClanName(
        'thinBlood',
      ),
      'Sangre Débil',
    )
  },
)
