import { demoSecondary } from '../data/demo-secondary'

export function CharacterSecondary() {
  return (
    <section
      className="sheet-section secondary-section"
      aria-labelledby="secondary-title"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Información adicional
          </p>

          <h2 id="secondary-title">
            Equipo, Notas e Historial
          </h2>
        </div>

        <span className="section-number">
          08
        </span>
      </div>

      <div className="secondary-grid">
        <article className="secondary-panel">
          <header>
            <span>Posesiones</span>
            <h3>Equipo</h3>
          </header>

          <div className="inventory-list">
            {demoSecondary.inventory.map((item) => (
              <div
                className="inventory-item"
                key={item.key}
              >
                <strong>{item.name}</strong>

                {item.detail && (
                  <span>{item.detail}</span>
                )}
              </div>
            ))}
          </div>
        </article>

        <article className="secondary-panel">
          <header>
            <span>Recordatorios</span>
            <h3>Notas</h3>
          </header>

          <ul className="notes-list">
            {demoSecondary.notes.map((note, index) => (
              <li key={index}>
                {note}
              </li>
            ))}
          </ul>
        </article>

        <article className="secondary-panel">
          <header>
            <span>Trayectoria</span>
            <h3>Historial</h3>
          </header>

          <div className="history-list">
            {demoSecondary.history.map((entry) => (
              <div
                className="history-entry"
                key={entry.key}
              >
                <strong>
                  {entry.title}
                </strong>

                <p>
                  {entry.detail}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
