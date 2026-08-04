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
  getCharacterAdvantagesBudget,
} from '../src/features/character-creation/domain/advantage-rules.ts'

import {
  applyCharacterDraftUpdate,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'

import {
  clanAllowed,
  getAvailablePredatorTypeChoiceOptions,
  predatorPendingReferences,
  resolvePredatorTypePointDistributions,
  resolveSelectedPredatorChoices,
  validatePredatorTypePointDistributionGrant,
} from '../src/features/character-creation/domain/predator-type-rules.ts'

import {
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'

const clanCandidates = [
  'tremere',
  'brujah',
  'gangrel',
  'malkavian',
  'nosferatu',
  'toreador',
  'ventrue',
  'banu-haqim',
  'hecata',
  'lasombra',
  'ministry',
  'ravnos',
  'salubri',
  'tzimisce',
]

function validClanFor(
  predatorTypeKey,
) {
  const clanKey =
    clanCandidates.find(
      candidate =>
        clanAllowed(
          predatorTypeKey,
          candidate,
        ),
    )

  assert.ok(
    clanKey,
    `No hay clan válido para ${predatorTypeKey}`,
  )

  return clanKey
}

function selectFirstAvailableChoices(
  definition,
  clanKey,
) {
  const selections = {}

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

    assert.ok(
      available.length > 0 ||
        choice.minimumSelections === 0,
      [
        definition.key,
        choice.id,
        'sin opciones disponibles',
      ].join(': '),
    )

    if (available.length > 1) {
      selections[choice.id] =
        available[0].index
    }
  }

  return selections
}

function compareGrant(
  left,
  right,
) {
  return [
    left.definitionKey,
    left.category,
    left.rating,
  ]
    .join(':')
    .localeCompare(
      [
        right.definitionKey,
        right.category,
        right.rating,
      ].join(':'),
    )
}

function directAdvantageGrants(
  definition,
  clanKey,
  choiceSelections,
) {
  const pending =
    new Set(
      predatorPendingReferences(
        definition.key,
      ),
    )

  const selected =
    resolveSelectedPredatorChoices(
      definition.key,
      {
        clan: clanKey,
      },
      choiceSelections,
    ).filter(
      grant =>
        grant.type ===
        'advantage',
    )

  return [
    ...(
      definition.fixedGrants
        ?.advantages ?? []
    ),
    ...selected,
  ]
    .filter(
      grant =>
        !pending.has(
          grant.definitionKey,
        ),
    )
    .map(
      grant => ({
        definitionKey:
          grant.definitionKey,
        category:
          grant.category,
        rating:
          grant.rating,
      }),
    )
    .sort(compareGrant)
}

function predatorSelections(
  draft,
) {
  return draft.advantages.selections
    .filter(
      selection =>
        selection.origin ===
        'predatorType',
    )
    .map(
      selection => ({
        definitionKey:
          selection.definitionKey,
        category:
          selection.category,
        rating:
          selection.rating,
      }),
    )
    .sort(compareGrant)
}

function createDraftFor(
  definition,
) {
  const clanKey =
    validClanFor(
      definition.key,
    )

  const choiceSelections =
    selectFirstAvailableChoices(
      definition,
      clanKey,
    )

  const draft =
    applyCharacterDraftUpdate(
      structuredClone(
        initialCharacterDraft,
      ),
      current => ({
        ...current,

        identity: {
          ...current.identity,
          name:
            `Matriz ${definition.name}`,
          concept:
            'Prueba E2E Tipo de Depredador',
          clan:
            clanKey,
          generation:
            10,
          predatorType:
            definition.key,
        },

        blood: {
          ...current.blood,
          potency: 2,
        },

        predatorTypeChoices:
          choiceSelections,
      }),
    )

  return {
    clanKey,
    choiceSelections,
    draft,
  }
}

function ordinaryBudgetSelections() {
  return [
    {
      selectionId:
        'matrix-creation-status',
      definitionKey:
        'status',
      category:
        'background',
      rating:
        5,
      origin:
        'creation',
      details: {
        kind:
          'status',
      },
    },
    {
      selectionId:
        'matrix-creation-haven',
      definitionKey:
        'haven',
      category:
        'background',
      rating:
        2,
      origin:
        'creation',
      details: {
        kind:
          'haven',
      },
    },
    {
      selectionId:
        'matrix-creation-illiterate',
      definitionKey:
        'illiterate',
      category:
        'flaw',
      rating:
        2,
      origin:
        'creation',
    },
  ]
}

function completeOrdinaryBudget(
  draft,
) {
  return applyCharacterDraftUpdate(
    draft,
    current => ({
      ...current,

      advantages: {
        selections: [
          ...current.advantages
            .selections,
          ...ordinaryBudgetSelections(),
        ],
      },
    }),
  )
}

function completeRequiredPredatorDetails(
  draft,
) {
  return applyCharacterDraftUpdate(
    draft,
    current => ({
      ...current,

      advantages: {
        selections:
          current.advantages.selections.map(
            selection => {
              if (
                selection.origin ===
                  'predatorType' &&
                selection.definitionKey ===
                  'prey-exclusion' &&
                !selection.details
                  ?.excludedPrey
                  ?.trim()
              ) {
                return {
                  ...selection,

                  details: {
                    ...selection.details,
                    kind:
                      'preyExclusion',
                    excludedPrey:
                      'Mortales',
                  },
                }
              }

              return selection
            },
          ),
      },
    }),
  )
}

test(
  '003-J matriz E2E aplica las concesiones directas de los 10 Tipos de Depredador',
  () => {
    assert.equal(
      predatorTypeDefinitions.length,
      10,
    )

    for (
      const definition of
      predatorTypeDefinitions
    ) {
      const {
        clanKey,
        choiceSelections,
        draft,
      } =
        createDraftFor(
          definition,
        )

      assert.equal(
        draft.identity.predatorType,
        definition.key,
        `${definition.name}: Tipo no conservado`,
      )

      assert.deepEqual(
        predatorSelections(
          draft,
        ),
        directAdvantageGrants(
          definition,
          clanKey,
          choiceSelections,
        ),
        `${definition.name}: concesiones incorrectas`,
      )
    }
  },
)

test(
  '003-J matriz E2E permite editar detalles obligatorios de concesiones automáticas',
  async () => {
    const source =
      await readFile(
        new URL(
          '../src/features/character-creation/components/AdvantagesStep.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    const labelIndex =
      source.indexOf(
        'Concedido por el Tipo de Depredador.',
      )

    assert.notEqual(
      labelIndex,
      -1,
    )

    const automaticCard =
      source.slice(
        Math.max(
          0,
          labelIndex - 2000,
        ),
        labelIndex + 5000,
      )

    assert.match(
      automaticCard,
      /AdvantageInstanceDetailsEditor/,
    )

    assert.match(
      automaticCard,
      /definition\?\.requiresInstanceDetails/,
    )

    assert.match(
      automaticCard,
      /updated\.selectionId/,
    )
  },
)

test(
  '003-J matriz E2E mantiene 7/2 fuera de todas las concesiones depredadoras',
  () => {
    for (
      const definition of
      predatorTypeDefinitions
    ) {
      const {
        draft,
      } =
        createDraftFor(
          definition,
        )

      assert.deepEqual(
        getCharacterAdvantagesBudget(
          draft.advantages,
        ),
        {
          advantagePoints: 0,
          flawPoints: 0,
        },
        `${definition.name}: altera el presupuesto antes de elegir 7/2`,
      )

      const completed =
        completeOrdinaryBudget(
          draft,
        )

      assert.deepEqual(
        getCharacterAdvantagesBudget(
          completed.advantages,
        ),
        {
          advantagePoints: 7,
          flawPoints: 2,
        },
        `${definition.name}: altera el presupuesto 7/2`,
      )

      const configured =
        completeRequiredPredatorDetails(
          completed,
        )

      const validation =
        validateStep(
          'advantages',
          configured,
        )

      assert.deepEqual(
        validation.errors,
        [],
        `${definition.name}: bloquea Ventajas tras completar 7/2`,
      )

      assert.equal(
        validation.valid,
        true,
        `${definition.name}: Ventajas no queda válida`,
      )
    }
  },
)

test(
  '003-J matriz E2E sustituye sólo concesiones del Tipo anterior',
  () => {
    const definitions =
      predatorTypeDefinitions

    for (
      let index = 0;
      index < definitions.length;
      index += 1
    ) {
      const current =
        definitions[index]

      const next =
        definitions[
          (index + 1) %
          definitions.length
        ]

      const initial =
        completeOrdinaryBudget(
          createDraftFor(
            current,
          ).draft,
        )

      const clanKey =
        validClanFor(
          next.key,
        )

      const choices =
        selectFirstAvailableChoices(
          next,
          clanKey,
        )

      const switched =
        applyCharacterDraftUpdate(
          initial,
          draft => ({
            ...draft,

            identity: {
              ...draft.identity,
              clan:
                clanKey,
              predatorType:
                next.key,
            },

            blood: {
              ...draft.blood,
              potency:
                2,
            },

            predatorTypeChoices:
              choices,
          }),
        )

      const ordinary =
        switched.advantages
          .selections
          .filter(
            selection =>
              selection.origin ===
              'creation',
          )

      assert.equal(
        ordinary.length,
        3,
        `${current.name} → ${next.name}: perdió elecciones normales`,
      )

      assert.deepEqual(
        getCharacterAdvantagesBudget(
          switched.advantages,
        ),
        {
          advantagePoints: 7,
          flawPoints: 2,
        },
        `${current.name} → ${next.name}: cambió 7/2`,
      )

      for (
        const selection of
        switched.advantages
          .selections
          .filter(
            candidate =>
              candidate.origin ===
              'predatorType',
          )
      ) {
        assert.match(
          selection.selectionId,
          new RegExp(
            `^predatorType:${next.key}:`,
          ),
          `${current.name} → ${next.name}: queda una concesión anterior`,
        )
      }
    }
  },
)

test(
  '003-J matriz valida todos los repartos de puntos declarados',
  () => {
    for (
      const definition of
      predatorTypeDefinitions
    ) {
      const clanKey =
        validClanFor(
          definition.key,
        )

      const choices =
        selectFirstAvailableChoices(
          definition,
          clanKey,
        )

      const distributions =
        resolvePredatorTypePointDistributions(
          definition.key,
          {
            clan:
              clanKey,
          },
          choices,
        )

      for (
        const distribution of
        distributions
      ) {
        const validation =
          validatePredatorTypePointDistributionGrant(
            distribution,
          )

        assert.deepEqual(
          validation.errors,
          [],
          `${definition.name}: reparto inválido`,
        )

        assert.equal(
          validation.valid,
          true,
          `${definition.name}: reparto no válido`,
        )
      }
    }
  },
)
