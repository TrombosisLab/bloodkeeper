import {
  useMemo,
  useState,
} from 'react'

import {
  AdvantagesStep,
} from '../../character-creation/components/AdvantagesStep.tsx'

import {
  initialVampireThinBloodAlchemyDraft,
  initialVampireThinBloodTraitsDraft,
} from '../domain/initial-vampire-transition-thin-blood-ui-state.ts'

import {
  initialVampireAdvantagesBudgetValid,
  initialVampireAdvantagesClanKey,
  initialVampireAdvantagesDraft,
  initialVampireAdvantagesGeneration,
  initialVampireAdvantagesReviewPayload,
} from '../domain/initial-vampire-transition-advantages-ui-state.ts'

import type {
  CharacterInitialVampireTransitionReadModel,
} from '../types/character-transition-read-model.types.ts'

import type {
  InitialVampireAdvantagesReviewPayload,
} from '../domain/initial-vampire-transition-advantages-ui-state.ts'

interface PersistedInitialVampireAdvantagesReviewProps {
  readonly transition:
    CharacterInitialVampireTransitionReadModel

  readonly busy: boolean
  readonly resolving: boolean

  readonly onReview: (
    advantages:
      InitialVampireAdvantagesReviewPayload,
  ) => void
}

export function PersistedInitialVampireAdvantagesReview({
  transition,
  busy,
  resolving,
  onReview,
}: PersistedInitialVampireAdvantagesReviewProps) {
  const [
    advantages,
    setAdvantages,
  ] = useState(
    () =>
      initialVampireAdvantagesDraft(
        transition,
      ),
  )

  const clanKey =
    initialVampireAdvantagesClanKey(
      transition,
    )

  const generation =
    initialVampireAdvantagesGeneration(
      transition,
    )

  const thinBloodTraits =
    useMemo(
      () =>
        initialVampireThinBloodTraitsDraft(
          transition,
        ),
      [transition],
    )

  const thinBloodAlchemy =
    useMemo(
      () =>
        initialVampireThinBloodAlchemyDraft(
          transition,
        ),
      [transition],
    )

  const budgetValid =
    initialVampireAdvantagesBudgetValid(
      advantages,
    )

  const prerequisitesReady =
    clanKey !== null &&
    generation !== null

  return (
    <section
      className={
        'initial-vampire-transition__card ' +
        'initial-vampire-transition__card--wide'
      }
    >
      <h3>
        Revisión de Ventajas y Defectos
      </h3>

      <p>
        Conserva las selecciones que sigan
        siendo válidas y sustituye únicamente
        las que hayan dejado de ser compatibles
        tras el Abrazo. El backend realiza la
        validación definitiva.
      </p>

      {!prerequisitesReady ? (
        <p
          className={
            'initial-vampire-transition__message'
          }
        >
          Resuelve Clan y Generación antes de
          revisar las Ventajas dependientes del
          perfil vampírico.
        </p>
      ) : (
        <AdvantagesStep
          creationMode={
            transition.creationMode
          }
          profileNature="vampire"
          showThinBloodState={false}
          automaticGrantDetailsReadOnly
          clanKey={clanKey}
          generation={generation}
          value={advantages}
          onChange={setAdvantages}
          thinBloodTraits={
            thinBloodTraits
          }
          onThinBloodTraitsChange={() => {}}
          thinBloodAlchemy={
            thinBloodAlchemy
          }
          onThinBloodAlchemyChange={() => {}}
        />
      )}

      <button
        type="button"
        className={
          'initial-vampire-transition__submit'
        }
        disabled={
          busy ||
          !prerequisitesReady ||
          !budgetValid
        }
        onClick={() => {
          if (
            !prerequisitesReady ||
            !budgetValid
          ) {
            return
          }

          onReview(
            initialVampireAdvantagesReviewPayload(
              advantages,
            ),
          )
        }}
      >
        {resolving
          ? 'Revisando Ventajas…'
          : 'Confirmar revisión'}
      </button>
    </section>
  )
}
