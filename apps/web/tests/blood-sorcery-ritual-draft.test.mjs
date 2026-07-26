import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  normalizeBloodSorceryRitualsForDraft,
  normalizeCharacterDraftRituals,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'

const BLOOD_WALK =
  'blood-sorcery-ritual-blood-walk'

test(
  'CharacterDraft inicial contiene una colección independiente de Rituales vacía',
  () => {
    assert.deepEqual(
      initialCharacterDraft.bloodSorceryRituals,
      {
        ritualKeys: [],
      },
    )
  },
)

test(
  'sin Hechicería de Sangre los Rituales se eliminan',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [],

      bloodSorceryRituals: {
        ritualKeys: [
          BLOOD_WALK,
        ],
      },
    }

    assert.deepEqual(
      normalizeBloodSorceryRitualsForDraft(
        draft,
      ),
      {
        ritualKeys: [],
      },
    )
  },
)

test(
  'con Hechicería de Sangre 1 conserva un Ritual válido de nivel 1',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [
        {
          key: 'bloodSorcery',
          value: 1,
          powerKeys: [],
        },
      ],

      bloodSorceryRituals: {
        ritualKeys: [
          BLOOD_WALK,
        ],
      },
    }

    assert.deepEqual(
      normalizeBloodSorceryRitualsForDraft(
        draft,
      ),
      {
        ritualKeys: [
          BLOOD_WALK,
        ],
      },
    )
  },
)

test(
  'normalización elimina claves inexistentes y duplicados',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [
        {
          key: 'bloodSorcery',
          value: 1,
          powerKeys: [],
        },
      ],

      bloodSorceryRituals: {
        ritualKeys: [
          BLOOD_WALK,
          'ritual-inexistente',
          BLOOD_WALK,
        ],
      },
    }

    assert.deepEqual(
      normalizeBloodSorceryRitualsForDraft(
        draft,
      ),
      {
        ritualKeys: [
          BLOOD_WALK,
        ],
      },
    )
  },
)

test(
  'normalizeCharacterDraftRituals devuelve un nuevo draft normalizado sin mutar el original',
  () => {
    const draft = {
      ...initialCharacterDraft,

      disciplines: [],

      bloodSorceryRituals: {
        ritualKeys: [
          BLOOD_WALK,
        ],
      },
    }

    const normalized =
      normalizeCharacterDraftRituals(
        draft,
      )

    assert.notEqual(
      normalized,
      draft,
    )

    assert.deepEqual(
      normalized.bloodSorceryRituals,
      {
        ritualKeys: [],
      },
    )

    assert.deepEqual(
      draft.bloodSorceryRituals,
      {
        ritualKeys: [
          BLOOD_WALK,
        ],
      },
    )
  },
)

test(
  'la transición segura conserva un Ritual válido cuando cambia información no relacionada',
  async () => {
    const {
      applyCharacterDraftUpdate,
    } = await import(
      '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'
    )

    const draft = {
      ...initialCharacterDraft,

      identity: {
        ...initialCharacterDraft.identity,
        clan: 'tremere',
      },

      disciplines: [
        {
          key: 'bloodSorcery',
          value: 1,
          powerKeys: [],
        },
      ],

      bloodSorceryRituals: {
        ritualKeys: [
          BLOOD_WALK,
        ],
      },
    }

    const result =
      applyCharacterDraftUpdate(
        draft,
        (current) => ({
          ...current,

          identity: {
            ...current.identity,
            name: 'Regent',
          },
        }),
      )

    assert.deepEqual(
      result.bloodSorceryRituals
        .ritualKeys,
      [
        BLOOD_WALK,
      ],
    )

    assert.equal(
      result.identity.name,
      'Regent',
    )
  },
)

test(
  'eliminar Hechicería de Sangre mediante una actualización limpia automáticamente los Rituales',
  async () => {
    const {
      applyCharacterDraftUpdate,
    } = await import(
      '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'
    )

    const draft = {
      ...initialCharacterDraft,

      disciplines: [
        {
          key: 'bloodSorcery',
          value: 1,
          powerKeys: [],
        },
      ],

      bloodSorceryRituals: {
        ritualKeys: [
          BLOOD_WALK,
        ],
      },
    }

    const result =
      applyCharacterDraftUpdate(
        draft,
        (current) => ({
          ...current,
          disciplines: [],
        }),
      )

    assert.deepEqual(
      result.bloodSorceryRituals,
      {
        ritualKeys: [],
      },
    )
  },
)

test(
  'cambiar de Tremere a un clan sin Hechicería de Sangre elimina los Rituales',
  async () => {
    const {
      applyCharacterDraftUpdate,
    } = await import(
      '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'
    )

    const {
      normalizeDisciplinesForClan,
    } = await import(
      '../src/features/character-creation/domain/discipline-rules.ts'
    )

    const draft = {
      ...initialCharacterDraft,

      identity: {
        ...initialCharacterDraft.identity,
        clan: 'tremere',
      },

      disciplines: [
        {
          key: 'bloodSorcery',
          value: 1,
          powerKeys: [],
        },
        {
          key: 'auspex',
          value: 2,
          powerKeys: [],
        },
      ],

      bloodSorceryRituals: {
        ritualKeys: [
          BLOOD_WALK,
        ],
      },
    }

    const result =
      applyCharacterDraftUpdate(
        draft,
        (current) => ({
          ...current,

          identity: {
            ...current.identity,
            clan: 'brujah',
          },

          disciplines:
            normalizeDisciplinesForClan(
              current.disciplines,
              'brujah',
            ),
        }),
      )

    assert.equal(
      result.identity.clan,
      'brujah',
    )

    assert.equal(
      result.disciplines.some(
        (discipline) =>
          discipline.key ===
          'bloodSorcery',
      ),
      false,
    )

    assert.deepEqual(
      result.bloodSorceryRituals,
      {
        ritualKeys: [],
      },
    )
  },
)

test(
  'cambiar entre clanes que conservan Hechicería de Sangre puede conservar Rituales válidos',
  async () => {
    const {
      applyCharacterDraftUpdate,
    } = await import(
      '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'
    )

    const {
      normalizeDisciplinesForClan,
    } = await import(
      '../src/features/character-creation/domain/discipline-rules.ts'
    )

    const draft = {
      ...initialCharacterDraft,

      identity: {
        ...initialCharacterDraft.identity,
        clan: 'tremere',
      },

      disciplines: [
        {
          key: 'bloodSorcery',
          value: 1,
          powerKeys: [],
        },
        {
          key: 'auspex',
          value: 2,
          powerKeys: [],
        },
      ],

      bloodSorceryRituals: {
        ritualKeys: [
          BLOOD_WALK,
        ],
      },
    }

    const result =
      applyCharacterDraftUpdate(
        draft,
        (current) => ({
          ...current,

          identity: {
            ...current.identity,
            clan: 'banuHaqim',
          },

          disciplines:
            normalizeDisciplinesForClan(
              current.disciplines,
              'banuHaqim',
            ),
        }),
      )

    assert.equal(
      result.disciplines.some(
        (discipline) =>
          discipline.key ===
          'bloodSorcery',
      ),
      true,
    )

    assert.deepEqual(
      result.bloodSorceryRituals
        .ritualKeys,
      [
        BLOOD_WALK,
      ],
    )
  },
)
