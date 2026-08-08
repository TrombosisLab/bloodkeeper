import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateCharacterAttributeSkillState,
} from '../dist/characters/domain/character-attribute-skill.rules.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

import {
  resolvePredatorTypeCreationSkills,
  resolvePredatorTypeSpecialtyGrant,
  resolvePredatorTypeValidationSpecialties,
} from '../dist/characters/domain/predator-type-skill-grant.rules.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

function emptySkills() {
  return Object.fromEntries(
    CHARACTER_SKILL_KEYS.map(
      key => [key, 0],
    ),
  )
}

function clanFor(
  definition,
) {
  const required =
    definition.restrictions
      ?.requiredClans ?? []

  if (required.length > 0) {
    return required[0]
  }

  const excluded =
    new Set(
      definition.restrictions
        ?.excludedClans ?? [],
    )

  return [
    'brujah',
    'gangrel',
    'malkavian',
    'nosferatu',
    'toreador',
    'tremere',
    'ventrue',
    'banu-haqim',
    'hecata',
    'lasombra',
    'ministry',
    'ravnos',
    'salubri',
    'tzimisce',
  ].find(
    clanKey =>
      !excluded.has(clanKey),
  )
}

function optionMatches(
  option,
  clanKey,
) {
  return (
    option.when?.clan === undefined ||
    option.when.clan === clanKey
  )
}

function choicesFor(
  definition,
  clanKey,
) {
  const selections = {}

  for (
    const choice of
      definition.choices ?? []
  ) {
    const available =
      choice.options
        .map(
          (option, index) => ({
            option,
            index,
          }),
        )
        .filter(
          ({ option }) =>
            optionMatches(
              option,
              clanKey,
            ),
        )

    if (available.length > 1) {
      selections[choice.id] =
        available[0].index
    }
  }

  return selections
}

function stateFor(
  definition,
) {
  const clanKey =
    clanFor(definition)

  assert.ok(
    clanKey,
    `${definition.name}: sin clan de prueba`,
  )

  return {
    identity: {
      clanKey,
      predatorTypeKey:
        definition.key,
    },
    creation: {
      predatorTypeChoices:
        choicesFor(
          definition,
          clanKey,
        ),
    },
    skills: emptySkills(),
    skillSpecialties: [],
  }
}

function attributes() {
  return {
    strength: 4,
    dexterity: 3,
    stamina: 3,
    charisma: 3,
    manipulation: 2,
    composure: 2,
    intelligence: 2,
    wits: 2,
    resolve: 1,
  }
}

function balancedSkills(
  excludedSkillKey,
) {
  const skills =
    emptySkills()

  const candidates =
    CHARACTER_SKILL_KEYS.filter(
      key =>
        key !==
          excludedSkillKey &&
        ![
          'academics',
          'craft',
          'performance',
          'science',
        ].includes(key),
    )

  const ratings = [
    ...Array(3).fill(3),
    ...Array(5).fill(2),
    ...Array(7).fill(1),
  ]

  ratings.forEach(
    (rating, index) => {
      skills[
        candidates[index]
      ] = rating
    },
  )

  return skills
}

test(
  'SPEC-021 backend reconoce las dos ramas para los 10 Tipos',
  () => {
    const definitions =
      characterRulesCatalog
        .dependencyCatalog
        .predatorTypes

    assert.equal(
      definitions.length,
      10,
    )

    for (
      const definition of definitions
    ) {
      const value =
        stateFor(definition)

      const grant =
        resolvePredatorTypeSpecialtyGrant(
          value,
          definition,
        )

      assert.ok(
        grant,
        `${definition.name}: falta grant de Especialidad`,
      )

      value.skills[
        grant.skillKey
      ] = 1

      assert.equal(
        resolvePredatorTypeCreationSkills(
          value,
          definition,
        )[grant.skillKey],
        0,
        `${definition.name}: no descuenta punto gratuito`,
      )

      const validationSpecialties =
        resolvePredatorTypeValidationSpecialties(
          value,
          definition,
        )

      assert.equal(
        validationSpecialties.some(
          specialty =>
            specialty.origin ===
              'predatorType' &&
            specialty.skillKey ===
              grant.skillKey &&
            specialty.name ===
              grant.name,
        ),
        true,
        `${definition.name}: la rama de punto no satisface dependencia`,
      )

      const withSpecialty = {
        ...value,
        skillSpecialties: [
          {
            id:
              `predatorType:${definition.key}:specialty:${grant.skillKey}:${grant.name}`,
            skillKey:
              grant.skillKey,
            name:
              grant.name,
            origin:
              'predatorType',
          },
        ],
      }

      assert.equal(
        resolvePredatorTypeCreationSkills(
          withSpecialty,
          definition,
        )[grant.skillKey],
        1,
        `${definition.name}: la rama de Especialidad descuenta un punto que sí es de creación`,
      )
    }
  },
)

test(
  'SPEC-021 validador backend usa reparto base y estado efectivo',
  () => {
    const sandman =
      characterRulesCatalog
        .dependencyCatalog
        .predatorTypes
        .find(
          definition =>
            definition.key ===
            'sandman',
        )

    assert.ok(sandman)

    const value =
      stateFor(sandman)

    const grant =
      resolvePredatorTypeSpecialtyGrant(
        value,
        sandman,
      )

    assert.ok(grant)

    const base =
      balancedSkills(
        grant.skillKey,
      )

    const effective = {
      ...base,
      [grant.skillKey]: 1,
    }

    const specialties = [
      {
        id: 'creation-free',
        skillKey:
          CHARACTER_SKILL_KEYS.find(
            key =>
              base[key] > 0,
          ),
        name: 'Libre',
        origin: 'creation',
      },
      {
        id: 'predator-validation',
        skillKey:
          grant.skillKey,
        name:
          grant.name,
        origin:
          'predatorType',
      },
    ]

    const violations =
      validateCharacterAttributeSkillState(
        attributes(),
        base,
        'balanced',
        'review',
        specialties,
        effective,
      )

    assert.equal(
      violations.includes(
        'SKILL_DISTRIBUTION_INVALID',
      ),
      false,
    )

    assert.equal(
      violations.includes(
        'SKILL_SPECIALTY_WITH_ZERO_RATING',
      ),
      false,
    )
  },
)
