import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  previewCharacterDraftUpdate,
} from '../src/features/character-creation/domain/character-draft-loss-rules.ts'

const wizard = await readFile(
  new URL(
    '../src/features/character-creation/components/CharacterCreationWizard.tsx',
    import.meta.url,
  ),
  'utf8',
)

function lossKeys(preview) {
  return preview.losses.map(
    loss => loss.key,
  )
}

test(
  'SPEC-021 un cambio sin pérdida dependiente se aplica sin confirmación',
  () => {
    const current =
      structuredClone(
        initialCharacterDraft,
      )

    const preview =
      previewCharacterDraftUpdate(
        current,
        draft => ({
          ...draft,
          identity: {
            ...draft.identity,
            name: 'Nuevo nombre',
          },
        }),
      )

    assert.deepEqual(
      preview.losses,
      [],
    )

    assert.equal(
      preview.draft.identity.name,
      'Nuevo nombre',
    )
  },
)

test(
  'SPEC-021 cambiar de clan detecta una Disciplina posterior que será retirada',
  () => {
    const current =
      structuredClone(
        initialCharacterDraft,
      )

    current.identity = {
      ...current.identity,
      clan: 'brujah',
      generation: 13,
    }

    current.disciplines = [
      {
        key: 'celerity',
        value: 1,
        powerKeys: [],
        origin: 'creation',
      },
    ]

    const preview =
      previewCharacterDraftUpdate(
        current,
        draft => ({
          ...draft,
          identity: {
            ...draft.identity,
            clan: 'tremere',
          },
        }),
      )

    assert.ok(
      lossKeys(preview).includes(
        'disciplines',
      ),
    )

    assert.equal(
      preview.draft.disciplines.some(
        discipline =>
          discipline.key ===
          'celerity',
      ),
      false,
    )
  },
)

test(
  'SPEC-021 abandonar Sangre Débil detecta rasgos y Alquimia que se perderán',
  () => {
    const current =
      structuredClone(
        initialCharacterDraft,
      )

    current.identity = {
      ...current.identity,
      clan: 'thinBlood',
      generation: 14,
    }

    current.thinBloodTraits = {
      selections: [
        {
          definitionKey:
            'thin-blood-alchemist',
        },
      ],
    }

    current.thinBloodAlchemy = {
      rating: 1,
      method: 'fixatio',
      formulaKeys: [],
    }

    const preview =
      previewCharacterDraftUpdate(
        current,
        draft => ({
          ...draft,
          identity: {
            ...draft.identity,
            clan: 'brujah',
            generation: 13,
          },
        }),
      )

    const keys =
      lossKeys(preview)

    assert.ok(
      keys.includes(
        'thinBloodTraits',
      ),
    )

    assert.ok(
      keys.includes(
        'thinBloodAlchemy',
      ),
    )
  },
)

test(
  'SPEC-021 retirar directamente Alquimista sólo confirma la Alquimia dependiente',
  () => {
    const current =
      structuredClone(
        initialCharacterDraft,
      )

    current.identity = {
      ...current.identity,
      clan: 'thinBlood',
      generation: 14,
    }

    current.thinBloodTraits = {
      selections: [
        {
          definitionKey:
            'thin-blood-alchemist',
        },
      ],
    }

    current.thinBloodAlchemy = {
      rating: 1,
      method: 'fixatio',
      formulaKeys: [],
    }

    const preview =
      previewCharacterDraftUpdate(
        current,
        draft => ({
          ...draft,
          thinBloodTraits: {
            selections: [],
          },
        }),
      )

    assert.deepEqual(
      lossKeys(preview),
      [
        'thinBloodAlchemy',
      ],
    )
  },
)

test(
  'SPEC-021 cambiar contexto de Depredador detecta elecciones ya realizadas',
  () => {
    const current =
      structuredClone(
        initialCharacterDraft,
      )

    current.identity = {
      ...current.identity,
      clan: 'brujah',
      generation: 13,
      predatorType: 'bagger',
    }

    current.predatorTypeChoices = {
      'bagger-specialty': 0,
    }

    const preview =
      previewCharacterDraftUpdate(
        current,
        draft => ({
          ...draft,
          identity: {
            ...draft.identity,
            predatorType: '',
          },
          predatorTypeChoices: {},
        }),
      )

    assert.ok(
      lossKeys(preview).includes(
        'predatorTypeChoices',
      ),
    )
  },
)

test(
  'SPEC-021 la UI conserva el borrador hasta confirmar y permite cancelar',
  () => {
    assert.match(
      wizard,
      /previewCharacterDraftUpdate/,
    )

    assert.match(
      wizard,
      /pendingDraftUpdate/,
    )

    assert.match(
      wizard,
      /if \(preview\.losses\.length > 0\)[\s\S]*setPendingDraftUpdate/,
    )

    assert.match(
      wizard,
      /El borrador todavía no se ha modificado/,
    )

    assert.match(
      wizard,
      /Confirmar cambio/,
    )

    assert.match(
      wizard,
      /Cancelar/,
    )

    assert.match(
      wizard,
      /confirmPendingDraftUpdate[\s\S]*applyDraftCandidate/,
    )

    assert.match(
      wizard,
      /cancelPendingDraftUpdate[\s\S]*setPendingDraftUpdate\(null\)/,
    )
  },
)
