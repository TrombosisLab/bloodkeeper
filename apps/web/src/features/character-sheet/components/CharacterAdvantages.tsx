import { demoAdvantages } from '../data/demo-advantages'

import type {
  CharacterAdvantages as CharacterAdvantagesModel,
} from '../types/character-advantages.types'

import { TraitGroup } from './TraitGroup'

interface CharacterAdvantagesProps {
  advantages?: CharacterAdvantagesModel
}

export function CharacterAdvantages({
  advantages = demoAdvantages,
}: CharacterAdvantagesProps) {
  return (
    <section
      className="sheet-section advantages-section"
      aria-labelledby="advantages-title"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Rasgos y circunstancias
          </p>

          <h2 id="advantages-title">
            Ventajas y Defectos
          </h2>
        </div>

        <span className="section-number">
          05
        </span>
      </div>

      <div className="advantages-grid">
        <TraitGroup
          title="Ventajas"
          subtitle="Méritos"
          traits={advantages.advantages}
        />

        <TraitGroup
          title="Trasfondos"
          subtitle="Recursos y vínculos"
          traits={advantages.backgrounds}
        />

        <TraitGroup
          title="Defectos"
          subtitle="Complicaciones"
          traits={advantages.flaws}
          negative
        />
      </div>
    </section>
  )
}
