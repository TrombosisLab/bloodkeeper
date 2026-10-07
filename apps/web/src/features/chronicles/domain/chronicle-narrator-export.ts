import { buildChronicleContext, safeExportText, EXPORT_MAX_BYTES, EXPORT_INSTRUCTIONS } from './chronicle-context-export.ts'
import type { ChronicleExportSources } from './chronicle-context-export.ts'
import type { ChronicleStoryApiSnapshot } from '../types/chronicle-story-api.types.ts'
import type { NotebookNote } from '../../notebook/types/notebook.types.ts'
import { normalizeGuidePages, guidePageCards, guidePageConnections } from './story-guide-pages.ts'

export interface NarratorExportSources {
  shared: ChronicleExportSources
  narratorId: string
  viewerUserId: string
  stories: readonly ChronicleStoryApiSnapshot[]
  notes: readonly NotebookNote[]
}
const title = (value: string | null | undefined) => safeExportText(value).replace(/[\r\n]+/g, ' ').trim()
const quote = (value: string | null | undefined) => (safeExportText(value).trim() || 'Sin texto registrado.').split(/\r?\n/).map(line => '> ' + line).join('\n')
const kinds: Record<string, string> = { clue: 'Pista', npc: 'PNJ', location: 'Lugar', document: 'Documento', event: 'Evento', decision: 'Decisión', outcome: 'Consecuencia' }
const states: Record<string, string> = { hidden: 'Secreto / pendiente', discovered: 'Descubierto por la coterie', resolved: 'Resuelto' }
const statuses: Record<string, string> = { planned: 'Planificada', active: 'En curso', completed: 'Completada', archived: 'Archivada' }
const milestones: Record<string, string> = { hook: 'Inicio / gancho', first_turn: 'Primer giro', revelation: 'Revelación', climax: 'Clímax', resolution: 'Resolución' }
const sessionStatuses: Record<string, string> = { preparation: 'En preparación', in_progress: 'En curso', completed: 'Completada', archived: 'Archivada' }

export const NARRATOR_EXPORT_INSTRUCTIONS = EXPORT_INSTRUCTIONS + `
### Tratamiento del contexto privado del narrador

Este documento completo es privado y contiene secretos. El apartado Alcance del bloque compartido describe únicamente la primera parte, no el archivo completo.
Distingue tres capas: acontecimientos registrados en sesiones realizadas; planificación y posibilidades del guion; secretos y notas privadas del narrador. No presentes escenas previstas ni consecuencias posibles como hechos ocurridos.
Los estados Secreto, Descubierto y Resuelto de las tarjetas no publican su contenido ni demuestran por sí solos cuándo ocurrió un acontecimiento. Los hitos pendientes no son sucesos realizados.
GN1-P1 identifica una página y GN1-T1 una tarjeta única. Las continuaciones repiten la misma tarjeta en varias páginas, no son acontecimientos ni personajes distintos.
Revisa coherencia y preparación usando las referencias del documento. Indica lo que falta; no inventes contenido de fichas, adjuntos ni mapas privados ausentes.
No produzcas una versión para jugadores ni reveles secretos a otros destinatarios salvo petición explícita del narrador. Si se pide una versión compartible, usa únicamente el bloque compartido y no introduzcas información privada.
`

