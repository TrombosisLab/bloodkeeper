import { useEffect, useRef, useState } from 'react'
import type { ChronicleApiSnapshot } from '../types/chronicle-api.types.ts'
import { buildNarratorContext, NARRATOR_EXPORT_INSTRUCTIONS } from '../domain/chronicle-narrator-export.ts'
import { loadNarratorExport } from '../infrastructure/chronicle-narrator-export.api.ts'
import './chronicle-context-export.css'
import { ChronicleVisualPackage } from './ChronicleVisualPackage.tsx'

export function ChronicleNarratorExport({ chronicle, active = true }: { readonly chronicle: ChronicleApiSnapshot; readonly active?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const request = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [document, setDocument] = useState('')
  const [error, setError] = useState('')
  const [instructions, setInstructions] = useState(true)
  function clear() {
    request.current?.abort()
    request.current = null
    setBusy(false)
    setDocument('')
    setError('')
  }
  useEffect(() => {
    dialog.current?.close(); clear()
    return () => { request.current?.abort(); request.current = null }
  }, [active, chronicle.id])

  async function generate() {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setBusy(true); setError(''); setDocument('')
    const timeout = window.setTimeout(() => controller.abort(), 60000)
    try {
      const sources = await loadNarratorExport(chronicle, controller.signal)
      if (request.current === controller) setDocument(buildNarratorContext(sources))
    } catch (cause) {
      if (request.current === controller) setError(controller.signal.aborted ? 'La consulta superó 60 segundos. Puedes reintentar; no se generó un archivo parcial.' : cause instanceof Error ? cause.message : 'No se pudo generar el contexto.')
    } finally {
      window.clearTimeout(timeout)
      if (request.current === controller) { request.current = null; setBusy(false) }
    }
  }
  function open() {
    clear(); setInstructions(true)
    dialog.current?.showModal()
    void generate()
  }
  function download() {
    const content = document + (instructions ? '\n\n' + NARRATOR_EXPORT_INSTRUCTIONS : '')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))
    const link = window.document.createElement('a')
    const name = chronicle.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80) || 'cronica'
    link.href = url
    link.download = `PRIVADO-narrador-${name}-${new Date().toISOString().slice(0, 10)}.md`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const bytes = new TextEncoder().encode(document + (instructions ? '\n\n' + NARRATOR_EXPORT_INSTRUCTIONS : '')).byteLength
  return <>
    <button className="summary-inline-button" type="button" onClick={open}>Exportar contexto privado del narrador</button>
    <dialog ref={dialog} className="chronicle-context-export" aria-labelledby="chronicle-narrator-export-title" onClose={clear}>
      <header><div><small>PRIVADO · SOLO NARRADOR</small><h2 id="chronicle-narrator-export-title">Exportar contexto privado</h2></div><button type="button" onClick={() => dialog.current?.close()} aria-label="Cerrar exportación privada">Cerrar</button></header>
      <div className="chronicle-context-export__content">
        <p>Contexto compartido más historias privadas, guiones completos con páginas y continuaciones, notas propias del narrador, hitos, recordatorios y notas del narrador en sesiones.</p>
        <p className="chronicle-context-export__notice">CONTIENE SECRETOS. No compartir con jugadores. El guion es planificación, no acontecimientos realizados. No incluye mapas privados, notas privadas de otros jugadores, fichas completas ni adjuntos. No se envía a ninguna IA.</p>
        {busy ? <p role="status">Consultando fuentes autorizadas…</p> : null}
        {error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => void generate()}>Reintentar</button></div> : null}
        {document ? <>
          <p>Vista previa · {(bytes / 1024).toFixed(1)} KiB · Markdown de texto</p>
          <pre tabIndex={0} aria-label="Vista previa del contexto">{document}</pre>
          <label className="chronicle-context-export__option"><input type="checkbox" checked={instructions} onChange={event => setInstructions(event.target.checked)} /> Incluir instrucciones para IA al final del archivo</label>
          <details><summary>Ver instrucciones para IA</summary><pre>{NARRATOR_EXPORT_INSTRUCTIONS}</pre></details>
          <ChronicleVisualPackage chronicle={chronicle} scope="narrator" includeInstructions={instructions} />
        </> : null}
      </div>
      <footer><span>Se genera en memoria, sin guardar archivos en el servidor.</span><button type="button" disabled={busy || !document} onClick={download}>Descargar .md</button></footer>
    </dialog>
  </>
}
