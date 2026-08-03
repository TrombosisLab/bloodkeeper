import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  buildCharacterAdvantageEligibilityContext,
  validateCharacterAdvantageRegulatoryState,
} from '../src/features/character-creation/domain/character-advantage-regulatory-rules.ts'

function draftWithSelection(
  definitionKey,
  rating = 1,
) {
  return {
    ...initialCharacterDraft,
    identity: {
      ...initialCharacterDraft.identity,
      clan: 'caitiff',
      generation: 13,
      predatorType: 'farmer',
    },
    humanity: {
      ...initialCharacterDraft.humanity,
      value: 7,
    },
    advantages: {
      selections: [
        {
          selectionId: 'selection-1',
          definitionKey,
          category: 'merit',
          rating,
          origin: 'creation',
        },
      ],
    },
  }
}

test(
  'construye el contexto reglamentario desde el borrador completo',
  () => {
    const context =
      buildCharacterAdvantageEligibilityContext(
        draftWithSelection(
          'context-merit',
        ),
      )

    assert.deepEqual(
      context,
      {
        characterKind: 'caitiff',
        clanKey: 'caitiff',
        ageCategory: null,
        selectedAdvantages: [
          {
            definitionKey:
              'context-merit',
            rating: 1,
          },
        ],
        predatorTypeKey: 'farmer',
        humanity: 7,
        generation: 13,
      },
    )
  },
)

test(
  'revalida los requisitos cuando cambia un estado previo del personaje',
  () => {
    const definitions = [
      {
        key: 'humane-merit',
        name: 'Mérito humano',
        category: 'merit',
        allowedRatings: [1],
        source: 'core',
        allowMultiple: false,
        requiresInstanceDetails: false,
        requirementRules: [
          {
            type: 'humanity',
            min: 7,
          },
        ],
      },
    ]

    const validDraft =
      draftWithSelection(
        'humane-merit',
      )

    assert.equal(
      validateCharacterAdvantageRegulatoryState(
        validDraft,
        definitions,
      ).valid,
      true,
    )

    const invalidDraft = {
      ...validDraft,
      humanity: {
        ...validDraft.humanity,
        value: 6,
      },
    }

    const result =
      validateCharacterAdvantageRegulatoryState(
        invalidDraft,
        definitions,
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.match(
      result.errors.join('\n'),
      /Humanidad m.nima/,
    )
  },
)

test(
  'combina contrato de catálogo y elegibilidad sin duplicar errores',
  () => {
    const draft =
      draftWithSelection(
        'restricted-merit',
        2,
      )

    const result =
      validateCharacterAdvantageRegulatoryState(
        draft,
        [
          {
            key: 'restricted-merit',
            name: 'Mérito restringido',
            category: 'merit',
            allowedRatings: [1],
            source: 'core',
            allowMultiple: false,
            requiresInstanceDetails: false,
            requirements: {
              characterKinds: ['standard'],
            },
          },
        ],
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          /puntuaci.n 2/.test(
            error,
          ),
      ),
      true,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'tipo caitiff',
          ),
      ),
      true,
    )

    assert.equal(
      new Set(result.errors).size,
      result.errors.length,
    )
  },
)
