import { useEffect, useRef, useState } from 'react'
import type { ChronicleApiSnapshot } from '../types/chronicle-api.types.ts'
import type { PackageScope } from '../domain/context-visual-package.ts'
import { prepareVisualPackage } from '../infrastructure/context-visual-package.api.ts'
import type { VisualPackageResult } from '../infrastructure/context-visual-package.api.ts'

export function ChronicleVisualPackage({ chronicle, scope, includeInstructions }: { readonly chronicle: ChronicleApiSnapshot; readonly scope: PackageScope; readonly includeInstructions: boolean }) {
  const request = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false), [status, setStatus] = useState(''), [error, setError] = useState('')
  const [result, setResult] = useState<VisualPackageResult | null>(null)
  useEffect(() => { request.current?.abort(); request.current = null; setBusy(false); setResult(null); setStatus(''); setError(''); return () => { request.current?.abort(); request.current = null } }, [chronicle.id, scope, includeInstructions])
  async function prepare() {
    request.current?.abort()
    const controller = new AbortController(); request.current = controller
    setBusy(true); setResult(null); setError('')
    const timeout = window.setTimeout(() => controller.abort(), 120000)
    try {
      const value = await prepareVisualPackage(chronicle, scope, includeInstructions, controller.signal, message => { if (request.current === controller) setStatus(message) })
      if (request.current === controller) { setResult(value); setStatus('Paquete listo. Revisa los avisos antes de descargar.') }
    } catch (cause) {
      if (request.current === controller) { setStatus(''); setError(controller.signal.aborted ? 'Preparación cancelada o límite de 120 segundos alcanzado. No se genera un archivo parcial.' : cause instanceof Error ? cause.message : 'No se pudo preparar el ZIP.') }
    } finally { window.clearTimeout(timeout); if (request.current === controller) { request.current = null; setBusy(false) } }
  }
  function cancel() { request.current?.abort() }
  function download() {
    if (!result) return
    const url = URL.createObjectURL(result.blob), link = window.document.createElement('a')
    const name = chronicle.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80) || 'cronica'
    link.href = url; link.download = `${scope === 'narrator' ? 'PRIVADO-' : ''}contexto-visual-${name}-${new Date().toISOString().slice(0, 10)}.zip`
    link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section aria-label="Paquete visual de contexto">
    <h3>Fotos y mapas en un ZIP</h3>
    <p>Incluye un contexto recién consultado, fotos autorizadas, mapas con marcas y leyendas e índice. No incluye fichas completas ni documentos adjuntos. No se envía a ninguna IA.</p>
    <p>{scope === 'narrator' ? 'PRIVADO: puede incluir marcas y zonas secretas del narrador. No compartir con jugadores.' : 'Solo material compartido: se excluyen marcas privadas y destinos que no pertenecen al contexto compartido.'}</p>
    <p>Revisa la imagen base de cada mapa: los secretos dibujados en la propia imagen no se pueden filtrar. El ZIP descargado queda fuera de los permisos de BloodKeeper.</p>
    <p>Máximo 60 imágenes y mapas, 50 MiB de ZIP y 120 segundos. Se prepara en memoria del navegador; no guarda exportaciones en el servidor.</p>
    <button type="button" disabled={busy} onClick={() => void prepare()}>{result ? 'Volver a preparar ZIP' : 'Preparar ZIP con fotos y mapas'}</button>
    {busy ? <button type="button" onClick={cancel}>Cancelar preparación del ZIP</button> : null}
    {status ? <p role="status">{status}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    {result ? <><p>{result.images} fotos · {result.maps} mapas con imagen · {(result.blob.size / 1024 / 1024).toFixed(1)} MiB. {result.unavailable ? `${result.unavailable} imágenes no disponibles; consulta el índice del ZIP.` : 'Sin imágenes pendientes entre las seleccionadas.'} Puede haber material excluido por alcance o permisos.</p><button type="button" onClick={download}>Descargar ZIP con fotos y mapas</button></> : null}
    <p>{includeInstructions ? 'Incluye instrucciones para organizar un PDF. La IA elegida debe poder abrir ZIP y generar PDF.' : 'La casilla de instrucciones está desmarcada: el ZIP no incluirá prompts para IA.'}</p>
  </section>
}
