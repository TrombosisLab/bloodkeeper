import type {
  CharacterAdvantageSelectionDraft,
  MaskAdvantageDetails,
} from '../../types/character-advantages-draft.types'


interface AdvantageInstanceDetailsEditorProps {
  selection: CharacterAdvantageSelectionDraft

  onChange: (
    selection: CharacterAdvantageSelectionDraft,
  ) => void
}


export function AdvantageInstanceDetailsEditor({
  selection,
  onChange,
}: AdvantageInstanceDetailsEditorProps) {

  const details = selection.details

  if (
    !details
  ) {
    return null
  }


  if (
    details.kind === 'allies'
  ) {
    const alliesIdentity =
      details.identity

    function update(
      effectiveness: number,
      reliability: number,
      identity = alliesIdentity,
    ) {
      onChange({
        ...selection,
        rating:
          effectiveness +
          reliability,
        details: {
          kind: 'allies',
          effectiveness,
          reliability,
          identity,
        },
      })
    }


    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Aliados
        </h5>

        <div>
          <span>
            Efectividad
          </span>

          <div>
            {[1,2,3,4].map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={
                    details.effectiveness === value
                  }
                  onClick={() =>
                    update(
                      value,
                      details.reliability,
                    )
                  }
                >
                  {value}
                </button>
              ),
            )}
          </div>
        </div>


        <div>
          <span>
            Fiabilidad
          </span>

          <div>
            {[1,2,3].map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={
                    details.reliability === value
                  }
                  onClick={() =>
                    update(
                      details.effectiveness,
                      value,
                    )
                  }
                >
                  {value}
                </button>
              ),
            )}
          </div>
        </div>


        <label>
          Identidad

          <input
            value={
              details.identity ?? ''
            }
            onChange={
              (event) =>
                update(
                  details.effectiveness,
                  details.reliability,
                  event.target.value,
                )
            }
          />
        </label>


        <small>
          Total: {selection.rating} puntos
        </small>
      </div>
    )
  }


  if (
    details.kind === 'contact'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Contacto
        </h5>

        <label>
          Identidad

          <input
            value={
              details.identity ?? ''
            }
            onChange={
              (event) =>
                onChange({
                  ...selection,
                  details: {
                    kind: 'contact',
                    identity:
                      event.target.value,
                  },
                })
            }
          />
        </label>
      </div>
    )
  }


  if (
    details.kind === 'retainer'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Criado
        </h5>

        <label>
          Identidad

          <input
            value={
              details.identity ?? ''
            }
            onChange={
              (event) =>
                onChange({
                  ...selection,
                  details: {
                    kind: 'retainer',
                    identity:
                      event.target.value,
                  },
                })
            }
          />
        </label>
      </div>
    )
  }


  if (
    details.kind === 'mask'
  ) {
    const maskDetails =
      details as import('../../types/character-advantages-draft.types').MaskAdvantageDetails

    function updateMask(
      changes: Partial<
        import('../../types/character-advantages-draft.types').MaskAdvantageDetails
      >,
    ) {
      onChange({
        ...selection,
        details: {
          ...maskDetails,
          ...changes,
          kind: 'mask',
        },
      })
    }

    function toggleBenefit(
      benefit:
        | 'erased'
        | 'tailor',
    ) {
      const benefits =
        maskDetails.benefits ?? []

      updateMask({
        benefits:
          benefits.includes(benefit)
            ? benefits.filter(
                (item) =>
                  item !== benefit,
              )
            : [
                ...benefits,
                benefit,
              ],
      })
    }

    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Máscara
        </h5>

        <label>
          Identidad

          <input
            value={
              maskDetails.identity ?? ''
            }
            onChange={
              (event) =>
                updateMask({
                  identity:
                    event.target.value,
                })
            }
          />
        </label>

        {selection.rating >= 2 && (
          <div>
            <h6>
              Beneficios de Máscara
            </h6>

            <label>
              <input
                type="checkbox"
                checked={
                  maskDetails.benefits.includes(
                    'erased',
                  )
                }
                onChange={() =>
                  toggleBenefit(
                    'erased',
                  )
                }
              />
              Borrado
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  maskDetails.benefits.includes(
                    'tailor',
                  )
                }
                onChange={() =>
                  toggleBenefit(
                    'tailor',
                  )
                }
              />
              Curtidor
            </label>
          </div>
        )}
      </div>
    )
  }


  if (
    details.kind === 'haven'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Refugio
        </h5>

        <label>
          Identidad

          <input
            value={
              details.identity ?? ''
            }
            onChange={
              (event) =>
                onChange({
                  ...selection,
                  details: {
                    kind: 'haven',
                    identity:
                      event.target.value,
                  },
                })
            }
          />
        </label>

        <small>
          Nivel de Refugio: {selection.rating}
        </small>
      </div>
    )
  }


  return (
    <p className="advantage-catalog-card__pending">
      Editor específico pendiente.
    </p>
  )
}
