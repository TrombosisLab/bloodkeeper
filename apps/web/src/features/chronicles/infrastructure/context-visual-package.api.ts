import type { ChronicleApiSnapshot } from '../types/chronicle-api.types.ts'
import type { ChronicleMapWorkspace, ChronicleMapSnapshot } from '../../map/infrastructure/chronicle-map.api.ts'
import { loadChronicleExport } from './chronicle-context-export.api.ts'
import { loadNarratorExport } from './chronicle-narrator-export.api.ts'
import { buildChronicleContext, EXPORT_INSTRUCTIONS, safeExportText } from '../domain/chronicle-context-export.ts'
import { buildNarratorContext, NARRATOR_EXPORT_INSTRUCTIONS } from '../domain/chronicle-narrator-export.ts'
import { planVisualPackage, mapLegend, buildStoredZip, PDF_PACKAGE_INSTRUCTIONS, PACKAGE_MAX_BYTES } from '../domain/context-visual-package.ts'
import type { PackageScope, ZipEntry } from '../domain/context-visual-package.ts'

export interface VisualPackageResult { readonly blob: Blob; readonly images: number; readonly maps: number; readonly unavailable: number; readonly excluded: number }

function validImageUrl(value: string, chronicleId: string): string {
  const prefix = '/api/chronicles/' + encodeURIComponent(chronicleId) + '/assets/'
  if (!value.startsWith(prefix) || !/^(CHARACTER|NPC|LOCATION|RESOURCE|SESSION|MAP)\/[0-9a-f-]{36}\/image$/i.test(value.slice(prefix.length))) throw new Error('Ruta de imagen no autorizada para este paquete.')
  return value
}

