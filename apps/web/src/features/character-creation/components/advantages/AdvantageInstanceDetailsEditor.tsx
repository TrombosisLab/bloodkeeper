import type {
  CharacterAdvantageSelectionDraft,
  MaskAdvantageDetails,
} from '../../types/character-advantages-draft.types'


import {
  AdvantageRatingControl,
} from './AdvantageRatingControl'


interface AdvantageInstanceDetailsEditorProps {
  selection: CharacterAdvantageSelectionDraft

  onChange: (
    selection: CharacterAdvantageSelectionDraft,
  ) => void
}


/*
 * Editor de configuración específica de una ventaja.
 *
 * Cada instanceDetailsKind con información propia implementa
 * aquí su edición visual.
 *
 * La puntuación de la ventaja permanece separada de estos datos:
 * este componente solo modifica la configuración adicional
 * de la instancia seleccionada.
 */
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

          <AdvantageRatingControl
            value={
              details.effectiveness
            }
            min={0}
            max={4}
            onChange={(value) =>
              update(
                value,
                details.reliability,
              )
            }
          />
        </div>


        <div>
          <span>
            Fiabilidad
          </span>

          <AdvantageRatingControl
            value={
              details.reliability
            }
            min={0}
            max={3}
            onChange={(value) =>
              update(
                details.effectiveness,
                value,
              )
            }
          />
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
    details.kind === 'enemy'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Enemigo
        </h5>

        <label>
          Identidad

          <input
            value={
              details.identity ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'enemy',
                  identity: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  if (
    details.kind === 'stalker'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Stalker
        </h5>

        <label>
          Identidad

          <input
            value={
              details.identity ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'stalker',
                  identity: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  /*
   * Infamia.
   *
   * Guarda la causa o naturaleza de la mala reputación.
   */
  if (
    details.kind === 'infamy'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Infamia
        </h5>

        <label>
          Descripción

          <input
            value={
              details.description ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'infamy',
                  description:
                    event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  /*
   * Despreciado.
   *
   * Guarda el motivo por el que el personaje es rechazado.
   */
  if (
    details.kind === 'despised'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Despreciado
        </h5>

        <label>
          Descripción

          <input
            value={
              details.description ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'despised',
                  description:
                    event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  /*
   * Odio.
   *
   * Guarda la persona, grupo o causa odiada.
   */
  if (
    details.kind === 'hatred'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Odio
        </h5>

        <label>
          Descripción

          <input
            value={
              details.description ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'hatred',
                  description:
                    event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }
  

  /*
   * Expulsado.
   *
   * Guarda la causa o la organización de la expulsión.
   */
  if (
    details.kind === 'exiled'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Expulsado
        </h5>

        <label>
          Descripción

          <input
            value={
              details.description ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'exiled',
                  description:
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
    details.kind === 'darkSecret'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Secreto Oscuro
        </h5>

        <label>
          Secreto

          <input
            value={
              details.secret ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'darkSecret',
                  secret: event.target.value,
                },
              })
            }
          />
        </label>
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



  /*
   * Lingüística.
   *
   * Guarda los idiomas concretos asociados al personaje.
   */
  if (
    details.kind === 'linguistics'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Lingüística
        </h5>

        <label>
          Idiomas

          <input
            value={
              details.languages.join(', ')
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'linguistics',
                  languages:
                    event.target.value
                      .split(',')
                      .map(
                        (value) => value.trim(),
                      )
                      .filter(Boolean),
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  /*
   * Semblante de Matusalén.
   *
   * Guarda la identidad de la figura
   * a la que se parece el personaje.
   */
  if (
    details.kind === 'methuselahVisage'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Semblante de Matusalén
        </h5>

        <label>
          Se parece a

          <input
            value={
              details.resembles ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'methuselahVisage',
                  resembles: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  /*
   * Cara Famosa.
   *
   * Guarda la identidad por la que el personaje
   * es reconocido.
   */
  if (
    details.kind === 'famousFace'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Cara Famosa
        </h5>

        <label>
          Identidad conocida

          <input
            value={
              details.identity ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'famousFace',
                  identity: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  /*
   * Niño de la Escena.
   *
   * Guarda la subcultura o escena social
   * asociada al personaje.
   */
  if (
    details.kind === 'childOfTheScene'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Niño de la Escena
        </h5>

        <label>
          Subcultura

          <input
            value={
              details.subculture ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'childOfTheScene',
                  subculture: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }



  if (
    details.kind === 'fame'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Fama
        </h5>

        <label>
          Ámbito conocido

          <input
            value={
              details.sphere ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'fame',
                  sphere: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  if (
    details.kind === 'substanceUse'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Consumo
        </h5>

        <label>
          Sustancia

          <input
            value={
              details.substance ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'substanceUse',
                  substance: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  if (
    details.kind === 'preyExclusion'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Exclusión de Presa
        </h5>

        <label>
          Presa excluida

          <input
            value={
              details.excludedPrey ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'preyExclusion',
                  excludedPrey: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  if (
    details.kind === 'folkloricBane'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Plaga Folclórica
        </h5>

        <label>
          Fuente

          <input
            value={
              details.source ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'folkloricBane',
                  source: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  if (
    details.kind === 'folkloricBlock'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Bloqueo Folclórico
        </h5>

        <label>
          Tabú

          <input
            value={
              details.taboo ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'folkloricBlock',
                  taboo: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }



  if (
    details.kind === 'status'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Estatus
        </h5>

        <label>
          Esfera

          <input
            value={
              details.sphere ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'status',
                  sphere: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  if (
    details.kind === 'influence'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Influencia
        </h5>

        <label>
          Ámbito

          <input
            value={
              details.sphere ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'influence',
                  sphere: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  if (
    details.kind === 'mawla'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Mawla
        </h5>

        <label>
          Identidad

          <input
            value={
              details.identity ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'mawla',
                  identity: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  if (
    details.kind === 'herd'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Rebaño
        </h5>

        <label>
          Descripción

          <input
            value={
              details.identity ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'herd',
                  identity: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  if (
    details.kind === 'resources'
  ) {
    return (
      <div className="advantage-instance-editor">
        <h5>
          Configuración de Recursos
        </h5>

        <label>
          Fuente

          <input
            value={
              details.source ?? ''
            }
            onChange={(event) =>
              onChange({
                ...selection,
                details: {
                  kind: 'resources',
                  source: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    )
  }


  return (
    <p className="advantage-catalog-card__pending">
      Editor específico pendiente.
    </p>
  )
}