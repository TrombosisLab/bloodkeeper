import assert from 'node:assert/strict'
import test from 'node:test'

import {
  INITIAL_HUMANITY_VALUE,
  MAX_INITIAL_CONVICTIONS,
  MIN_INITIAL_CONVICTIONS,
  validateInitialHumanity,
} from '../src/features/character-creation/domain/humanity-rules.ts'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function createValidHumanity() {
  return {
    value: 7,
    convictions: [
      {
        convictionId: 'conviction-1',
        text: 'Protege siempre a los indefensos.',
        touchstoneId: 'touchstone-1',
      },
    ],
    touchstones: [
      {
        touchstoneId: 'touchstone-1',
        name: 'Elena',
        relationship: 'Hermana mortal',
      },
    ],
  }
}

test(
  'la Humanidad inicial normativa es 7',
  () => {
    assert.equal(
      INITIAL_HUMANITY_VALUE,
      7,
    )

    assert.equal(
      initialCharacterDraft.humanity.value,
      7,
    )
  },
)

test(
  'el CharacterDraft inicial contiene Humanidad sin Convicciones ni Piedras de Toque',
  () => {
    assert.deepEqual(
      initialCharacterDraft.humanity,
      {
        value: 7,
        convictions: [],
        touchstones: [],
      },
    )
  },
)

test(
  'la creación inicial admite entre 1 y 3 Convicciones',
  () => {
    assert.equal(
      MIN_INITIAL_CONVICTIONS,
      1,
    )

    assert.equal(
      MAX_INITIAL_CONVICTIONS,
      3,
    )
  },
)

test(
  'una Convicción completa con su Piedra de Toque es válida',
  () => {
    const result =
      validateInitialHumanity(
        createValidHumanity(),
      )

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)

test(
  'la Humanidad inicial distinta de 7 es inválida',
  () => {
    const humanity =
      createValidHumanity()

    humanity.value = 6

    const result =
      validateInitialHumanity(
        humanity,
      )

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /Humanidad inicial debe ser 7/,
    )
  },
)

test(
  'la creación inicial exige al menos una Convicción',
  () => {
    const result =
      validateInitialHumanity({
        value: 7,
        convictions: [],
        touchstones: [],
      })

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /entre 1 y 3 Convicciones/,
    )
  },
)

test(
  'la creación inicial rechaza más de tres Convicciones',
  () => {
    const convictions =
      Array.from(
        { length: 4 },
        (_, index) => ({
          convictionId:
            `conviction-${index}`,
          text:
            `Convicción ${index}`,
          touchstoneId:
            `touchstone-${index}`,
        }),
      )

    const touchstones =
      Array.from(
        { length: 4 },
        (_, index) => ({
          touchstoneId:
            `touchstone-${index}`,
          name:
            `Persona ${index}`,
          relationship:
            `Relación ${index}`,
        }),
      )

    const result =
      validateInitialHumanity({
        value: 7,
        convictions,
        touchstones,
      })

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /entre 1 y 3 Convicciones/,
    )
  },
)

test(
  'cada Convicción exige descripción',
  () => {
    const humanity =
      createValidHumanity()

    humanity.convictions[0].text = ' '

    const result =
      validateInitialHumanity(
        humanity,
      )

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /deben tener una descripción/,
    )
  },
)

test(
  'cada Convicción debe apuntar a una Piedra de Toque existente',
  () => {
    const humanity =
      createValidHumanity()

    humanity.convictions[0]
      .touchstoneId =
        'touchstone-inexistente'

    const result =
      validateInitialHumanity(
        humanity,
      )

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /Piedra de Toque existente/,
    )
  },
)

test(
  'una Piedra de Toque exige nombre y relación',
  () => {
    const humanity =
      createValidHumanity()

    humanity.touchstones[0].name = ''
    humanity.touchstones[0]
      .relationship = ''

    const result =
      validateInitialHumanity(
        humanity,
      )

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /deben tener un nombre/,
    )
    assert.match(
      result.errors.join(' '),
      /deben indicar su relación/,
    )
  },
)

test(
  'una Piedra de Toque no puede sostener varias Convicciones',
  () => {
    const humanity =
      createValidHumanity()

    humanity.convictions.push({
      convictionId: 'conviction-2',
      text: 'Nunca abandones a tu familia.',
      touchstoneId: 'touchstone-1',
    })

    const result =
      validateInitialHumanity(
        humanity,
      )

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /varias Convicciones/,
    )
  },
)

test(
  'el paso Humanidad usa la validación del dominio',
  () => {
    const validDraft = {
      ...initialCharacterDraft,
      humanity: createValidHumanity(),
    }

    assert.equal(
      validateStep(
        'humanity',
        validDraft,
      ).valid,
      true,
    )

    assert.equal(
      validateStep(
        'humanity',
        initialCharacterDraft,
      ).valid,
      false,
    )
  },
)
