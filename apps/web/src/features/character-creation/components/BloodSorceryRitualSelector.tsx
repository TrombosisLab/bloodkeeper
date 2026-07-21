import {
  BLOOD_SORCERY_RITUAL_DEFINITIONS,
} from '../data/blood-sorcery-ritual-definitions'

import type {
  CharacterBloodSorceryRitualsDraft,
  BloodSorceryRitualKey,
} from '../types/blood-sorcery-ritual.types'

interface BloodSorceryRitualSelectorProps {
  value:
    CharacterBloodSorceryRitualsDraft

  onChange: (
    value:
      CharacterBloodSorceryRitualsDraft,
  ) => void
}

export function BloodSorceryRitualSelector({
  value,
  onChange,
}: BloodSorceryRitualSelectorProps) {
  const rituals =
    BLOOD_SORCERY_RITUAL_DEFINITIONS.filter(
      (ritual) =>
        ritual.level === 1,
    )

  const selectedKey =
    value.ritualKeys[0] ??
    null

  function selectRitual(
    ritualKey:
      BloodSorceryRitualKey,
  ) {
    onChange({
      ritualKeys: [
        ritualKey,
      ],
    })
  }

  return (
    <section className="blood-sorcery-ritual-selector">
      <div className="blood-sorcery-ritual-selector__heading">
        <div>
          <span>
            Hechicería de Sangre
          </span>

          <h3>
            Ritual inicial
          </h3>
        </div>

        <strong>
          1 requerido
        </strong>
      </div>

      <p className="blood-sorcery-ritual-selector__intro">
        Selecciona un Ritual de nivel 1.
        Solo puedes escoger uno durante
        la creación inicial.
      </p>

      <div className="blood-sorcery-ritual-grid">
        {rituals.map(
          (ritual) => {
            const selected =
              ritual.key ===
              selectedKey

            return (
              <button
                key={ritual.key}
                type="button"
                className={
                  selected
                    ? 'blood-sorcery-ritual-card blood-sorcery-ritual-card--selected'
                    : 'blood-sorcery-ritual-card'
                }
                aria-pressed={
                  selected
                }
                onClick={() =>
                  selectRitual(
                    ritual.key,
                  )
                }
              >
                <span className="blood-sorcery-ritual-card__level">
                  Nivel {ritual.level}
                </span>

                <strong>
                  {ritual.name}
                </strong>

                {ritual.summary && (
                  <p>
                    {ritual.summary}
                  </p>
                )}

                {ritual.sourcePage && (
                  <small>
                    Manual Básico V5 · pág.{' '}
                    {ritual.sourcePage}
                  </small>
                )}
              </button>
            )
          },
        )}
      </div>
    </section>
  )
}
