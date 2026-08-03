import { demoSecondary } from '../data/demo-secondary'

import type {
  CharacterSecondaryData,
} from '../types/character-secondary.types'

interface CharacterSecondaryProps {
  data?: CharacterSecondaryData
}

export function CharacterSecondary({
  data = demoSecondary,
}: CharacterSecondaryProps) {
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
            Inventario, Notas e Historial
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
            <h3>Inventario</h3>
          </header>

          <div className="inventory-list">
            {data.inventory.length === 0 ? (
              <p className="secondary-empty">
                No hay objetos registrados.
              </p>
            ) : data.inventory.map((item) => (
              <div
                className="inventory-item"
                key={item.id}
              >
                <strong>
                  {item.name}
                  {item.quantity > 1
                    ? ` ×${item.quantity}`
                    : ''}
                </strong>

                {item.description && (
                  <span>{item.description}</span>
                )}

                <span>
                  {item.category ?? 'Sin categoría'}
                  {item.status === 'archived'
                    ? ' · Archivado'
                    : ''}
                </span>

                {item.notes && (
                  <span>{item.notes}</span>
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

          {data.notes.length === 0 ? (
            <p className="secondary-empty">
              No hay notas guardadas.
            </p>
          ) : (
            <ul className="notes-list">
              {data.notes.map((note) => (
                <li key={note.id}>
                  {note.content}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="secondary-panel">
          <header>
            <span>Trayectoria</span>
            <h3>Historial</h3>
          </header>

          <div className="history-list">
            {data.history.length === 0 ? (
              <p className="secondary-empty">
                No hay hitos narrativos.
              </p>
            ) : data.history.map((entry) => (
              <div
                className="history-entry"
                key={entry.id}
              >
                <strong>
                  {entry.title}
                </strong>

                <p>
                  {entry.description}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
