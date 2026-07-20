import { demoDisciplines } from '../data/demo-disciplines'
import { DisciplineCard } from './DisciplineCard'

export function CharacterDisciplines() {
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
        {demoDisciplines.map((discipline) => (
          <DisciplineCard
            key={discipline.key}
            discipline={discipline}
          />
        ))}
      </div>
    </section>
  )
}
