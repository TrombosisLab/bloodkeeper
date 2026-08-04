import { useState } from 'react'

import { demoCharacter } from '../data/demo-character'

import {
  demoHealth,
  demoWillpower,
} from '../data/demo-trackers'

import { demoState } from '../data/demo-state'

import type {
  CharacterSheetModel,
} from '../types/character-sheet-model.types'

import { CharacterAttributes } from './CharacterAttributes'
import { CharacterIdentity } from './CharacterIdentity'
import { CharacterSkills } from './CharacterSkills'
import { CharacterState } from './CharacterState'
import { CharacterDisciplines } from './CharacterDisciplines'
import { CharacterAdvantages } from './CharacterAdvantages'
import { CharacterNarrative } from './CharacterNarrative'
import { CharacterBloodExperience } from './CharacterBloodExperience'
import { CharacterSecondary } from './CharacterSecondary'
import { PersistedCharacterSecondary } from './PersistedCharacterSecondary'
import { PersistedCharacterLifecycle } from './PersistedCharacterLifecycle'
import { PersistedCharacterValidation } from './PersistedCharacterValidation'

interface CharacterSheetProps {
  characterId?: string
  model?: CharacterSheetModel
}

export function CharacterSheet({
  characterId,
  model,
}: CharacterSheetProps) {
  const persisted =
    model !== undefined

  const [stateEditing, setStateEditing] =
    useState(false)

  const [health, setHealth] = useState(
    () => ({
      ...(
        model?.damage.health ??
        demoHealth.track
      ),
    }),
  )

  const [willpower, setWillpower] =
    useState(
      () => ({
        ...(
          model?.damage.willpower ??
          demoWillpower.track
        ),
      }),
    )

  const [humanity, setHumanity] =
    useState(
      () => ({
        ...(
          model?.state.humanity ??
          demoState.humanity
        ),
      }),
    )

  const [hunger, setHunger] =
    useState(
      () =>
        model?.state.hunger ??
        demoState.hunger,
    )

  return (
    <article className="character-sheet">
      <header className="sheet-header">
        <div>
          <p className="sheet-header__eyebrow">
            Ficha de personaje
          </p>

          <h1>Vampiro: La Mascarada</h1>
        </div>

        <div className="sheet-header__actions">
          {!persisted ? (
            <button
              type="button"
              className="sheet-header__state-edit"
              aria-pressed={stateEditing}
              onClick={() =>
                setStateEditing(
                  (editing) => !editing,
                )
              }
            >
              {stateEditing
                ? 'Finalizar edición'
                : 'Editar estados'}
            </button>
          ) : null}

          <div className="sheet-header__edition">
            <span>V5</span>
          </div>
        </div>
      </header>

      {persisted ? (
        <p
          className="sheet-edit-notice"
          role="status"
        >
          Ficha persistida · revisión{' '}
          {model.revision}
        </p>
      ) : stateEditing ? (
        <p
          className="sheet-edit-notice"
          role="status"
        >
          Edición local de demostración. Los cambios no
          se guardan.
        </p>
      ) : null}

      <CharacterIdentity
        character={
          model?.identity ??
          demoCharacter
        }
      />

      <CharacterAttributes
        attributes={model?.attributes}
        health={health}
        healthCapacity={
          model?.damage.healthCapacity
        }
        willpower={willpower}
        willpowerCapacity={
          model?.damage.willpowerCapacity
        }
        stateEditing={
          !persisted && stateEditing
        }
        onHealthChange={setHealth}
        onWillpowerChange={setWillpower}
      />

      <CharacterSkills
        skills={model?.skills}
      />

      <CharacterState
        humanity={humanity}
        hunger={hunger}
        bloodPotency={
          model?.state.bloodPotency
        }
        stateEditing={
          !persisted && stateEditing
        }
        onHumanityChange={setHumanity}
        onHungerChange={setHunger}
      />

      <CharacterDisciplines
        disciplines={model?.disciplines}
      />

      <CharacterAdvantages
        advantages={model?.advantages}
      />

      <CharacterNarrative
        narrative={model?.narrative}
      />

      <CharacterBloodExperience
        available={
          model?.availability
            .bloodExperience ??
          true
        }
      />

      {characterId ? (
        <>
          <PersistedCharacterValidation
            characterId={characterId}
          />
          <PersistedCharacterLifecycle
            characterId={characterId}
          />
        </>
      ) : null}

      {characterId ? (
        <PersistedCharacterSecondary
          characterId={characterId}
        />
      ) : (
        <CharacterSecondary />
      )}
    </article>
  )
}
