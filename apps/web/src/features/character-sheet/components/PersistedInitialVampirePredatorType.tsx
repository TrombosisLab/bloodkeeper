import { displayValue } from './displayValue'
import {
  useMemo,
  useState,
} from 'react'

import {
  PredatorTypeConfiguration,
} from '../../character-creation/components/PredatorTypeConfiguration.tsx'

import type {
  CharacterAdvantagesDraft,
} from '../../character-creation/types/character-advantages-draft.types.ts'

import {
  initialVampirePredatorAdvantages,
  initialVampirePredatorClanKey,
  initialVampirePredatorConfigurationValid,
  initialVampirePredatorPowerChoices,
  initialVampirePredatorTypeOptions,
  toInitialVampirePredatorApiAdvantages,
} from '../domain/initial-vampire-transition-predator-ui-state.ts'

import type {
  InitialVampirePredatorAdoptionInput,
} from '../domain/initial-vampire-transition-predator-ui-state.ts'

import type {
  CharacterInitialVampireTransitionReadModel,
} from '../types/character-transition-read-model.types.ts'

interface PersistedInitialVampirePredatorTypeProps {
  readonly transition:
    CharacterInitialVampireTransitionReadModel
  readonly busy: boolean
  readonly resolving: boolean

  readonly onAdopt: (
    input:
      InitialVampirePredatorAdoptionInput,
  ) => void
}

export function PersistedInitialVampirePredatorType({
  transition,
  busy,
  resolving,
  onAdopt,
}: PersistedInitialVampirePredatorTypeProps) {
  const [predatorTypeKey, setPredatorTypeKey] =
    useState('')

  const [
    choiceSelections,
    setChoiceSelections,
  ] = useState<
    Record<string, number>
  >({
    ...transition.predatorTypeChoices,
  })

  const [
    advantages,
    setAdvantages,
  ] = useState<CharacterAdvantagesDraft>({
    selections: [],
  })

  const [
    disciplinePowerKey,
    setDisciplinePowerKey,
  ] = useState('')

  const predatorTypeOptions =
    useMemo(
      () =>
        initialVampirePredatorTypeOptions(
          transition,
        ),
      [transition],
    )

  const clanKey =
    initialVampirePredatorClanKey(
      transition,
    )

  const powerChoices =
    useMemo(
      () =>
        initialVampirePredatorPowerChoices(
          transition,
          predatorTypeKey,
          choiceSelections,
        ),
      [
        transition,
        predatorTypeKey,
        choiceSelections,
      ],
    )

  const valid =
    initialVampirePredatorConfigurationValid(
      transition,
      predatorTypeKey,
      choiceSelections,
      advantages,
      disciplinePowerKey,
    )

  function changePredatorType(
    value: string,
  ): void {
    setPredatorTypeKey(value)

    const nextChoices:
      Record<string, number> = {}

    setChoiceSelections(nextChoices)
    setDisciplinePowerKey('')

    setAdvantages(
      initialVampirePredatorAdvantages(
        transition,
        value,
        nextChoices,
      ),
    )
  }

  function changeChoices(
    value: Record<string, number>,
  ): void {
    setChoiceSelections(value)
    setDisciplinePowerKey('')

    setAdvantages(
      (current) =>
        initialVampirePredatorAdvantages(
          transition,
          predatorTypeKey,
          value,
          current,
        ),
    )
  }

  return (
    <form
      className={
        'initial-vampire-transition__card'
      }
      onSubmit={(event) => {
        event.preventDefault()

        if (!valid) return

        onAdopt({
          predatorTypeKey,
          predatorTypeChoices: {
            ...choiceSelections,
          },
          disciplinePowerKey,
          advantages:
            toInitialVampirePredatorApiAdvantages(
              advantages,
            ),
        })
      }}
    >
      <h3>Tipo de Depredador</h3>

      <p>
        Adopta el Tipo de Depredador mediante
        las reglas canónicas ya utilizadas por
        el creador. Sus concesiones se aplican
        de forma atómica en el backend.
      </p>

      <label>
        <span>Tipo de Depredador</span>

        <select
          value={predatorTypeKey}
          disabled={busy}
          onChange={(event) => {
            changePredatorType(
              event.target.value,
            )
          }}
        >
          <option value="">
            Seleccionar…
          </option>

          {predatorTypeOptions.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {displayValue(option.label, '')}
              </option>
            ),
          )}
        </select>
      </label>

      {predatorTypeKey !== '' ? (
        <>
          <PredatorTypeConfiguration
            predatorTypeKey={
              predatorTypeKey
            }
            clanKey={clanKey}
            choiceSelections={
              choiceSelections
            }
            advantages={
              advantages
            }
            onChoiceSelectionsChange={
              changeChoices
            }
            onAdvantagesChange={
              setAdvantages
            }
          />

          <label>
            <span>
              Poder concedido
            </span>

            <select
              value={
                disciplinePowerKey
              }
              disabled={
                busy ||
                powerChoices.length === 0
              }
              onChange={(event) => {
                setDisciplinePowerKey(
                  event.target.value,
                )
              }}
            >
              <option value="">
                Seleccionar…
              </option>

              {powerChoices.map(
                (power) => (
                  <option
                    key={power.key}
                    value={power.key}
                  >
                    {displayValue(power.disciplineName, 'Disciplina')}
                    {' · '}
                    {displayValue(power.name, 'Poder')}
                    {' · nivel '}
                    {displayValue(power.level)}
                  </option>
                ),
              )}
            </select>

            <small>
              Las opciones usan nivel efectivo,
              prerrequisitos y capacidad del
              sistema de Poderes existente.
            </small>
          </label>
        </>
      ) : null}

      <button
        type="submit"
        className={
          'initial-vampire-transition__submit'
        }
        disabled={
          busy ||
          !valid
        }
      >
        {resolving
          ? 'Adoptando Tipo de Depredador…'
          : 'Adoptar Tipo de Depredador'}
      </button>
    </form>
  )
}
