import { useState } from 'react'

import { demoCharacter } from '../data/demo-character'
import {
  demoHealth,
  demoWillpower,
} from '../data/demo-trackers'
import { demoState } from '../data/demo-state'

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
import { PersistedCharacterValidation } from './PersistedCharacterValidation'

interface CharacterSheetProps {
  characterId?: string
}

export function CharacterSheet({
  characterId,
}: CharacterSheetProps) {
  const [stateEditing, setStateEditing] =
    useState(false)
  const [health, setHealth] = useState({
    ...demoHealth.track,
  })
  const [willpower, setWillpower] =
    useState({
      ...demoWillpower.track,
    })
  const [humanity, setHumanity] = useState({
    ...demoState.humanity,
  })
  const [hunger, setHunger] =
    useState(
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
          <button
            type="button"
            className="sheet-header__state-edit"
            aria-pressed={stateEditing}
            onClick={() =>
              setStateEditing((editing) => !editing)
            }
          >
            {stateEditing
              ? 'Finalizar edición'
              : 'Editar estados'}
          </button>

          <div className="sheet-header__edition">
            <span>V5</span>
          </div>
        </div>
      </header>

      {stateEditing ? (
        <p
          className="sheet-edit-notice"
          role="status"
        >
          Edición local de demostración. Los cambios no
          se guardan.
        </p>
      ) : null}

      <CharacterIdentity
        character={demoCharacter}
      />

      <CharacterAttributes
        health={health}
        willpower={willpower}
        stateEditing={stateEditing}
        onHealthChange={setHealth}
        onWillpowerChange={setWillpower}
      />

      <CharacterSkills />

      <CharacterState
        humanity={humanity}
        hunger={hunger}
        stateEditing={stateEditing}
        onHumanityChange={setHumanity}
        onHungerChange={setHunger}
      />

      <CharacterDisciplines />

      <CharacterAdvantages />

      <CharacterNarrative />

      <CharacterBloodExperience />

      {characterId ? (
        <PersistedCharacterValidation
          characterId={characterId}
        />
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
