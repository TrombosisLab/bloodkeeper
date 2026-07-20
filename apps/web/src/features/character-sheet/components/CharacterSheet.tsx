import { demoCharacter } from '../data/demo-character'
import { CharacterIdentity } from './CharacterIdentity'

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

      <section className="next-section-placeholder">
        <span>Siguiente bloque</span>
        <strong>Atributos</strong>
      </section>
    </article>
  )
}
