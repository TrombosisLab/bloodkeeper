import { V5VisualMark } from '../../v5-visuals/V5VisualMark'
import type {
  CharacterIdentity as CharacterIdentityData,
} from '../types/character-sheet.types'

import type {
  CharacterProfilePhase,
} from '../types/character-sheet-model.types'

import { IdentityField } from './IdentityField'
import { CharacterPortrait } from './CharacterPortrait'

interface CharacterIdentityProps {
  characterId?: string
  character: CharacterIdentityData
  profilePhase?: CharacterProfilePhase
}

function transitionalValue(
  value: string,
  profilePhase:
    | CharacterProfilePhase
    | undefined,
): string {
  return (
    profilePhase ===
      'TRANSITIONAL_VAMPIRE' &&
    value.trim() === ''
  )
    ? 'Pendiente'
    : value
}

export function CharacterIdentity({
  characterId,
  character,
  profilePhase,
}: CharacterIdentityProps) {
  const human =
    profilePhase === 'HUMAN'

  return (
    <section
      className="sheet-section identity-section"
      aria-labelledby="identity-title"
      data-profile-phase={
        profilePhase ?? 'DEMO'
      }
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

        {!human ? (
          <div className="clan-mark">
            <V5VisualMark kind="clan-symbol" value={character.clan} decorative />
            <span>Clan</span>
            <strong>
              {transitionalValue(
                character.clan,
                profilePhase,
              )}
            </strong>
          </div>
        ) : null}
      </div>

      <div className="identity-section__portrait-layout">
        <CharacterPortrait characterId={characterId} name={character.name} clan={character.clan} />
        <div className="identity-grid">
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

        <IdentityField
          label="Ambición"
          value={character.ambition}
          featured
        />

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

        <IdentityField
          label="Deseo"
          value={character.desire}
          featured
        />
        </div>
      </div>
    </section>
  )
}
