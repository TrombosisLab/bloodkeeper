import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateCharacterLoresheetEligibility,
} from '../src/features/character-creation/domain/loresheet-eligibility-rules.ts'

import {
  validateCharacterLoresheetDefinitions,
} from '../src/features/character-creation/domain/loresheet-definition-rules.ts'

const benefits = [
  {
    key: 'benefit-1',
    name: 'Ventaja I',
    level: 1,
  },
  {
    key: 'benefit-2',
    name: 'Ventaja II',
    level: 2,
  },
  {
    key: 'benefit-3',
    name: 'Ventaja III',
    level: 3,
  },
  {
    key: 'benefit-4',
    name: 'Ventaja IV',
    level: 4,
  },
  {
    key: 'benefit-5',
    name: 'Ventaja V',
    level: 5,
  },
]

function createLoresheet(
  requirements,
) {
  return {
    key: 'test-loresheet',
    name: 'Ficha de prueba',
    source: 'core',
    requirements,
    benefits,
  }
}

test(
  'una ficha sin requisitos está disponible',
  () => {
    const result =
      validateCharacterLoresheetEligibility(
        createLoresheet(undefined),
        {
          characterKind: 'standard',
          clanKey: 'brujah',
        },
      )

    assert.equal(
      result.eligible,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'permite un tipo de personaje incluido explícitamente',
  () => {
    const result =
      validateCharacterLoresheetEligibility(
        createLoresheet({
          characterKinds: [
            'standard',
          ],
        }),
        {
          characterKind: 'standard',
          clanKey: 'brujah',
        },
      )

    assert.equal(
      result.eligible,
      true,
    )
  },
)

test(
  'rechaza un tipo de personaje no permitido',
  () => {
    const result =
      validateCharacterLoresheetEligibility(
        createLoresheet({
          characterKinds: [
            'standard',
          ],
        }),
        {
          characterKind: 'thin-blood',
          clanKey: null,
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
            'no está disponible para personajes de tipo',
          ),
      ),
    )
  },
)

test(
  'permite un clan incluido explícitamente',
  () => {
    const result =
      validateCharacterLoresheetEligibility(
        createLoresheet({
          clanKeys: [
            'brujah',
            'toreador',
          ],
        }),
        {
          characterKind: 'standard',
          clanKey: 'brujah',
        },
      )

    assert.equal(
      result.eligible,
      true,
    )
  },
)

test(
  'rechaza un clan fuera de la lista permitida',
  () => {
    const result =
      validateCharacterLoresheetEligibility(
        createLoresheet({
          clanKeys: [
            'brujah',
          ],
        }),
        {
          characterKind: 'standard',
          clanKey: 'ventrue',
        },
      )

    assert.equal(
      result.eligible,
      false,
    )
  },
)

test(
  'una restricción positiva de clan rechaza un personaje sin clan definido',
  () => {
    const result =
      validateCharacterLoresheetEligibility(
        createLoresheet({
          clanKeys: [
            'brujah',
          ],
        }),
        {
          characterKind: 'standard',
          clanKey: null,
        },
      )

    assert.equal(
      result.eligible,
      false,
    )
  },
)

test(
  'rechaza un clan excluido explícitamente',
  () => {
    const result =
      validateCharacterLoresheetEligibility(
        createLoresheet({
          excludedClanKeys: [
            'ventrue',
          ],
        }),
        {
          characterKind: 'standard',
          clanKey: 'ventrue',
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
            'excluye el clan ventrue',
          ),
      ),
    )
  },
)

test(
  'permite un clan no incluido en las exclusiones',
  () => {
    const result =
      validateCharacterLoresheetEligibility(
        createLoresheet({
          excludedClanKeys: [
            'ventrue',
          ],
        }),
        {
          characterKind: 'standard',
          clanKey: 'brujah',
        },
      )

    assert.equal(
      result.eligible,
      true,
    )
  },
)

test(
  'combina restricciones de tipo de personaje y clan',
  () => {
    const definition =
      createLoresheet({
        characterKinds: [
          'standard',
        ],
        clanKeys: [
          'brujah',
        ],
      })

    assert.equal(
      validateCharacterLoresheetEligibility(
        definition,
        {
          characterKind: 'standard',
          clanKey: 'brujah',
        },
      ).eligible,
      true,
    )

    assert.equal(
      validateCharacterLoresheetEligibility(
        definition,
        {
          characterKind: 'thin-blood',
          clanKey: 'brujah',
        },
      ).eligible,
      false,
    )

    assert.equal(
      validateCharacterLoresheetEligibility(
        definition,
        {
          characterKind: 'standard',
          clanKey: 'ventrue',
        },
      ).eligible,
      false,
    )
  },
)

test(
  'la validación estructural rechaza permitir y excluir simultáneamente el mismo clan',
  () => {
    const result =
      validateCharacterLoresheetDefinitions([
        createLoresheet({
          clanKeys: [
            'brujah',
          ],
          excludedClanKeys: [
            'brujah',
          ],
        }),
      ])

    assert.equal(
      result.valid,
      false,
    )

    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'permitir y excluir simultáneamente',
          ),
      ),
    )
  },
)

test(
  'la validación estructural rechaza requisitos duplicados',
  () => {
    const result =
      validateCharacterLoresheetDefinitions([
        createLoresheet({
          characterKinds: [
            'standard',
            'standard',
          ],
          clanKeys: [
            'brujah',
            'brujah',
          ],
          excludedClanKeys: [
            'ventrue',
            'ventrue',
          ],
        }),
      ])

    assert.equal(
      result.valid,
      false,
    )

    assert.ok(
      result.errors.length >= 3,
    )
  },
)
