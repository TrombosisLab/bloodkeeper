import { useEffect, useRef } from 'react'

interface ClanInfoDialogProps {
  clanName: string
  kindLabel: string
  summary: string
  disciplines: string[]
  onClose: () => void
}

export function ClanInfoDialog({
  clanName,
  kindLabel,
  summary,
  disciplines,
  onClose,
}: ClanInfoDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="advantage-info-dialog"
      aria-labelledby="clan-info-dialog-title"
      aria-describedby="clan-info-dialog-description"
      onCancel={(event) => {
        event.preventDefault()
        dialogRef.current?.close()
      }}
      onClose={onClose}
    >
      <div className="advantage-info-dialog__content">
        <header className="advantage-info-dialog__header">
          <div>
            <span>Guía del catálogo · {kindLabel}</span>
            <h2 id="clan-info-dialog-title">{clanName}</h2>
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

        <section aria-labelledby="clan-info-dialog-summary-title">
          <h3 id="clan-info-dialog-summary-title">¿Qué los caracteriza?</h3>
          <p id="clan-info-dialog-description">{summary}</p>
        </section>

        <section aria-labelledby="clan-info-dialog-disciplines-title">
          <h3 id="clan-info-dialog-disciplines-title">Disciplinas del clan</h3>
          <ul>
            {disciplines.map((discipline) => (
              <li key={discipline}>{discipline}</li>
            ))}
          </ul>
        </section>

        <p className="advantage-info-dialog__source">
          Es una pincelada orientativa, no una limitación para interpretar al personaje.
        </p>

        <footer className="advantage-info-dialog__actions">
          <button type="button" onClick={() => dialogRef.current?.close()}>
            Cerrar
          </button>
        </footer>
      </div>
    </dialog>
  )
}
