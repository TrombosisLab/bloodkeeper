import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyCharacterDisciplineResonanceEvidence,
  assessCharacterDisciplineResonanceEvidence,
  CHARACTER_DISCIPLINE_RESONANCE_EVIDENCE_REQUIRED,
} from '../dist/characters/domain/character-discipline-resonance-evidence.rules.js'

function operation({
  operationId = 'feed-1',
  resonanceKey = 'choleric',
  specialAffinityKey = null,
  temperament = 'fleeting',
  createdAt = new Date(
    '2026-08-20T18:00:00.000Z',
  ),
} = {}) {
  return {
    characterId: 'character-1',
    operationId,
    sourceKind:
      specialAffinityKey === 'animalBlood'
        ? 'animal'
        : 'human',
    resonanceKey,
    specialAffinityKey,
    temperament,
    dyscrasiaKey: null,
    dyscrasiaAcquisitionMode: null,
    hungerSlaked: 1,
    hungerBefore: 3,
    hungerAfter: 2,
    createdAt,
  }
}

function preview(overrides = {}) {
  return {
    characterId: 'character-1',
    revision: 4,
    kind: 'discipline',
    key: 'celerity',
    currentRating: 1,
    newRating: 2,
    cost: 10,
    available: 20,
    eligible: true,
    issues: [],
    consequences: [
      'discipline_cost_class:clan',
      'selected_power:celerity-rapid-reflexes',
    ],
    ...overrides,
  }
}

test('058-E1 reconoce las cuatro Resonancias humorales para sus Disciplinas', () => {
  const cases = [
    ['choleric', 'celerity'],
    ['choleric', 'potence'],
    ['melancholy', 'fortitude'],
    ['melancholy', 'obfuscate'],
    ['phlegmatic', 'auspex'],
    ['phlegmatic', 'dominate'],
    ['sanguine', 'bloodSorcery'],
    ['sanguine', 'presence'],
  ]

  for (const [resonanceKey, disciplineKey] of cases) {
    const assessment =
      assessCharacterDisciplineResonanceEvidence(
        [
          operation({
            resonanceKey,
          }),
        ],
        disciplineKey,
      )

    assert.equal(
      assessment.status,
      'matched',
    )
    assert.equal(
      assessment.evidence?.disciplineKey,
      disciplineKey,
    )
  }
})

test('058-E1 animalBlood acredita Animalismo/Protean y resonanceFree acredita Olvido sin quinta Resonancia', () => {
  for (const disciplineKey of [
    'animalism',
    'protean',
  ]) {
    const assessment =
      assessCharacterDisciplineResonanceEvidence(
        [
          operation({
            resonanceKey: null,
            specialAffinityKey:
              'animalBlood',
            temperament: 'fleeting',
          }),
        ],
        disciplineKey,
      )

    assert.equal(
      assessment.status,
      'matched',
    )
  }

  const oblivion =
    assessCharacterDisciplineResonanceEvidence(
      [
        operation({
          resonanceKey: null,
          specialAffinityKey:
            'resonanceFree',
          temperament: null,
        }),
      ],
      'oblivion',
    )

  assert.equal(
    oblivion.status,
    'matched',
  )
  assert.equal(
    oblivion.evidence?.resonanceKey,
    null,
  )
})

test('058-E1 usa la evidencia compatible más reciente', () => {
  const older =
    operation({
      operationId: 'feed-old',
      createdAt:
        new Date('2026-08-20T17:00:00Z'),
    })

  const newer =
    operation({
      operationId: 'feed-new',
      createdAt:
        new Date('2026-08-20T19:00:00Z'),
    })

  const assessment =
    assessCharacterDisciplineResonanceEvidence(
      [older, newer],
      'celerity',
    )

  assert.equal(
    assessment.status,
    'matched',
  )
  assert.equal(
    assessment.evidence?.operationId,
    'feed-new',
  )
})

test('058-E1 historial estructurado sin Resonancia compatible bloquea explícitamente', () => {
  const result =
    applyCharacterDisciplineResonanceEvidence(
      preview(),
      {
        kind: 'discipline',
        disciplineKey: 'celerity',
        powerKey:
          'celerity-rapid-reflexes',
      },
      [
        operation({
          resonanceKey: 'sanguine',
        }),
      ],
    )

  assert.equal(result.eligible, false)
  assert.equal(
    result.issues.at(-1)?.code,
    CHARACTER_DISCIPLINE_RESONANCE_EVIDENCE_REQUIRED,
  )
  assert.match(
    result.issues.at(-1)?.message ?? '',
    /No consta una alimentación/,
  )
})

test('058-E1 sin historial estructurado preserva compatibilidad histórica sin inventar evidencia', () => {
  const assessment =
    assessCharacterDisciplineResonanceEvidence(
      [],
      'celerity',
    )

  assert.equal(
    assessment.status,
    'compatibilityUnverified',
  )

  const result =
    applyCharacterDisciplineResonanceEvidence(
      preview(),
      {
        kind: 'discipline',
        disciplineKey: 'celerity',
        powerKey:
          'celerity-rapid-reflexes',
      },
      [],
    )

  assert.equal(result.eligible, true)
  assert.equal(result.issues.length, 0)
  assert.match(
    result.consequences.at(-1) ?? '',
    /compatibilidad/,
  )
})

test('058-E1 evidencia coincidente mantiene elegibilidad y deja explicación', () => {
  const result =
    applyCharacterDisciplineResonanceEvidence(
      preview(),
      {
        kind: 'discipline',
        disciplineKey: 'celerity',
        powerKey:
          'celerity-rapid-reflexes',
      },
      [operation()],
    )

  assert.equal(result.eligible, true)
  assert.match(
    result.consequences.at(-1) ?? '',
    /acreditada/,
  )
})

test('058-E1 nueva Disciplina fuera de Clan conserva requisito de donante como explicación no automatizada', () => {
  const result =
    applyCharacterDisciplineResonanceEvidence(
      preview({
        currentRating: 0,
        newRating: 1,
        consequences: [
          'discipline_cost_class:other',
          'selected_power:test-power',
        ],
      }),
      {
        kind: 'discipline',
        disciplineKey: 'celerity',
        powerKey: 'test-power',
      },
      [operation()],
    )

  assert.equal(result.eligible, true)
  assert.equal(
    result.consequences.some(
      (value) =>
        value.includes(
          'sangre de alguien que posea',
        ),
    ),
    true,
  )
  assert.equal(
    result.consequences.some(
      (value) =>
        value.includes(
          'todavía no dispone de un donante verificable',
        ),
    ),
    true,
  )
})

test('058-E1 no afecta avances que no son Disciplina', () => {
  const base =
    preview({
      kind: 'attribute',
      key: 'strength',
      consequences: [],
    })

  const result =
    applyCharacterDisciplineResonanceEvidence(
      base,
      {
        kind: 'attribute',
        key: 'strength',
      },
      [operation()],
    )

  assert.equal(result, base)
})
