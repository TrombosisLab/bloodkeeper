import type {
  DisciplinePowerDefinition,
} from '../../character-creation/types/discipline-power.types'
import type {
  DisciplineDefinition,
} from '../../character-creation/types/discipline.types'
import type {
  CharacterDisciplineState,
  CharacterDisciplineView,
  DisciplinePowerView,
} from '../types/character-disciplines.types'

export function buildCharacterDisciplineReadModel(
  state: readonly CharacterDisciplineState[],
  disciplineDefinitions:
    readonly DisciplineDefinition[],
  powerDefinitions:
    readonly DisciplinePowerDefinition[],
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
            sourcePage: powerDefinition.sourcePage,
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
