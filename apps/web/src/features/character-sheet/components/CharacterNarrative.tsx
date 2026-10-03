import {
  useState,
} from 'react'

import { displayValue } from './displayValue'

import {
  demoNarrativeState,
} from '../data/demo-convictions'

import type {
  CharacterNarrativeState,
  Conviction,
  Touchstone,
} from '../types/character-convictions.types'

interface CharacterNarrativeProps {
  narrative?: CharacterNarrativeState
  onSave?: (
    narrative: CharacterNarrativeState,
  ) => Promise<void>
}

type NarrativeSaveState =
  | 'ready'
  | 'saving'
  | 'error'

function copyNarrative(
  narrative: CharacterNarrativeState,
): CharacterNarrativeState {
  return {
    convictions:
      narrative.convictions.map(
        (conviction) => ({ ...conviction }),
      ),
    touchstones:
      narrative.touchstones.map(
        (touchstone) => ({ ...touchstone }),
      ),
    notes: narrative.notes,
  }
}

function createNarrativeKey(
  prefix: string,
): string {
  const randomUuid =
    globalThis.crypto?.randomUUID?.()

  return randomUuid === undefined
    ? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
    : randomUuid
}

function normalizedNarrative(
  draft: CharacterNarrativeState,
): CharacterNarrativeState {
  const touchstones =
    draft.touchstones
      .map((touchstone) => ({
        ...touchstone,
        name: touchstone.name.trim(),
        relation:
          touchstone.relation.trim(),
      }))
      .filter(
        (touchstone) =>
          touchstone.name !== '' ||
          touchstone.relation !== '',
      )

  const touchstoneKeys =
    new Set(
      touchstones.map(
        (touchstone) => touchstone.key,
      ),
    )

  return {
    convictions:
      draft.convictions
        .map((conviction) => ({
          ...conviction,
          text: conviction.text.trim(),
          touchstoneKey:
            conviction.touchstoneKey !== null &&
            touchstoneKeys.has(
              conviction.touchstoneKey,
            )
              ? conviction.touchstoneKey
              : null,
        }))
        .filter(
          (conviction) =>
            conviction.text !== '',
        ),
    touchstones,
    notes: draft.notes.trim(),
  }
}

