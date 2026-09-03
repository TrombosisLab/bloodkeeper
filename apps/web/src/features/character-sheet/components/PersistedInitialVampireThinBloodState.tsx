import { displayValue } from './displayValue'
import {
  useMemo,
  useState,
} from 'react'

import {
  ThinBloodSection,
} from '../../character-creation/components/thin-blood/ThinBloodSection.tsx'

import {
  getThinBloodTraitDefinitionsByCategory,
} from '../../character-creation/data/thin-blood-trait-definitions.ts'

import {
  useThinBloodTraits,
} from '../../character-creation/hooks/useThinBloodTraits.ts'

import type {
  CharacterThinBloodAlchemyDraft,
} from '../../character-creation/types/thin-blood-alchemy.types.ts'

import type {
  CharacterThinBloodTraitsDraft,
} from '../../character-creation/types/thin-blood-trait.types.ts'

import {
  initialVampireThinBloodAlchemyDraft,
  initialVampireThinBloodResolution,
  initialVampireThinBloodTraitsDraft,
} from '../domain/initial-vampire-transition-thin-blood-ui-state.ts'

import type {
  InitialVampireThinBloodResolution,
} from '../domain/initial-vampire-transition-thin-blood-ui-state.ts'

import type {
  CharacterInitialVampireTransitionReadModel,
} from '../types/character-transition-read-model.types.ts'

interface PersistedInitialVampireThinBloodStateProps {
  readonly transition:
    CharacterInitialVampireTransitionReadModel

  readonly busy: boolean
  readonly resolving: boolean

  readonly onResolve: (
    resolution:
      InitialVampireThinBloodResolution,
  ) => void
}

const merits =
  getThinBloodTraitDefinitionsByCategory(
    'merit',
  )

const flaws =
  getThinBloodTraitDefinitionsByCategory(
    'flaw',
  )

const meritKeys =
  merits.map(({ key }) => key)

const flawKeys =
  flaws.map(({ key }) => key)

export function PersistedInitialVampireThinBloodState({
  transition,
  busy,
  resolving,
  onResolve,
}: PersistedInitialVampireThinBloodStateProps) {
  const [
    traits,
    setTraits,
  ] =
    useState<CharacterThinBloodTraitsDraft>(
      () =>
        initialVampireThinBloodTraitsDraft(
          transition,
        ),
    )

  const [
    alchemy,
    setAlchemy,
  ] =
    useState<CharacterThinBloodAlchemyDraft>(
      () =>
        initialVampireThinBloodAlchemyDraft(
          transition,
        ),
    )

  const thinBlood =
    useThinBloodTraits({
      value:
        traits,
      onChange:
        setTraits,
      meritKeys,
      flawKeys,
      characterKind:
        'thinBlood',
    })

  const resolution =
    useMemo(
      () =>
        initialVampireThinBloodResolution(
          traits,
          alchemy,
        ),
      [traits, alchemy],
    )

  return (
    <form
      className={
        'initial-vampire-transition__card ' +
        'initial-vampire-transition__card--wide'
      }
      onSubmit={(event) => {
        event.preventDefault()

        if (!resolution.valid) {
          return
        }

        onResolve(resolution)
      }}
    >
      <h3>Estado de Sangre Débil</h3>

      <p>
        Completa los rasgos específicos,
        la Afinidad de Disciplina cuando
        corresponda y la Alquimia inicial
        mediante las reglas compartidas
        del creador.
      </p>

      <ThinBloodSection
        thinBlood={thinBlood}
        merits={merits}
        flaws={flaws}
        alchemy={alchemy}
        onAlchemyChange={setAlchemy}
      />

      {!resolution.valid ? (
        <ul className="creation-step-errors">
          {resolution.errors.map(
            (error) => (
              <li key={displayValue(error, '')}>
                {displayValue(error, '')}
              </li>
            ),
          )}
        </ul>
      ) : null}

      <button
        type="submit"
        className={
          'initial-vampire-transition__submit'
        }
        disabled={
          busy ||
          !resolution.valid
        }
      >
        {resolving
          ? 'Guardando Sangre Débil…'
          : 'Resolver Sangre Débil'}
      </button>
    </form>
  )
}
