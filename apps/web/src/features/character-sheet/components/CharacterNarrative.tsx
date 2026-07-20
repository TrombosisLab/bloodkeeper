import { demoNarrativeState } from '../data/demo-convictions'

export function CharacterNarrative() {
  return (
    <section
      className="sheet-section narrative-section"
      aria-labelledby="narrative-title"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Anclas humanas
          </p>

          <h2 id="narrative-title">
            Convicciones y Piedras de Toque
          </h2>
        </div>

        <span className="section-number">
          06
        </span>
      </div>

      <div className="narrative-grid">
        <div className="narrative-panel">
          <header>
            <span>Principios</span>
            <h3>Convicciones</h3>
          </header>

          <ul className="narrative-list">
            {demoNarrativeState.convictions.map(
              (conviction) => (
                <li key={conviction.key}>
                  {conviction.text}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="narrative-panel">
          <header>
            <span>Vínculos mortales</span>
            <h3>Piedras de Toque</h3>
          </header>

          <div className="touchstone-list">
            {demoNarrativeState.touchstones.map(
              (touchstone) => (
                <div
                  className="touchstone"
                  key={touchstone.key}
                >
                  <strong>
                    {touchstone.name}
                  </strong>

                  <span>
                    {touchstone.relation}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="narrative-panel narrative-panel--notes">
          <header>
            <span>Contexto</span>
            <h3>Notas narrativas</h3>
          </header>

          <p>
            {demoNarrativeState.notes}
          </p>
        </div>
      </div>
    </section>
  )
}
