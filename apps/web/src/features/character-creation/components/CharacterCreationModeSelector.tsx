import type {
  CharacterDraftApiCreationMode,
} from '../types/character-draft-api.types'

interface CharacterCreationModeSelectorProps {
  onSelect: (
    creationMode: CharacterDraftApiCreationMode,
  ) => void
  onCancel: () => void
}

export function CharacterCreationModeSelector({
  onSelect,
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
            Elige cómo comienza la historia del personaje.
            El modo no se deduce de campos incompletos.
          </p>
        </div>
      </header>

      <section className="creation-workspace">
        <div className="creation-step-heading">
          <span>Modo de creación</span>
          <h2>¿Cómo comienza el personaje?</h2>
          <p>
            Ambas rutas usan el mismo creador y conservan
            la identidad del personaje.
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
            onClick={onCancel}
          >
            Volver a personajes
          </button>
        </div>
      </section>
    </section>
  )
}
