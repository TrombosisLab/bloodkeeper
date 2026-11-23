import { useEffect, useRef } from 'react'

import type {
  CharacterAdvantageDefinition,
} from '../../types/character-advantage-definition.types'

interface AdvantageCatalogInfoDialogProps {
  definition: CharacterAdvantageDefinition
  categoryLabel: string
  description: string
  onClose: () => void
}

export function AdvantageCatalogInfoDialog({
  definition,
  categoryLabel,
  description,
  onClose,
}: AdvantageCatalogInfoDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const ratings = definition.allowedRatings
  const ratingLabel = ratings.length === 0
    ? 'No se compra con puntos'
    : ratings.map((rating) => `${'•'.repeat(rating)} (${rating})`).join(' · ')

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="advantage-info-dialog"
      aria-labelledby="advantage-info-dialog-title"
      aria-describedby="advantage-info-dialog-description"
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
            <h2 id="advantage-info-dialog-title">{definition.name}</h2>
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

        <p className="advantage-info-dialog__rating">
          <span>Puntos disponibles</span>
          <strong>{ratingLabel}</strong>
        </p>
        <section aria-labelledby="advantage-info-dialog-effect">
          <h3 id="advantage-info-dialog-effect">¿Qué hace?</h3>
          <p id="advantage-info-dialog-description">{description}</p>
        </section>
        <p className="advantage-info-dialog__source">
          Es un resumen para orientarte; la ficha y el Narrador determinan cómo se aplica en cada caso.
        </p>
        {definition.sourcePage && (
          <p className="advantage-info-dialog__source">
            Referencia del catálogo: pág. {definition.sourcePage}.
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
