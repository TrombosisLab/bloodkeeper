import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  CharacterEmbraceApiError,
  characterEmbracePendingDecisions,
  createCharacterEmbraceGateway,
  parseCharacterEmbraceResponse,
} from '../src/features/character-sheet/infrastructure/character-embrace.api.ts'

const characterId =
  '11111111-1111-4111-8111-111111111111'

function humanSnapshot() {
  return {
    characterId,
    ownerId:
      '22222222-2222-4222-8222-222222222222',
    chronicleId: null,
    status: 'active',
    nature: 'vampire',
    revision: 9,
    createdAt:
      '2026-08-17T10:00:00.000Z',
    updatedAt:
      '2026-08-17T11:00:00.000Z',
    identity: {
      name: 'Alicia',
      concept: 'Investigadora',
      predatorTypeKey: null,
      ambition: null,
      clanKey: null,
      sire: null,
      desire: null,
      generation: null,
      ageCategory: 'neonate',
    },
    creation: {
      schemaVersion: 1,
      currentStep: 'review',
      creationMode: 'sessionZero',
      skillDistributionMethod:
        'balanced',
      predatorTypeChoices: {},
      updatedAt:
        '2026-08-17T11:00:00.000Z',
    },
    attributes: {
      strength: 2,
      dexterity: 2,
      stamina: 2,
      charisma: 2,
      manipulation: 2,
      composure: 2,
      intelligence: 2,
      wits: 2,
      resolve: 2,
    },
    blood: null,
    damage: {
      health: {
        superficial: 0,
        aggravated: 0,
      },
      willpower: {
        superficial: 0,
        aggravated: 0,
      },
    },
    skills: {
      athletics: 1,
      brawl: 1,
      craft: 1,
      drive: 1,
      firearms: 1,
      larceny: 1,
      melee: 1,
      stealth: 1,
      survival: 1,
      animalKen: 1,
      etiquette: 1,
      insight: 1,
      intimidation: 1,
      leadership: 1,
      performance: 1,
      persuasion: 1,
      streetwise: 1,
      subterfuge: 1,
      academics: 1,
      awareness: 1,
      finance: 1,
      investigation: 1,
      medicine: 1,
      occult: 1,
      politics: 1,
      science: 1,
      technology: 1,
    },
    skillSpecialties: [],
    disciplines: [],
    bloodSorceryRituals: {
      ritualKeys: [],
    },
    oblivionCeremonies: {
      ceremonyKeys: [],
    },
    thinBloodAlchemy: null,
    thinBloodTraits: [],
    advantages: {
      selections: [],
    },
    humanity: {
      value: 7,
      stains: 0,
      convictions: [],
      touchstones: [],
    },
  }
}

test(
  '057-F2A3A parser acepta snapshot vampírico Session Zero y decisiones canónicas',
  () => {
    const result =
      parseCharacterEmbraceResponse({
        character:
          humanSnapshot(),
        pendingDecisions:
          characterEmbracePendingDecisions,
      })

    assert.equal(
      result.character.nature,
      'vampire',
    )
    assert.equal(
      result.character.creation
        .creationMode,
      'sessionZero',
    )
    assert.deepEqual(
      result.pendingDecisions,
      characterEmbracePendingDecisions,
    )
  },
)

test(
  '057-F2A3A parser rechaza decisión inventada',
  () => {
    assert.throws(
      () =>
        parseCharacterEmbraceResponse({
          character:
            humanSnapshot(),
          pendingDecisions: [
            'clan',
            'invented',
          ],
        }),
      CharacterEmbraceApiError,
    )
  },
)

test(
  '057-F2A3A gateway usa POST explícito y sólo expectedRevision',
  async () => {
    let receivedUrl = ''
    let receivedInit

    const gateway =
      createCharacterEmbraceGateway(
        async (url, init) => {
          receivedUrl =
            String(url)
          receivedInit =
            init

          return new Response(
            JSON.stringify({
              character:
                humanSnapshot(),
              pendingDecisions: [
                'clan',
              ],
            }),
            {
              status: 200,
              headers: {
                'Content-Type':
                  'application/json',
              },
            },
          )
        },
      )

    await gateway.embrace(
      characterId,
      8,
    )

    assert.equal(
      receivedUrl,
      `/api/characters/${characterId}/embrace`,
    )
    assert.equal(
      receivedInit?.method,
      'POST',
    )
    assert.equal(
      receivedInit?.credentials,
      'include',
    )
    assert.deepEqual(
      JSON.parse(
        String(receivedInit?.body),
      ),
      {
        expectedRevision: 8,
      },
    )
  },
)

test(
  '057-F2A3A conserva código estructurado del backend',
  async () => {
    const gateway =
      createCharacterEmbraceGateway(
        async () =>
          new Response(
            JSON.stringify({
              code:
                'CHARACTER_EMBRACE_PERMISSION_DENIED',
            }),
            {
              status: 403,
              headers: {
                'Content-Type':
                  'application/json',
              },
            },
          ),
      )

    await assert.rejects(
      () =>
        gateway.embrace(
          characterId,
          8,
        ),
      (error) => {
        assert.ok(
          error instanceof
            CharacterEmbraceApiError,
        )
        assert.equal(
          error.status,
          403,
        )
        assert.equal(
          error.code,
          'CHARACTER_EMBRACE_PERMISSION_DENIED',
        )
        return true
      },
    )
  },
)

const sheet =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/CharacterSheet.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const component =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/PersistedCharacterEmbrace.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const css =
  await readFile(
    new URL(
      '../src/styles/character-sheet.css',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '057-F2A3A muestra acción sólo en ficha HUMAN no archivada',
  () => {
    assert.match(
      sheet,
      /model\?\.profilePhase === 'HUMAN'/,
    )
    assert.match(
      sheet,
      /model\.status !== 'archived'/,
    )
    assert.match(
      sheet,
      /<PersistedCharacterEmbrace/,
    )
    assert.match(
      sheet,
      /revision=\{model\.revision\}/,
    )
    assert.match(
      sheet,
      /onEmbraced=\{onStateReload\}/,
    )
  },
)

test(
  '057-F2A3A exige confirmación explícita y no infiere permisos',
  () => {
    assert.match(
      component,
      /Iniciar Abrazo/,
    )
    assert.match(
      component,
      /Confirmar transición irreversible/,
    )
    assert.match(
      component,
      /Confirmar Abrazo/,
    )
    assert.match(
      component,
      /CHARACTER_EMBRACE_PERMISSION_DENIED/,
    )
    assert.doesNotMatch(
      component,
      /role.*narrator|isNarrator|canEmbrace/,
    )
  },
)

test(
  '057-F2A3A representa conflicto y perfil humano incompleto',
  () => {
    assert.match(
      component,
      /CHARACTER_REVISION_CONFLICT/,
    )
    assert.match(
      component,
      /CHARACTER_HUMAN_PROFILE_INCOMPLETE/,
    )
    assert.match(
      component,
      /Recárgala antes de intentar el Abrazo/,
    )
  },
)

test(
  '057-F2A3A mantiene acción accesible en móvil',
  () => {
    assert.match(
      css,
      /@media \(max-width: 600px\)[\s\S]*\.embrace-section__actions/,
    )
    assert.match(
      component,
      /type="button"/,
    )
    assert.match(
      component,
      /aria-busy=\{busy\}/,
    )
    assert.match(
      component,
      /aria-live=/,
    )
  },
)
