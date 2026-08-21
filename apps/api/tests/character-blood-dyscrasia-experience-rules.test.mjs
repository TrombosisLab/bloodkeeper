import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyCharacterBloodDyscrasiaExperiencePreview,
  assessCharacterBloodDyscrasiaExperience,
  CHARACTER_DYSCRASIA_EXPERIENCE_UNAVAILABLE,
  isCharacterBloodDyscrasiaExperienceBenefit,
  rejectCharacterBloodDyscrasiaExperiencePreview,
} from '../dist/characters/domain/character-blood-dyscrasia-experience.rules.js'

function discipline(
  disciplineKey,
) {
  return {
    kind: 'discipline',
    disciplineKey,
    powerKey:
      `${disciplineKey}-test-power`,
  }
}

function preview(overrides = {}) {
  return {
    characterId: 'character-1',
    revision: 7,
    kind: 'discipline',
    key: 'celerity',
    currentRating: 2,
    newRating: 3,
    cost: 15,
    available: 15,
    eligible: true,
    issues: [],
    consequences: [],
    ...overrides,
  }
}

test('058-E2 fija exactamente las cuatro Discrasias XP y sus dos Disciplinas', () => {
  const cases = {
    energetic: [
      'celerity',
      'potence',
    ],
    evocative: [
      'fortitude',
      'obfuscate',
    ],
    reflection: [
      'auspex',
      'dominate',
    ],
    excited: [
      'bloodSorcery',
      'presence',
    ],
  }

  for (
    const [
      dyscrasiaKey,
      disciplineKeys,
    ]
    of Object.entries(cases)
  ) {
    for (
      const disciplineKey
      of disciplineKeys
    ) {
      const assessment =
        assessCharacterBloodDyscrasiaExperience(
          dyscrasiaKey,
          discipline(
            disciplineKey,
          ),
          true,
        )

      assert.equal(
        assessment.status,
        'available',
      )
      assert.deepEqual(
        assessment.benefit,
        {
          dyscrasiaKey,
          disciplineKey,
          amount: 1,
        },
      )

      assert.equal(
        isCharacterBloodDyscrasiaExperienceBenefit(
          assessment.benefit,
        ),
        true,
      )
    }
  }
})

test('058-E2 no convierte otras Discrasias consumibles/no consumibles en XP', () => {
  for (const key of [
    'aggressive',
    'cycleOfViolence',
    'relaxed',
    'sniffingGame',
  ]) {
    const assessment =
      assessCharacterBloodDyscrasiaExperience(
        key,
        discipline('celerity'),
        true,
      )

    assert.equal(
      assessment.status,
      'unavailable',
    )
  }
})

test('058-E2 opt-in falso no consume ni descuenta nada', () => {
  const assessment =
    assessCharacterBloodDyscrasiaExperience(
      'energetic',
      discipline('celerity'),
      false,
    )

  assert.equal(
    assessment.status,
    'notRequested',
  )
  assert.equal(
    assessment.benefit,
    null,
  )
})

test('058-E2 rechaza no-Disciplina, ausencia activa y Disciplina incompatible', () => {
  assert.equal(
    assessCharacterBloodDyscrasiaExperience(
      'energetic',
      {
        kind: 'attribute',
        key: 'strength',
      },
      true,
    ).status,
    'unavailable',
  )

  assert.equal(
    assessCharacterBloodDyscrasiaExperience(
      null,
      discipline('celerity'),
      true,
    ).status,
    'unavailable',
  )

  assert.equal(
    assessCharacterBloodDyscrasiaExperience(
      'energetic',
      discipline('fortitude'),
      true,
    ).status,
    'unavailable',
  )
})

test('058-E2 14 XP disponibles + coste normativo 15 produce SPEND efectivo 14', () => {
  const assessment =
    assessCharacterBloodDyscrasiaExperience(
      'energetic',
      discipline('celerity'),
      true,
    )

  assert.equal(
    assessment.status,
    'available',
  )

  const result =
    applyCharacterBloodDyscrasiaExperiencePreview(
      preview({
        available: 15,
      }),
      14,
      assessment.benefit,
    )

  assert.equal(result.cost, 14)
  assert.equal(result.available, 14)
  assert.equal(result.eligible, true)
  assert.match(
    result.consequences.at(-1),
    /^dyscrasia_experience:energetic:celerity:-1$/,
  )
})

test('058-E2 un beneficio solicitado pero inválido deja issue estable', () => {
  const result =
    rejectCharacterBloodDyscrasiaExperiencePreview(
      preview(),
      'No disponible.',
    )

  assert.equal(
    result.eligible,
    false,
  )
  assert.equal(
    result.issues.at(-1).code,
    CHARACTER_DYSCRASIA_EXPERIENCE_UNAVAILABLE,
  )
})

test('058-E2 descriptor trusted no admite amount ni Disciplina inventados', () => {
  assert.equal(
    isCharacterBloodDyscrasiaExperienceBenefit({
      dyscrasiaKey: 'energetic',
      disciplineKey: 'celerity',
      amount: 1,
    }),
    true,
  )

  assert.equal(
    isCharacterBloodDyscrasiaExperienceBenefit({
      dyscrasiaKey: 'energetic',
      disciplineKey: 'fortitude',
      amount: 1,
    }),
    false,
  )

  assert.equal(
    isCharacterBloodDyscrasiaExperienceBenefit({
      dyscrasiaKey: 'aggressive',
      disciplineKey: 'celerity',
      amount: 1,
    }),
    false,
  )
})
