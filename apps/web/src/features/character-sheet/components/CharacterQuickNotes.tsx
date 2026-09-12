import { useEffect, useState } from 'react'

interface CharacterQuickNotesProps {
  characterId?: string
}

export function CharacterQuickNotes({
  characterId,
}: CharacterQuickNotesProps) {
  const storageKey = `bloodkeeper.character.quick-notes.${characterId ?? 'demo'}`
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setDraft(window.localStorage.getItem(storageKey) ?? '')
    setSaved(false)
  }, [storageKey])

  function saveNote() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, draft)
    }
    setSaved(true)
  }

  return (
    <div
      className="blood-quick-notes"
      data-blood-notes="quick"
      data-quick-notes-action="save"
    >
      <div className="blood-quick-notes__heading">
        <strong>Notas</strong>
        <span>Condiciones y recordatorios</span>
      </div>

      <textarea
        aria-label="Notas de la ficha"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          setSaved(false)
        }}
        placeholder="Anota efectos, condiciones o recordatorios…"
      />

      <div className="blood-quick-notes__actions">
        <button
          type="button"
          onClick={saveNote}
          data-quick-notes-save="true"
        >
          Guardar nota
        </button>

        {saved ? (
          <span role="status">Nota guardada</span>
        ) : null}
      </div>
    </div>
  )
}
