import { demoCharacter } from '../data/demo-character'

import { CharacterAttributes } from './CharacterAttributes'
import { CharacterIdentity } from './CharacterIdentity'
import { CharacterSkills } from './CharacterSkills'
import { CharacterState } from './CharacterState'
import { CharacterDisciplines } from './CharacterDisciplines'
import { CharacterAdvantages } from './CharacterAdvantages'
import { CharacterNarrative } from './CharacterNarrative'
import { CharacterBloodExperience } from './CharacterBloodExperience'

export function CharacterSheet() {
  return (
    <article className="character-sheet">
      <header className="sheet-header">
        <div>
          <p className="sheet-header__eyebrow">
            Ficha de personaje
          </p>

          <h1>Vampiro: La Mascarada</h1>
        </div>

        <div className="sheet-header__edition">
          <span>V5</span>
        </div>
      </header>

      <CharacterIdentity
        character={demoCharacter}
      />

      <CharacterAttributes />

      <CharacterSkills />

      <CharacterState />

      <CharacterDisciplines />

      <CharacterAdvantages />

      <CharacterNarrative />

      <CharacterBloodExperience />
    </article>
  )
}
