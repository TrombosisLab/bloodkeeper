import {
  thinBloodAlchemyFormulaCatalog,
} from '../../data/thin-blood-alchemy-formulas'

import {
  isThinBloodAlchemyMethod,
  normalizeThinBloodAlchemyFormulaKeys,
  normalizeThinBloodAlchemyRating,
  validateThinBloodAlchemyDraft,
} from '../../domain/thin-blood-alchemy-rules'

import type {
  UseThinBloodTraitsResult,
} from '../../hooks/useThinBloodTraits'

import type {
  CharacterThinBloodAlchemyDraft,
  ThinBloodAlchemyMethod,
} from '../../types/thin-blood-alchemy.types'

interface ThinBloodAlchemySectionProps {
  thinBlood: UseThinBloodTraitsResult

  value: CharacterThinBloodAlchemyDraft

  onChange: (
    value: CharacterThinBloodAlchemyDraft,
  ) => void
}

const methodLabels: Record<
  ThinBloodAlchemyMethod,
  string
> = {
  athanorCorporis: 'Athanor Corporis',
  calcinatio: 'Calcinatio',
  fixatio: 'Fixatio',
}

const sourceLabels = {
  core: 'Libro Básico',
  playersGuide: 'Guía del Jugador',
  bloodSigils: 'Sellos de Sangre',
} as const

export function ThinBloodAlchemySection({
  thinBlood,
  value,
  onChange,
}: ThinBloodAlchemySectionProps) {
  if (
    !thinBlood.isSelected(
      'thin-blood-alchemist',
    )
  ) {
    return null
  }

  const validation =
    validateThinBloodAlchemyDraft(
      value,
    )

  const formulaLimitReached =
    value.rating > 0 &&
    value.formulaKeys.length >=
      value.rating

  const creationErrors = [
    ...validation.errors,

    ...(
      validation.valid &&
      value.rating > 0 &&
      value.formulaKeys.length !==
        value.rating
        ? [
            value.rating === 1
              ? 'Durante la creación inicial debes seleccionar exactamente 1 fórmula gratuita.'
              : `Durante la creación inicial debes seleccionar exactamente ${value.rating} fórmulas gratuitas.`,
          ]
        : []
    ),
  ]

  const availableFormulas =
    thinBloodAlchemyFormulaCatalog.filter(
      (formula) =>
        formula.level <= value.rating,
    )

  function setRating(
    requestedRating: number,
  ) {
    const rating =
      normalizeThinBloodAlchemyRating(
        requestedRating,
      )

    onChange({
      rating,

      method:
        rating === 0
          ? null
          : value.method,

      formulaKeys:
        normalizeThinBloodAlchemyFormulaKeys(
          value.formulaKeys,
          rating,
        ).slice(
          0,
          rating,
        ),
    })
  }

  function setMethod(
    rawValue: string,
  ) {
    onChange({
      ...value,

      method:
        rawValue.length > 0 &&
        isThinBloodAlchemyMethod(
          rawValue,
        )
          ? rawValue
          : null,
    })
  }

  function toggleFormula(
    formulaKey: string,
  ) {
    const selected =
      value.formulaKeys.includes(
        formulaKey,
      )

    if (
      !selected &&
      formulaLimitReached
    ) {
      return
    }

    const nextKeys =
      selected
        ? value.formulaKeys.filter(
            (key) =>
              key !== formulaKey,
          )
        : [
            ...value.formulaKeys,
            formulaKey,
          ]

    onChange({
      ...value,

      formulaKeys:
        normalizeThinBloodAlchemyFormulaKeys(
          nextKeys,
          value.rating,
        ),
    })
  }

  return (
    <section className="thin-blood-traits__group">
      <header>
        <div>
          <span>
            Mérito de Sangre Débil
          </span>

          <h4>
            Alquimia de Sangre Débil
          </h4>
        </div>

        <strong>
          Fórmulas:{' '}
          {value.formulaKeys.length}
          {' / '}
          {value.rating}
        </strong>
      </header>

      <div className="thin-blood-alchemy__controls">
        <label>
          <span>Puntuación</span>

          <select
            value={value.rating}
            onChange={(event) =>
              setRating(
                Number(
                  event.target.value,
                ),
              )
            }
          >
            {[0, 1, 2, 3, 4, 5].map(
              (rating) => (
                <option
                  key={rating}
                  value={rating}
                >
                  {rating}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>
            Método de destilación
          </span>

          <select
            value={value.method ?? ''}
            disabled={value.rating === 0}
            onChange={(event) =>
              setMethod(
                event.target.value,
              )
            }
          >
            <option value="">
              Selecciona un método
            </option>

            {Object.entries(
              methodLabels,
            ).map(
              ([key, label]) => (
                <option
                  key={key}
                  value={key}
                >
                  {label}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {creationErrors.length > 0 && (
        <div
          className="thin-blood-validation thin-blood-validation--invalid"
          role="status"
          aria-live="polite"
        >
          <p>
            Revisa la configuración de
            Alquimia:
          </p>

          <ul>
            {creationErrors.map(
              (error) => (
                <li key={error}>
                  {error}
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      {value.rating === 0 ? (
        <p>
          Selecciona una puntuación para
          escoger el método y las fórmulas
          disponibles.
        </p>
      ) : (
        <div className="thin-blood-traits__options">
          {availableFormulas.map(
            (formula) => {
              const selected =
                value.formulaKeys.includes(
                  formula.key,
                )

              return (
                <button
                  key={formula.key}
                  disabled={
                    !selected &&
                    formulaLimitReached
                  }
                  type="button"
                  className={
                    selected
                      ? 'thin-blood-trait-option thin-blood-trait-option--selected'
                      : 'thin-blood-trait-option'
                  }
                  aria-pressed={selected}
                  onClick={() =>
                    toggleFormula(
                      formula.key,
                    )
                  }
                >
                  <span>
                    {formula.name}
                  </span>

                  <small>
                    Nivel {formula.level}
                    {' · '}
                    {
                      sourceLabels[
                        formula.source
                      ]
                    }
                    {' · '}
                    {selected
                      ? 'Seleccionada'
                      : 'Seleccionar'}
                  </small>
                </button>
              )
            },
          )}
        </div>
      )}
    </section>
  )
}
