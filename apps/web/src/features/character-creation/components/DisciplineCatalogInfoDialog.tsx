import { useEffect, useRef } from 'react'

interface DisciplineCatalogInfoDialogProps {
  title: string
  categoryLabel: string
  summary: string
  detail?: string
  level?: number
  sourcePage?: number
  onClose: () => void
}

export function DisciplineCatalogInfoDialog({
  title,
  categoryLabel,
  summary,
  detail,
  level,
  sourcePage,
  onClose,
}: DisciplineCatalogInfoDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="advantage-info-dialog"
      aria-labelledby="discipline-info-dialog-title"
      aria-describedby="discipline-info-dialog-description"
      onCancel={(event) => {
        event.preventDefault()
        dialogRef.current?.close()
      }}
      onClose={onClose}
    >
      <div className="advantage-info-dialog__content">
        <header className="advantage-info-dialog__header">
          <div>
            <span>Guía del catálogo · {categoryLabel}</span>
            <h2 id="discipline-info-dialog-title">{title}</h2>
          </div>
          <button
            type="button"
            className="advantage-info-dialog__close"
            aria-label="Cerrar información"
            onClick={() => dialogRef.current?.close()}
          >
            ×
          </button>
        </header>

        {level !== undefined && (
          <p className="advantage-info-dialog__rating">
            <span>Nivel del Poder</span>
            <strong>{level}</strong>
          </p>
        )}

        <section aria-labelledby="discipline-info-dialog-effect">
          <h3 id="discipline-info-dialog-effect">¿Qué hace?</h3>
          <p id="discipline-info-dialog-description">{summary}</p>
        </section>

        {detail && (
          <section aria-labelledby="discipline-info-dialog-details">
            <h3 id="discipline-info-dialog-details">Aplicación en juego</h3>
            <p>{detail}</p>
          </section>
        )}

        <p className="advantage-info-dialog__source">
          Resumen orientativo. Consulta la ficha y al Narrador para las condiciones y excepciones.
        </p>
        {sourcePage && (
          <p className="advantage-info-dialog__source">
            Referencia del catálogo: pág. {sourcePage}.
          </p>
        )}

        <footer className="advantage-info-dialog__actions">
          <button type="button" onClick={() => dialogRef.current?.close()}>
            Cerrar
          </button>
        </footer>
      </div>
    </dialog>
  )
}
