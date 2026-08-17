import {
  clanDefinitions,
} from '../../data/clan-definitions'

import {
  getThinBloodClanCurseSeverity,
} from '../../domain/thin-blood-trait-rules'

import type {
  UseThinBloodTraitsResult,
} from '../../hooks/useThinBloodTraits'

import type {
  ClanKey,
} from '../../types/clan.types'

interface ClanCurseSectionProps {
  thinBlood: UseThinBloodTraitsResult
}

const realClanOptions =
  clanDefinitions.filter(
    ({ kind }) => kind === 'clan',
  )

function isRealClanKey(
  value: string,
): value is ClanKey {
  return realClanOptions.some(
    ({ key }) => key === value,
  )
}

export function ClanCurseSection({
  thinBlood,
}: ClanCurseSectionProps) {
  if (
    !thinBlood.isSelected(
      'clan-curse',
    )
  ) {
    return null
  }

  const details =
    thinBlood.getClanCurseDetails()

  return (
    <section className="thin-blood-traits__group">
      <header className="discipline-affinity-editor__header">
        <div>
          <span>Defecto de Sangre Débil</span>
          <h4>Maldición de Clan</h4>
        </div>

        <p>
          Selecciona el Clan real cuya
          Prohibición adopta el personaje.
          La severidad es
          {' '}
          {getThinBloodClanCurseSeverity()}.
        </p>
      </header>

      <label className="discipline-affinity-editor__field">
        <span>Clan de la Maldición</span>

        <select
          value={
            details?.clanKey ?? ''
          }
          onChange={(event) => {
            const value =
              event.target.value

            thinBlood.setClanCurseDetails(
              isRealClanKey(value)
                ? {
                    clanKey:
                      value,
                  }
                : null,
            )
          }}
        >
          <option value="">
            Selecciona un Clan
          </option>

          {realClanOptions.map(
            ({ key, name }) => (
              <option
                key={key}
                value={key}
              >
                {name}
              </option>
            ),
          )}
        </select>
      </label>
    </section>
  )
}
