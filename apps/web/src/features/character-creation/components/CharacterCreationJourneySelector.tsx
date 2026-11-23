import type {
  CharacterCreationJourney,
} from './character-creation-journey.types'

interface CharacterCreationJourneySelectorProps {
  onSelect: (journey: CharacterCreationJourney) => void
  onCancel: () => void
}

export type { CharacterCreationJourney } from './character-creation-journey.types'

export function CharacterCreationJourneySelector({
  onSelect,
  onCancel,
}: CharacterCreationJourneySelectorProps) {
  return (
    <section className="creation-page creation-mode-selector">
      <header className="creation-header">
        <div>
          <p className="creation-header__eyebrow">
            Vampiro: La Mascarada V5
          </p>
          <h1>Crear personaje</h1>
          <p className="creation-header__description">
            Elige cuánto acompañamiento quieres durante la creación.
            Después escogerás si la historia empieza como vampiro o en una Sesión 0.
          </p>
        </div>
      </header>

      <section className="creation-workspace">
        <div className="creation-step-heading">
          <span>Recorrido de creación</span>
          <h2>¿Cómo quieres crear tu personaje?</h2>
          <p>
            Ambos recorridos usan las mismas reglas y opciones.
            Puedes volver a cambiar esta elección antes de empezar.
          </p>
        </div>

        <div className="creation-mode-selector__grid">
          <article className="creation-mode-selector__option">
            <div>
              <span>Recomendado para empezar</span>
              <h3>Guiado</h3>
              <p>
                Avanza con explicaciones y ayuda en cada decisión,
                sin tener que conocer previamente todas las reglas.
              </p>
            </div>
            <button
              type="button"
              className="creation-button creation-button--primary"
              onClick={() => onSelect('guided')}
            >
              Elegir recorrido guiado
            </button>
          </article>

          <article className="creation-mode-selector__option">
            <div>
              <span>Para quien ya conoce el sistema</span>
              <h3>Directo</h3>
              <p>
                Abre el creador completo y decide por tu cuenta en sus fases,
                con acceso directo a todas las opciones.
              </p>
            </div>
            <button
              type="button"
              className="creation-button creation-button--primary"
              onClick={() => onSelect('direct')}
            >
              Elegir recorrido directo
            </button>
          </article>
        </div>

        <div className="creation-actions">
          <button
            type="button"
            className="creation-button creation-button--secondary"
            onClick={onCancel}
          >
            Volver a personajes
          </button>
        </div>
      </section>
    </section>
  )
}
