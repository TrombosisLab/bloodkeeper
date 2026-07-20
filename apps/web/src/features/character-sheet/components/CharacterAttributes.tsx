import { demoAttributes } from '../data/demo-attributes'
import { AttributeRow } from './AttributeRow'
import { CharacterTrackers } from './CharacterTrackers'

export function CharacterAttributes() {
  return (
    <section
      className="sheet-section attributes-section"
      aria-labelledby="attributes-title"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Capacidades innatas
          </p>

          <h2 id="attributes-title">
            Atributos
          </h2>
        </div>

        <span className="section-number">
          01
        </span>
      </div>

      <div className="attributes-grid">
        {demoAttributes.map((category) => (
          <div
            className="attribute-category"
            key={category.key}
          >
            <h3>
              {category.label}
            </h3>

            <div className="attribute-category__rows">
              {category.attributes.map(
                (attribute) => (
                  <AttributeRow
                    key={attribute.key}
                    label={attribute.label}
                    value={attribute.value}
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <CharacterTrackers />
    </section>
  )
}