export function CharacterNarrative({
  narrative = demoNarrativeState,
  onSave,
}: CharacterNarrativeProps) {
  const [editing, setEditing] =
    useState(false)
  const [draft, setDraft] =
    useState<CharacterNarrativeState>(
      () => copyNarrative(narrative),
    )
  const [saveState, setSaveState] =
    useState<NarrativeSaveState>('ready')

  function startEditing(): void {
    setDraft(copyNarrative(narrative))
    setSaveState('ready')
    setEditing(true)
  }

  function cancelEditing(): void {
    if (saveState === 'saving') return

    setDraft(copyNarrative(narrative))
    setSaveState('ready')
    setEditing(false)
  }

  function updateConviction(
    key: string,
    changes: Partial<Conviction>,
  ): void {
    setDraft((current) => ({
      ...current,
      convictions:
        current.convictions.map(
          (conviction) =>
            conviction.key === key
              ? { ...conviction, ...changes }
              : conviction,
        ),
    }))
  }

  function removeConviction(
    key: string,
  ): void {
    setDraft((current) => ({
      ...current,
      convictions:
        current.convictions.filter(
          (conviction) =>
            conviction.key !== key,
        ),
    }))
  }

  function addConviction(): void {
    setDraft((current) => ({
      ...current,
      convictions: [
        ...current.convictions,
        {
          key:
            createNarrativeKey(
              'conviction',
            ),
          text: '',
          touchstoneKey: null,
        },
      ],
    }))
  }

  function updateTouchstone(
    key: string,
    changes: Partial<Touchstone>,
  ): void {
    setDraft((current) => ({
      ...current,
      touchstones:
        current.touchstones.map(
          (touchstone) =>
            touchstone.key === key
              ? { ...touchstone, ...changes }
              : touchstone,
        ),
    }))
  }

  function removeTouchstone(
    key: string,
  ): void {
    setDraft((current) => ({
      ...current,
      touchstones:
        current.touchstones.filter(
          (touchstone) =>
            touchstone.key !== key,
        ),
      convictions:
        current.convictions.map(
          (conviction) =>
            conviction.touchstoneKey === key
              ? {
                  ...conviction,
                  touchstoneKey: null,
                }
              : conviction,
        ),
    }))
  }

  function addTouchstone(): void {
    setDraft((current) => ({
      ...current,
      touchstones: [
        ...current.touchstones,
        {
          key:
            createNarrativeKey(
              'touchstone',
            ),
          name: '',
          relation: '',
        },
      ],
    }))
  }

  async function saveNarrative(): Promise<void> {
    if (
      onSave === undefined ||
      saveState === 'saving'
    ) {
      return
    }

    setSaveState('saving')

    try {
      await onSave(
        normalizedNarrative(draft),
      )
      setSaveState('ready')
      setEditing(false)
    } catch {
      setSaveState('error')
    }
  }

  return (
    <section
      className="sheet-section narrative-section"
      aria-labelledby="narrative-title"
    >
      <div className="section-title narrative-section__title">
        <div>
          <p className="section-kicker">
            Anclas humanas
          </p>

          <h2 id="narrative-title">
            Convicciones y Piedras de Toque
          </h2>
        </div>

        <div className="narrative-section__actions">
          {onSave !== undefined && !editing ? (
            <button
              type="button"
              className="narrative-editor__button"
              onClick={startEditing}
            >
              Editar historia
            </button>
          ) : null}

          <span className="section-number">
            06
          </span>
        </div>
      </div>

      {editing ? (
        <div className="narrative-editor">
          <div className="narrative-editor__grid">
            <section className="narrative-editor__panel">
              <header>
                <div>
                  <span>Principios</span>
                  <h3>Convicciones</h3>
                </div>

                <button
                  type="button"
                  className="narrative-editor__add"
                  onClick={addConviction}
                >
                  + Añadir
                </button>
              </header>

              <div className="narrative-editor__entries">
                {draft.convictions.length === 0 ? (
                  <p className="narrative-editor__empty">
                    Todavía no hay convicciones.
                  </p>
                ) : null}

                {draft.convictions.map(
                  (conviction, index) => (
                    <div
                      className="narrative-editor__entry"
                      key={conviction.key}
                    >
                      <label>
                        <span>
                          Convicción {index + 1}
                        </span>
                        <textarea
                          value={conviction.text}
                          maxLength={500}
                          rows={3}
                          onChange={(event) =>
                            updateConviction(
                              conviction.key,
                              {
                                text:
                                  event.target.value,
                              },
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          Piedra de Toque vinculada
                        </span>
                        <select
                          value={
                            conviction.touchstoneKey ??
                            ''
                          }
                          onChange={(event) =>
                            updateConviction(
                              conviction.key,
                              {
                                touchstoneKey:
                                  event.target.value === ''
                                    ? null
                                    : event.target.value,
                              },
                            )
                          }
                        >
                          <option value="">
                            Sin vínculo
                          </option>
                          {draft.touchstones.map(
                            (touchstone) => (
                              <option
                                key={touchstone.key}
                                value={touchstone.key}
                              >
                                {touchstone.name.trim() ||
                                  'Piedra sin nombre'}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <button
                        type="button"
                        className="narrative-editor__remove"
                        onClick={() =>
                          removeConviction(
                            conviction.key,
                          )
                        }
                      >
                        Eliminar convicción
                      </button>
                    </div>
                  ),
                )}
              </div>
            </section>

            <section className="narrative-editor__panel">
              <header>
                <div>
                  <span>Vínculos mortales</span>
                  <h3>Piedras de Toque</h3>
                </div>

                <button
                  type="button"
                  className="narrative-editor__add"
                  onClick={addTouchstone}
                >
                  + Añadir
                </button>
              </header>

              <div className="narrative-editor__entries">
                {draft.touchstones.length === 0 ? (
                  <p className="narrative-editor__empty">
                    Todavía no hay Piedras de Toque.
                  </p>
                ) : null}

                {draft.touchstones.map(
                  (touchstone, index) => (
                    <div
                      className="narrative-editor__entry"
                      key={touchstone.key}
                    >
                      <label>
                        <span>
                          Nombre {index + 1}
                        </span>
                        <input
                          type="text"
                          value={touchstone.name}
                          maxLength={200}
                          onChange={(event) =>
                            updateTouchstone(
                              touchstone.key,
                              {
                                name:
                                  event.target.value,
                              },
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          Relación con el personaje
                        </span>
                        <textarea
                          value={touchstone.relation}
                          maxLength={500}
                          rows={2}
                          onChange={(event) =>
                            updateTouchstone(
                              touchstone.key,
                              {
                                relation:
                                  event.target.value,
                              },
                            )
                          }
                        />
                      </label>

                      <button
                        type="button"
                        className="narrative-editor__remove"
                        onClick={() =>
                          removeTouchstone(
                            touchstone.key,
                          )
                        }
                      >
                        Eliminar Piedra de Toque
                      </button>
                    </div>
                  ),
                )}
              </div>
            </section>
          </div>

          <label className="narrative-editor__notes">
            <span>Notas narrativas</span>
            <textarea
              value={draft.notes}
              maxLength={5000}
              rows={6}
              placeholder="Contexto, relaciones y recordatorios de la historia personal…"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </label>

          {saveState === 'error' ? (
            <p
              className="narrative-editor__message narrative-editor__message--error"
              role="alert"
            >
              No se pudieron guardar los cambios. Recarga la ficha e inténtalo de nuevo.
            </p>
          ) : null}

          <div className="narrative-editor__footer">
            <button
              type="button"
              className="narrative-editor__button narrative-editor__button--secondary"
              disabled={saveState === 'saving'}
              onClick={cancelEditing}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="narrative-editor__button"
              disabled={saveState === 'saving'}
              onClick={() => void saveNarrative()}
            >
              {saveState === 'saving'
                ? 'Guardando…'
                : 'Guardar historia'}
            </button>
          </div>
        </div>
      ) : (
        <div className="narrative-grid">
          <div className="narrative-panel">
            <header>
              <span>Principios</span>
              <h3>Convicciones</h3>
            </header>

            <ul className="narrative-list">
              {narrative.convictions.length === 0 ? (
                <li>Sin convicciones registradas</li>
              ) : null}

              {narrative.convictions.map(
                (conviction) => {
                  const linkedTouchstone =
                    narrative.touchstones.find(
                      (touchstone) =>
                        touchstone.key ===
                        conviction.touchstoneKey,
                    )

                  return (
                    <li key={conviction.key}>
                      {displayValue(
                        conviction.text,
                        'Convicción',
                      )}
                      {linkedTouchstone !== undefined ? (
                        <small>
                          Vinculada a {displayValue(
                            linkedTouchstone.name,
                            'Piedra sin nombre',
                          )}
                        </small>
                      ) : null}
                    </li>
                  )
                },
              )}
            </ul>
          </div>

          <div className="narrative-panel">
            <header>
              <span>Vínculos mortales</span>
              <h3>Piedras de Toque</h3>
            </header>

            <div className="touchstone-list">
              {narrative.touchstones.length === 0 ? (
                <p className="narrative-empty">
                  Sin Piedras de Toque registradas
                </p>
              ) : null}

              {narrative.touchstones.map(
                (touchstone) => (
                  <div
                    className="touchstone"
                    key={touchstone.key}
                  >
                    <strong>
                      {displayValue(
                        touchstone.name,
                        'Sin nombre',
                      )}
                    </strong>

                    <span>
                      {displayValue(
                        touchstone.relation,
                        'Relación',
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="narrative-panel narrative-panel--notes">
            <header>
              <span>Contexto</span>
              <h3>Notas narrativas</h3>
            </header>

            <p>
              {displayValue(
                narrative.notes,
                'Sin notas narrativas',
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
