import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  CharacterInitialVampireApiError,
  createCharacterInitialVampireGateway,
} from '../src/features/character-sheet/infrastructure/character-initial-vampire.api.ts'

const characterId =
  '33333333-3333-4333-8333-333333333333'

function deniedFetch(calls) {
  return async (url, init) => {
    calls.push({
      url: String(url),
      init,
    })

    return new Response(
      JSON.stringify({
        code:
          'INITIAL_VAMPIRE_RESOLUTION_PERMISSION_DENIED',
      }),
      {
        status: 403,
        headers: {
          'Content-Type':
            'application/json',
        },
      },
    )
  }
}

async function capture(operation) {
  const calls = []

  const gateway =
    createCharacterInitialVampireGateway(
      deniedFetch(calls),
    )

  await assert.rejects(
    () => operation(gateway),
    (error) =>
      error instanceof
        CharacterInitialVampireApiError &&
      error.status === 403 &&
      error.code ===
        'INITIAL_VAMPIRE_RESOLUTION_PERMISSION_DENIED',
  )

  assert.equal(calls.length, 1)

  return {
    url: calls[0].url,
    init: calls[0].init,
    body: JSON.parse(
      String(calls[0].init.body),
    ),
  }
}

test(
  '057-F2A3B1 reutiliza literalmente el contrato pending de F2A3A',
  async () => {
    const source =
      await readFile(
        new URL(
          '../src/features/character-sheet/infrastructure/character-initial-vampire.api.ts',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      source,
      /characterEmbracePendingDecisions/,
    )

    assert.doesNotMatch(
      source,
      /deriveCharacterEmbracePendingDecisions|CharacterValidator|validateInitialDisciplineManifestation|analyzeInitialPredatorAdoption/,
    )
  },
)

test(
  '057-F2A3B1 clan usa PATCH dedicado y cuerpo exacto',
  async () => {
    const call =
      await capture(
        gateway =>
          gateway.resolveClan(
            characterId,
            4,
            'brujah',
          ),
      )

    assert.equal(
      call.url,
      `/api/characters/${characterId}/initial-vampire/clan`,
    )
    assert.equal(
      call.init.method,
      'PATCH',
    )
    assert.equal(
      call.init.credentials,
      'include',
    )
    assert.deepEqual(
      call.body,
      {
        expectedRevision: 4,
        clanKey: 'brujah',
      },
    )
  },
)

test(
  '057-F2A3B1 Generación y Sangre conservan DTO backend',
  async () => {
    const generation =
      await capture(
        gateway =>
          gateway.resolveGeneration(
            characterId,
            5,
            13,
          ),
      )

    assert.deepEqual(
      generation.body,
      {
        expectedRevision: 5,
        generation: 13,
      },
    )

    const blood =
      await capture(
        gateway =>
          gateway.establishBlood(
            characterId,
            6,
            1,
            2,
          ),
      )

    assert.deepEqual(
      blood.body,
      {
        expectedRevision: 6,
        bloodPotency: 1,
        hunger: 2,
      },
    )
  },
)

test(
  '057-F2A3B1 Disciplina y Poder usan operaciones separadas',
  async () => {
    const discipline =
      await capture(
        gateway =>
          gateway.manifestDiscipline(
            characterId,
            7,
            'celerity',
            2,
          ),
      )

    assert.equal(
      discipline.url,
      `/api/characters/${characterId}/initial-vampire/discipline`,
    )
    assert.deepEqual(
      discipline.body,
      {
        expectedRevision: 7,
        disciplineKey: 'celerity',
        rating: 2,
      },
    )

    const power =
      await capture(
        gateway =>
          gateway.manifestPower(
            characterId,
            8,
            'celerity',
            'celerity-cats-grace',
          ),
      )

    assert.equal(
      power.url,
      `/api/characters/${characterId}/initial-vampire/power`,
    )
    assert.deepEqual(
      power.body,
      {
        expectedRevision: 8,
        disciplineKey: 'celerity',
        powerKey:
          'celerity-cats-grace',
      },
    )
  },
)

test(
  '057-F2A3B1 revisión de Ventajas no añade presupuesto ni XP',
  async () => {
    const advantages = {
      selections: [],
    }

    const call =
      await capture(
        gateway =>
          gateway.reviewAdvantages(
            characterId,
            9,
            advantages,
          ),
      )

    assert.deepEqual(
      call.body,
      {
        expectedRevision: 9,
        advantages,
      },
    )

    assert.equal(
      Object.hasOwn(
        call.body,
        'xp',
      ),
      false,
    )
  },
)

test(
  '057-F2A3B1 Tipo de Depredador conserva contrato atómico',
  async () => {
    const advantages = {
      selections: [],
    }

    const call =
      await capture(
        gateway =>
          gateway.adoptPredatorType(
            characterId,
            10,
            {
              predatorTypeKey: 'bagger',
              predatorTypeChoices: {
                specialty: 0,
              },
              disciplinePowerKey:
                'obfuscate-cloak-of-shadows',
              advantages,
            },
          ),
      )

    assert.equal(
      call.url,
      `/api/characters/${characterId}/initial-vampire/predator-type`,
    )

    assert.deepEqual(
      call.body,
      {
        expectedRevision: 10,
        predatorTypeKey: 'bagger',
        predatorTypeChoices: {
          specialty: 0,
        },
        disciplinePowerKey:
          'obfuscate-cloak-of-shadows',
        advantages,
      },
    )
  },
)

test(
  '057-F2A3B1 Sangre Débil envía sólo traits, alquimia y revisión',
  async () => {
    const thinBloodTraits = [
      {
        definitionKey:
          'day-drinker',
        clanCurseDetails: null,
        disciplineAffinityDetails:
          null,
      },
    ]

    const thinBloodAlchemy = {
      rating: 0,
      method: null,
      formulaKeys: [],
    }

    const call =
      await capture(
        gateway =>
          gateway.resolveThinBloodState(
            characterId,
            11,
            thinBloodTraits,
            thinBloodAlchemy,
          ),
      )

    assert.equal(
      call.url,
      `/api/characters/${characterId}/initial-vampire/thin-blood`,
    )

    assert.deepEqual(
      call.body,
      {
        expectedRevision: 11,
        thinBloodTraits,
        thinBloodAlchemy,
      },
    )
  },
)

test(
  '057-F2A3B1 consolidación sólo envía expectedRevision',
  async () => {
    const call =
      await capture(
        gateway =>
          gateway.consolidate(
            characterId,
            12,
          ),
      )

    assert.equal(
      call.url,
      `/api/characters/${characterId}/initial-vampire/consolidate`,
    )

    assert.deepEqual(
      call.body,
      {
        expectedRevision: 12,
      },
    )
  },
)

test(
  '057-F2A3B1 conserva detalles estructurados del backend',
  async () => {
    const gateway =
      createCharacterInitialVampireGateway(
        async () =>
          new Response(
            JSON.stringify({
              code:
                'INITIAL_VAMPIRE_PREREQUISITE_PENDING',
              prerequisite:
                'generation',
            }),
            {
              status: 422,
              headers: {
                'Content-Type':
                  'application/json',
              },
            },
          ),
      )

    await assert.rejects(
      () =>
        gateway.establishBlood(
          characterId,
          4,
          1,
          1,
        ),
      (error) => {
        assert.ok(
          error instanceof
            CharacterInitialVampireApiError,
        )
        assert.equal(
          error.status,
          422,
        )
        assert.equal(
          error.code,
          'INITIAL_VAMPIRE_PREREQUISITE_PENDING',
        )
        assert.equal(
          error.details.prerequisite,
          'generation',
        )

        return true
      },
    )
  },
)

test(
  '057-F2A3B1 no duplica catálogos ni reglas V5',
  async () => {
    const source =
      await readFile(
        new URL(
          '../src/features/character-sheet/infrastructure/character-initial-vampire.api.ts',
          import.meta.url,
        ),
        'utf8',
      )

    for (
      const forbidden of [
        'bloodPotencyRanges',
        'predatorTypeDefinitions',
        'disciplineDefinitions',
        'characterAdvantageDefinitions',
        'thinBloodTraitDefinitions',
      ]
    ) {
      assert.equal(
        source.includes(forbidden),
        false,
      )
    }
  },
)
