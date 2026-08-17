import assert from 'node:assert/strict'
import test from 'node:test'

import {
  analyzeInitialThinBloodResolution,
} from '../dist/characters/domain/character-initial-thin-blood.rules.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

function trait(
  definitionKey,
  overrides = {},
) {
  return {
    definitionKey,
    clanCurseDetails: null,
    disciplineAffinityDetails: null,
    ...overrides,
  }
}

function character(
  overrides = {},
) {
  return {
    identity: {
      clanKey: 'thinBlood',
    },
    disciplines: [],
    ...overrides,
  }
}

const emptyAlchemy = {
  rating: 0,
  method: null,
  formulaKeys: [],
}

test(
  '057-E3C1 acepta 1 Mérito + 1 Defecto sin Alquimista',
  () => {
    const result =
      analyzeInitialThinBloodResolution(
        character(),
        [
          trait('day-drinker'),
          trait('baby-teeth'),
        ],
        emptyAlchemy,
        characterRulesCatalog,
      )

    assert.deepEqual(
      result.issues,
      [],
    )
    assert.notEqual(
      result.plan,
      null,
    )
    assert.equal(
      result.plan.discipline,
      null,
    )
  },
)

test(
  '057-E3C1 exige equilibrio 1..3 y catálogo canónico',
  () => {
    const unbalanced =
      analyzeInitialThinBloodResolution(
        character(),
        [
          trait('day-drinker'),
        ],
        emptyAlchemy,
        characterRulesCatalog,
      )

    assert.ok(
      unbalanced.issues.some(
        ({ code }) =>
          code ===
            'CHARACTER_THIN_BLOOD_FLAW_COUNT_INVALID',
      ),
    )

    const unknown =
      analyzeInitialThinBloodResolution(
        character(),
        [
          trait('unknown'),
          trait('baby-teeth'),
        ],
        emptyAlchemy,
        characterRulesCatalog,
      )

    assert.ok(
      unknown.issues.some(
        ({ code }) =>
          code ===
            'CHARACTER_THIN_BLOOD_TRAIT_UNKNOWN',
      ),
    )
  },
)

test(
  '057-E3C1 Alquimista concede Alquimia 1 + método + una fórmula nivel 1',
  () => {
    const formula =
      characterRulesCatalog
        .disciplineCatalog
        .thinBloodAlchemyFormulas
        .find(
          ({ level }) =>
            level === 1,
        )

    assert.ok(formula)

    const result =
      analyzeInitialThinBloodResolution(
        character(),
        [
          trait(
            'thin-blood-alchemist',
          ),
          trait('vitae-dependency'),
        ],
        {
          rating: 1,
          method: 'fixatio',
          formulaKeys: [
            formula.key,
          ],
        },
        characterRulesCatalog,
      )

    assert.deepEqual(
      result.issues,
      [],
    )
  },
)

test(
  '057-E3C1 Disciplina Afín produce contribución thinBlood 1 + poder',
  () => {
    const disciplineKey =
      characterRulesCatalog
        .disciplineCatalog
        .clanAffinities
        .find(
          ({ kind }) =>
            kind === 'clan',
        )
        .disciplineKeys[0]

    const power =
      characterRulesCatalog
        .disciplineCatalog
        .powers.find(
          (candidate) =>
            candidate.active &&
            candidate.level === 1 &&
            candidate.disciplineKey ===
              disciplineKey &&
            (
              candidate.requirements
                ?.prerequisitePowerKeys
                ?.length ?? 0
            ) === 0 &&
            candidate.requirements
              ?.amalgam === undefined,
        )

    assert.ok(power)

    const result =
      analyzeInitialThinBloodResolution(
        character(),
        [
          trait(
            'discipline-affinity',
            {
              disciplineAffinityDetails: {
                disciplineKey,
                powerKey: power.key,
              },
            },
          ),
          trait('baby-teeth'),
        ],
        emptyAlchemy,
        characterRulesCatalog,
      )

    assert.deepEqual(
      result.issues,
      [],
    )

    assert.deepEqual(
      result.plan.discipline,
      {
        disciplineKey,
        rating: 1,
        powerKeys: [
          power.key,
        ],
        origin: 'thinBlood',
      },
    )
  },
)
