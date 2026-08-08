import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  predatorTypeDefinitions,
} from '../src/features/character-creation/data/predator-type-definitions.ts'

import {
  skillKeys,
} from '../src/features/character-creation/data/skill-definitions.ts'

import {
  applyCharacterDraftUpdate,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'

import {
  clanAllowed,
  getAvailablePredatorTypeChoiceOptions,
} from '../src/features/character-creation/domain/predator-type-rules.ts'

import {
  resolvePredatorTypeCreationSkills,
  resolvePredatorTypeEffectiveSkills,
  resolveSelectedPredatorTypeSpecialtyGrant,
} from '../src/features/character-creation/domain/predator-type-skill-grant-rules.ts'

import {
  validateSkillDistribution,
} from '../src/features/character-creation/domain/skill-rules.ts'

import {
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'

const clans = [
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
]

function clanFor(
  predatorTypeKey,
) {
  return clans.find(
    clanKey =>
      clanAllowed(
        predatorTypeKey,
        clanKey,
      ),
  )
}

function choicesFor(
  definition,
  clanKey,
) {
  const choices = {}

  for (
    const choice of
      definition.choices ?? []
  ) {
    const available =
      getAvailablePredatorTypeChoiceOptions(
        choice,
        {
          clan: clanKey,
        },
      )

    if (available.length > 1) {
      choices[choice.id] =
        available[0].index
    }
  }

  return choices
}

function draftFor(
  definition,
) {
  const clanKey =
    clanFor(definition.key)

  assert.ok(
    clanKey,
    `${definition.name}: sin clan de prueba`,
  )

  return applyCharacterDraftUpdate(
    structuredClone(
      initialCharacterDraft,
    ),
    current => ({
      ...current,
      identity: {
        ...current.identity,
        name:
          `Prueba ${definition.name}`,
        concept:
          'Tipo de Depredador',
        clan: clanKey,
        generation: 13,
        predatorType:
          definition.key,
      },
      predatorTypeChoices:
        choicesFor(
          definition,
          clanKey,
        ),
    }),
  )
}

function balancedCreationSkills(
  excludedSkillKey,
) {
  const skills =
    Object.fromEntries(
      skillKeys.map(
        key => [key, 0],
      ),
    )

  const candidates =
    skillKeys.filter(
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
  'SPEC-021 los 10 Tipos aplican punto o Especialidad de forma alternativa',
  () => {
    assert.equal(
      predatorTypeDefinitions.length,
      10,
    )

    for (
      const definition of
        predatorTypeDefinitions
    ) {
      const freeDot =
        draftFor(definition)

      const grant =
        resolveSelectedPredatorTypeSpecialtyGrant(
          freeDot,
        )

      assert.ok(
        grant,
        `${definition.name}: falta elección de Habilidad`,
      )

      assert.equal(
        freeDot.skills[
          grant.skillKey
        ],
        1,
        `${definition.name}: no concede +1 Habilidad`,
      )

      assert.equal(
        freeDot.skillSpecialties.some(
          specialty =>
            specialty.origin ===
              'predatorType' &&
            specialty.skillKey ===
              grant.skillKey &&
            specialty.name ===
              grant.name,
        ),
        false,
        `${definition.name}: concede también Especialidad con base 0`,
      )

      const creation =
        resolvePredatorTypeCreationSkills(
          freeDot,
        )

      assert.equal(
        creation[
          grant.skillKey
        ],
        0,
        `${definition.name}: el punto gratuito consume reparto`,
      )

      const investedCreation = {
        ...creation,
        [grant.skillKey]: 1,
      }

      const invested =
        applyCharacterDraftUpdate(
          freeDot,
          current => ({
            ...current,
            skills:
              resolvePredatorTypeEffectiveSkills(
                current,
                investedCreation,
              ),
          }),
          {
            creationSkills:
              investedCreation,
          },
        )

      assert.equal(
        invested.skills[
          grant.skillKey
        ],
        1,
        `${definition.name}: el primer punto de creación se suma indebidamente`,
      )

      assert.equal(
        invested.skillSpecialties.some(
          specialty =>
            specialty.origin ===
              'predatorType' &&
            specialty.skillKey ===
              grant.skillKey &&
            specialty.name ===
              grant.name,
        ),
        true,
        `${definition.name}: base 1 no recibe Especialidad`,
      )

      const backToZero = {
        ...investedCreation,
        [grant.skillKey]: 0,
      }

      const reverted =
        applyCharacterDraftUpdate(
          invested,
          current => ({
            ...current,
            skills:
              resolvePredatorTypeEffectiveSkills(
                current,
                backToZero,
              ),
          }),
          {
            creationSkills:
              backToZero,
          },
        )

      assert.equal(
        reverted.skills[
          grant.skillKey
        ],
        1,
      )

      assert.equal(
        reverted.skillSpecialties.some(
          specialty =>
            specialty.origin ===
              'predatorType' &&
            specialty.skillKey ===
              grant.skillKey &&
            specialty.name ===
              grant.name,
        ),
        false,
      )

      const cleared =
        applyCharacterDraftUpdate(
          reverted,
          current => ({
            ...current,
            identity: {
              ...current.identity,
              predatorType: '',
            },
            predatorTypeChoices: {},
          }),
        )

      assert.equal(
        cleared.skills[
          grant.skillKey
        ],
        0,
        `${definition.name}: queda un punto residual al retirar el Tipo`,
      )
    }
  },
)

test(
  'SPEC-021 el punto gratuito queda fuera del reparto equilibrado',
  () => {
    const definition =
      predatorTypeDefinitions.find(
        candidate =>
          candidate.key ===
          'bagger',
      )

    assert.ok(definition)

    const draft =
      draftFor(definition)

    const grant =
      resolveSelectedPredatorTypeSpecialtyGrant(
        draft,
      )

    assert.ok(grant)

    const base =
      balancedCreationSkills(
        grant.skillKey,
      )

    const normalized =
      applyCharacterDraftUpdate(
        draft,
        current => ({
          ...current,
          skills:
            resolvePredatorTypeEffectiveSkills(
              current,
              base,
            ),
        }),
        {
          creationSkills: base,
        },
      )

    assert.equal(
      validateSkillDistribution(
        resolvePredatorTypeCreationSkills(
          normalized,
        ),
        'balanced',
      ).valid,
      true,
    )

    assert.equal(
      normalized.skills[
        grant.skillKey
      ],
      1,
    )
  },
)

test(
  'SPEC-021 Granjero usa Humanidad 8 y las Especialidades muestran su Habilidad',
  async () => {
    const farmer =
      predatorTypeDefinitions.find(
        definition =>
          definition.key ===
          'farmer',
      )

    assert.ok(farmer)

    const farmerDraft =
      draftFor(farmer)

    assert.equal(
      farmerDraft.humanity.value,
      8,
    )

    const result =
      validateStep(
        'humanity',
        farmerDraft,
      )

    assert.equal(
      result.errors.some(
        error =>
          error.includes(
            'Humanidad inicial debe ser',
          ),
      ),
      false,
    )

    const selectorSource =
      await readFile(
        new URL(
          '../src/features/character-creation/components/PredatorTypeChoiceSelector.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      selectorSource,
      /skillDefinitions\.find/,
    )

    assert.match(
      selectorSource,
      /\(\$\{grant\.name\}\)/,
    )
  },
)
