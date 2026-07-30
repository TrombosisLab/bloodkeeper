import { predatorTypeDefinitions } from '../data/predator-type-definitions.ts';

import type {
  PredatorTypeChoice,
  PredatorTypeChoiceGrant,
} from '../types/predator-type.types.ts'


import type {
  CharacterAdvantagesDraft,
  CharacterAdvantageSelectionDraft,
} from '../types/character-advantages-draft.types.ts'

import type {
  CharacterDisciplineDraft,
  CharacterDisciplinesDraft,
} from '../types/discipline.types.ts'

import type {
  CharacterSkillSpecialtiesDraft,
  SkillSpecialty,
} from '../types/character-skills-draft.types.ts'


export function getPredatorType(key: string) {
    return predatorTypeDefinitions.find(x => x.key === key);
}

export function predatorTypeExists(key: string) {
    return getPredatorType(key) !== undefined;
}

export function clanAllowed(predatorTypeKey: string, clanKey: string) {

    const definition = getPredatorType(predatorTypeKey);

    if (!definition) {
        return false;
    }

    const excluded =
        definition.restrictions?.excludedClans ?? [];

    return !excluded.includes(clanKey);
}

export function resolveChoice(
  choice: PredatorTypeChoice,
  context: Record<string, unknown>,
): PredatorTypeChoiceGrant | null {

    for (const option of choice.options) {

        if (!option.when) {
            return option.grant;
        }

        let ok = true;

        for (const [k,v] of Object.entries(option.when)) {

            if (context[k] !== v) {
                ok = false;
                break;
            }

        }

        if (ok) {
            return option.grant;
        }
    }

    return null;
}

export function resolvePredatorChoices(
  predatorTypeKey: string,
  context: Record<string, unknown> = {},
): PredatorTypeChoiceGrant[] {

    const definition = getPredatorType(predatorTypeKey);

    if (!definition) {
        return [];
    }

    return (definition.choices ?? [])
        .map(choice => resolveChoice(choice, context))
        .filter(
            (
                grant,
            ): grant is PredatorTypeChoiceGrant =>
                grant !== null,
        );

}

export function predatorPendingReferences(
  predatorTypeKey: string,
): string[] {

    const definition = getPredatorType(predatorTypeKey);

    if(!definition){
        return [];
    }

    return (definition.pendingReferences ?? [])
        .map(x=>x.definitionKey);

}

export function normalizePredatorTypeForCharacter(
  predatorTypeKey: string,
  clanKey: string | null,
): string {
  if (predatorTypeKey === '') {
    return ''
  }

  if (clanKey === null) {
    return ''
  }

  if (!predatorTypeExists(predatorTypeKey)) {
    return ''
  }

  if (!clanAllowed(predatorTypeKey, clanKey)) {
    return ''
  }

  return predatorTypeKey
}

export function removePredatorTypeAdvantages(
  advantages: CharacterAdvantagesDraft,
): CharacterAdvantagesDraft {
  return {
    ...advantages,
    selections: advantages.selections.filter(
      selection =>
        selection.origin !== 'predatorType',
    ),
  }
}

export function removePredatorTypeDisciplines(
  disciplines: CharacterDisciplinesDraft,
): CharacterDisciplinesDraft {
  return disciplines.filter(
    discipline =>
      discipline.origin !== 'predatorType',
  )
}

export function removePredatorTypeSpecialties(
  specialties: CharacterSkillSpecialtiesDraft,
): CharacterSkillSpecialtiesDraft {
  return specialties.filter(
    specialty =>
      specialty.origin !== 'predatorType',
  )
}

export interface PredatorTypeOwnedEffects {
  advantages: CharacterAdvantagesDraft
  disciplines: CharacterDisciplinesDraft
  skillSpecialties: CharacterSkillSpecialtiesDraft
}

export function removePredatorTypeEffects(
  effects: PredatorTypeOwnedEffects,
): PredatorTypeOwnedEffects {
  return {
    advantages:
      removePredatorTypeAdvantages(
        effects.advantages,
      ),

    disciplines:
      removePredatorTypeDisciplines(
        effects.disciplines,
      ),

    skillSpecialties:
      removePredatorTypeSpecialties(
        effects.skillSpecialties,
      ),
  }
}

export type PredatorTypeChoiceSelections =
  Record<string, number>

export function resolveSelectedPredatorChoices(
  predatorTypeKey: string,
  context: Record<string, unknown> = {},
  selections: PredatorTypeChoiceSelections = {},
): PredatorTypeChoiceGrant[] {
  const definition =
    getPredatorType(predatorTypeKey)

  if (!definition) {
    return []
  }

  const grants: PredatorTypeChoiceGrant[] = []

  for (const choice of definition.choices ?? []) {
    const selectableOptions =
      choice.options.filter(
        option =>
          option.when === undefined,
      )

    const hasMultipleUnconditionalOptions =
      selectableOptions.length > 1

    if (hasMultipleUnconditionalOptions) {
      const selectedIndex =
        selections[choice.id]

      if (
        selectedIndex === undefined ||
        selectedIndex < 0 ||
        selectedIndex >=
          choice.options.length
      ) {
        continue
      }

      const selectedOption =
        choice.options[selectedIndex]

      if (selectedOption.when !== undefined) {
        continue
      }

      grants.push(selectedOption.grant)
      continue
    }

    const resolved =
      resolveChoice(
        choice,
        context,
      )

    if (resolved !== null) {
      grants.push(resolved)
    }
  }

  return grants
}

