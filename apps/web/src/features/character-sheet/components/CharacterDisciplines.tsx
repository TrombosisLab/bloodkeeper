import { demoDisciplines } from '../data/demo-disciplines'

import {
  disciplineDefinitions,
} from '../../character-creation/data/discipline-definitions'

import {
  disciplinePowerDefinitions,
} from '../../character-creation/data/discipline-power-definitions'

import {
  contentSources,
} from '../../character-creation/data/content-sources'

import {
  buildCharacterDisciplineReadModel,
} from '../domain/character-discipline-read-model'

import type {
  CharacterDisciplineView,
} from '../types/character-disciplines.types'

import { DisciplineCard } from './DisciplineCard'

interface CharacterDisciplinesProps {
  disciplines?: CharacterDisciplineView[]
}

export function CharacterDisciplines({
  disciplines,
}: CharacterDisciplinesProps) {
  const resolvedDisciplines =
    disciplines ??
    buildCharacterDisciplineReadModel(
      demoDisciplines,
      disciplineDefinitions,
      disciplinePowerDefinitions,
      contentSources,
    )

  return (
    <section
      className="sheet-section disciplines-section"
      aria-labelledby="disciplines-title"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Poderes de la Sangre
          </p>

          <h2 id="disciplines-title">
            Disciplinas
          </h2>
        </div>

        <span className="section-number">
          04
        </span>
      </div>

      <div className="disciplines-grid">
        {resolvedDisciplines.map(
          (discipline) => (
            <DisciplineCard
              key={discipline.key}
              discipline={discipline}
            />
          ),
        )}
      </div>
    </section>
  )
}
