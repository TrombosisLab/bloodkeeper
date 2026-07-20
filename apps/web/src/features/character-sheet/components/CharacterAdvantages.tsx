import { demoAdvantages } from '../data/demo-advantages'
import { TraitGroup } from './TraitGroup'

export function CharacterAdvantages() {
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
          traits={demoAdvantages.advantages}
        />

        <TraitGroup
          title="Trasfondos"
          subtitle="Recursos y vínculos"
          traits={demoAdvantages.backgrounds}
        />

        <TraitGroup
          title="Defectos"
          subtitle="Complicaciones"
          traits={demoAdvantages.flaws}
          negative
        />
      </div>
    </section>
  )
}
