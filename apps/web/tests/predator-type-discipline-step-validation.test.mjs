import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  validateDisciplinesStepBase,
} from '../src/features/character-creation/domain/step-validation.ts'

function createBrujahDraft(disciplines) {
  const draft =
    structuredClone(initialCharacterDraft)

  draft.identity.clan = 'brujah'
  draft.disciplines = disciplines

  return draft
}

test(
  '029-U ignora una Disciplina externa concedida por el Tipo de Depredador',
  () => {
    const result =
      validateDisciplinesStepBase(
        createBrujahDraft([
          {
            key: 'potence',
            value: 2,
            powerKeys: [],
            origin: 'creation',
          },
          {
            key: 'presence',
            value: 1,
            powerKeys: [],
            origin: 'creation',
          },
          {
            key: 'obfuscate',
            value: 1,
            powerKeys: [],
            origin: 'predatorType',
          },
        ]),
      )

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)

test(
  '029-U la concesión depredadora no altera el reparto inicial 2 más 1',
  () => {
    const result =
      validateDisciplinesStepBase(
        createBrujahDraft([
          {
            key: 'potence',
            value: 2,
            powerKeys: [],
            origin: 'creation',
          },
          {
            key: 'presence',
            value: 1,
            powerKeys: [],
            origin: 'creation',
          },
          {
            key: 'celerity',
            value: 1,
            powerKeys: [],
            origin: 'predatorType',
          },
        ]),
      )

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)

test(
  '029-U continúa rechazando una Disciplina externa elegida durante la creación',
  () => {
    const result =
      validateDisciplinesStepBase(
        createBrujahDraft([
          {
            key: 'potence',
            value: 2,
            powerKeys: [],
            origin: 'creation',
          },
          {
            key: 'obfuscate',
            value: 1,
            powerKeys: [],
            origin: 'creation',
          },
        ]),
      )

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.includes(
        'Solo puedes seleccionar Disciplinas de clan durante esta fase.',
      ),
    )
  },
)

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function simplePowerKeys(
  disciplineKey,
  rating,
) {
  return disciplinePowerDefinitions
    .filter(
      power =>
        power.disciplineKey ===
          disciplineKey &&
        power.level <= rating &&
        (
          power.requirements
            ?.prerequisitePowerKeys
            ?.length ?? 0
        ) === 0 &&
        power.requirements
          ?.amalgam === undefined,
    )
    .sort(
      (left, right) =>
        left.level - right.level ||
        left.key.localeCompare(
          right.key,
        ),
    )
    .slice(0, rating)
    .map(power => power.key)
}

function completeBrujahWithBagger(
  includePredatorPower,
) {
  const draft =
    structuredClone(
      initialCharacterDraft,
    )

  draft.identity.clan = 'brujah'
  draft.identity.predatorType = 'bagger'

  draft.disciplines = [
    {
      key: 'celerity',
      value: 2,
      powerKeys:
        simplePowerKeys(
          'celerity',
          2,
        ),
      origin: 'creation',
    },
    {
      key: 'potence',
      value: 1,
      powerKeys:
        simplePowerKeys(
          'potence',
          1,
        ),
      origin: 'creation',
    },
    {
      key: 'obfuscate',
      value: 1,
      powerKeys:
        includePredatorPower
          ? simplePowerKeys(
              'obfuscate',
              1,
            )
          : [],
      origin: 'predatorType',
    },
  ]

  return draft
}

test(
  '029-U exige el Poder de la Disciplina concedida por el Tipo de Depredador',
  () => {
    const result =
      validateStep(
        'disciplines',
        completeBrujahWithBagger(
          false,
        ),
      )

    assert.equal(result.valid, false)
  },
)

test(
  '029-U permite avanzar con 2 más 1 de creación y 1 de depredador con su Poder',
  () => {
    const result =
      validateStep(
        'disciplines',
        completeBrujahWithBagger(
          true,
        ),
      )

    assert.equal(
      simplePowerKeys(
        'celerity',
        2,
      ).length,
      2,
    )
    assert.equal(
      simplePowerKeys(
        'potence',
        1,
      ).length,
      1,
    )
    assert.equal(
      simplePowerKeys(
        'obfuscate',
        1,
      ).length,
      1,
    )
    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)

test(
  '029-U la interfaz no cuenta la concesión depredadora en 2 más 1 y expone su selector de Poder',
  async () => {
    const { readFile } =
      await import('node:fs/promises')

    const source =
      await readFile(
        new URL(
          '../src/features/character-creation/components/DisciplinesStep.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      source,
      /const creationDisciplines =[\s\S]*origin === 'creation'/,
    )
    assert.match(
      source,
      /validateDisciplines\([\s\S]*creationDisciplines,[\s\S]*clanKey/,
    )
    assert.match(
      source,
      /const predatorDisciplines =[\s\S]*'predatorType'/,
    )
    assert.match(
      source,
      /const powerDisciplineKeys =[\s\S]*predatorDisciplines/,
    )
    assert.match(
      source,
      /powerDisciplineKeys\.map/,
    )
  },
)

import {
  applyPredatorTypeDisciplines,
} from '../src/features/character-creation/domain/predator-type-rules.ts'

import {
  updateSelectedPower,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

test(
  '029-U conserva el Poder seleccionado al reaplicar el Tipo de Depredador',
  () => {
    const applied =
      applyPredatorTypeDisciplines(
        'bagger',
        'brujah',
        [],
        {},
      )

    const predatorDiscipline =
      applied.find(
        discipline =>
          discipline.origin ===
          'predatorType',
      )

    assert.ok(predatorDiscipline)
    assert.equal(
      predatorDiscipline.key,
      'obfuscate',
    )

    const power =
      disciplinePowerDefinitions.find(
        definition =>
          definition.disciplineKey ===
            predatorDiscipline.key &&
          definition.level === 1 &&
          definition.active,
      )

    assert.ok(power)

    const selected =
      updateSelectedPower(
        applied,
        predatorDiscipline.key,
        power.key,
        true,
      )

    assert.deepEqual(
      selected.find(
        discipline =>
          discipline.origin ===
          'predatorType',
      )?.powerKeys,
      [power.key],
    )

    const reapplied =
      applyPredatorTypeDisciplines(
        'bagger',
        'brujah',
        selected,
        {},
      )

    assert.deepEqual(
      reapplied.find(
        discipline =>
          discipline.origin ===
          'predatorType',
      )?.powerKeys,
      [power.key],
    )
  },
)

import {
  applyCharacterDraftUpdate,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'

test(
  '029-U conserva el Poder depredador a través de applyCharacterDraftUpdate',
  () => {
    const base =
      structuredClone(
        initialCharacterDraft,
      )

    base.identity.clan = 'brujah'
    base.identity.predatorType = 'bagger'

    const applied =
      applyCharacterDraftUpdate(
        base,
        current => current,
      )

    const predatorDiscipline =
      applied.disciplines.find(
        discipline =>
          discipline.origin ===
          'predatorType',
      )

    assert.ok(predatorDiscipline)
    assert.equal(
      predatorDiscipline.key,
      'obfuscate',
    )

    const power =
      disciplinePowerDefinitions.find(
        definition =>
          definition.disciplineKey ===
            predatorDiscipline.key &&
          definition.level === 1 &&
          definition.active,
      )

    assert.ok(power)

    const updated =
      applyCharacterDraftUpdate(
        applied,
        current => ({
          ...current,
          disciplines:
            updateSelectedPower(
              current.disciplines,
              predatorDiscipline.key,
              power.key,
              true,
            ),
        }),
      )

    assert.deepEqual(
      updated.disciplines.find(
        discipline =>
          discipline.origin ===
          'predatorType',
      )?.powerKeys,
      [power.key],
    )
  },
)


test(
  '029-U permite avanzar cuando el Tipo de Depredador suma 1 a una Disciplina de clan',
  async () => {
    const {
      initialCharacterDraft,
    } = await import(
      '../src/features/character-creation/data/initial-character-draft.ts'
    )

    const {
      applyCharacterDraftUpdate,
    } = await import(
      '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'
    )

    const {
      disciplinePowerDefinitions,
    } = await import(
      '../src/features/character-creation/data/discipline-power-definitions.ts'
    )

    const {
      getSelectedDisciplinePowerKeys,
      updateSelectedPower,
    } = await import(
      '../src/features/character-creation/domain/discipline-power-rules.ts'
    )

    const {
      validateStep,
    } = await import(
      '../src/features/character-creation/domain/step-validation.ts'
    )

    let draft =
      structuredClone(
        initialCharacterDraft,
      )

    draft.identity.clan =
      'banuHaqim'

    draft.identity.predatorType =
      'bagger'

    const obfuscatePowers =
      disciplinePowerDefinitions
        .filter(
          power =>
            power.disciplineKey ===
              'obfuscate' &&
            power.level === 1 &&
            power.active,
        )
        .slice(0, 2)
        .map(
          power => power.key,
        )

    const celerityPower =
      disciplinePowerDefinitions.find(
        power =>
          power.disciplineKey ===
            'celerity' &&
          power.level === 1 &&
          power.active,
      )

    assert.equal(
      obfuscatePowers.length,
      2,
    )
    assert.ok(celerityPower)

    draft.disciplines = [
      {
        key: 'obfuscate',
        value: 2,
        powerKeys:
          obfuscatePowers,
        origin: 'creation',
      },
      {
        key: 'celerity',
        value: 1,
        powerKeys: [
          celerityPower.key,
        ],
        origin: 'creation',
      },
    ]

    draft =
      applyCharacterDraftUpdate(
        draft,
        value => value,
      )

    const selectedBefore =
      getSelectedDisciplinePowerKeys(
        draft.disciplines,
        'obfuscate',
      )

    const extraPower =
      disciplinePowerDefinitions.find(
        power =>
          power.disciplineKey ===
            'obfuscate' &&
          power.level <= 3 &&
          power.active &&
          !selectedBefore.includes(
            power.key,
          ),
      )

    assert.ok(extraPower)

    draft =
      applyCharacterDraftUpdate(
        draft,
        value => ({
          ...value,
          disciplines:
            updateSelectedPower(
              value.disciplines,
              'obfuscate',
              extraPower.key,
              true,
            ),
        }),
      )

    assert.equal(
      getSelectedDisciplinePowerKeys(
        draft.disciplines,
        'obfuscate',
      ).length,
      3,
    )

    assert.equal(
      validateStep(
        'disciplines',
        draft,
      ).valid,
      true,
    )
  },
)


test(
  '029-U la interfaz muestra la puntuación efectiva sin alterar el límite 2 más 1',
  async () => {
    const {
      readFile,
    } = await import(
      'node:fs/promises'
    )

    const cardSource =
      await readFile(
        new URL(
          '../src/features/character-creation/components/DisciplineEditorCard.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    const stepSource =
      await readFile(
        new URL(
          '../src/features/character-creation/components/DisciplinesStep.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      cardSource,
      /effectiveValue\?: number/,
    )

    assert.match(
      cardSource,
      /displayedValue - value/,
    )

    assert.match(
      cardSource,
      /disabled=\{value >= 2\}/,
    )

    assert.match(
      stepSource,
      /effectiveValue=\{/,
    )

    assert.match(
      stepSource,
      /getDisciplineValue\(\s*value,\s*disciplineKey,/,
    )
  },
)
