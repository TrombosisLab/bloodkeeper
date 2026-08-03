import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateInitialThinBloodAlchemySelection,
  validateThinBloodAlchemyDraft,
} from '../src/features/character-creation/domain/thin-blood-alchemy-rules.ts'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function traits(...definitionKeys) {
  return {
    selections:
      definitionKeys.map(
        (definitionKey) => ({
          definitionKey,
        }),
      ),
  }
}

function alchemy(
  rating,
  formulaKeys,
) {
  return {
    rating,
    method: 'fixatio',
    formulaKeys,
  }
}

function validAdvantages() {
  return {
    selections: [
      {
        selectionId: 'status-5',
        definitionKey: 'status',
        category: 'background',
        rating: 5,
        origin: 'creation',
        details: {
          kind: 'status',
        },
      },
      {
        selectionId: 'contacts-2',
        definitionKey: 'contacts',
        category: 'background',
        rating: 2,
        origin: 'creation',
        details: {
          kind: 'contact',
        },
      },
      {
        selectionId: 'illiterate-2',
        definitionKey: 'illiterate',
        category: 'flaw',
        rating: 2,
        origin: 'creation',
      },
    ],
  }
}

test(
  'el dominio general permite aprender fórmulas adicionales durante la crónica',
  () => {
    const result =
      validateThinBloodAlchemyDraft(
        alchemy(
          1,
          [
            'farReach',
            'haze',
          ],
        ),
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'la creación inicial acepta exactamente una fórmula con Alquimia 1',
  () => {
    const result =
      validateInitialThinBloodAlchemySelection(
        alchemy(
          1,
          [
            'farReach',
          ],
        ),
        'thinBlood',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'la creación inicial rechaza cero fórmulas con Alquimia 1',
  () => {
    const result =
      validateInitialThinBloodAlchemySelection(
        alchemy(
          1,
          [],
        ),
        'thinBlood',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'la creación inicial rechaza fórmulas adicionales con Alquimia 1',
  () => {
    const result =
      validateInitialThinBloodAlchemySelection(
        alchemy(
          1,
          [
            'farReach',
            'haze',
          ],
        ),
        'thinBlood',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'exactamente 1 fórmula',
          ),
      ),
      true,
    )
  },
)

test(
  'la creación inicial acepta tres fórmulas con Alquimia 3',
  () => {
    const result =
      validateInitialThinBloodAlchemySelection(
        alchemy(
          3,
          [
            'farReach',
            'envelop',
            'defractionate',
          ],
        ),
        'thinBlood',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'la creación inicial rechaza menos fórmulas que la puntuación',
  () => {
    const result =
      validateInitialThinBloodAlchemySelection(
        alchemy(
          3,
          [
            'farReach',
            'envelop',
          ],
        ),
        'thinBlood',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'la creación inicial rechaza más fórmulas que la puntuación',
  () => {
    const result =
      validateInitialThinBloodAlchemySelection(
        alchemy(
          3,
          [
            'farReach',
            'envelop',
            'defractionate',
            'haze',
          ],
        ),
        'thinBlood',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'el paso Ventajas bloquea una selección inicial incompleta de Alquimia',
  () => {
    const draft = {
      ...initialCharacterDraft,

      identity: {
        ...initialCharacterDraft.identity,
        clan: 'thinBlood',
      },

      advantages:
        validAdvantages(),

      thinBloodTraits:
        traits(
          'thin-blood-alchemist',
          'baby-teeth',
        ),

      thinBloodAlchemy:
        alchemy(
          1,
          [],
        ),
    }

    const result =
      validateStep(
        'advantages',
        draft,
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'fórmula gratuita',
          ),
      ),
      true,
    )
  },
)

test(
  'el paso Ventajas acepta una selección inicial completa de Alquimia',
  () => {
    const draft = {
      ...initialCharacterDraft,

      identity: {
        ...initialCharacterDraft.identity,
        clan: 'thinBlood',
      },

      advantages:
        validAdvantages(),

      thinBloodTraits:
        traits(
          'thin-blood-alchemist',
          'baby-teeth',
        ),

      thinBloodAlchemy:
        alchemy(
          1,
          [
            'farReach',
          ],
        ),
    }

    const result =
      validateStep(
        'advantages',
        draft,
      )

    assert.equal(
      result.valid,
      true,
      result.errors.join('\n'),
    )
  },
)


test(
  'Sangre Débil permite generación 14',
  () => {
    const draft = {
      ...initialCharacterDraft,

      identity: {
        ...initialCharacterDraft.identity,
        name: 'Test',
        concept: 'Test',
        clan: 'thinBlood',
        generation: 14,
      },
    }

    const result =
      validateStep(
        'identity',
        draft,
      )

    assert.equal(
      result.valid,
      true,
      result.errors.join('\n'),
    )
  },
)

test(
  'Sangre Débil permite generación 15',
  () => {
    const draft = {
      ...initialCharacterDraft,

      identity: {
        ...initialCharacterDraft.identity,
        name: 'Test',
        concept: 'Test',
        clan: 'thinBlood',
        generation: 15,
      },
    }

    const result =
      validateStep(
        'identity',
        draft,
      )

    assert.equal(
      result.valid,
      true,
      result.errors.join('\n'),
    )
  },
)

test(
  'Sangre Débil permite generación 16',
  () => {
    const draft = {
      ...initialCharacterDraft,

      identity: {
        ...initialCharacterDraft.identity,
        name: 'Test',
        concept: 'Test',
        clan: 'thinBlood',
        generation: 16,
      },
    }

    const result =
      validateStep(
        'identity',
        draft,
      )

    assert.equal(
      result.valid,
      true,
      result.errors.join('\n'),
    )
  },
)

test(
  'Sangre Débil rechaza generación distinta de 14, 15 o 16',
  () => {
    const draft = {
      ...initialCharacterDraft,

      identity: {
        ...initialCharacterDraft.identity,
        name: 'Test',
        concept: 'Test',
        clan: 'thinBlood',
        generation: 13,
      },
    }

    const result =
      validateStep(
        'identity',
        draft,
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            '14, 15 o 16',
          ),
      ),
      true,
    )
  },
)
