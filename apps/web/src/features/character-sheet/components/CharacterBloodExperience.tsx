import {
  characterBloodDyscrasiaCatalog,
  characterBloodResonanceCatalog,
} from '@v5r/character-rules'

import type {
  CharacterBloodExperience as CharacterBloodExperienceModel,
} from '../types/character-blood-experience.types.ts'

interface CharacterBloodExperienceProps {
  blood: CharacterBloodExperienceModel | null
}

function resonanceLabel(
  blood: CharacterBloodExperienceModel,
): string {
  const active = blood.resonance

  if (active === null) {
    return 'Sin Resonancia activa'
  }

  if (active.resonanceKey !== null) {
    return (
      characterBloodResonanceCatalog
        .resonances
        .find(
          ({ key }) =>
            key === active.resonanceKey,
        )
        ?.name ??
      active.resonanceKey
    )
  }

  if (
    active.specialAffinityKey !== null
  ) {
    return (
      characterBloodResonanceCatalog
        .specialAffinities
        .find(
          ({ key }) =>
            key ===
              active.specialAffinityKey,
        )
        ?.name ??
      active.specialAffinityKey
    )
  }

  return 'Sin Resonancia activa'
}

function temperamentLabel(
  blood: CharacterBloodExperienceModel,
): string {
  const temperament =
    blood.resonance?.temperament ?? null

  if (temperament === null) {
    return 'Sin Temperamento'
  }

  return (
    characterBloodResonanceCatalog
      .temperaments
      .find(
        ({ key }) =>
          key === temperament,
      )
      ?.name ??
    temperament
  )
}

function dyscrasiaLabel(
  blood: CharacterBloodExperienceModel,
): string | null {
  if (blood.dyscrasia === null) {
    return null
  }

  return (
    characterBloodDyscrasiaCatalog
      .definitions
      .find(
        ({ key }) =>
          key === blood.dyscrasia?.key,
      )
      ?.name ??
    blood.dyscrasia.key
  )
}

export function CharacterBloodExperience({
  blood,
}: CharacterBloodExperienceProps) {
  const dyscrasia =
    blood === null
      ? null
      : dyscrasiaLabel(blood)

  return (
    <section
      className="sheet-section blood-experience-section"
      aria-labelledby="blood-experience-title"
      data-blood-resonance="persisted"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Sangre
          </p>

          <h2 id="blood-experience-title">
            Resonancia
          </h2>
        </div>
      </div>

      {blood === null ? (
        <p className="secondary-empty">
          Estado de Sangre pendiente.
        </p>
      ) : (
        <div className="blood-experience-grid">
          <div className="blood-info-card">
            <span className="blood-info-card__label">
              Resonancia
            </span>

            <strong>
              {resonanceLabel(blood)}
            </strong>
          </div>

          <div className="blood-info-card">
            <span className="blood-info-card__label">
              Temperamento
            </span>

            <strong>
              {temperamentLabel(blood)}
            </strong>
          </div>

          {dyscrasia !== null ? (
            <div className="blood-info-card">
              <span className="blood-info-card__label">
                Discrasia activa
              </span>

              <strong>
                {dyscrasia}
              </strong>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
