import type {
  ChangeEvent,
} from 'react'

import type {
  CharacterHumanityDraft,
} from '../types/character-humanity-draft.types'

interface HumanityStepProps {
  value: CharacterHumanityDraft
  onChange: (
    value: CharacterHumanityDraft,
  ) => void
}

let nextDraftId = 0

function createId(
  prefix: string,
): string {
  nextDraftId += 1

  return [
    prefix,
    Date.now(),
    nextDraftId,
  ].join('-')
}

export function HumanityStep({
  value,
  onChange,
}: HumanityStepProps) {
  function addConviction() {
    if (value.convictions.length >= 3) {
      return
    }

    const convictionId =
      createId('conviction')

    const touchstoneId =
      createId('touchstone')

    onChange({
      ...value,
      convictions: [
        ...value.convictions,
        {
          convictionId,
          text: '',
          touchstoneId,
        },
      ],
      touchstones: [
        ...value.touchstones,
        {
          touchstoneId,
          name: '',
          relationship: '',
        },
      ],
    })
  }

  function removeConviction(
    convictionId: string,
  ) {
    const conviction =
      value.convictions.find(
        (candidate) =>
          candidate.convictionId ===
          convictionId,
      )

    onChange({
      ...value,
      convictions:
        value.convictions.filter(
          (candidate) =>
            candidate.convictionId !==
            convictionId,
        ),
      touchstones:
        value.touchstones.filter(
          (touchstone) =>
            touchstone.touchstoneId !==
            conviction?.touchstoneId,
        ),
    })
  }

  function updateConviction(
    convictionId: string,
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    onChange({
      ...value,
      convictions:
        value.convictions.map(
          (conviction) =>
            conviction.convictionId ===
            convictionId
              ? {
                  ...conviction,
                  text:
                    event.target.value,
                }
              : conviction,
        ),
    })
  }

  function updateTouchstone(
    touchstoneId: string,
    field:
      | 'name'
      | 'relationship',
    event: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >,
  ) {
    onChange({
      ...value,
      touchstones:
        value.touchstones.map(
          (touchstone) =>
            touchstone.touchstoneId ===
            touchstoneId
              ? {
                  ...touchstone,
                  [field]:
                    event.target.value,
                }
              : touchstone,
        ),
    })
  }

  return (
    <div className="creation-step-content">
      <section className="creation-step-section">
        <header className="creation-step-section__header">
          <div>
            <span>
              Humanidad inicial
            </span>

            <h3>
              Humanidad {value.value}
            </h3>

            <p>
              La Humanidad inicial del
              personaje es 7.
            </p>
          </div>
        </header>

        <div
          className="humanity-track"
          aria-label={
            `Humanidad ${value.value} de 10`
          }
        >
          {Array.from(
            { length: 10 },
            (_, index) => {
              const level = index + 1
              const filled =
                level <= value.value

              return (
                <span
                  key={level}
                  className={
                    filled
                      ? 'humanity-box humanity-box--filled'
                      : 'humanity-box'
                  }
                  aria-hidden="true"
                />
              )
            },
          )}
        </div>
      </section>

      <section className="creation-step-section">
        <header className="creation-step-section__header">
          <div>
            <span>
              Principios personales
            </span>

            <h3>
              Convicciones y Piedras
              de Toque
            </h3>

            <p>
              Define entre una y tres
              Convicciones. Cada una debe
              estar vinculada a una Piedra
              de Toque mortal.
            </p>
          </div>

          <strong>
            {value.convictions.length}
            {' / 3'}
          </strong>
        </header>

        {value.convictions.length === 0 ? (
          <div className="creation-empty-state">
            <p>
              Todavía no has definido
              ninguna Convicción.
            </p>
          </div>
        ) : (
          <div className="creation-form-grid">
            {value.convictions.map(
              (conviction, index) => {
                const touchstone =
                  value.touchstones.find(
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
                    className="creation-card creation-field--wide"
                  >
                    <header>
                      <div>
                        <span>
                          Convicción{' '}
                          {index + 1}
                        </span>

                        <h4>
                          Principio y
                          vínculo mortal
                        </h4>
                      </div>

                      <button
                        type="button"
                        className="creation-button creation-button--secondary"
                        onClick={() =>
                          removeConviction(
                            conviction
                              .convictionId,
                          )
                        }
                      >
                        Eliminar
                      </button>
                    </header>

                    <label className="creation-field creation-field--wide">
                      <span>
                        Convicción
                      </span>

                      <textarea
                        value={
                          conviction.text
                        }
                        onChange={(event) =>
                          updateConviction(
                            conviction
                              .convictionId,
                            event,
                          )
                        }
                        rows={3}
                        placeholder="Ejemplo: protege siempre a los indefensos"
                      />
                    </label>

                    {touchstone && (
                      <div className="creation-form-grid">
                        <label className="creation-field">
                          <span>
                            Piedra de Toque
                          </span>

                          <input
                            type="text"
                            value={
                              touchstone
                                .name
                            }
                            onChange={(
                              event,
                            ) =>
                              updateTouchstone(
                                touchstone
                                  .touchstoneId,
                                'name',
                                event,
                              )
                            }
                            placeholder="Nombre de la persona"
                          />
                        </label>

                        <label className="creation-field">
                          <span>
                            Relación
                          </span>

                          <textarea
                            value={
                              touchstone
                                .relationship
                            }
                            onChange={(
                              event,
                            ) =>
                              updateTouchstone(
                                touchstone
                                  .touchstoneId,
                                'relationship',
                                event,
                              )
                            }
                            rows={2}
                            placeholder="Relación con el personaje"
                          />
                        </label>
                      </div>
                    )}
                  </article>
                )
              },
            )}
          </div>
        )}

        <button
          type="button"
          className="creation-button creation-button--primary"
          onClick={addConviction}
          disabled={
            value.convictions.length >= 3
          }
        >
          Añadir Convicción
        </button>
      </section>
    </div>
  )
}
