import type {
  CharacterAdvantageSelectionDraft,
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


  return (
    <p className="advantage-catalog-card__pending">
      Editor específico pendiente.
    </p>
  )
}
