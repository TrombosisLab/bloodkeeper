import { useEffect, useRef, useState } from 'react'
import { buildRelationshipExport, RELATIONSHIP_EXPORT_INSTRUCTIONS } from '../domain/chronicle-relationship-export.ts'
import { loadRelationshipExport } from '../infrastructure/chronicle-relationship-export.api.ts'

export function ChronicleRelationshipExport({ chronicle }: { readonly chronicle: { id: string; name: string } }) {
  const [selected, setSelected] = useState('all')
  const [owners, setOwners] = useState<readonly { ownerId: string; name: string }[]>([])
  const [document, setDocument] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const [instructions, setInstructions] = useState(true)
  const [retry, setRetry] = useState(0)
  const request = useRef<AbortController | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    request.current = controller
    setBusy(true); setDocument(''); setError('')
    const timeout = window.setTimeout(() => controller.abort(), 60000)
    void loadRelationshipExport(chronicle.id, selected, controller.signal).then(result => {
      if (request.current !== controller) return
      setOwners(result.owners)
      setDocument(buildRelationshipExport(chronicle, result.maps))
    }).catch(cause => {
      if (request.current === controller) setError(controller.signal.aborted ? 'La consulta superó 60 segundos. Puedes reintentar.' : cause instanceof Error ? cause.message : 'No se pudo exportar.')
    }).finally(() => { window.clearTimeout(timeout); if (request.current === controller) setBusy(false) })
    return () => { request.current = null; controller.abort(); window.clearTimeout(timeout) }
  }, [chronicle.id, chronicle.name, selected, retry])
  const content = document + (instructions ? '\n\n## Instrucciones para IA\n\n' + RELATIONSHIP_EXPORT_INSTRUCTIONS : '')
  function download() {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))
    const link = window.document.createElement('a')
    const name = chronicle.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80) || 'cronica'
    link.href = url; link.download = `relaciones-${name}-${new Date().toISOString().slice(0, 10)}.md`; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section aria-label="Exportación de relaciones compartidas">
    <p>Exporta únicamente mapas compartidos. Cada autor conserva su perspectiva; no se mezclan con mapas privados ni se presentan como hechos confirmados.</p>
    <label className="chronicle-context-export__option">Mapa <select aria-label="Mapa compartido a exportar" value={selected} disabled={busy} onChange={event => { setDocument(''); setSelected(event.target.value) }}><option value="all">Todos los mapas compartidos</option>{owners.map(owner => <option key={owner.ownerId} value={owner.ownerId}>Mapa de {owner.name}</option>)}</select></label>
    {busy ? <p role="status">Consultando mapas compartidos…</p> : null}
    {error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Reintentar</button></div> : null}
    {document ? <><p>Vista previa · {(new TextEncoder().encode(content).byteLength / 1024).toFixed(1)} KiB · Markdown de texto</p><pre tabIndex={0} aria-label="Vista previa de relaciones">{document}</pre><label className="chronicle-context-export__option"><input type="checkbox" checked={instructions} onChange={event => setInstructions(event.target.checked)} /> Incluir instrucciones para IA al final del archivo</label><details><summary>Ver instrucciones para IA</summary><pre>{RELATIONSHIP_EXPORT_INSTRUCTIONS}</pre></details></> : null}
    <p>Se genera en memoria. Revisa el archivo antes de compartirlo; lo descargado queda fuera de los permisos de la web.</p>
    <button type="button" disabled={busy || !document} onClick={download}>Descargar relaciones .md</button>
  </section>
}