function createPredatorTypeSelectionId(
  predatorTypeKey: string,
  kind: string,
  key: string,
): string {
  return [
    'predatorType',
    predatorTypeKey,
    kind,
    key,
  ].join(':')
}

export function applyPredatorTypeAdvantages(
  predatorTypeKey: string,
  advantages: CharacterAdvantagesDraft,
): CharacterAdvantagesDraft {
  const cleaned =
    removePredatorTypeAdvantages(
      advantages,
    )

  const definition =
    getPredatorType(predatorTypeKey)

  if (!definition) {
    return cleaned
  }

  const pendingReferences =
    new Set(
      predatorPendingReferences(
        predatorTypeKey,
      ),
    )

  const selections:
    CharacterAdvantageSelectionDraft[] =
      (
        definition.fixedGrants
          ?.advantages ?? []
      )
        .filter(
          grant =>
            !pendingReferences.has(
              grant.definitionKey,
            ),
        )
        .map(
          grant => ({
            selectionId:
              createPredatorTypeSelectionId(
                predatorTypeKey,
                'advantage',
                grant.definitionKey,
              ),

            definitionKey:
              grant.definitionKey,

            category:
              grant.category,

            rating:
              grant.rating,

            origin:
              'predatorType',
          }),
        )

  return {
    ...cleaned,

    selections: [
      ...cleaned.selections,
      ...selections,
    ],
  }
}

export function applyPredatorTypeDisciplines(
  predatorTypeKey: string,
  clanKey: string | null,
  disciplines: CharacterDisciplinesDraft,
  selections: PredatorTypeChoiceSelections = {},
): CharacterDisciplinesDraft {
  const cleaned =
    removePredatorTypeDisciplines(
      disciplines,
    )

  if (
    predatorTypeKey === '' ||
    clanKey === null ||
    !clanAllowed(
      predatorTypeKey,
      clanKey,
    )
  ) {
    return cleaned
  }

  const grants =
    resolveSelectedPredatorChoices(
      predatorTypeKey,
      {
        clan: clanKey,
      },
      selections,
    )

  const predatorDisciplines:
    CharacterDisciplineDraft[] =
      grants
        .filter(
          (
            grant,
          ): grant is Extract<
            PredatorTypeChoiceGrant,
            {
              type: 'discipline'
            }
          > =>
            grant.type ===
            'discipline',
        )
        .map(
          grant => ({
            key:
              grant.disciplineKey,

            value:
              grant.dots,

            powerKeys:
              [],

            origin:
              'predatorType',
          }),
        )

  return [
    ...cleaned,
    ...predatorDisciplines,
  ]
}

export function applyPredatorTypeSpecialties(
  predatorTypeKey: string,
  clanKey: string | null,
  specialties: CharacterSkillSpecialtiesDraft,
  selections: PredatorTypeChoiceSelections = {},
): CharacterSkillSpecialtiesDraft {
  const cleaned =
    removePredatorTypeSpecialties(
      specialties,
    )

  if (
    predatorTypeKey === '' ||
    clanKey === null ||
    !clanAllowed(
      predatorTypeKey,
      clanKey,
    )
  ) {
    return cleaned
  }

  const grants =
    resolveSelectedPredatorChoices(
      predatorTypeKey,
      {
        clan: clanKey,
      },
      selections,
    )

  const predatorSpecialties:
    SkillSpecialty[] =
      grants
        .filter(
          (
            grant,
          ): grant is Extract<
            PredatorTypeChoiceGrant,
            {
              type: 'specialty'
            }
          > =>
            grant.type ===
            'specialty',
        )
        .map(
          grant => ({
            id:
              createPredatorTypeSelectionId(
                predatorTypeKey,
                'specialty',
                [
                  grant.skillKey,
                  grant.name,
                ].join(':'),
              ),

            skillKey:
              grant.skillKey,

            name:
              grant.name,

            origin:
              'predatorType',
          }),
        )

  return [
    ...cleaned,
    ...predatorSpecialties,
  ]
}

export interface ApplyPredatorTypeEffectsInput
  extends PredatorTypeOwnedEffects {
  predatorTypeKey: string
  clanKey: string | null
  choiceSelections?: PredatorTypeChoiceSelections
}

export function applyPredatorTypeEffects(
  input: ApplyPredatorTypeEffectsInput,
): PredatorTypeOwnedEffects {
  const choiceSelections =
    input.choiceSelections ?? {}

  const validPredatorTypeKey =
    normalizePredatorTypeForCharacter(
      input.predatorTypeKey,
      input.clanKey,
    )

  if (validPredatorTypeKey === '') {
    return removePredatorTypeEffects(
      input,
    )
  }

  return {
    advantages:
      applyPredatorTypeAdvantages(
        validPredatorTypeKey,
        input.advantages,
      ),

    disciplines:
      applyPredatorTypeDisciplines(
        validPredatorTypeKey,
        input.clanKey,
        input.disciplines,
        choiceSelections,
      ),

    skillSpecialties:
      applyPredatorTypeSpecialties(
        validPredatorTypeKey,
        input.clanKey,
        input.skillSpecialties,
        choiceSelections,
      ),
  }
}

