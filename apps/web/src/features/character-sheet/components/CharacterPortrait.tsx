import { ChangeEvent, useRef, useState } from 'react'

import { V5VisualMark } from '../../v5-visuals/V5VisualMark'

import './character-portrait.css'

const MAX_PORTRAIT_BYTES = 2 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface CharacterPortraitProps {
  readonly characterId?: string
  readonly name: string
  readonly clan: string
}

export function CharacterPortrait({
  characterId,
  name,
  clan,
}: CharacterPortraitProps) {
  const input = useRef<HTMLInputElement>(null)
  const [version, setVersion] = useState(0)
  const [customAvailable, setCustomAvailable] = useState(characterId !== undefined)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (file === undefined || characterId === undefined) return

    if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_PORTRAIT_BYTES) {
      setMessage('Usa JPEG, PNG o WebP de hasta 2 MB.')
      return
    }

    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/characters/${characterId}/portrait`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!response.ok) throw new Error('upload-failed')
      setVersion((current) => current + 1)
      setCustomAvailable(true)
      setMessage('Retrato actualizado.')
    } catch {
      setMessage('No se pudo guardar el retrato.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (characterId === undefined || !window.confirm('¿Quitar el retrato personal?')) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/characters/${characterId}/portrait`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('remove-failed')
      setCustomAvailable(false)
      setMessage('Se vuelve a mostrar el emblema del clan.')
    } catch {
      setMessage('No se pudo quitar el retrato.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="character-portrait" aria-label={`Retrato de ${name}`}>
      <div className="character-portrait__frame">
        {customAvailable && characterId !== undefined ? (
          <img
            src={`/api/characters/${characterId}/portrait?v=${version}`}
            alt={`Retrato de ${name}`}
            onError={() => setCustomAvailable(false)}
          />
        ) : (
          <div className="character-portrait__fallback">
            <V5VisualMark kind="clan-symbol" value={clan} decorative />
            <span>{clan || 'Sin clan'}</span>
          </div>
        )}
      </div>

      {characterId !== undefined ? (
        <div className="character-portrait__actions">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void upload(event)}
            hidden
          />
          <button type="button" disabled={busy} onClick={() => input.current?.click()}>
            {customAvailable ? 'Cambiar foto' : 'Subir foto'}
          </button>
          {customAvailable ? (
            <button type="button" disabled={busy} onClick={() => void remove()}>
              Quitar
            </button>
          ) : null}
        </div>
      ) : null}

      <small>JPEG, PNG o WebP · máximo 2 MB</small>
      {message ? <p role="status">{message}</p> : null}
    </aside>
  )
}
