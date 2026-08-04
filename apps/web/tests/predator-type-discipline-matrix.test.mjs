import assert from 'node:assert/strict'
import test from 'node:test'

import {
  predatorTypeDefinitions,
} from '../src/features/character-creation/data/predator-type-definitions.ts'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  getClanDefinition,
} from '../src/features/character-creation/data/clan-definitions.ts'

import {
  getDisciplineValue,
} from '../src/features/character-creation/domain/discipline-rules.ts'

import {
  applyPredatorTypeDisciplines,
  clanAllowed,
} from '../src/features/character-creation/domain/predator-type-rules.ts'

import {
  getSelectedDisciplinePowerKeys,
  normalizeDisciplinePowers,
  updateSelectedPower,
  validateInitialDisciplinePowers,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

import {
  validateDisciplinePowerAcquisition,
} from '../src/features/character-creation/domain/discipline-power-acquisition-rules.ts'

const fallbackClanKeys = [
  'brujah',
  'gangrel',
  'malkavian',
  'nosferatu',
  'toreador',
  'tremere',
  'ventrue',
  'lasombra',
  'hecata',
  'ravnos',
  'salubri',
  'tzimisce',
  'banuHaqim',
  'ministry',
]

function resolveClanForOption(
  definition,
  choice,
  option,
) {
  if (option.when?.clan !== undefined) {
    return option.when.clan
  }

  const conditionalClans =
    new Set(
      choice.options
        .map(
          sibling =>
            sibling.when?.clan,
        )
        .filter(
          clanKey =>
            clanKey !== undefined,
        ),
    )

  return fallbackClanKeys.find(
    clanKey =>
      !conditionalClans.has(clanKey) &&
      clanAllowed(
        definition.key,
        clanKey,
      ),
  )
}

function resolveSelectionsForOption(
  choice,
  optionIndex,
  clanKey,
) {
  const availableOptions =
    choice.options.filter(
      option =>
        option.when?.clan === undefined ||
        option.when.clan === clanKey,
    )

  if (
    availableOptions.length <= 1
  ) {
    return {}
  }

  return {
    [choice.id]: optionIndex,
  }
}

function findSelectablePower(
  disciplineKey,
  rating,
) {
  return disciplinePowerDefinitions
    .filter(
      power =>
        power.disciplineKey ===
          disciplineKey &&
        power.level <= rating &&
        power.active &&
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
    )[0]
}

const matrix =
  predatorTypeDefinitions.flatMap(
    definition =>
      (definition.choices ?? [])
        .flatMap(
          choice =>
            choice.options
              .map(
                (
                  option,
                  optionIndex,
                ) => ({
                  definition,
                  choice,
                  option,
                  optionIndex,
                }),
              )
              .filter(
                entry =>
                  entry.option.grant.type ===
                  'discipline',
              ),
        ),
  )

test(
  '029-U la matriz contiene las 20 concesiones de Disciplina de los 10 Tipos de Depredador Core',
  () => {
    assert.equal(
      predatorTypeDefinitions.length,
      10,
    )

    assert.equal(matrix.length, 20)

    assert.deepEqual(
      [
        ...new Set(
          matrix.map(
            entry =>
              entry.definition.key,
          ),
        ),
      ].sort(),
      predatorTypeDefinitions
        .map(
          definition =>
            definition.key,
        )
        .sort(),
    )
  },
)

for (const entry of matrix) {
  const grant = entry.option.grant

  test(
    `029-U conserva Poder en ${entry.definition.key} → ${grant.disciplineKey}`,
    () => {
      assert.equal(
        grant.type,
        'discipline',
      )

      const clanKey =
        resolveClanForOption(
          entry.definition,
          entry.choice,
          entry.option,
        )

      assert.ok(
        clanKey,
        `No existe un clan válido para ${entry.definition.key} → ${grant.disciplineKey}`,
      )

      assert.equal(
        clanAllowed(
          entry.definition.key,
          clanKey,
        ),
        true,
      )

      const selections =
        resolveSelectionsForOption(
          entry.choice,
          entry.optionIndex,
          clanKey,
        )

      const applied =
        applyPredatorTypeDisciplines(
          entry.definition.key,
          clanKey,
          [],
          selections,
        )

      const discipline =
        applied.find(
          candidate =>
            candidate.origin ===
              'predatorType' &&
            candidate.key ===
              grant.disciplineKey,
        )

      assert.ok(
        discipline,
        `No se aplicó ${entry.definition.key} → ${grant.disciplineKey}`,
      )

      assert.equal(
        discipline.value,
        grant.dots,
      )

      const power =
        findSelectablePower(
          grant.disciplineKey,
          grant.dots,
        )

      assert.ok(
        power,
        `No existe un Poder seleccionable para ${grant.disciplineKey} ${grant.dots}`,
      )

      const selected =
        updateSelectedPower(
          applied,
          grant.disciplineKey,
          power.key,
          true,
        )

      assert.deepEqual(
        selected.find(
          candidate =>
            candidate.origin ===
              'predatorType' &&
            candidate.key ===
              grant.disciplineKey,
        )?.powerKeys,
        [power.key],
      )

      const reapplied =
        applyPredatorTypeDisciplines(
          entry.definition.key,
          clanKey,
          selected,
          selections,
        )

      assert.deepEqual(
        reapplied.find(
          candidate =>
            candidate.origin ===
              'predatorType' &&
            candidate.key ===
              grant.disciplineKey,
        )?.powerKeys,
        [power.key],
      )
    },
  )
}


function resolveOverlapClan(
  definition,
  option,
) {
  const candidateKeys =
    option.when?.clan !== undefined
      ? [option.when.clan]
      : fallbackClanKeys

  return candidateKeys.find(
    clanKey => {
      if (
        !clanAllowed(
          definition.key,
          clanKey,
        )
      ) {
        return false
      }

      const clan =
        getClanDefinition(
          clanKey,
        )

      return (
        clan.kind === 'clan' &&
        clan.inClanDisciplines.includes(
          option.grant.disciplineKey,
        )
      )
    },
  )
}

for (const entry of matrix) {
  const grant = entry.option.grant

  test(
    `029-U suma y conserva Poder con solapamiento ${entry.definition.key} → ${grant.disciplineKey}`,
    () => {
      assert.equal(
        grant.type,
        'discipline',
      )

      const clanKey =
        resolveOverlapClan(
          entry.definition,
          entry.option,
        )

      assert.ok(
        clanKey,
        `No existe clan solapado válido para ${entry.definition.key} → ${grant.disciplineKey}`,
      )

      const initialPowers =
        disciplinePowerDefinitions
          .filter(
            power =>
              power.disciplineKey ===
                grant.disciplineKey &&
              power.level === 1 &&
              power.active &&
              (
                power.requirements
                  ?.prerequisitePowerKeys
                  ?.length ?? 0
              ) === 0 &&
              power.requirements
                ?.amalgam === undefined,
          )
          .slice(0, 2)

      assert.equal(
        initialPowers.length,
        2,
        `Faltan dos Poderes iniciales para ${grant.disciplineKey}`,
      )

      const creation = [
        {
          key:
            grant.disciplineKey,
          value: 2,
          powerKeys:
            initialPowers.map(
              power => power.key,
            ),
          origin:
            'creation',
        },
      ]

      const selections =
        resolveSelectionsForOption(
          entry.choice,
          entry.optionIndex,
          clanKey,
        )

      const granted =
        applyPredatorTypeDisciplines(
          entry.definition.key,
          clanKey,
          creation,
          selections,
        )

      assert.equal(
        getDisciplineValue(
          granted,
          grant.disciplineKey,
        ),
        3,
      )

      const selectedBefore =
        getSelectedDisciplinePowerKeys(
          granted,
          grant.disciplineKey,
        )

      const additionalPower =
        disciplinePowerDefinitions.find(
          power =>
            power.disciplineKey ===
              grant.disciplineKey &&
            power.active &&
            power.level <= 3 &&
            !selectedBefore.includes(
              power.key,
            ) &&
            validateDisciplinePowerAcquisition(
              disciplinePowerDefinitions,
              granted,
              grant.disciplineKey,
              power.key,
              selectedBefore,
              'characterCreation',
            ).valid,
        )

      assert.ok(
        additionalPower,
        `No existe Poder adicional aprendible para ${grant.disciplineKey}`,
      )

      const selected =
        updateSelectedPower(
          granted,
          grant.disciplineKey,
          additionalPower.key,
          true,
        )

      const normalized =
        normalizeDisciplinePowers(
          disciplinePowerDefinitions,
          selected,
        )

      const effectivePowerKeys =
        getSelectedDisciplinePowerKeys(
          normalized,
          grant.disciplineKey,
        )

      assert.equal(
        effectivePowerKeys.length,
        3,
      )

      assert.ok(
        effectivePowerKeys.includes(
          additionalPower.key,
        ),
      )

      const predatorContribution =
        normalized.find(
          discipline =>
            discipline.key ===
              grant.disciplineKey &&
            discipline.origin ===
              'predatorType',
        )

      assert.equal(
        predatorContribution
          ?.powerKeys.includes(
            additionalPower.key,
          ),
        true,
      )

      assert.equal(
        validateInitialDisciplinePowers(
          disciplinePowerDefinitions,
          normalized,
          grant.disciplineKey,
          effectivePowerKeys,
        ).valid,
        true,
      )
    },
  )
}


test(
  '029-U el pipeline completo aplica las 20 elecciones de Disciplina',
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

    for (const entry of matrix) {
      const grant =
        entry.option.grant

      assert.equal(
        grant.type,
        'discipline',
      )

      const clanKey =
        resolveOverlapClan(
          entry.definition,
          entry.option,
        )

      assert.ok(clanKey)

      const clan =
        getClanDefinition(
          clanKey,
        )

      const otherDisciplineKey =
        clan.inClanDisciplines.find(
          key =>
            key !==
            grant.disciplineKey,
        )

      assert.ok(
        otherDisciplineKey,
      )

      const mainPowers =
        disciplinePowerDefinitions
          .filter(
            power =>
              power.disciplineKey ===
                grant.disciplineKey &&
              power.level === 1 &&
              power.active,
          )
          .slice(0, 2)

      const otherPower =
        disciplinePowerDefinitions.find(
          power =>
            power.disciplineKey ===
              otherDisciplineKey &&
            power.level === 1 &&
            power.active,
        )

      assert.equal(
        mainPowers.length,
        2,
      )

      assert.ok(otherPower)

      const draft =
        structuredClone(
          initialCharacterDraft,
        )

      draft.identity.clan =
        clanKey

      draft.identity.predatorType =
        entry.definition.key

      draft.predatorTypeChoices =
        resolveSelectionsForOption(
          entry.choice,
          entry.optionIndex,
          clanKey,
        )

      draft.disciplines = [
        {
          key:
            grant.disciplineKey,
          value: 2,
          powerKeys:
            mainPowers.map(
              power =>
                power.key,
            ),
          origin: 'creation',
        },
        {
          key:
            otherDisciplineKey,
          value: 1,
          powerKeys: [
            otherPower.key,
          ],
          origin: 'creation',
        },
      ]

      const normalized =
        applyCharacterDraftUpdate(
          draft,
          current => current,
        )

      assert.equal(
        getDisciplineValue(
          normalized.disciplines,
          grant.disciplineKey,
        ),
        3,
        `${entry.definition.key} → ${grant.disciplineKey}`,
      )

      assert.equal(
        normalized.disciplines.some(
          discipline =>
            discipline.key ===
              grant.disciplineKey &&
            discipline.origin ===
              'predatorType' &&
            discipline.value === 1,
        ),
        true,
        `${entry.definition.key} → ${grant.disciplineKey}`,
      )
    }
  },
)
