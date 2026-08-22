import type {
  DisciplinePowerDefinition,
} from '../../character-creation/types/discipline-power.types'
import type {
  DisciplineDefinition,
} from '../../character-creation/types/discipline.types'
import type {
  ContentSourceDefinition,
} from '../../character-creation/types/content-source.types'
import type {
  CharacterDisciplineState,
  CharacterDisciplineView,
  DisciplinePowerView,
} from '../types/character-disciplines.types'

import {
  presentDisciplinePowerMechanics,
} from './discipline-power-mechanics-presenter.ts'

export function buildCharacterDisciplineReadModel(
  state: readonly CharacterDisciplineState[],
  disciplineDefinitions:
    readonly DisciplineDefinition[],
  powerDefinitions:
    readonly DisciplinePowerDefinition[],
  contentSourceDefinitions:
    readonly ContentSourceDefinition[],
): CharacterDisciplineView[] {
  const disciplinesByKey =
    new Map<string, DisciplineDefinition>(
      disciplineDefinitions.map(
        (definition) => [
          definition.key,
          definition,
        ],
      ),
    )
  const powersByKey =
    new Map<string, DisciplinePowerDefinition>(
      powerDefinitions.map(
        (definition) => [
          definition.key,
          definition,
        ],
      ),
    )
  const contentSourcesByKey =
    new Map<string, ContentSourceDefinition>(
      contentSourceDefinitions.map(
        (definition) => [
          definition.key,
          definition,
        ],
      ),
    )

  return state.map((disciplineState) => {
    const disciplineDefinition =
      disciplinesByKey.get(
        disciplineState.key,
      )

    const powers: DisciplinePowerView[] =
      disciplineState.powerKeys.map(
        (powerKey) => {
          const candidate =
            powersByKey.get(powerKey)
          const powerDefinition =
            candidate?.disciplineKey ===
            disciplineState.key
              ? candidate
              : undefined

          if (!powerDefinition) {
            return {
              key: powerKey,
              name: powerKey,
              level: null,
              catalogStatus: 'missing',
            }
          }

          return {
            key: powerDefinition.key,
            name: powerDefinition.name,
            level: powerDefinition.level,
            summary: powerDefinition.summary,
            sourceKey: powerDefinition.sourceKey,
            sourceName:
              powerDefinition.sourceKey
                ? contentSourcesByKey.get(
                    powerDefinition.sourceKey,
                  )?.shortName
                : undefined,
            sourcePage: powerDefinition.sourcePage,
            mechanics:
              powerDefinition.mechanics
                ? presentDisciplinePowerMechanics(
                    powerDefinition.mechanics,
                  )
                : undefined,
            catalogStatus: 'resolved',
          }
        },
      )

    return {
      key: disciplineState.key,
      name:
        disciplineDefinition?.name ??
        disciplineState.key,
      value: disciplineState.value,
      powers,
      catalogStatus: disciplineDefinition
        ? 'resolved'
        : 'missing',
    }
  })
}
