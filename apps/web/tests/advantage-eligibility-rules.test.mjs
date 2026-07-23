import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateCharacterAdvantageEligibility,
} from '../src/features/character-creation/domain/advantage-eligibility-rules.ts'

function createDefinition(
  requirements,
) {
  return {
    key: 'test-advantage',
    name: 'Ventaja de Prueba',
    category: 'merit',
    allowedRatings: [1],
    source: 'core',
    allowMultiple: false,
    requiresInstanceDetails: false,
    requirements,
  }
}

test(
  'una Ventaja sin requisitos es elegible',
  () => {
    const result =
      validateCharacterAdvantageEligibility(
        createDefinition(undefined),
        {
          characterKind: 'standard',
          clanKey: null,
          ageCategory: null,
        },
      )

    assert.deepEqual(
      result,
      {
        eligible: true,
        errors: [],
      },
    )
  },
)

test(
  'la elegibilidad general respeta tipos de personaje',
  () => {
    const definition =
      createDefinition({
        characterKinds: ['thinBlood'],
      })

    const invalid =
      validateCharacterAdvantageEligibility(
        definition,
        {
          characterKind: 'standard',
          clanKey: null,
          ageCategory: null,
        },
      )

    assert.equal(
      invalid.eligible,
      false,
    )

    const valid =
      validateCharacterAdvantageEligibility(
        definition,
        {
          characterKind: 'thinBlood',
          clanKey: null,
          ageCategory: null,
        },
      )

    assert.equal(
      valid.eligible,
      true,
    )
  },
)

test(
  'la elegibilidad general respeta clanes permitidos y excluidos',
  () => {
    const allowed =
      createDefinition({
        clanKeys: ['brujah'],
      })

    assert.equal(
      validateCharacterAdvantageEligibility(
        allowed,
        {
          characterKind: 'standard',
          clanKey: 'brujah',
          ageCategory: null,
        },
      ).eligible,
      true,
    )

    assert.equal(
      validateCharacterAdvantageEligibility(
        allowed,
        {
          characterKind: 'standard',
          clanKey: 'toreador',
          ageCategory: null,
        },
      ).eligible,
      false,
    )

    const excluded =
      createDefinition({
        excludedClanKeys: ['brujah'],
      })

    assert.equal(
      validateCharacterAdvantageEligibility(
        excluded,
        {
          characterKind: 'standard',
          clanKey: 'brujah',
          ageCategory: null,
        },
      ).eligible,
      false,
    )
  },
)

test(
  'una categoría mínima ancilla rechaza neonatos',
  () => {
    const definition =
      createDefinition({
        minimumAgeCategory: 'ancilla',
      })

    const result =
      validateCharacterAdvantageEligibility(
        definition,
        {
          characterKind: 'standard',
          clanKey: null,
          ageCategory: 'neonate',
        },
      )

    assert.equal(
      result.eligible,
      false,
    )
  },
)

test(
  'una categoría mínima ancilla acepta ancillae y antiguos',
  () => {
    const definition =
      createDefinition({
        minimumAgeCategory: 'ancilla',
      })

    for (
      const ageCategory of [
        'ancilla',
        'elder',
      ]
    ) {
      const result =
        validateCharacterAdvantageEligibility(
          definition,
          {
            characterKind: 'standard',
            clanKey: null,
            ageCategory,
          },
        )

      assert.equal(
        result.eligible,
        true,
      )
    }
  },
)

test(
  'un requisito etario no se valida si la edad es desconocida',
  () => {
    const definition =
      createDefinition({
        minimumAgeCategory: 'ancilla',
      })

    const result =
      validateCharacterAdvantageEligibility(
        definition,
        {
          characterKind: 'standard',
          clanKey: null,
          ageCategory: null,
        },
      )

    assert.equal(
      result.eligible,
      false,
    )

    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'categoría etaria conocida',
          ),
      ),
    )
  },
)

test(
  'la elegibilidad general respeta definiciones requeridas',
  () => {
    const definition =
      createDefinition({
        requiredDefinitionKeys: [
          'required-merit',
        ],
      })

    const invalid =
      validateCharacterAdvantageEligibility(
        definition,
        {
          characterKind: 'standard',
          clanKey: null,
          ageCategory: null,
          selectedDefinitionKeys: [],
        },
      )

    assert.equal(
      invalid.eligible,
      false,
    )

    const valid =
      validateCharacterAdvantageEligibility(
        definition,
        {
          characterKind: 'standard',
          clanKey: null,
          ageCategory: null,
          selectedDefinitionKeys: [
            'required-merit',
          ],
        },
      )

    assert.equal(
      valid.eligible,
      true,
    )
  },
)
