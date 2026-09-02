import {
  useMemo,
  useState,
} from 'react'

import {
  createCharacterSheetPdfGateway,
} from '../infrastructure/character-sheet-pdf.api'

import type {
  CharacterSheetPdfFormat,
  CharacterSheetPdfGateway,
} from '../infrastructure/character-sheet-pdf.api'

import './persisted-character-pdf-export.css'

interface PersistedCharacterPdfExportProps {
  readonly characterId: string
  readonly gateway?: CharacterSheetPdfGateway
}

export function PersistedCharacterPdfExport({
  characterId,
  gateway,
}: PersistedCharacterPdfExportProps) {
  const resolvedGateway = useMemo(
    () => gateway ?? createCharacterSheetPdfGateway(),
    [gateway],
  )
  const [format, setFormat] =
    useState<CharacterSheetPdfFormat>('editable')
  const [status, setStatus] = useState<
    'ready' | 'downloading' | 'error'
  >('ready')

  const download = async () => {
    if (status === 'downloading') return

    setStatus('downloading')

    try {
      const result = await resolvedGateway.download(
        characterId,
        format,
      )
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.fileName
      link.rel = 'noopener'
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="character-pdf-export">
      <label>
        <span className="sr-only">Formato PDF</span>
        <select
          aria-label="Formato PDF"
          value={format}
          disabled={status === 'downloading'}
          onChange={(event) => {
            setFormat(
              event.target.value as CharacterSheetPdfFormat,
            )
            setStatus('ready')
          }}
        >
          <option value="editable">PDF editable</option>
          <option value="print">PDF para imprimir</option>
        </select>
      </label>

      <button
        type="button"
        className="sheet-header__state-edit"
        disabled={status === 'downloading'}
        onClick={() => void download()}
      >
        {status === 'downloading'
          ? 'Generando PDF…'
          : 'Descargar ficha'}
      </button>

      {status === 'error' ? (
        <span role="alert">
          No se pudo generar el PDF.
        </span>
      ) : null}
    </div>
  )
}
