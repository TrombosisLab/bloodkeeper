import {
  demoBloodExperience,
} from '../data/demo-blood-experience'

interface CharacterBloodExperienceProps {
  available?: boolean
}

export function CharacterBloodExperience({
  available = true,
}: CharacterBloodExperienceProps) {
  const totalExperience =
    demoBloodExperience.experienceCurrent +
    demoBloodExperience.experienceSpent

  return (
    <section
      className="sheet-section blood-experience-section"
      aria-labelledby="blood-experience-title"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Sangre y evolución
          </p>

          <h2 id="blood-experience-title">
            Resonancia y Experiencia
          </h2>
        </div>

        <span className="section-number">
          07
        </span>
      </div>

      {available ? (
        <div className="blood-experience-grid">
          <div className="blood-info-card">
            <span className="blood-info-card__label">
              Resonancia
            </span>

            <strong>
              {demoBloodExperience.resonance}
            </strong>
          </div>

          <div className="blood-info-card">
            <span className="blood-info-card__label">
              Temperamento
            </span>

            <strong>
              {demoBloodExperience.temperament}
            </strong>
          </div>

          <div className="experience-card">
            <div>
              <span>Experiencia disponible</span>
              <strong>
                {
                  demoBloodExperience
                    .experienceCurrent
                }
              </strong>
            </div>

            <div>
              <span>Experiencia gastada</span>
              <strong>
                {
                  demoBloodExperience
                    .experienceSpent
                }
              </strong>
            </div>

            <div>
              <span>Total obtenida</span>
              <strong>
                {totalExperience}
              </strong>
            </div>
          </div>
        </div>
      ) : (
        <p className="secondary-empty">
          Esta información todavía no forma parte del
          contrato persistente.
        </p>
      )}
    </section>
  )
}