export function buildNarratorContext(input: NarratorExportSources, generatedAt?: string): string {
  if (!input.viewerUserId || input.viewerUserId !== input.narratorId) throw new Error('Solo el narrador de esta crónica puede generar este documento.')
  const lines = ['# PRIVADO — CONTIENE SECRETOS DE LA CRÓNICA', '',
    'Solo para el narrador. No compartir con jugadores. Lo descargado queda fuera de los permisos de BloodKeeper.',
    'El guion es planificación: sus escenas, conexiones y consecuencias no prueban que hayan sucedido. Los estados de tarjeta no publican su contenido.', '',
    buildChronicleContext(input.shared, generatedAt, 'narrator-section'), '', '## Contexto privado del narrador', '',
    'Lo anterior es contexto compartido. Lo siguiente contiene información privada. No se consultan mapas privados ni notas privadas de otros jugadores.',
    'GN = guion; GN1-P1 = página; GN1-T1 = tarjeta única. Una tarjeta puede aparecer en varias páginas sin convertirse en otra tarjeta.', '']
  for (const [index, story] of input.stories.entries()) {
    const ref = `GN${index + 1}`
    lines.push(`### ${title(story.title)} [${ref}]`, `Estado: ${statuses[story.status] ?? title(story.status)}.`,
      'Premisa privada:', quote(story.premise), 'Qué está en juego:', quote(story.stakes),
      'Notas del narrador:', quote(story.narratorNotes), 'Resolución registrada:', quote(story.resolution))
    for (const milestone of story.milestones) lines.push(`Hito ${title(milestones[milestone.key] ?? milestone.key)} — ${milestone.completed ? 'Alcanzado' : 'Pendiente'}; nota privada:`, quote(milestone.note))
    for (const reminder of story.reminders) lines.push(`Recordatorio — ${reminder.resolved ? 'Resuelto' : 'Pendiente'}:`, quote(reminder.text))
    for (const session of story.sessions) lines.push(`Progreso vinculado a ${title(session.title) || 'Sesión sin título'} (no implica que se haya jugado):`, quote(session.progressNotes))
    if (!story.narratorGuide) { lines.push('Sin guion visual registrado.', ''); continue }
    const guide = normalizeGuidePages(story.narratorGuide)
    const pages = guide.pages ?? []
    const pageRefs = new Map(pages.map((page, i) => [page.id, `${ref}-P${i + 1}`]))
    const cardRefs = new Map(guide.cards.map((card, i) => [card.id, `${ref}-T${i + 1}`]))
    const cards = new Map(guide.cards.map(card => [card.id, card]))
    const label = (id: string) => `${title(cards.get(id)?.title)} [${cardRefs.get(id)}]`
    for (const card of guide.cards) {
      lines.push(`#### ${label(card.id)}`, `Tipo: ${kinds[card.kind] ?? title(card.kind)}. Estado: ${states[card.state] ?? title(card.state)}.`,
        'Descripción:', quote(card.summary), 'Nota privada:', quote(card.narratorNote))
    }
    for (const page of pages) {
      lines.push(`#### Página: ${title(page.title)} [${pageRefs.get(page.id)}]`)
      const present = guidePageCards(guide, page.id)
      if (!present.length) lines.push('Página sin tarjetas.')
      for (const card of present) {
        const appearance = card.appearances?.find(item => item.pageId === page.id)
        lines.push(`- ${label(card.id)}${appearance ? ` — continuación desde [${pageRefs.get(appearance.sourcePageId) ?? 'página no disponible'}]; misma tarjeta.` : ' — ubicación original.'}`)
      }
      const edges = guidePageConnections(guide, page.id)
      if (!edges.length) lines.push('Sin conexiones en esta página.')
      for (const edge of edges) lines.push(`- ${label(edge.from)} → ${label(edge.to)}: ${title(edge.label) || 'Sin significado registrado'}.`)
    }
    const shown = new Set(pages.flatMap(page => guidePageConnections(guide, page.id).map(edge => edge.id)))
    for (const edge of guide.connections.filter(edge => !shown.has(edge.id) && cards.has(edge.from) && cards.has(edge.to))) {
      lines.push(`- Conexión entre páginas: ${label(edge.from)} → ${label(edge.to)}: ${title(edge.label) || 'Sin significado registrado'}.`)
    }
    lines.push('')
  }
  if (!input.stories.length) lines.push('Sin historias registradas.')
  lines.push('### Notas privadas propias del narrador')
  const ownNotes = input.notes.filter(note => note.author.id === input.viewerUserId && note.visibility === 'PRIVATE')
  if (!ownNotes.length) lines.push('Ninguna.')
  for (const [i, note] of ownNotes.entries()) lines.push(`#### ${title(note.title)} [NP${i + 1}]`, quote(note.content))
  lines.push('### Notas privadas de sesiones (incluye preparación; no confirma acontecimientos)')
  const sessionNotes = input.shared.sessions.filter(item => item.narratorNotes?.trim())
  if (!sessionNotes.length) lines.push('Ninguna.')
  for (const session of sessionNotes) lines.push(`#### ${title(session.title) || 'Sesión sin título'} — ${title(sessionStatuses[session.status] ?? session.status)}`, quote(session.narratorNotes))
  const result = lines.join('\n')
  if (new TextEncoder().encode(result + '\n\n' + NARRATOR_EXPORT_INSTRUCTIONS).byteLength > EXPORT_MAX_BYTES) throw new Error('El documento supera 2 MiB. No se genera un archivo parcial.')
  return result
}
