import type {
  CharacterDraft,
} from '../types/character-draft.types'

interface ReviewStepProps {
  draft: CharacterDraft
}

function displayValue(
  value:
    | string
    | number
    | null
    | undefined,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Sin definir'
  }

  return String(value)
}

export function ReviewStep({
  draft,
}: ReviewStepProps) {
  return (
    <div className="creation-step-content">
      <section className="creation-step-section">
        <header className="creation-step-section__header">
          <div>
            <span>
              Revisión final
            </span>

            <h3>
              Resumen del personaje
            </h3>

            <p>
              Comprueba los datos antes
              de finalizar la creación.
            </p>
          </div>
        </header>
      </section>

      <section className="creation-step-section">
        <header className="creation-step-section__header">
          <div>
            <span>
              Identidad
            </span>

            <h3>
              Datos principales
            </h3>
          </div>
        </header>

        <div className="creation-form-grid">
          <article className="creation-card">
            <span>
              Nombre
            </span>

            <h4>
              {displayValue(
                draft.identity.name,
              )}
            </h4>
          </article>

          <article className="creation-card">
            <span>
              Concepto
            </span>

            <h4>
              {displayValue(
                draft.identity.concept,
              )}
            </h4>
          </article>

          <article className="creation-card">
            <span>
              Clan
            </span>

            <h4>
              {displayValue(
                draft.identity.clan,
              )}
            </h4>
          </article>

          <article className="creation-card">
            <span>
              Generación
            </span>

            <h4>
              {draft.identity.generation
                ? `${draft.identity.generation}.ª`
                : 'Sin definir'}
            </h4>
          </article>
        </div>
      </section>

      <section className="creation-step-section">
        <header className="creation-step-section__header">
          <div>
            <span>
              Humanidad
            </span>

            <h3>
              Humanidad {
                draft.humanity.value
              }
            </h3>

            <p>
              Convicciones y vínculos
              mortales del personaje.
            </p>
          </div>

          <strong>
            {
              draft.humanity
                .convictions.length
            }
            {' Convicciones'}
          </strong>
        </header>

        <div
          className="humanity-track"
          aria-label={
            `Humanidad ${draft.humanity.value} de 10`
          }
        >
          {Array.from(
            { length: 10 },
            (_, index) => {
              const level = index + 1

              return (
                <span
                  key={level}
                  className={
                    level <=
                    draft.humanity.value
                      ? 'humanity-box humanity-box--filled'
                      : 'humanity-box'
                  }
                  aria-hidden="true"
                />
              )
            },
          )}
        </div>

        <div className="creation-form-grid">
          {draft.humanity.convictions.map(
            (conviction, index) => {
              const touchstone =
                draft.humanity
                  .touchstones.find(
                    (candidate) =>
                      candidate
                        .touchstoneId ===
                      conviction
                        .touchstoneId,
                  )

              return (
                <article
                  key={
                    conviction
                      .convictionId
                  }
                  className="creation-card"
                >
                  <header>
                    <div>
                      <span>
                        Convicción{' '}
                        {index + 1}
                      </span>

                      <h4>
                        {conviction.text}
                      </h4>
                    </div>
                  </header>

                  <div>
                    <span>
                      Piedra de Toque
                    </span>

                    <p>
                      <strong>
                        {
                          touchstone?.name ??
                          'Sin definir'
                        }
                      </strong>
                    </p>

                    <p>
                      {
                        touchstone
                          ?.relationship ??
                        'Sin relación definida'
                      }
                    </p>
                  </div>
                </article>
              )
            },
          )}
        </div>
      </section>
    </div>
  )
}
