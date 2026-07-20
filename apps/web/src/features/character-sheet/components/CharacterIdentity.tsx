import type {
  CharacterIdentity as CharacterIdentityData,
} from '../types/character-sheet.types'

import { IdentityField } from './IdentityField'

interface CharacterIdentityProps {
  character: CharacterIdentityData
}

export function CharacterIdentity({
  character,
}: CharacterIdentityProps) {
  return (
    <section
      className="sheet-section identity-section"
      aria-labelledby="identity-title"
    >
      <div className="section-heading identity-heading">
        <div>
          <p className="section-kicker">
            Identidad
          </p>

          <h2 id="identity-title">
            {character.name}
          </h2>
        </div>

        <div className="clan-mark">
          <span>Clan</span>
          <strong>{character.clan}</strong>
        </div>
      </div>

      <div className="identity-grid">
        <IdentityField
          label="Concepto"
          value={character.concept}
          featured
        />

        <IdentityField
          label="Depredador"
          value={character.predatorType}
        />

        <IdentityField
          label="Crónica"
          value={character.chronicle}
        />

        <IdentityField
          label="Ambición"
          value={character.ambition}
          featured
        />

        <IdentityField
          label="Clan"
          value={character.clan}
        />

        <IdentityField
          label="Generación"
          value={character.generation}
        />

        <IdentityField
          label="Sire"
          value={character.sire}
        />

        <IdentityField
          label="Deseo"
          value={character.desire}
          featured
        />
      </div>
    </section>
  )
}
