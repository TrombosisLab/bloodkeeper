import {
  useEffect,
  useState,
} from 'react'

import { V5VisualMark } from '../../v5-visuals/V5VisualMark'

import type {
  CharacterIdentity as CharacterIdentityData,
} from '../types/character-sheet.types'

import type {
  CharacterProfilePhase,
} from '../types/character-sheet-model.types'

import { IdentityField } from './IdentityField'
import { CharacterPortrait } from './CharacterPortrait'

export interface CharacterIdentityEditableFields {
  ambition: string
  desire: string
}

interface CharacterIdentityProps {
  characterId?: string
  character: CharacterIdentityData
  profilePhase?: CharacterProfilePhase
  editing?: boolean
  onSave?: (
    identity: CharacterIdentityEditableFields,
  ) => Promise<void>
  onFinishEditing?: () => void
}

type IdentitySaveState =
  | 'ready'
  | 'saving'
  | 'error'

function transitionalValue(
  value: string,
  profilePhase: CharacterProfilePhase | undefined,
): string {
  return profilePhase === 'TRANSITIONAL_VAMPIRE' && value.trim() === ''
    ? 'Pendiente'
    : value
}

export function CharacterIdentity({
  characterId,
  character,
  profilePhase,
  editing = false,
  onSave,
  onFinishEditing,
}: CharacterIdentityProps) {
  const human = profilePhase === 'HUMAN'
  const [ambition, setAmbition] =
    useState(character.ambition)
  const [desire, setDesire] =
    useState(character.desire)
  const [saveState, setSaveState] =
    useState<IdentitySaveState>('ready')

  useEffect(() => {
    if (!editing) return

    setAmbition(character.ambition)
    setDesire(character.desire)
    setSaveState('ready')
  }, [
    editing,
    character.ambition,
    character.desire,
  ])

  function cancelEditing(): void {
    if (saveState === 'saving') return

    setAmbition(character.ambition)
    setDesire(character.desire)
    setSaveState('ready')
    onFinishEditing?.()
  }

  async function saveIdentity(): Promise<void> {
    if (
      onSave === undefined ||
      saveState === 'saving'
    ) {
      return
    }

    setSaveState('saving')

    try {
      await onSave({
        ambition: ambition.trim(),
        desire: desire.trim(),
      })
      setSaveState('ready')
      onFinishEditing?.()
    } catch {
      setSaveState('error')
    }
  }

  return (
    <section
      className="sheet-section identity-section"
      aria-labelledby="identity-title"
      data-profile-phase={profilePhase ?? 'DEMO'}
    >
      <div className="identity-header-layout">
        <CharacterPortrait
          characterId={characterId}
          name={character.name}
          clan={character.clan}
        />

        <div className="identity-header-main">
          <div className="section-heading identity-heading">
            <div className="identity-heading__name">
              <p className="section-kicker">Identidad</p>
              <h2 id="identity-title">{character.name}</h2>
            </div>

            {!human ? (
              <div className="clan-mark">
                <V5VisualMark
                  kind="clan-symbol"
                  value={character.clan}
                  decorative
                />
                <span>Clan</span>
                <strong>
                  {transitionalValue(character.clan, profilePhase)}
                </strong>
              </div>
            ) : null}
          </div>

          <div
            className={
              editing && onSave !== undefined
                ? 'identity-grid identity-grid--editing'
                : 'identity-grid'
            }
          >
            <IdentityField
              label="Concepto"
              value={character.concept}
              featured
            />
            {!human ? (
              <IdentityField
                label="Depredador"
                value={transitionalValue(
                  character.predatorType,
                  profilePhase,
                )}
              />
            ) : null}
            <IdentityField
              label="Crónica"
              value={character.chronicle}
            />

            {editing && onSave !== undefined ? (
              <label className="identity-field identity-field--featured identity-editor__field">
                <span className="identity-field__label">
                  Ambición
                </span>
                <textarea
                  value={ambition}
                  maxLength={500}
                  rows={2}
                  placeholder="Objetivo a largo plazo del personaje"
                  onChange={(event) =>
                    setAmbition(event.target.value)
                  }
                />
              </label>
            ) : (
              <IdentityField
                label="Ambición"
                value={character.ambition}
                featured
              />
            )}

            {!human ? (
              <>
                <IdentityField
                  label="Clan"
                  value={transitionalValue(
                    character.clan,
                    profilePhase,
                  )}
                />
                <IdentityField
                  label="Generación"
                  value={transitionalValue(
                    character.generation,
                    profilePhase,
                  )}
                />
                <IdentityField
                  label="Sire"
                  value={transitionalValue(
                    character.sire,
                    profilePhase,
                  )}
                />
              </>
            ) : null}

            {editing && onSave !== undefined ? (
              <label className="identity-field identity-field--featured identity-editor__field">
                <span className="identity-field__label">
                  Deseo
                </span>
                <textarea
                  value={desire}
                  maxLength={500}
                  rows={2}
                  placeholder="Objetivo inmediato del personaje"
                  onChange={(event) =>
                    setDesire(event.target.value)
                  }
                />
              </label>
            ) : (
              <IdentityField
                label="Deseo"
                value={character.desire}
                featured
              />
            )}

            {editing && onSave !== undefined ? (
              <div className="identity-editor__actions">
                {saveState === 'error' ? (
                  <p role="alert">
                    No se pudieron guardar Ambición y Deseo. Recarga la ficha e inténtalo de nuevo.
                  </p>
                ) : null}

                <button
                  type="button"
                  className="identity-editor__button identity-editor__button--secondary"
                  disabled={saveState === 'saving'}
                  onClick={cancelEditing}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="identity-editor__button"
                  disabled={saveState === 'saving'}
                  onClick={() => void saveIdentity()}
                >
                  {saveState === 'saving'
                    ? 'Guardando…'
                    : 'Guardar cambios'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
