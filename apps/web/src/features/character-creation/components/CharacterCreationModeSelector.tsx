import type {
  CharacterDraftApiCreationMode,
} from '../types/character-draft-api.types'
import type {
  CharacterCreationJourney,
} from './character-creation-journey.types'

interface CharacterCreationModeSelectorProps {
  journeyMode: CharacterCreationJourney
  onSelect: (
    creationMode: CharacterDraftApiCreationMode,
  ) => void
  onBackToJourney: () => void
  onCancel: () => void
}

export function CharacterCreationModeSelector({
  journeyMode,
  onSelect,
  onBackToJourney,
  onCancel,
}: CharacterCreationModeSelectorProps) {
  return (
    <section className="creation-page creation-mode-selector">
      <header className="creation-header">
        <div>
          <p className="creation-header__eyebrow">
            Vampiro: La Mascarada V5
          </p>
          <h1>Crear personaje</h1>
          <p className="creation-header__description">
            Primero elegiste el recorrido {journeyMode === 'guided' ? 'Guiado' : 'Directo'}.
            Ahora decide desde qué punto comienza la historia.
          </p>
        </div>
      </header>

      <section className="creation-workspace">
        <div className="creation-step-heading">
          <span>Inicio de la historia</span>
          <h2>¿Desde dónde comienza el personaje?</h2>
          <p>
            Esta elección define si la historia empieza como vampiro
            o como humano en una Sesión 0.
          </p>
        </div>

        <div className="creation-mode-selector__grid">
          <article className="creation-mode-selector__option">
            <div>
              <span>Vampiro</span>
              <h3>Creación vampírica estándar</h3>
              <p>
                Mantiene el flujo actual completo con Clan,
                Sangre, Disciplinas y demás decisiones vampíricas.
              </p>
            </div>
            <button
              type="button"
              className="creation-button creation-button--primary"
              onClick={() => onSelect('standard')}
            >
              Comenzar creación estándar
            </button>
          </article>

          <article className="creation-mode-selector__option">
            <div>
              <span>Sesión 0</span>
              <h3>Comenzar como humano</h3>
              <p>
                Crea primero la base mortal: Identidad,
                Atributos, Habilidades, Ventajas y Humanidad.
              </p>
            </div>
            <button
              type="button"
              className="creation-button creation-button--primary"
              onClick={() => onSelect('sessionZero')}
            >
              Comenzar Sesión 0
            </button>
          </article>
        </div>

        <div className="creation-actions">
          <button
            type="button"
            className="creation-button creation-button--secondary"
            onClick={onBackToJourney}
          >
            Cambiar recorrido
          </button>
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