async function renderImage(blob: Blob, map: ChronicleMapSnapshot | undefined, signal: AbortSignal): Promise<Uint8Array> {
  signal.throwIfAborted()
  const bitmap = await createImageBitmap(blob)
  try {
    signal.throwIfAborted()
    if (bitmap.width * bitmap.height > 16_000_000) throw new Error('Una imagen supera 16 millones de píxeles. Reduce su resolución antes de exportar.')
    const scale = Math.min(1, 4096 / Math.max(bitmap.width, bitmap.height))
    const canvas = window.document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('El navegador no permite generar imágenes del paquete.')
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    if (map) {
      if (map.markers.length + map.areas.length > 1000) throw new Error('Un mapa supera 1000 marcas y zonas; no se exporta parcialmente.')
      const font = Math.max(14, Math.round(Math.min(canvas.width, canvas.height) / 45))
      ctx.font = `bold ${font}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      const coordinate = (value: number) => { if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Coordenada del mapa inválida.'); return value }
      for (const [index, area] of map.areas.entries()) {
        const rect = area.geometry as { type?: string; x: number; y: number; width: number; height: number }
        if (!rect || rect.type !== 'RECT') throw new Error('Tipo de zona no compatible; no se genera un mapa incompleto.')
        const x = coordinate(rect.x) * canvas.width, y = coordinate(rect.y) * canvas.height
        const width = coordinate(rect.width) * canvas.width, height = coordinate(rect.height) * canvas.height
        ctx.fillStyle = '#bd3e5733'; ctx.fillRect(x, y, width, height)
        ctx.strokeStyle = /^#[0-9a-f]{6}$/i.test(area.color ?? '') ? area.color! : '#bd3e57'; ctx.lineWidth = 2; ctx.strokeRect(x, y, width, height)
        ctx.fillStyle = '#111111'; ctx.fillRect(x, y, font * 2.6, font * 1.4)
        ctx.fillStyle = '#ffffff'; ctx.fillText(`Z${index + 1}`, x + font * 1.3, y + font * .7)
      }
      for (const [index, marker] of map.markers.entries()) {
        const radius = font * .9
        const x = Math.min(canvas.width - radius, Math.max(radius, coordinate(marker.x) * canvas.width))
        const y = Math.min(canvas.height - radius, Math.max(radius, coordinate(marker.y) * canvas.height))
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = '#8f2038'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = '#ffffff'; ctx.fillText(String(index + 1), x, y)
      }
    }
    signal.throwIfAborted()
    const output = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('No se pudo generar la imagen.')), 'image/jpeg', .85))
    signal.throwIfAborted()
    canvas.width = 1; canvas.height = 1
    return new Uint8Array(await output.arrayBuffer())
  } finally { bitmap.close() }
}

export async function prepareVisualPackage(chronicle: ChronicleApiSnapshot, scope: PackageScope, includeInstructions: boolean, signal: AbortSignal, progress: (message: string) => void): Promise<VisualPackageResult> {
  progress('Consultando contexto autorizado…')
  const privateSources = scope === 'narrator' ? await loadNarratorExport(chronicle, signal) : null
  const sources = privateSources?.shared ?? await loadChronicleExport(chronicle, signal)
  const text = privateSources ? buildNarratorContext(privateSources) : buildChronicleContext(sources)
  const instructions = privateSources ? NARRATOR_EXPORT_INSTRUCTIONS : EXPORT_INSTRUCTIONS
  let received = 0
  async function read(url: string, maximum: number, optional = false): Promise<{ bytes: Uint8Array; mime: string } | null> {
    signal.throwIfAborted()
    const response = await fetch(url, { credentials: 'include', signal, cache: 'no-store', redirect: 'error', headers: { Accept: optional ? 'image/png,image/jpeg,image/webp' : 'application/json' } })
    if (optional && response.status === 404) return null
    if (!response.ok || !response.body) throw new Error('Una fuente no pudo consultarse o dejó de estar autorizada. No se genera un ZIP parcial.')
    const reader = response.body.getReader(), chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const part = await reader.read()
        if (part.done) break
        size += part.value.byteLength; received += part.value.byteLength
        if (size > maximum || received > 100 * 1024 * 1024) throw new Error('Se superó el límite de lectura del material visual. No se genera un ZIP parcial.')
        chunks.push(part.value)
      }
    } catch (error) { await reader.cancel().catch(() => undefined); throw error }
    finally { reader.releaseLock() }
    const bytes = new Uint8Array(size); let at = 0
    for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length }
    return { bytes, mime: response.headers.get('content-type')?.split(';')[0] ?? '' }
  }
  const mapResponse = await read('/api/chronicles/' + encodeURIComponent(chronicle.id) + '/maps', 8 * 1024 * 1024)
  const workspace = JSON.parse(new TextDecoder().decode(mapResponse!.bytes)) as ChronicleMapWorkspace
  if (workspace.chronicleId !== chronicle.id || !Array.isArray(workspace.maps) || workspace.maps.some(map => map.chronicleId !== chronicle.id)) throw new Error('Respuesta de mapas inválida o de otra crónica.')
  const plan = planVisualPackage(sources.context, workspace, scope)
  const encoder = new TextEncoder(), entries: ZipEntry[] = []
  let outputSize = 0
  function add(name: string, data: Uint8Array) { outputSize += data.byteLength; if (outputSize > PACKAGE_MAX_BYTES - 65536) throw new Error('El paquete supera 50 MiB.'); entries.push({ name, data }) }
  function addText(name: string, value: string) { add(name, encoder.encode(value)) }
  addText('contexto.md', text + (includeInstructions ? '\n\n' + instructions : ''))
  if (includeInstructions) addText('instrucciones-para-pdf.md', PDF_PACKAGE_INSTRUCTIONS)
  const index = [scope === 'narrator' ? '# PRIVADO — índice del material' : '# Índice del material compartido', '',
    'contexto.md es la fuente narrativa. Las imágenes son ilustraciones autorizadas, no fichas completas ni pruebas de acontecimientos.',
    'Las imágenes se reexportan a JPEG sin conservar metadatos originales. Los mapas se reconstruyen con marcas y zonas permitidas; no son capturas exactas de la interfaz.',
    'Los archivos locales no requieren acceso a BloodKeeper. El ZIP descargado queda fuera de sus permisos. No contiene documentos adjuntos ni mapas privados de relaciones.', '']
  let images = 0, maps = 0, unavailable = 0
  async function imageBytes(url: string): Promise<Blob | null> {
    const image = await read(validImageUrl(url, chronicle.id), 5 * 1024 * 1024, true)
    if (!image) return null
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(image.mime)) throw new Error('Formato de imagen no admitido.')
    return new Blob([new Uint8Array(image.bytes).buffer], { type: image.mime })
  }
  for (const [i, image] of plan.images.entries()) {
    progress(`Preparando foto ${i + 1} de ${plan.images.length}…`)
    const blob = await imageBytes(image.url)
    const label = safeExportText(image.name).replace(/[\r\n]+/g, ' ')
    if (!blob) { unavailable++; index.push(`- Foto ${image.reference}: ${label} — sin imagen disponible.`); continue }
    const path = `imagenes/foto-${i + 1}.jpg`
    add(path, await renderImage(blob, undefined, signal)); images++
    index.push(`- ${path}: ${label} [${image.reference}].`)
  }
  for (const [i, map] of plan.maps.entries()) {
    progress(`Preparando mapa ${i + 1} de ${plan.maps.length}…`)
    const legend = `mapas/mapa-${i + 1}-leyenda.md`
    addText(legend, mapLegend(map))
    if (!map.hasImage) { unavailable++; index.push(`- ${legend}: ${safeExportText(map.name)} — sin imagen base disponible.`); continue }
    const blob = await imageBytes(map.imageUrl)
    if (!blob) { unavailable++; index.push(`- ${legend}: ${safeExportText(map.name)} — imagen base no disponible.`); continue }
    const path = `mapas/mapa-${i + 1}.jpg`
    add(path, await renderImage(blob, map, signal)); maps++
    index.push(`- ${path}: ${safeExportText(map.name)}; leyenda: ${legend}.`)
  }
  index.push('', '## Límites y material no incluido',
    `Fotos generadas: ${images}. Mapas con imagen: ${maps}. Imágenes no disponibles: ${unavailable}.`,
    scope === 'shared' ? 'Se incluyen las marcas y zonas compartidas de los mapas seleccionados, también las marcas de solicitudes aprobadas. Una marca no se omite porque su recurso vinculado no figure en el Markdown. No se exportan sus fichas completas ni se añaden fotos de esos recursos.' : 'Incluye marcas y zonas de los mapas autorizados al narrador, también las privadas. No incluye mapas privados de relaciones de jugadores.',
    'Puede haber material excluido por el alcance o los permisos. Una imagen 404 queda documentada; cualquier fallo de autorización cancela el paquete.')
  addText('indice-de-material.md', index.join('\n'))
  signal.throwIfAborted()
  progress('Empaquetando archivos…')
  const blob = buildStoredZip(entries)
  signal.throwIfAborted()
  return { blob, images, maps, unavailable, excluded: plan.excluded }
}
