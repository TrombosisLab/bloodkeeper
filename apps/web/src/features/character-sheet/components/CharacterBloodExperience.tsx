import type {
  ReactNode,
} from 'react'

import {
  characterBloodDyscrasiaCatalog,
  characterBloodResonanceCatalog,
} from '@v5r/character-rules'

import type {
  CharacterBloodExperience as CharacterBloodExperienceModel,
} from '../types/character-blood-experience.types.ts'

interface CharacterBloodExperienceProps {
  blood: CharacterBloodExperienceModel | null
  actions?: ReactNode
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

function resonanceFieldLabel(
  blood: CharacterBloodExperienceModel,
): string {
  return blood.resonance
    ?.specialAffinityKey !== null &&
    blood.resonance
      ?.specialAffinityKey !== undefined
    ? 'Afinidad especial'
    : 'Resonancia'
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
  actions,
}: CharacterBloodExperienceProps) {
  const dyscrasia =
    blood === null
      ? null
      : dyscrasiaLabel(blood)

  return (
    <section
      className="sheet-section blood-experience-section"
      aria-labelledby="blood-resonance-title"
      data-blood-resonance="persisted"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Sangre
          </p>

          <h2 id="blood-resonance-title">
            Resonancia
          </h2>
        </div>
      </div>

      {blood === null ? (
        <p className="secondary-empty">
          Estado de Sangre pendiente.
        </p>
      ) : (
        <>
          <div className="blood-experience-grid">
            <div className="blood-info-card">
              <span className="blood-info-card__label">
                {resonanceFieldLabel(blood)}
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

            <div className="blood-info-card">
              <span className="blood-info-card__label">
                Discrasia activa
              </span>

              <strong>
                {dyscrasia ??
                  'Sin Discrasia activa'}
              </strong>
            </div>
          </div>

          {actions}
        </>
      )}
    </section>
  )
}
