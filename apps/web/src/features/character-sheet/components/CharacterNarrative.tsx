import { displayValue } from './displayValue'
import {
  demoNarrativeState,
} from '../data/demo-convictions'

import type {
  CharacterNarrativeState,
} from '../types/character-convictions.types'

interface CharacterNarrativeProps {
  narrative?: CharacterNarrativeState
}

export function CharacterNarrative({
  narrative = demoNarrativeState,
}: CharacterNarrativeProps) {
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
            {narrative.convictions.map(
              (conviction) => (
                <li key={conviction.key}>
                  {displayValue(conviction.text, 'Conviccion')}
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
            {narrative.touchstones.map(
              (touchstone) => (
                <div
                  className="touchstone"
                  key={touchstone.key}
                >
                  <strong>
                    {displayValue(touchstone.name, 'Sin nombre')}
                  </strong>

                  <span>
                    {displayValue(touchstone.relation, 'Relacion')}
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
            {displayValue(narrative.notes, '')}
          </p>
        </div>
      </div>
    </section>
  )
}
