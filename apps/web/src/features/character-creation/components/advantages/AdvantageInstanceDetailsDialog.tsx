import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  CharacterAdvantageSelectionDraft,
} from '../../types/character-advantages-draft.types'

import {
  AdvantageInstanceDetailsEditor,
} from './AdvantageInstanceDetailsEditor'

interface AdvantageInstanceDetailsDialogProps {
  selection: CharacterAdvantageSelectionDraft
  title: string
  onSave: (
    selection: CharacterAdvantageSelectionDraft,
  ) => void
  onClose: () => void
}

export function AdvantageInstanceDetailsDialog({
  selection,
  title,
  onSave,
  onClose,
}: AdvantageInstanceDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [draftSelection, setDraftSelection] =
    useState(selection)

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog && !dialog.open) {
      dialog.showModal()
    }

    return () => {
      if (dialog?.open) {
        dialog.close()
      }
    }
  }, [])

  function close() {
    dialogRef.current?.close()
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave(draftSelection)
    close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="advantage-instance-dialog"
      aria-labelledby="advantage-instance-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClose={onClose}
    >
      <form onSubmit={save}>
        <header className="advantage-instance-dialog__header">
          <div>
            <span>Información adicional</span>
            <h2 id="advantage-instance-dialog-title">
              Editar {title}
            </h2>
          </div>
          <button
            type="button"
            className="advantage-instance-dialog__close"
            aria-label="Cerrar sin guardar"
            onClick={close}
          >
            ×
          </button>
        </header>

        <p className="advantage-instance-dialog__intro">
          Completa los datos de esta selección. Puedes modificarlos más adelante.
        </p>

        <div className="advantage-instance-dialog__fields">
          <AdvantageInstanceDetailsEditor
            selection={draftSelection}
            onChange={setDraftSelection}
          />
        </div>

        <footer className="advantage-instance-dialog__actions">
          <button type="button" onClick={close}>
            Cancelar
          </button>
          <button type="submit">
            Guardar
          </button>
        </footer>
      </form>
    </dialog>
  )
}
