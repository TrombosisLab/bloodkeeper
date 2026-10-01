
import { useAuthenticatedUser } from '../../authentication/context/authentication.context'
// CHRONICLE_SPACE_TIMELINE_SESSION_CARD_VISUALS_V1

// CHRONICLE_SPACE_RESOURCE_RELATED_NOTES_V3
import { useRef, useEffect, useMemo, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode  } from 'react'
import { createPortal } from 'react-dom'
import { createChronicleGateway } from '../../chronicles/infrastructure/chronicle.api'
import type { ChronicleApiSnapshot, ChronicleSessionApiSnapshot } from '../../chronicles/types/chronicle-api.types'
import { notebookApi } from '../../notebook/infrastructure/notebook.api'
import { chronicleSpaceBoardPersonalApi } from '../infrastructure/chronicle-space-board-personal.api'
import { ChronicleSpaceBoardConflictError, chronicleSpaceBoardApi } from '../infrastructure/chronicle-space-board.api'
import type { NotebookContext, NotebookNote, NotebookResourcePreview } from '../../notebook/types/notebook.types'
import './chronicle-space-prototype.css'

type Section = 'BOARD' | 'TIMELINE' | 'ARCHIVE'
type TimelineFilter = 'ALL' | 'PREPARATION' | 'COMPLETED' | 'WITH_NOTES' | 'WITHOUT_NOTES'
type ArchiveFilter = 'ALL' | 'NOTES' | 'PEOPLE' | 'PLACES' | 'ORGANIZATIONS' | 'ARTIFACTS' | 'DOCUMENTS'
type ArchiveSort = 'DEFAULT' | 'NAME' | 'RECENT'
type Kind = 'PERSONAJE' | 'PNJ' | 'LUGAR' | 'NOTA' | 'ORGANIZACION' | 'ARTEFACTO' | 'DOCUMENTO'
type BoardFilter = 'ALL' | Kind
type Card = { readonly id: string; readonly kind: Kind; readonly title: string; readonly meta: string; readonly description: string; readonly author?: string; readonly targetType?: string; readonly targetId?: string; readonly sessionId?: string | null }
type BoardPosition = { readonly x: number; readonly y: number }
type BoardDragSnapshot = {
  readonly cardId: string
  readonly pointerX: number
  readonly pointerY: number
  readonly leftPx: number
  readonly topPx: number
  readonly boardWidth: number
  readonly boardHeight: number
  readonly cardWidth: number
  readonly cardHeight: number
}

type BoardPreset = {
  readonly name: string
  readonly hiddenCardIds: readonly string[]
  readonly personalPositions: Readonly<Record<string, BoardPosition>>
  readonly boardFilter: BoardFilter
  readonly quickQuery: string
  readonly selectionQuery: string
  readonly selectionKind: 'ALL' | Kind
  readonly selectionStatus: 'ALL' | 'VISIBLE' | 'HIDDEN'
  readonly selectionAuthor: string
  readonly selectionSession: string
}

type BoardConnectionType = 'VISUAL' | 'KNOWN' | 'SUSPICION'
// CHRONICLE_SPACE_BOARD_CONNECTION_TYPES_V1
type BoardConnection = { readonly id: string; readonly fromId: string; readonly toId: string; readonly label: string; readonly type: BoardConnectionType; readonly arrow: boolean; readonly color: string }
type BoardConnectionScope = 'PERSONAL' | 'SHARED'
type ScopedBoardConnection = BoardConnection & { readonly scope: BoardConnectionScope }
const gateway = createChronicleGateway()
function readChronicleSpaceSection(): Section {
  if (typeof window === 'undefined') return 'BOARD'
  const value = new URLSearchParams(window.location.search).get('section')
  return value === 'TIMELINE' || value === 'ARCHIVE' ? value : 'BOARD'
}
function rememberChronicleSpaceSection(section: Section) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('section', section)
  window.history.replaceState(window.history.state, '', url.toString())
}

const chronicleSpaceSelectionKey = 'chronicleId'
const GENERAL_BOARD_SESSION_FILTER = '__general__'
const BOARD_POSITION_HEIGHT = 760
const BOARD_CONNECTION_COLORS: Record<BoardConnectionType, string> = { VISUAL: '#aab4c2', KNOWN: '#f2a35f', SUSPICION: '#d77b9a' }
const boardConnectionColor = (type: BoardConnectionType) => BOARD_CONNECTION_COLORS[type]
const boardConnectionKey = (connection: ScopedBoardConnection) => connection.scope + ':' + connection.id
function readPersonalBoardConnections(value: unknown): BoardConnection[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 200).flatMap((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
    const item = raw as Record<string, unknown>
    if (typeof item.id !== 'string' || typeof item.fromId !== 'string' || typeof item.toId !== 'string' || item.fromId === item.toId) return []
    const type: BoardConnectionType = item.type === 'KNOWN' || item.type === 'SUSPICION' ? item.type : 'VISUAL'
    const color = typeof item.color === 'string' && /^#[0-9a-f]{6}$/i.test(item.color) ? item.color.toLowerCase() : boardConnectionColor(type)
    return [{ id: item.id, fromId: item.fromId, toId: item.toId, label: typeof item.label === 'string' ? item.label.slice(0, 160).trim() : '', type, arrow: typeof item.arrow === 'boolean' ? item.arrow : type !== 'VISUAL', color }]
  })
}
function rememberChronicleSpaceSelection(id: string) {
  if (typeof window === 'undefined' || !id) return
  const url = new URL(window.location.href)
  url.searchParams.set(chronicleSpaceSelectionKey, id)
  window.history.replaceState(window.history.state, '', url.toString())
}

const excerpt = (value: string | null | undefined, size: number) => { const text = (value || '').trim(); return text.length > size ? text.slice(0, size).trimEnd() + '…' : text }
const dateLabel = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha no indicada'
const kindLabel = (kind: Kind) => kind === 'PERSONAJE' ? 'Personaje jugador' : kind === 'PNJ' ? 'Persona' : kind === 'LUGAR' ? 'Lugar' : kind === 'NOTA' ? 'Anotación' : kind === 'ORGANIZACION' ? 'Organización' : kind === 'ARTEFACTO' ? 'Artefacto' : 'Documento'
function sortArchiveItems<T>(items: readonly T[], mode: ArchiveSort, getName: (item: T) => string, getDate?: (item: T) => string | null | undefined): readonly T[] {
  if (mode === 'DEFAULT') return items
  const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })
  return [...items].sort((left, right) => {
    if (mode === 'RECENT') {
      const rightTime = getDate ? new Date(getDate(right) || 0).getTime() : 0
      const leftTime = getDate ? new Date(getDate(left) || 0).getTime() : 0
      if (rightTime !== leftTime) return rightTime - leftTime
    }
    return collator.compare(getName(left), getName(right))
  })
}

const plainMentionText = (value: string) => value.replace(/@\[([^\]]+)\]\([A-Z_]+:[^\)]+\)/g, '$1')

// CHRONICLE_SPACE_MENTION_LABELS_V1
function renderMentionText(value: string, onOpen: (label: string, targetType: string, targetId: string) => void): ReactNode {
  const pieces: ReactNode[] = []
  const pattern = /@\[([^\]]+)\]\(([A-Z_]+):([^\)]+)\)/g
  let cursor = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) pieces.push(value.slice(cursor, match.index))
    const label = match[1]
    const targetType = match[2]
    const targetId = match[3]
    pieces.push(<button className="mention-link" key={targetType + '-' + targetId + '-' + match.index} type="button" onClick={() => onOpen(label, targetType, targetId)}>{label}</button>)
    cursor = pattern.lastIndex
  }
  if (cursor < value.length) pieces.push(value.slice(cursor))
  return pieces
}


function displayChronicleMentions(value: string): string {
  return value.replace(/@\[([^\]]+)\]\([A-Z_]+:[^\)]+\)/g, '@$1')
}

function chronicleRawOffsetForVisible(value: string, offset: number, bias: 'start' | 'end'): number {
  const pattern = /@\[([^\]]+)\]\([A-Z_]+:[^\)]+\)/g
  let rawCursor = 0
  let visibleCursor = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(value)) !== null) {
    const plainLength = match.index - rawCursor
    if (offset <= visibleCursor + plainLength) return rawCursor + Math.max(0, offset - visibleCursor)
    visibleCursor += plainLength
    const mentionVisibleLength = match[1].length + 1
    if (offset < visibleCursor + mentionVisibleLength) return bias === 'start' ? match.index : pattern.lastIndex
    visibleCursor += mentionVisibleLength
    rawCursor = pattern.lastIndex
  }
  return rawCursor + Math.max(0, offset - visibleCursor)
}

function applyChronicleMentionEdit(rawValue: string, nextVisibleValue: string): string {
  const currentVisibleValue = displayChronicleMentions(rawValue)
  let prefix = 0
  while (prefix < currentVisibleValue.length && prefix < nextVisibleValue.length && currentVisibleValue[prefix] === nextVisibleValue[prefix]) prefix += 1
  let suffix = 0
  while (
    suffix < currentVisibleValue.length - prefix &&
    suffix < nextVisibleValue.length - prefix &&
    currentVisibleValue[currentVisibleValue.length - 1 - suffix] === nextVisibleValue[nextVisibleValue.length - 1 - suffix]
  ) suffix += 1
  const oldVisibleEnd = currentVisibleValue.length - suffix
  const insertedVisibleValue = nextVisibleValue.slice(prefix, nextVisibleValue.length - suffix)
  const rawStart = chronicleRawOffsetForVisible(rawValue, prefix, 'start')
  const rawEnd = chronicleRawOffsetForVisible(rawValue, oldVisibleEnd, 'end')
  return rawValue.slice(0, rawStart) + insertedVisibleValue + rawValue.slice(rawEnd)
}

// CHRONICLE_SPACE_NOTE_EDIT_MENTION_LABELS_V1
// CHRONICLE_SPACE_ACTIVE_SELECTION_PERSISTENCE_V1
// CHRONICLE_SPACE_ACTIVE_SECTION_PERSISTENCE_V1
function chronicleNoteMentionedImageKeys(note: NotebookNote): Set<string> {
  const keys = new Set(note.references.map((reference) => reference.targetType + ':' + reference.targetId))
  const pattern = /@\[[^\]]+\]\(([^:]+):([^\)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(note.content)) !== null) keys.add(match[1]!.toUpperCase() + ':' + match[2]!)
  return keys
}

function chronicleNoteContextImage(note: NotebookNote, candidates: readonly { readonly targetType: string; readonly targetId: string; readonly name: string; readonly imageUrl: string }[]) {
  const byKey = new Map(candidates.map((candidate) => [candidate.targetType + ':' + candidate.targetId, candidate]))
  const preferredKey = note.contextImageTargetType && note.contextImageTargetId ? note.contextImageTargetType + ':' + note.contextImageTargetId : note.contextLocationId ? 'LOCATION:' + note.contextLocationId : ''
  if (preferredKey && byKey.has(preferredKey)) return byKey.get(preferredKey) ?? null
  const mentioned = chronicleNoteMentionedImageKeys(note)
  return candidates.find((candidate) => mentioned.has(candidate.targetType + ':' + candidate.targetId)) ?? null
}

export function ChronicleSpacePrototype() {
  const authenticatedUser = useAuthenticatedUser()
  const canEditDetailImages = authenticatedUser.roles.some((role) => { const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : ''; return normalizedRole === 'admin' || normalizedRole === 'narrator' })
  const [chronicles, setChronicles] = useState<readonly ChronicleApiSnapshot[]>([])
  const [chronicleId, setChronicleId] = useState(() => new URLSearchParams(window.location.search).get('chronicleId') || '')
  const [context, setContext] = useState<NotebookContext | null>(null)
  const [notes, setNotes] = useState<readonly NotebookNote[]>([])
  const [sessions, setSessions] = useState<readonly ChronicleSessionApiSnapshot[]>([])
  const [section, setSection] = useState<Section>(() => readChronicleSpaceSection())
  function changeChronicleSpaceSection(next: Section) {
    rememberChronicleSpaceSection(next)
    setSection(next)
  }
  const [selected, setSelected] = useState<Card | null>(null)
  const [preview, setPreview] = useState<NotebookResourcePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState('')
  const [boardPositions, setBoardPositions] = useState<Readonly<Record<string, BoardPosition>>>({})
  const [boardConnections, setBoardConnections] = useState<readonly BoardConnection[]>([])
  const [boardHydratedFor, setBoardHydratedFor] = useState<string | null>(null)
  const [draggingBoardId, setDraggingBoardId] = useState<string | null>(null)
  // CHRONICLE_SPACE_BOARD_SMOOTH_DRAG_CONNECTIONS_V1 — conserva el arrastre en píxeles aunque cambie la altura.
  const boardDragSnapshot = useRef<BoardDragSnapshot | null>(null)
  const [boardHeightFloor, setBoardHeightFloor] = useState(0)
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(null)
  const [pendingConnection, setPendingConnection] = useState<{ readonly fromId: string; readonly toId: string } | null>(null)
  const [connectionLabel, setConnectionLabel] = useState('')
  const [pendingConnectionType, setPendingConnectionType] = useState<BoardConnectionType>('VISUAL')
  const [pendingConnectionArrow, setPendingConnectionArrow] = useState(true)
  const [pendingConnectionColor, setPendingConnectionColor] = useState(boardConnectionColor('VISUAL'))
  const [pendingConnectionScope, setPendingConnectionScope] = useState<BoardConnectionScope>('PERSONAL')
  // CHRONICLE_SPACE_BOARD_CONNECTION_EDITOR_V1 — una relación existente puede editarse sin recrearla.
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null)
  const [connectionEditorMessage, setConnectionEditorMessage] = useState('')
  // CHRONICLE_SPACE_BOARD_CONNECTION_FILTERS_V1 — el filtro afecta al listado, no a las relaciones dibujadas en la pizarra.
  const [connectionListFilter, setConnectionListFilter] = useState<'ALL' | 'VISUAL' | 'KNOWN' | 'SUSPICION'>('ALL')
  const [connectionListQuery, setConnectionListQuery] = useState('')
  // CHRONICLE_SPACE_BOARD_CONNECTION_FOCUS_V1 — identifica una relación para guiar la lectura de la pizarra.
  const [focusedConnectionId, setFocusedConnectionId] = useState<string | null>(null)
  // CHRONICLE_SPACE_BOARD_CARD_FOCUS_V1 — una tarjeta puede convertirse en el centro de lectura de sus relaciones.
  const [focusedBoardCardId, setFocusedBoardCardId] = useState<string | null>(null)
  // CHRONICLE_SPACE_BOARD_NAVIGATION_V1 — controles de escala sin modificar posiciones ni relaciones.
  const [boardZoom, setBoardZoom] = useState(1)
  const [boardSaving, setBoardSaving] = useState(false)
  const [boardRevision, setBoardRevision] = useState(0)
  const boardRevisionRef = useRef(0)
  const boardDirtyRef = useRef(false)
  const boardChangeVersionRef = useRef(0)
  const [boardUpdateAvailable, setBoardUpdateAvailable] = useState(false)
  const [boardFilter, setBoardFilter] = useState<BoardFilter>('ALL')
  // CHRONICLE_SPACE_BOARD_QUICK_SEARCH_V1
  const [boardQuickQuery, setBoardQuickQuery] = useState('')
  // CHRONICLE_SPACE_BOARD_PERSONAL_PRESETS_V2
  const [boardPresets, setBoardPresets] = useState<readonly BoardPreset[]>([])
  const [boardPresetName, setBoardPresetName] = useState('')
  const [boardPresetOpen, setBoardPresetOpen] = useState(false)
  const [boardPresetHydratedFor, setBoardPresetHydratedFor] = useState<string | null>(null)
  // CHRONICLE_SPACE_BOARD_PERSONAL_PRESETS_IMPORT_EXPORT_V1
  const [boardPresetImportError, setBoardPresetImportError] = useState<string | null>(null)
  // CHRONICLE_SPACE_BOARD_COMPACT_CARDS_V1
  // CHRONICLE_SPACE_BOARD_PREVIEW_MENTIONS_V1
  // CHRONICLE_SPACE_BOARD_COMPACT_ACTIONS_V1
  const [boardPreviewCard, setBoardPreviewCard] = useState<Card | null>(null)
  // CHRONICLE_SPACE_TIMELINE_SESSION_DETAIL_V1
// CHRONICLE_SPACE_TIMELINE_GLOBAL_OVERLAYS_V1
// CHRONICLE_SPACE_TIMELINE_FILTERS_V1
  // CHRONICLE_SPACE_ARCHIVE_FILTERS_V1
  // CHRONICLE_SPACE_ARCHIVE_EXPAND_V1
  // CHRONICLE_SPACE_ARCHIVE_RESOURCE_KINDS_V1
  // CHRONICLE_SPACE_ARCHIVE_SORT_V1
// CHRONICLE_SPACE_GLOBAL_PREVIEW_MENTIONS_V1
  const [timelineSession, setTimelineSession] = useState<ChronicleSessionApiSnapshot | null>(null)
  // CHRONICLE_SPACE_DETAIL_VISUALS_V1
  // CHRONICLE_SPACE_SESSION_DETAIL_VISUAL_V1
  const [timelineSessionPreview, setTimelineSessionPreview] = useState<NotebookResourcePreview | null>(null)
  const [detailImageEditing, setDetailImageEditing] = useState(false)
  const [detailImageBusy, setDetailImageBusy] = useState(false)
  const [, setDetailImageRevision] = useState(() => Date.now())
  const [detailImageMessage, setDetailImageMessage] = useState('')

  function detailImageUrl(assetType: string, assetId: string) {
    return '/api/chronicles/' + chronicleId + '/assets/' + assetType + '/' + assetId + '/image'
  }

  async function uploadDetailImage(assetType: string, assetId: string, file: File) {
    if (!chronicleId) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setDetailImageMessage('Usa PNG, JPG o WEBP.'); return }
    if (file.size > 5 * 1024 * 1024) { setDetailImageMessage('La imagen no puede superar 5 MB.'); return }
    setDetailImageBusy(true)
    setDetailImageMessage('Guardando imagen…')
    try {
      const response = await fetch(detailImageUrl(assetType, assetId), { method: 'PUT', credentials: 'include', headers: { 'content-type': file.type }, body: file })
      if (!response.ok) throw new Error('upload-failed')
      const revision = Date.now()
      setDetailImageRevision(revision)
      const url = detailImageUrl(assetType, assetId) + '?v=' + revision
      if (assetType === 'SESSION') setTimelineSessionPreview((current) => current ? { ...current, imageUrl: url } : current)
      else setPreview((current) => current ? { ...current, imageUrl: url } : current)
      setDetailImageMessage('Imagen actualizada.')
    } catch {
      setDetailImageMessage('No se pudo guardar. Sólo administradores y narradores pueden modificar imágenes.')
    } finally {
      setDetailImageBusy(false)
    }
  }

  async function removeDetailImage(assetType: string, assetId: string) {
    if (!chronicleId) return
    setDetailImageBusy(true)
    setDetailImageMessage('Quitando imagen…')
    try {
      const response = await fetch(detailImageUrl(assetType, assetId), { method: 'DELETE', credentials: 'include' })
      if (!response.ok) throw new Error('remove-failed')
      setDetailImageRevision(Date.now())
      if (assetType === 'SESSION') setTimelineSessionPreview((current) => current ? { ...current, imageUrl: null } : current)
      else setPreview((current) => current ? { ...current, imageUrl: null } : current)
      setDetailImageMessage('Imagen retirada.')
    } catch {
      setDetailImageMessage('No se pudo retirar. Sólo administradores y narradores pueden modificar imágenes.')
    } finally {
      setDetailImageBusy(false)
    }
  }
  // CHRONICLE_SPACE_TIMELINE_FILTERS_V1
  const [timelineSearch, setTimelineSearch] = useState('')
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('ALL')
  // CHRONICLE_SPACE_ARCHIVE_FILTERS_V1
  const [archiveSearch, setArchiveSearch] = useState('')
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('ALL')
  // CHRONICLE_SPACE_ARCHIVE_SORT_V1
  const [archiveSort, setArchiveSort] = useState<ArchiveSort>('DEFAULT')
  // CHRONICLE_SPACE_ARCHIVE_EXPAND_V1
  const [archiveExpandedGroups, setArchiveExpandedGroups] = useState<readonly ArchiveFilter[]>([])
  const toggleArchiveGroup = (group: ArchiveFilter) => setArchiveExpandedGroups((current) => current.includes(group) ? current.filter((item) => item !== group) : [...current, group])
  const archiveQuery = archiveSearch.trim().toLocaleLowerCase()
  const archiveTextMatches = (values: readonly (string | null | undefined)[]) => !archiveQuery || values.filter(Boolean).join(' ').toLocaleLowerCase().includes(archiveQuery)
  const archiveNotes = useMemo(() => sortArchiveItems(archiveFilter !== 'ALL' && archiveFilter !== 'NOTES' ? [] : notes.filter((note) => archiveTextMatches([note.title, note.content, note.visibility])), archiveSort, (item) => item.title, (item) => item.updatedAt), [archiveFilter, archiveQuery, archiveSort, notes])
  const archivePeople = useMemo(() => sortArchiveItems(archiveFilter !== 'ALL' && archiveFilter !== 'PEOPLE' ? [] : (context?.npcs || []).filter((item) => archiveTextMatches([item.name, item.category, item.narrativeRole, item.description])), archiveSort, (item) => item.name), [archiveFilter, archiveQuery, archiveSort, context])
  const archivePlaces = useMemo(() => sortArchiveItems(archiveFilter !== 'ALL' && archiveFilter !== 'PLACES' ? [] : (context?.locations || []).filter((item) => archiveTextMatches([item.name, item.category, item.description])), archiveSort, (item) => item.name), [archiveFilter, archiveQuery, archiveSort, context])
  // CHRONICLE_SPACE_ARCHIVE_RESOURCE_KINDS_V1
  const archiveResources = context?.resources || []
  const archiveOrganizations = useMemo(() => sortArchiveItems(archiveFilter !== 'ALL' && archiveFilter !== 'ORGANIZATIONS' ? [] : archiveResources.filter((item) => item.kind === 'ORGANIZATION' && archiveTextMatches([item.name, item.summary])), archiveSort, (item) => item.name), [archiveFilter, archiveQuery, archiveResources, archiveSort])
  const archiveArtifacts = useMemo(() => sortArchiveItems(archiveFilter !== 'ALL' && archiveFilter !== 'ARTIFACTS' ? [] : archiveResources.filter((item) => item.kind === 'ARTIFACT' && archiveTextMatches([item.name, item.summary])), archiveSort, (item) => item.name), [archiveFilter, archiveQuery, archiveResources, archiveSort])
  const archiveDocuments = useMemo(() => sortArchiveItems(archiveFilter !== 'ALL' && archiveFilter !== 'DOCUMENTS' ? [] : archiveResources.filter((item) => item.kind === 'DOCUMENT' && archiveTextMatches([item.name, item.summary])), archiveSort, (item) => item.name), [archiveFilter, archiveQuery, archiveResources, archiveSort])
  const archiveVisibleCount = archiveNotes.length + archivePeople.length + archivePlaces.length + archiveOrganizations.length + archiveArtifacts.length + archiveDocuments.length
  const archiveTotalCount = notes.length + (context?.npcs?.length || 0) + (context?.locations?.length || 0) + archiveResources.length
  const archiveNotesVisible = archiveExpandedGroups.includes('NOTES') ? archiveNotes : archiveNotes.slice(0, 8)
  const archivePeopleVisible = archiveExpandedGroups.includes('PEOPLE') ? archivePeople : archivePeople.slice(0, 8)
  const archivePlacesVisible = archiveExpandedGroups.includes('PLACES') ? archivePlaces : archivePlaces.slice(0, 8)
  const archiveOrganizationsVisible = archiveExpandedGroups.includes('ORGANIZATIONS') ? archiveOrganizations : archiveOrganizations.slice(0, 8)
  const archiveArtifactsVisible = archiveExpandedGroups.includes('ARTIFACTS') ? archiveArtifacts : archiveArtifacts.slice(0, 8)
  const archiveDocumentsVisible = archiveExpandedGroups.includes('DOCUMENTS') ? archiveDocuments : archiveDocuments.slice(0, 8)
  const filteredTimelineSessions = useMemo(() => {
    const query = timelineSearch.trim().toLocaleLowerCase()
    return sessions.filter((session) => {
      const matchesSearch = !query || [session.title, session.summary].filter(Boolean).join(' ').toLocaleLowerCase().includes(query)
      const hasNotes = notes.some((note) => note.sessionId === session.id)
      const matchesFilter = timelineFilter === 'ALL' || (timelineFilter === 'PREPARATION' && session.status === 'preparation') || (timelineFilter === 'COMPLETED' && session.status === 'completed') || (timelineFilter === 'WITH_NOTES' && hasNotes) || (timelineFilter === 'WITHOUT_NOTES' && !hasNotes)
      return matchesSearch && matchesFilter
    })
  }, [notes, sessions, timelineFilter, timelineSearch])
  // CHRONICLE_SPACE_BOARD_FOCUS_V1
  const [boardFocusCard, setBoardFocusCard] = useState<Card | null>(null)
  const [highlightedBoardCardId, setHighlightedBoardCardId] = useState<string | null>(null)
  // CHRONICLE_SPACE_BOARD_PERSONAL_VISIBILITY_V1
  // CHRONICLE_SPACE_BOARD_SELECTION_FILTERS_V1
  // CHRONICLE_SPACE_BOARD_NOTE_AUTHORS_V1
  // CHRONICLE_SPACE_BOARD_PERSONAL_PRESETS_V1
  // CHRONICLE_SPACE_BOARD_PERSONAL_CONNECTIONS_V1
  const [boardManageOpen, setBoardManageOpen] = useState(false)
  // CHRONICLE_SPACE_BOARD_SELECTION_FILTERS_V1
  const [boardSelectionQuery, setBoardSelectionQuery] = useState('')
  const [boardSelectionKind, setBoardSelectionKind] = useState<'ALL' | Kind>('ALL')
  const [boardSelectionStatus, setBoardSelectionStatus] = useState<'ALL' | 'VISIBLE' | 'HIDDEN'>('ALL')
  const [boardSelectionAuthor, setBoardSelectionAuthor] = useState('ALL')
  const [boardSelectionSession, setBoardSelectionSession] = useState('ALL')
  // CHRONICLE_SPACE_BOARD_PERSONAL_PRESETS_V1
  const [boardViewMode, setBoardViewMode] = useState<'PERSONAL' | 'ALL'>('PERSONAL')
  // CHRONICLE_SPACE_BOARD_PERSONAL_LAYOUT_V1
  const [personalBoardPositions, setPersonalBoardPositions] = useState<Record<string, BoardPosition>>({})
  const [personalBoardConnections, setPersonalBoardConnections] = useState<readonly BoardConnection[]>([])
  const [hiddenBoardCardIds, setHiddenBoardCardIds] = useState<ReadonlySet<string>>(new Set())
  const [boardVisibilityHydratedFor, setBoardVisibilityHydratedFor] = useState<string | null>(null)
  const skipNextBoardSaveRef = useRef(false)

  const [noteComposerOpen, setNoteComposerOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteMentionSearch, setNoteMentionSearch] = useState('')
  const [noteMentionCaret, setNoteMentionCaret] = useState<number | null>(null)
  const [noteMentionMenuOpen, setNoteMentionMenuOpen] = useState(false)
  const [noteVisibility, setNoteVisibility] = useState<'PRIVATE' | 'CHRONICLE'>('PRIVATE')
  const [noteSessionId, setNoteSessionId] = useState('')
  const [noteContextImageTarget, setNoteContextImageTarget] = useState('')
  const [noteReferenceTarget, setNoteReferenceTarget] = useState<{ readonly targetType: string; readonly targetId: string; readonly label: string } | null>(null)
  const [savingNote, setSavingNote] = useState(false)
  const [noteEditingId, setNoteEditingId] = useState<string | null>(null)


  useEffect(() => {
 let cancelled = false; void gateway.list().then((items) => { if (!cancelled) { const requested = new URLSearchParams(window.location.search).get('chronicleId'); setChronicles(items); setChronicleId(requested && items.some((item) => item.id === requested) ? requested : items[0]?.id || '') } }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las crónicas.') }); return () => { cancelled = true } }, [])
  useEffect(() => { let cancelled = false; async function load() { if (!chronicleId) { setLoading(false); return }; setLoading(true); setError(''); try { const [nextContext, nextNotes, nextSessions] = await Promise.all([notebookApi.context(chronicleId), notebookApi.list(chronicleId), gateway.sessions(chronicleId, { limit: 50, offset: 0 })]); if (!cancelled) { setContext(nextContext); setNotes(nextNotes.items); setSessions(nextSessions.items) } } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la crónica.') } finally { if (!cancelled) setLoading(false) } }; void load(); return () => { cancelled = true } }, [chronicleId])
  function closeComposer() {
    setNoteComposerOpen(false)
    setNoteMentionMenuOpen(false)
    setNoteTitle('')
    setNoteContent('')
    setNoteVisibility('PRIVATE')
    setNoteSessionId('')
    setNoteContextImageTarget('')
    setNoteReferenceTarget(null)
    setNoteEditingId(null)
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!chronicleId || !noteTitle.trim() || !noteContent.trim()) return
    const selectedContextImage = noteContextImageOptions.find((option) => option.id === noteContextImageTarget) ?? null
    const contextImageTargetTypeToSave: string | null = selectedContextImage?.targetType ?? null
    const contextImageTargetIdToSave: string | null = selectedContextImage?.targetId ?? null
    const contextLocationIdToSave: string | null = selectedContextImage?.targetType === 'LOCATION' ? selectedContextImage.targetId : null
    setSavingNote(true)
    setError('')
    try {
      if (noteEditingId) {
        const updated = await notebookApi.update(chronicleId, noteEditingId, { title: noteTitle.trim(), content: noteContent.trim(), visibility: noteVisibility, sessionId: noteSessionId || null, contextLocationId: contextLocationIdToSave, contextImageTargetType: contextImageTargetTypeToSave, contextImageTargetId: contextImageTargetIdToSave})
        setNotes((current) => current.map((note) => note.id === updated.id ? updated : note))
      } else {
        const created = await notebookApi.create(chronicleId, { title: noteTitle.trim(), content: noteContent.trim(), visibility: noteVisibility, sessionId: noteSessionId || null, contextLocationId: contextLocationIdToSave, contextImageTargetType: contextImageTargetTypeToSave, contextImageTargetId: contextImageTargetIdToSave, tags: [], references: noteReferenceTarget ? [noteReferenceTarget] : [] })
        setNotes((current) => [created, ...current])
      }
      closeComposer()
      changeChronicleSpaceSection('BOARD')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la nota.')
    } finally {
      setSavingNote(false)
    }
  }

  function openNewNote() {
    setNoteEditingId(null)
    setNoteContextImageTarget('')
    setNoteReferenceTarget(null)
    setNoteTitle('')
    setNoteContent('')
    setNoteVisibility('PRIVATE')
    setNoteSessionId('')
    setError('')
    setNoteComposerOpen(true)
  }

  function openEditNote() {
    if (!selected || selected.kind !== 'NOTA') return
    const noteId = selected.id.startsWith('note-') ? selected.id.slice(5) : ''
    const note = notes.find((item) => item.id === noteId)
    if (!note) return
    setNoteEditingId(note.id)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setNoteVisibility(note.visibility === 'PRIVATE' ? 'PRIVATE' : 'CHRONICLE')
    setNoteSessionId(note.sessionId || '')
    setNoteContextImageTarget(note.contextImageTargetType && note.contextImageTargetId ? note.contextImageTargetType + ':' + note.contextImageTargetId : note.contextLocationId ? 'LOCATION:' + note.contextLocationId : '')
    setSelected(null)
    setError('')
    setNoteComposerOpen(true)
  }

  useEffect(() => {
    let cancelled = false
    setConnectionSourceId(null)
    setPendingConnection(null)
    setFocusedConnectionId(null)
    setFocusedBoardCardId(null)
    setConnectionLabel('')
    setPendingConnectionType('VISUAL')
    setPendingConnectionArrow(true)
    setPendingConnectionColor(boardConnectionColor('VISUAL'))
    setBoardHydratedFor(null)
    if (!chronicleId) { skipNextBoardSaveRef.current = true; boardRevisionRef.current = 0; boardDirtyRef.current = false; setBoardPositions({}); setBoardConnections([]); setBoardRevision(0); setBoardUpdateAvailable(false); return }
    void chronicleSpaceBoardApi.get(chronicleId).then((saved) => {
      if (cancelled) return
      skipNextBoardSaveRef.current = true
      boardRevisionRef.current = saved.revision
      boardDirtyRef.current = false
      setBoardPositions(saved.positions)
      setBoardConnections(saved.connections)
      boardRevisionRef.current = saved.revision
      setBoardRevision(saved.revision)
      setBoardHydratedFor(chronicleId)
    }).catch((cause) => {
      if (cancelled) return
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar la pizarra.')
      setBoardPositions({})
      setBoardConnections([])
    })
    return () => { cancelled = true }
  }, [chronicleId])
  useEffect(() => {
    if (!chronicleId || boardHydratedFor !== chronicleId) return
    if (skipNextBoardSaveRef.current) { skipNextBoardSaveRef.current = false; return }
    const timer = window.setTimeout(() => {
      const savedChangeVersion = boardChangeVersionRef.current
      setBoardSaving(true)
      void chronicleSpaceBoardApi.replace(chronicleId, { revision: boardRevision, positions: boardPositions, connections: boardConnections }).then((saved) => { boardRevisionRef.current = saved.revision; if (boardChangeVersionRef.current === savedChangeVersion) boardDirtyRef.current = false; setBoardRevision(saved.revision) }).catch((cause) => setError(cause instanceof ChronicleSpaceBoardConflictError ? 'Otro usuario ha guardado cambios en la pizarra. Recarga la página para cargar esa versión antes de continuar.' : cause instanceof Error ? cause.message : 'No se pudo guardar la pizarra.')).finally(() => setBoardSaving(false))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [boardHydratedFor, boardConnections, boardPositions, chronicleId])
  // CHRONICLE_SPACE_BOARD_REALTIME_V1
  useEffect(() => {
    if (!chronicleId || boardHydratedFor !== chronicleId) return
    return chronicleSpaceBoardApi.subscribe(chronicleId, (saved) => {
      if (saved.revision <= boardRevisionRef.current) return
      if (boardDirtyRef.current) { setBoardUpdateAvailable(true); return }
      skipNextBoardSaveRef.current = true
      boardRevisionRef.current = saved.revision
      setBoardPositions(saved.positions)
      setBoardConnections(saved.connections)
      setBoardRevision(saved.revision)
      setBoardUpdateAvailable(false)
    })
  }, [boardHydratedFor, chronicleId])
  // CHRONICLE_SPACE_BOARD_PERSONAL_SERVER_V1
  useEffect(() => {
    let cancelled = false
    const readLocalFallback = () => {
      try {
        const viewRaw = window.localStorage.getItem('bloodkeeper-chronicle-space-board-view:' + chronicleId)
        const presetRaw = window.localStorage.getItem('bloodkeeper-chronicle-space-board-presets:' + chronicleId)
        const view = viewRaw ? JSON.parse(viewRaw) as unknown : {}
        const presets = presetRaw ? JSON.parse(presetRaw) as unknown : []
        return { ...(view && typeof view === 'object' && !Array.isArray(view) ? view as Record<string, unknown> : {}), presets: Array.isArray(presets) ? presets : [] }
      } catch { return {} }
    }
    const applyState = (value: unknown) => {
      const state = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
      const hidden = state.hiddenCardIds
      const positions = state.personalPositions
      setHiddenBoardCardIds(new Set(Array.isArray(hidden) ? hidden.filter((item): item is string => typeof item === 'string') : []))
      setPersonalBoardPositions(positions && typeof positions === 'object' && !Array.isArray(positions) ? positions as Record<string, BoardPosition> : {})
      setPersonalBoardConnections(readPersonalBoardConnections(state.personalConnections))
      setBoardSelectionQuery(typeof state.selectionQuery === 'string' ? state.selectionQuery : '')
      setBoardSelectionKind(state.selectionKind === 'PNJ' || state.selectionKind === 'LUGAR' || state.selectionKind === 'NOTA' ? state.selectionKind : 'ALL')
      setBoardSelectionStatus(state.selectionStatus === 'VISIBLE' || state.selectionStatus === 'HIDDEN' ? state.selectionStatus : 'ALL')
      setBoardSelectionAuthor(typeof state.selectionAuthor === 'string' ? state.selectionAuthor : 'ALL')
      setBoardSelectionSession(typeof state.selectionSession === 'string' ? state.selectionSession : 'ALL')
      setBoardViewMode(state.viewMode === 'ALL' ? 'ALL' : 'PERSONAL')
      setBoardFilter(state.boardFilter === 'PNJ' || state.boardFilter === 'LUGAR' || state.boardFilter === 'NOTA' ? state.boardFilter : 'ALL')
      setBoardQuickQuery(typeof state.quickQuery === 'string' ? state.quickQuery : '')
      const presets = state.presets
      setBoardPresets(Array.isArray(presets) ? presets.filter((item): item is BoardPreset => Boolean(item && typeof item === 'object' && typeof (item as Record<string, unknown>).name === 'string')) : [])
    }
    if (!chronicleId) {
      applyState({})
      setBoardVisibilityHydratedFor(null)
      setBoardPresetHydratedFor(null)
      return () => { cancelled = true }
    }
    setBoardVisibilityHydratedFor(null)
    setBoardPresetHydratedFor(null)
    void chronicleSpaceBoardPersonalApi.get(chronicleId).then((saved) => {
      if (cancelled) return
      const remote = saved.state && Object.keys(saved.state).length ? saved.state : readLocalFallback()
      applyState(remote)
      setBoardVisibilityHydratedFor(chronicleId)
      setBoardPresetHydratedFor(chronicleId)
    }).catch((cause) => {
      if (cancelled) return
      applyState(readLocalFallback())
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu vista personal.')
      setBoardVisibilityHydratedFor(chronicleId)
      setBoardPresetHydratedFor(chronicleId)
    })
    return () => { cancelled = true }
  }, [chronicleId])

  useEffect(() => {
    if (!chronicleId || boardVisibilityHydratedFor !== chronicleId || boardPresetHydratedFor !== chronicleId) return
    const timer = window.setTimeout(() => {
      void chronicleSpaceBoardPersonalApi.replace(chronicleId, { hiddenCardIds: [...hiddenBoardCardIds], personalPositions: personalBoardPositions, personalConnections: personalBoardConnections, selectionQuery: boardSelectionQuery, selectionKind: boardSelectionKind, selectionStatus: boardSelectionStatus, selectionAuthor: boardSelectionAuthor, selectionSession: boardSelectionSession, viewMode: boardViewMode, boardFilter, quickQuery: boardQuickQuery, presets: boardPresets }).catch((cause) => setError(cause instanceof Error ? cause.message : 'No se pudo guardar tu vista personal.'))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [boardFilter, boardPresetHydratedFor, boardPresets, boardQuickQuery, boardSelectionAuthor, boardSelectionKind, boardSelectionQuery, boardSelectionSession, boardSelectionStatus, boardViewMode, boardVisibilityHydratedFor, chronicleId, hiddenBoardCardIds, personalBoardConnections, personalBoardPositions])



  useEffect(() => {
    setBoardQuickQuery('')
  }, [chronicleId])




  function noteMentionQuery(value: string, caret = value.length): string | null {
    const safeCaret = Math.max(0, Math.min(caret, value.length))
    const prefix = value.slice(0, safeCaret)
    const match = prefix.match(/(?:^|\s)@([^\s@]*)$/)
    return match ? match[1].toLocaleLowerCase() : null
  }

  function insertChronicleMention(option: { readonly targetType: string; readonly targetId: string; readonly title: string }) {
    const token = '@[' + option.title + '](' + option.targetType + ':' + option.targetId + ')'
    setNoteContent((current) => {
      const visibleCurrent = displayChronicleMentions(current)
      const caret = noteMentionCaret ?? visibleCurrent.length
      const prefix = visibleCurrent.slice(0, caret)
      const suffix = visibleCurrent.slice(caret)
      const match = prefix.match(/(?:^|\s)@([^\s@]*)$/)
      if (!match) return current
      const mentionStart = prefix.length - match[1].length - 1
      const separator = suffix && /^\s/.test(suffix) ? '' : ' '
      const nextVisible = prefix.slice(0, mentionStart) + token + separator + suffix
      setNoteMentionCaret(mentionStart + token.length + separator.length)
      return applyChronicleMentionEdit(current, nextVisible)
    })
    setNoteMentionSearch('')
    setNoteMentionMenuOpen(false)
  }

  const noteContextImageOptions = useMemo(() => {
    const mentioned = new Set<string>()
    const pattern = /@\[[^\]]+\]\(([^:]+):([^\)]+)\)/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(noteContent)) !== null) mentioned.add(match[1]!.toUpperCase() + ':' + match[2]!)
    return (context?.imageCandidates || []).filter((candidate) => mentioned.has(candidate.targetType + ':' + candidate.targetId)).map((candidate) => ({ id: candidate.targetType + ':' + candidate.targetId, targetType: candidate.targetType, targetId: candidate.targetId, name: candidate.name }))
  }, [context, noteContent])

  const chronicle = useMemo(() => chronicles.find((item) => item.id === chronicleId), [chronicles, chronicleId])
  const canManageSharedBoard = authenticatedUser.roles.includes('admin') || authenticatedUser.roles.includes('narrator') || chronicle?.narratorId === authenticatedUser.id
  const canCreateBoardConnection = boardViewMode === 'PERSONAL' || canManageSharedBoard
  const activeChronicles = useMemo(() => chronicles.filter((item) => item.status !== 'archived'), [chronicles])
  const archivedChronicles = useMemo(() => chronicles.filter((item) => item.status === 'archived'), [chronicles])
  const cards = useMemo<readonly Card[]>(() => { const people = (context?.npcs || []).map((item) => ({ id: 'npc-' + item.id, kind: 'PNJ' as const, title: item.name, meta: item.category || item.narrativeRole || 'Persona', description: item.description || 'Sin descripción disponible.', targetType: 'NPC', targetId: item.id })); const places = (context?.locations || []).map((item) => ({ id: 'loc-' + item.id, kind: 'LUGAR' as const, title: item.name, meta: item.category || 'Lugar', description: item.description || 'Sin descripción disponible.', targetType: 'LOCATION', targetId: item.id })); const annotations = notes.map((item) => ({ id: 'note-' + item.id, kind: 'NOTA' as const, title: item.title, meta: item.visibility === 'PRIVATE' ? 'Privada' : 'Compartida', author: item.author.displayName || item.author.username, description: item.content || 'Anotación vacía.', sessionId: item.sessionId })); return [...people, ...places, ...annotations] }, [context, notes])
  const chronicleMentionOptions = useMemo(() => {
    const boardOptions = cards
      .filter((card) => Boolean(card.targetType && card.targetId))
      .map((card) => ({ targetType: card.targetType as string, targetId: card.targetId as string, title: card.title, kind: card.kind, type: card.targetType as string, id: card.targetId as string, label: card.title }))
    const characterOptions = (context?.characters || [])
      .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
      .map((item) => ({ targetType: 'CHARACTER', targetId: item.id, title: item.name, kind: 'PERSONAJE', type: 'CHARACTER', id: item.id, label: item.name }))
    const peopleOptions = (context?.npcs || [])
      .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
      .map((item) => ({ targetType: 'NPC', targetId: item.id, title: item.name, kind: 'PNJ', type: 'NPC', id: item.id, label: item.name }))
    const placeOptions = (context?.locations || [])
      .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
      .map((item) => ({ targetType: 'LOCATION', targetId: item.id, title: item.name, kind: 'LUGAR', type: 'LOCATION', id: item.id, label: item.name }))
    const archiveOptions = (context?.resources || [])
      .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string' && (noteVisibility === 'PRIVATE' || item.visibility === 'chronicle_participants') && (item.kind === 'ORGANIZATION' || item.kind === 'ARTIFACT' || item.kind === 'DOCUMENT'))
      .map((item) => ({
        targetType: item.kind,
        targetId: item.id,
        title: item.name,
        kind: item.kind === 'ORGANIZATION' ? 'ORGANIZACION' : item.kind === 'ARTIFACT' ? 'ARTEFACTO' : 'DOCUMENTO',
        type: item.kind,
        id: item.id,
        label: item.name,
      }))
    const merged = [...boardOptions, ...characterOptions, ...peopleOptions, ...placeOptions, ...archiveOptions]
    return merged.filter((option, index) => merged.findIndex((candidate) => candidate.targetType === option.targetType && candidate.targetId === option.targetId) === index)
  }, [cards, context, noteVisibility])
  const filteredChronicleMentionOptions = useMemo(() => {
    const query = noteMentionSearch.trim().toLocaleLowerCase('es-ES')
    return chronicleMentionOptions
      .filter((option) => String(option.title ?? option.label ?? '').toLocaleLowerCase('es-ES').includes(query))
      .slice(0, 12)
  }, [chronicleMentionOptions, noteMentionSearch])

  const visibleCards = useMemo(() => {
    const filtered = boardFilter === 'ALL' ? cards : cards.filter((card) => card.kind === boardFilter)
    const query = boardQuickQuery.trim().toLocaleLowerCase()
    const searched = query ? filtered.filter((card) => (card.title + ' ' + card.meta + ' ' + card.description).toLocaleLowerCase().includes(query)) : filtered
    return boardViewMode === 'ALL' ? searched : searched.filter((card) => !hiddenBoardCardIds.has(card.id))
  }, [boardFilter, boardQuickQuery, boardViewMode, cards, hiddenBoardCardIds])
  // CHRONICLE_SPACE_BOARD_LAYOUT_STABILITY_V1 — cambiar la crónica o la vista reinicia solo el tamaño mínimo.
  const boardLayoutResetKey = visibleCards.map((card) => card.id).join('|')
  useEffect(() => {
    setBoardHeightFloor(0)
  }, [boardLayoutResetKey, boardViewMode, chronicleId])
  // CHRONICLE_SPACE_BOARD_FREE_OVERLAP_V2 — la pizarra crece sin recolocar las tarjetas existentes.
  const boardHeight = useMemo(() => {
    const rows = Math.max(1, Math.ceil(visibleCards.length / 4))
    const layoutHeight = Math.max(BOARD_POSITION_HEIGHT, rows * 210 + 40)
    const maxStoredY = visibleCards.reduce((highest, card) => {
      const stored = (boardViewMode === 'PERSONAL' ? personalBoardPositions[card.id] || boardPositions[card.id] : boardPositions[card.id])?.y
      return typeof stored === 'number' && Number.isFinite(stored) ? Math.max(highest, stored) : highest
    }, 0)
    const heightForStoredPosition = maxStoredY > 0 ? ((maxStoredY / 100) * BOARD_POSITION_HEIGHT + 160) : 0
    return Math.ceil(Math.max(layoutHeight, heightForStoredPosition, boardHeightFloor))
  }, [boardHeightFloor, boardPositions, boardViewMode, personalBoardPositions, visibleCards])
  // CHRONICLE_SPACE_BOARD_CONNECTION_SCOPES_V1 — cada jugador conserva sus teorías; la capa compartida contiene las relaciones oficiales.
  const visibleBoardConnections = useMemo(() => {
    const visibleIds = new Set(visibleCards.map((card) => card.id))
    const shared = boardConnections.map((connection): ScopedBoardConnection => ({ ...connection, scope: 'SHARED' }))
    const personal = personalBoardConnections.map((connection): ScopedBoardConnection => ({ ...connection, scope: 'PERSONAL' }))
    const available = boardViewMode === 'PERSONAL' ? [...shared, ...personal] : shared
    return available.filter((connection) => visibleIds.has(connection.fromId) && visibleIds.has(connection.toId))
  }, [boardConnections, boardViewMode, personalBoardConnections, visibleCards])
  const filteredBoardConnections = useMemo(() => {
    const query = connectionListQuery.trim().toLocaleLowerCase()
    return visibleBoardConnections.filter((connection) => {
      const typeMatches = connectionListFilter === 'ALL' || connection.type === connectionListFilter
      if (!typeMatches) return false
      if (!query) return true
      const fromTitle = cards.find((card) => card.id === connection.fromId)?.title || ''
      const toTitle = cards.find((card) => card.id === connection.toId)?.title || ''
      return [fromTitle, toTitle, connection.label].some((value) => value.toLocaleLowerCase().includes(query))
    })
  }, [cards, connectionListFilter, connectionListQuery, visibleBoardConnections])



  function markBoardDirty() { boardChangeVersionRef.current += 1; boardDirtyRef.current = true }
  // CHRONICLE_SPACE_BOARD_PRIVATE_LAYOUT_V1
  // CHRONICLE_SPACE_BOARD_RESPONSIVE_V1
  // CHRONICLE_SPACE_BOARD_BOUNDS_V2
  function defaultBoardPosition(index: number): BoardPosition {
    const rows = Math.max(1, Math.ceil(cards.length / 4))
    const boardHeight = Math.max(760, rows * 210 + 40)
    const top = 10 + Math.floor(index / 4) * 145
    return { x: 4 + (index % 4) * 24, y: (top / boardHeight) * 100 }
  }
  // CHRONICLE_SPACE_BOARD_CONNECTION_GEOMETRY_V1 — las líneas terminan en el borde de cada tarjeta.
  // CHRONICLE_SPACE_BOARD_SMOOTH_DRAG_CONNECTIONS_V1 — las líneas usan el tamaño real aproximado de la tarjeta.
  function boardConnectionEndpoints(from: BoardPosition, to: BoardPosition): { readonly from: BoardPosition; readonly to: BoardPosition } {
    const cardWidth = typeof window !== 'undefined' && window.innerWidth <= 900 ? 29 : 18.25
    const cardHeight = Math.max(12, Math.min(24, (116 / Math.max(760, boardHeight)) * 100))
    return { from: { x: from.x + cardWidth / 2, y: from.y + cardHeight / 2 }, to: { x: to.x + cardWidth / 2, y: to.y + cardHeight / 2 } }
  }
  function boardConnectionArrowEndpoints(from: BoardPosition, to: BoardPosition): { readonly from: BoardPosition; readonly to: BoardPosition } {
    const cardWidth = typeof window !== 'undefined' && window.innerWidth <= 900 ? 29 : 18.25
    const cardHeight = Math.max(12, Math.min(24, (116 / Math.max(760, boardHeight)) * 100))
    const fromCenter = { x: from.x + cardWidth / 2, y: from.y + cardHeight / 2 }
    const toCenter = { x: to.x + cardWidth / 2, y: to.y + cardHeight / 2 }
    const dx = toCenter.x - fromCenter.x
    const dy = toCenter.y - fromCenter.y
    const distance = Math.max(0.001, Math.hypot(dx, dy))
    const edgeScale = 0.995 / Math.max(Math.abs(dx) / (cardWidth / 2), Math.abs(dy) / (cardHeight / 2), 0.001)
    const edge = { x: toCenter.x - dx * edgeScale, y: toCenter.y - dy * edgeScale }
    const arrowGap = 1.5
    return { from: { x: edge.x - (dx / distance) * arrowGap, y: edge.y - (dy / distance) * arrowGap }, to: edge }
  }
  function boardPosition(cardId: string, index: number): BoardPosition {
    const saved = boardViewMode === 'PERSONAL' ? personalBoardPositions[cardId] || boardPositions[cardId] : boardPositions[cardId]
    if (saved) return { x: Math.max(2, Math.min(76, saved.x)), y: Math.max(4, saved.y) }
    return defaultBoardPosition(index)
  }

  function boardConnectionPosition(position: BoardPosition): BoardPosition {
    return { x: position.x, y: (position.y / 100 * BOARD_POSITION_HEIGHT / Math.max(1, boardHeight)) * 100 }
  }

  function beginBoardDrag(event: ReactPointerEvent<HTMLElement>, cardId: string) {
    if ((event.target as HTMLElement).closest('button')) return
    if (boardViewMode === 'ALL' && !canManageSharedBoard) return
    const board = event.currentTarget.parentElement
    if (!board) return
    const boardRect = board.getBoundingClientRect()
    const cardRect = event.currentTarget.getBoundingClientRect()
    if (!boardRect.width || !boardRect.height) return
    event.currentTarget.setPointerCapture(event.pointerId)
    boardDragSnapshot.current = {
      cardId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      leftPx: cardRect.left - boardRect.left,
      topPx: cardRect.top - boardRect.top,
      boardWidth: boardRect.width,
      boardHeight: boardRect.height,
      cardWidth: cardRect.width,
      cardHeight: cardRect.height,
    }
    setDraggingBoardId(cardId)
  }
  function moveBoardCard(event: ReactPointerEvent<HTMLElement>, cardId: string) {
    const snapshot = boardDragSnapshot.current
    if (!snapshot || snapshot.cardId !== cardId || draggingBoardId !== cardId) return
    const board = event.currentTarget.parentElement
    if (!board) return
    const boardRect = board.getBoundingClientRect()
    if (!boardRect.width || !boardRect.height) return
    const leftPx = snapshot.leftPx + (event.clientX - snapshot.pointerX)
    const topPx = Math.max(8, snapshot.topPx + (event.clientY - snapshot.pointerY))
    const nextBoardHeight = Math.max(snapshot.boardHeight, topPx + snapshot.cardHeight + 32)
    const nextLeftPx = Math.max(8, Math.min(boardRect.width - snapshot.cardWidth - 8, leftPx))
    const nextPosition = {
      x: (nextLeftPx / boardRect.width) * 100,
      y: (topPx / BOARD_POSITION_HEIGHT) * 100,
    }
    if (nextBoardHeight > snapshot.boardHeight + 1) {
      setBoardHeightFloor((current) => Math.max(current, Math.ceil(nextBoardHeight)))
    }
    if (nextBoardHeight > snapshot.boardHeight + 1) {
      setBoardHeightFloor((current) => Math.max(current, Math.ceil(nextBoardHeight)))
    }
    if (boardViewMode === 'PERSONAL') {
      setPersonalBoardPositions((current) => ({ ...current, [cardId]: nextPosition }))
      return
    }
    markBoardDirty()
    setBoardPositions((current) => ({ ...current, [cardId]: nextPosition }))
  }
  function finishBoardDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    boardDragSnapshot.current = null
    setDraggingBoardId(null)
  }
  function startConnection(card: Card) {
    if (boardViewMode === 'ALL' && !canManageSharedBoard) {
      setConnectionEditorMessage('La Vista general contiene relaciones oficiales. Solo el Narrador puede modificarlas.')
      return
    }
    if (!connectionSourceId) { setConnectionSourceId(card.id); setSelected(null); return }
    if (connectionSourceId === card.id) { setConnectionSourceId(null); return }
    setPendingConnection({ fromId: connectionSourceId, toId: card.id })
    setConnectionSourceId(null)
    setConnectionLabel('')
    setPendingConnectionType('VISUAL')
    setPendingConnectionArrow(true)
    setPendingConnectionColor(boardConnectionColor('VISUAL'))
    setPendingConnectionScope(boardViewMode === 'ALL' ? 'SHARED' : 'PERSONAL')
  }
  function resetConnectionEditor() {
    setPendingConnection(null)
    setEditingConnectionId(null)
    setConnectionLabel('')
    setPendingConnectionType('VISUAL')
    setPendingConnectionArrow(true)
    setPendingConnectionColor(boardConnectionColor('VISUAL'))
    setPendingConnectionScope(boardViewMode === 'ALL' ? 'SHARED' : 'PERSONAL')
    setConnectionEditorMessage('')
  }
  function editConnection(connection: ScopedBoardConnection) {
    if (connection.scope === 'SHARED' && !canManageSharedBoard) {
      setConnectionEditorMessage('Esta relación es oficial y solo puede modificarla el Narrador.')
      return
    }
    setConnectionSourceId(null)
    setPendingConnection({ fromId: connection.fromId, toId: connection.toId })
    setEditingConnectionId(connection.id)
    setConnectionLabel(connection.label)
    setPendingConnectionType(connection.type)
    setPendingConnectionArrow(connection.arrow)
    setPendingConnectionColor(connection.color || boardConnectionColor(connection.type))
    setPendingConnectionScope(connection.scope)
    setConnectionEditorMessage('')
  }
  function invertConnectionDirection() {
    if (!pendingConnection) return
    setPendingConnection({ fromId: pendingConnection.toId, toId: pendingConnection.fromId })
  }

  function saveConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pendingConnection) return
    const type = pendingConnectionType
    const label = type === 'VISUAL' ? '' : connectionLabel.trim() || (type === 'KNOWN' ? 'Relación conocida' : 'Teoría o sospecha')
    const color = /^#[0-9a-f]{6}$/i.test(pendingConnectionColor) ? pendingConnectionColor.toLowerCase() : boardConnectionColor(type)
    if (pendingConnectionScope === 'SHARED' && !canManageSharedBoard) {
      setConnectionEditorMessage('La Vista general solo puede modificarla el Narrador.')
      return
    }
    const updateConnections = (current: readonly BoardConnection[]) => {
      const samePair = (item: BoardConnection) => (item.fromId === pendingConnection.fromId && item.toId === pendingConnection.toId) || (item.fromId === pendingConnection.toId && item.toId === pendingConnection.fromId)
      if (editingConnectionId) {
        const next = { id: editingConnectionId, fromId: pendingConnection.fromId, toId: pendingConnection.toId, label, type, arrow: pendingConnectionArrow, color }
        return current.filter((item) => item.id === editingConnectionId || !samePair(item)).map((item) => item.id === editingConnectionId ? next : item)
      }
      if (current.some(samePair)) return current.map((item) => samePair(item) ? { ...item, fromId: pendingConnection.fromId, toId: pendingConnection.toId, label, type, arrow: pendingConnectionArrow, color } : item)
      return [...current, { id: 'connection-' + Date.now(), fromId: pendingConnection.fromId, toId: pendingConnection.toId, label, type, arrow: pendingConnectionArrow, color }]
    }
    if (pendingConnectionScope === 'SHARED') {
      markBoardDirty()
      setBoardConnections(updateConnections)
    } else {
      setPersonalBoardConnections(updateConnections)
    }
    resetConnectionEditor()
  }
  function removeConnection(connection: ScopedBoardConnection) {
    if (connection.scope === 'SHARED') {
      if (!canManageSharedBoard) { setConnectionEditorMessage('Esta relación oficial solo puede retirarla el Narrador.'); return }
      markBoardDirty()
      setBoardConnections((current) => current.filter((item) => item.id !== connection.id))
      return
    }
    setPersonalBoardConnections((current) => current.filter((item) => item.id !== connection.id))
  }

  function openBoardCardPreview(card: Card) { setBoardPreviewCard(card) }
  function getBoardFocusRelated(card: Card) {
    const relatedIds = new Set<string>()
    visibleBoardConnections.forEach((connection) => {
      if (connection.fromId === card.id) relatedIds.add(connection.toId)
      if (connection.toId === card.id) relatedIds.add(connection.fromId)
    })
    return cards.filter((item) => relatedIds.has(item.id))
  }
  function getBoardNoteReferenceTarget(card: Card) {
    if (!card.targetType || !card.targetId || card.kind === 'NOTA') return null
    return { targetType: card.targetType, targetId: card.targetId, label: card.title }
  }

  function getBoardAttachedNotes(card: Card) {
    if (!card.targetType || !card.targetId || card.kind === 'NOTA') return []
    return notes.filter((note) => note.references?.some((reference) => reference.targetType === card.targetType && reference.targetId === card.targetId))
  }


  function openBoardFocus(card: Card) {
    setBoardPreviewCard(null)
    setBoardFocusCard(card)
  }

  function addBoardNoteFor(card: Card) {
    setBoardFocusCard(null)
    setNoteReferenceTarget(getBoardNoteReferenceTarget(card))
    setNoteTitle('Nota sobre ' + card.title)
    setNoteContent('')
    setNoteComposerOpen(true)
    setError('')
  }

  function toggleBoardHighlight(cardId: string) {
    setHighlightedBoardCardId((current) => current === cardId ? null : cardId)
  }

  async function openBoardCardRecord(card: Card) {
    setBoardPreviewCard(null)
    await openCard(card)
  }
  const boardSelectionAuthors = useMemo(() => Array.from(new Set(cards.filter((card) => card.kind === 'NOTA' && card.author).map((card) => card.author as string))).sort((left, right) => left.localeCompare(right, 'es', { sensitivity: 'base' })), [cards])

  const boardSelectionCards = useMemo(() => {
    const query = boardSelectionQuery.trim().toLocaleLowerCase()
    const kindOrder: Record<Kind, number> = { PERSONAJE: 1, PNJ: 1, LUGAR: 2, NOTA: 3, ORGANIZACION: 4, ARTEFACTO: 5, DOCUMENTO: 6 }
    return cards
      .filter((card) => boardSelectionKind === 'ALL' || card.kind === boardSelectionKind)
      .filter((card) => boardSelectionStatus === 'ALL' || (boardSelectionStatus === 'HIDDEN' ? hiddenBoardCardIds.has(card.id) : !hiddenBoardCardIds.has(card.id)))
      .filter((card) => boardSelectionAuthor === 'ALL' || card.author === boardSelectionAuthor)
      .filter((card) => boardSelectionSession === 'ALL' || (card.kind === 'NOTA' && (boardSelectionSession === GENERAL_BOARD_SESSION_FILTER ? !card.sessionId : card.sessionId === boardSelectionSession)))
      .filter((card) => !query || (card.title + ' ' + card.meta).toLocaleLowerCase().includes(query))
      .slice()
      .sort((left, right) => kindOrder[left.kind] - kindOrder[right.kind] || left.title.localeCompare(right.title, 'es', { sensitivity: 'base' }))
  }, [boardSelectionAuthor, boardSelectionKind, boardSelectionQuery, boardSelectionSession, boardSelectionStatus, cards, hiddenBoardCardIds])

  function toggleBoardCard(cardId: string) {
    setHiddenBoardCardIds((current) => {
      const next = new Set(current)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  function exportBoardPresets() {
    if (typeof window === 'undefined' || !chronicleId || !boardPresets.length) return
    const payload = JSON.stringify({ version: 1, chronicleId, presets: boardPresets }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'bloodkeeper-vistas-' + chronicleId + '.json'
    anchor.click()
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0)
  }

  async function importBoardPresets(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as unknown
      const candidate = parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).presets) ? (parsed as Record<string, unknown>).presets : parsed
      const imported = Array.isArray(candidate) ? candidate.filter((item): item is BoardPreset => Boolean(item && typeof item === 'object' && typeof (item as Record<string, unknown>).name === 'string')) : []
      if (!imported.length) throw new Error('El archivo no contiene vistas válidas.')
      setBoardPresets((current) => {
        const merged = new Map<string, BoardPreset>(current.map((item) => [item.name, item]))
        imported.forEach((item) => merged.set(item.name, item))
        return Array.from(merged.values()).slice(-12)
      })
      setBoardPresetImportError(null)
    } catch {
      setBoardPresetImportError('No se pudo importar el archivo de vistas.')
    }
  }

  function saveBoardPreset() {
    if (boardViewMode !== 'PERSONAL') return
    const fallbackName = 'Vista ' + String(boardPresets.length + 1)
    const name = boardPresetName.trim() || fallbackName
    const preset: BoardPreset = { name, hiddenCardIds: [...hiddenBoardCardIds], personalPositions: personalBoardPositions, boardFilter, quickQuery: boardQuickQuery, selectionQuery: boardSelectionQuery, selectionKind: boardSelectionKind, selectionStatus: boardSelectionStatus, selectionAuthor: boardSelectionAuthor, selectionSession: boardSelectionSession }
    setBoardPresets((current) => [...current.filter((item) => item.name !== name), preset].slice(-12))
    setBoardPresetName('')
    setBoardPresetOpen(false)
  }

  function applyBoardPreset(preset: BoardPreset) {
    setBoardViewMode('PERSONAL')
    setHiddenBoardCardIds(new Set(preset.hiddenCardIds))
    setPersonalBoardPositions(preset.personalPositions || {})
    setBoardFilter(preset.boardFilter || 'ALL')
    setBoardQuickQuery(preset.quickQuery || '')
    setBoardSelectionQuery(preset.selectionQuery || '')
    setBoardSelectionKind(preset.selectionKind || 'ALL')
    setBoardSelectionStatus(preset.selectionStatus || 'ALL')
    setBoardSelectionAuthor(preset.selectionAuthor || 'ALL')
    setBoardSelectionSession(preset.selectionSession || 'ALL')
    setBoardManageOpen(false)
  }

  function removeBoardPreset(name: string) {
    setBoardPresets((current) => current.filter((item) => item.name !== name))
  }

  function resetBoardFilters() {
    setBoardSelectionQuery('')
    setBoardSelectionKind('ALL')
    setBoardSelectionStatus('ALL')
    setBoardSelectionAuthor('ALL')
    setBoardSelectionSession('ALL')
  }

  // CHRONICLE_SPACE_BOARD_SELECTION_BATCH_V1
  function showBoardSelectionCards() {
    setHiddenBoardCardIds((current) => {
      const next = new Set(current)
      boardSelectionCards.forEach((card) => next.delete(card.id))
      return next
    })
  }

  function hideBoardSelectionCards() {
    setHiddenBoardCardIds((current) => {
      const next = new Set(current)
      boardSelectionCards.forEach((card) => next.add(card.id))
      return next
    })
  }


  function showAllBoardCards() {
    setHiddenBoardCardIds(new Set())
  }

  function resetPersonalBoardPositions() {
    // CHRONICLE_SPACE_BOARD_RESET_PERSONAL_POSITIONS_V1
    if (boardViewMode !== 'PERSONAL' || typeof window === 'undefined') return
    if (!window.confirm('¿Restaurar la distribución de las tarjetas en tu vista personal?')) return
    setPersonalBoardPositions(Object.fromEntries(cards.map((card, index) => [card.id, defaultBoardPosition(index)])))
    setBoardFilter('ALL')
  }

  function hideAllBoardCards() {
    // CHRONICLE_SPACE_BOARD_CLEAR_PERSONAL_V1
    if (!window.confirm('¿Retirar todas las tarjetas de tu vista personal? Las notas no se borrarán.')) return
    setHiddenBoardCardIds(new Set(cards.map((card) => card.id)))
    setBoardViewMode('PERSONAL')
    setBoardFilter('ALL')
    setBoardManageOpen(false)
  }


  function isFocusedConnectionEndpoint(cardId: string) {
    const connection = visibleBoardConnections.find((item) => boardConnectionKey(item) === focusedConnectionId)
    return Boolean(connection && (connection.fromId === cardId || connection.toId === cardId))
  }
  function isFocusedBoardCardEndpoint(cardId: string) {
    if (!focusedBoardCardId) return false
    if (focusedBoardCardId === cardId) return true
    return visibleBoardConnections.some((connection) => (connection.fromId === focusedBoardCardId || connection.toId === focusedBoardCardId) && (connection.fromId === cardId || connection.toId === cardId))
  }
  function centerBoardCard(cardId: string) {
    if (typeof window === 'undefined') return
    window.requestAnimationFrame(() => {
      const cardElement = Array.from(document.querySelectorAll<HTMLElement>('[data-board-card-id]')).find((element) => element.dataset.boardCardId === cardId)
      cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    })
  }
  function fitBoardToViewport() {
    if (typeof window === 'undefined') return
    const board = document.querySelector<HTMLElement>('.space-board')
    if (!board) return
    const availableWidth = Math.max(320, window.innerWidth - 36)
    const availableHeight = Math.max(240, Math.floor(window.innerHeight * 0.72))
    const naturalWidth = Math.max(1, board.offsetWidth)
    const naturalHeight = Math.max(1, board.offsetHeight)
    const scale = Math.max(0.7, Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight))
    setBoardZoom(Number(scale.toFixed(2)))
    window.requestAnimationFrame(() => board.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }))
  }
  function focusBoardCard(card: Card) {
    setFocusedConnectionId(null)
    const nextFocusedId = focusedBoardCardId === card.id ? null : card.id
    setFocusedBoardCardId(nextFocusedId)
    if (nextFocusedId) centerBoardCard(nextFocusedId)
  }
  function focusConnection(connection: ScopedBoardConnection) {
    const key = boardConnectionKey(connection)
    setFocusedConnectionId((current) => current === key ? null : key)
    setFocusedBoardCardId(null)
    if (typeof window === 'undefined') return
    window.setTimeout(() => {
      const card = Array.from(document.querySelectorAll<HTMLElement>('[data-board-card-id]')).find((element) => element.dataset.boardCardId === connection.fromId)
      card?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }, 40)
  }

  const selectedNote = selected?.kind === 'NOTA' ? notes.find((note) => note.id === selected.id.replace(/^note-/, '')) ?? null : null
  const selectedNoteContextImage = selectedNote ? chronicleNoteContextImage(selectedNote, context?.imageCandidates || []) : null

  async function openCard(card: Card) { setSelected(card); setPreview(null); if (!card.targetType || !card.targetId || !chronicleId) return; setPreviewLoading(true); try { setPreview(await notebookApi.resourcePreview(chronicleId, card.targetType, card.targetId)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo abrir la ficha.') } finally { setPreviewLoading(false) } }
  function openMention(label: string, targetType: string, targetId: string) {
    const kind = targetType === 'CHARACTER' ? 'PERSONAJE' : targetType === 'NPC' ? 'PNJ' : targetType === 'LOCATION' ? 'LUGAR' : targetType === 'ORGANIZATION' ? 'ORGANIZACION' : targetType === 'ARTIFACT' ? 'ARTEFACTO' : targetType === 'DOCUMENT' ? 'DOCUMENTO' : 'NOTA'
    setBoardPreviewCard(null)
    closeTimelineSession()
    void openCard({ id: 'mention-' + targetType + '-' + targetId, kind, title: label, meta: targetType, description: 'Referencia enlazada: ' + label, targetType: kind === 'NOTA' ? undefined : targetType, targetId: kind === 'NOTA' ? undefined : targetId })
  }

  // CHRONICLE_SPACE_RESOURCE_RELATED_NOTES_V2
  function openRelatedResourceNote(note: NotebookNote) {
    setSelected(null)
    setPreview(null)
    openBoardCardPreview({ id: 'note-' + note.id, kind: 'NOTA', title: note.title, meta: note.visibility === 'PRIVATE' ? 'Privada' : 'Compartida', description: note.content })
  }

  const closeCard = () => { setSelected(null); setPreview(null); setDetailImageEditing(false); setDetailImageMessage('') }
  async function openTimelineSession(session: ChronicleSessionApiSnapshot) {
    setTimelineSession(session)
    setTimelineSessionPreview(null)
    setDetailImageEditing(false)
    setDetailImageMessage('')
    if (!chronicleId) return
    try {
      setTimelineSessionPreview(await notebookApi.resourcePreview(chronicleId, 'SESSION', session.id))
    } catch {
      // La ficha sigue siendo útil aunque la sesión todavía no tenga imagen o preview ampliado.
    }
  }
  const closeTimelineSession = () => { setTimelineSession(null); setTimelineSessionPreview(null); setDetailImageEditing(false); setDetailImageMessage('') }

  // CHRONICLE_SPACE_RESOURCE_RELATED_NOTES_V1
  // CHRONICLE_SPACE_RESOURCE_MENTION_LINKS_V1
  function noteMentionsResource(note: NotebookNote, targetType: string, targetId: string) {
    const pattern = /@\[([^\]]+)\]\(([A-Z_]+):([^\)]+)\)/g
    let match: RegExpExecArray | null
    const content = note.content || ''
    while ((match = pattern.exec(content))) {
      if (match[2] === targetType && match[3] === targetId) return true
    }
    return false
  }
  const selectedRelatedNotes = useMemo(() => {
    const targetType = selected?.targetType
    const targetId = selected?.targetId
    if (!targetType || !targetId) return []
    return notes.filter((note) => note.references?.some((reference) => reference.targetType === targetType && reference.targetId === targetId) || noteMentionsResource(note, targetType, targetId))
  }, [notes, selected])
  function openRelatedNote(note: NotebookNote) {
    setSelected(null)
    setPreview(null)
    openBoardCardPreview({ id: 'note-' + note.id, kind: 'NOTA', title: note.title, meta: note.visibility === 'PRIVATE' ? 'Privada' : 'Compartida', description: note.content })
  }
  const nav = [{ id: 'BOARD' as const, label: 'Pizarra', note: 'Mapa de investigación' }, { id: 'TIMELINE' as const, label: 'Cronología', note: 'Memoria de la crónica' }, { id: 'ARCHIVE' as const, label: 'Archivo', note: 'Material consultable' }]

  return <main className="chronicle-space" aria-label="Sala de investigación">
    {typeof document !== 'undefined' && document.getElementById('app-header-page-actions') !== null ? createPortal(
      <div className="chronicle-space-global-actions" aria-label="Controles de la Sala de Investigación">
        <button className="chronicle-space-global-actions__new-note" type="button" onClick={openNewNote}>+ Nueva nota</button>
        <label className="chronicle-space-global-actions__chronicle"><span>Crónica</span><select value={chronicleId} onChange={(event) => { rememberChronicleSpaceSelection(event.target.value); setChronicleId(event.target.value) }}>{activeChronicles.length ? <optgroup label="Activas">{activeChronicles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup> : null}{archivedChronicles.length ? <optgroup label="Archivadas">{archivedChronicles.map((item) => <option key={item.id} value={item.id}>{item.name} · Archivada</option>)}</optgroup> : null}</select></label>
        <div className="chronicle-space-global-actions__counts" aria-label="Resumen de la crónica"><b>{cards.length}<small>elementos visibles</small></b><b>{sessions.length}<small>sesiones</small></b><b>{notes.length}<small>anotaciones</small></b></div>
        <nav className="chronicle-space-global-actions__nav" aria-label="Secciones de la Sala de Investigación">{nav.map((item) => <button key={item.id} className={section === item.id ? 'is-active' : ''} type="button" onClick={() => changeChronicleSpaceSection(item.id)}><small>{item.note}</small>{item.label}</button>)}</nav>
      </div>,
      document.getElementById('app-header-page-actions')!,
    ) : null}
    {error ? <p className="space-alert" role="alert">{error}</p> : null}{loading ? <p className="space-status">Cargando la crónica seleccionada…</p> : <>
      {section === 'BOARD' ? <section className="space-panel"><div className="panel-heading"><div><span>MAPA DE INVESTIGACIÓN</span><h2>Lo que sabemos hasta ahora</h2></div><p>Una superficie limitada y ordenada. Cada tarjeta abre su ficha o anotación.</p></div><div className="board-filter-bar" aria-label="Filtrar tarjetas de la pizarra"><span>Mostrar</span>{([['ALL', 'Todo'], ['PNJ', 'Personas'], ['LUGAR', 'Lugares'], ['NOTA', 'Anotaciones']] as const).map(([value, label]) => <button key={value} className={boardFilter === value ? 'is-active' : ''} type="button" onClick={() => setBoardFilter(value)}>{label}<b>{value === 'ALL' ? cards.length : cards.filter((card) => card.kind === value).length}</b></button>)}</div>      <div className="board-quick-search">
        <label htmlFor="board-quick-search-input">Buscar en la pizarra</label>
        <div><input id="board-quick-search-input" value={boardQuickQuery} onChange={(event) => setBoardQuickQuery(event.target.value)} placeholder="Título, autor o texto…" /><button type="button" onClick={() => setBoardQuickQuery('')} disabled={!boardQuickQuery} aria-label="Limpiar búsqueda de la pizarra">×</button></div>
      </div>
      <div className="board-visibility-bar">
        <span>{boardViewMode === 'ALL' ? 'Vista general' : 'Mi vista'}: <b>{visibleCards.length}</b> de {cards.length} tarjetas</span>
        <div>
          <button className={boardViewMode === 'PERSONAL' ? 'is-active' : ''} type="button" onClick={() => { resetConnectionEditor(); setConnectionSourceId(null); setPendingConnectionScope('PERSONAL'); setBoardViewMode('PERSONAL'); setBoardFilter('ALL') }}>Mi vista</button>
          <button className={boardViewMode === 'ALL' ? 'is-active' : ''} type="button" onClick={() => { resetConnectionEditor(); setConnectionSourceId(null); setPendingConnectionScope('SHARED'); setBoardViewMode('ALL'); setBoardFilter('ALL') }}>Vista general</button>
          <button type="button" onClick={() => setBoardManageOpen((current) => !current)}>{boardManageOpen ? 'Cerrar selección' : 'Elegir tarjetas'}</button>
          <button className="board-visibility-clear" type="button" onClick={hideAllBoardCards} disabled={boardViewMode !== 'PERSONAL' || !cards.some((card) => !hiddenBoardCardIds.has(card.id))} aria-label="Retirar todas las tarjetas de mi vista">Retirar todas</button>
          <button className="board-visibility-reset" type="button" onClick={resetPersonalBoardPositions} disabled={boardViewMode !== 'PERSONAL' || !cards.length} aria-label="Restaurar las posiciones de mi vista">Restaurar posiciones</button>
          <button className="board-visibility-preset" type="button" onClick={() => setBoardPresetOpen((current) => !current)} disabled={boardViewMode !== 'PERSONAL'}>{boardPresetOpen ? 'Cerrar presets' : 'Guardar vista'}</button>
        </div>
      </div>
      <p className={'board-scope-note board-scope-note--' + (boardViewMode === 'PERSONAL' ? 'personal' : 'shared')}>{boardViewMode === 'PERSONAL' ? 'Tus conexiones son privadas: ningún otro jugador puede verlas ni modificarlas. Las relaciones oficiales del Narrador también aparecen como referencia.' : canManageSharedBoard ? 'Vista oficial compartida: los cambios se muestran a todos los participantes de la crónica.' : 'Vista oficial compartida: puedes consultarla, pero solo el Narrador puede modificar tarjetas y conexiones.'}</p>
      {boardManageOpen ? <div className="board-visibility-panel" aria-label="Elegir tarjetas visibles">
        <div className="board-selection-tools">
          <label className="board-selection-field"><span>Buscar</span><input value={boardSelectionQuery} onChange={(event) => setBoardSelectionQuery(event.target.value)} placeholder="Nombre de tarjeta…" /></label>
          <label className="board-selection-field"><span>Tipo</span><select value={boardSelectionKind} onChange={(event) => setBoardSelectionKind(event.target.value as 'ALL' | Kind)}><option value="ALL">Todos los tipos</option><option value="PNJ">PNJ</option><option value="LUGAR">Lugares</option><option value="NOTA">Anotaciones</option></select></label>
          <label className="board-selection-field"><span>Estado</span><select value={boardSelectionStatus} onChange={(event) => setBoardSelectionStatus(event.target.value as 'ALL' | 'VISIBLE' | 'HIDDEN')}><option value="ALL">Todos</option><option value="VISIBLE">Visibles</option><option value="HIDDEN">Ocultas</option></select></label>
          <label className="board-selection-field"><span>Sesión</span><select aria-label="Filtrar anotaciones por sesión" value={boardSelectionSession} onChange={(event) => { const value = event.target.value; setBoardSelectionSession(value); if (value !== 'ALL') setBoardSelectionKind('NOTA') }}><option value="ALL">Todas las sesiones</option><option value={GENERAL_BOARD_SESSION_FILTER}>Notas sin sesión</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.title || (session.sessionNumber === null ? 'Sesión sin título' : 'Sesión ' + session.sessionNumber)}</option>)}</select></label>
          <label className="board-selection-field"><span>Autor</span><select value={boardSelectionAuthor} onChange={(event) => setBoardSelectionAuthor(event.target.value)}><option value="ALL">Todos los autores</option>{boardSelectionAuthors.map((author) => <option key={author} value={author}>{author}</option>)}</select></label>
          <button className="board-selection-reset" type="button" onClick={resetBoardFilters}>Limpiar filtros</button>
          <div className="board-selection-batch" aria-label="Acciones para los resultados filtrados">
            <button type="button" onClick={showBoardSelectionCards} disabled={!boardSelectionCards.length}>Mostrar resultados</button>
            <button type="button" onClick={hideBoardSelectionCards} disabled={!boardSelectionCards.length}>Retirar resultados</button>
          </div>
        </div>
        <div className="board-selection-summary">Mostrando <b>{boardSelectionCards.length}</b> de {cards.length} tarjetas</div>
        <div className="board-selection-list">{boardSelectionCards.length ? boardSelectionCards.map((card) => <label key={card.id}><input type="checkbox" checked={!hiddenBoardCardIds.has(card.id)} onChange={() => toggleBoardCard(card.id)} /><span><small>{kindLabel(card.kind)}{card.kind === 'NOTA' && card.author ? ' · ' + card.author : ''}</small><strong>{card.title}</strong></span></label>) : <p className="board-selection-empty">No hay tarjetas que coincidan con estos filtros.</p>}</div>
      </div> : null}
      {boardPresetOpen ? <div className="board-preset-panel" aria-label="Vistas personales guardadas">
        <div className="board-preset-create"><label><span>Nombre de la vista</span><input value={boardPresetName} onChange={(event) => setBoardPresetName(event.target.value)} placeholder="Ej. Solo pistas" /></label><button type="button" onClick={saveBoardPreset}>Guardar vista actual</button></div>
        <div className="board-preset-tools"><button type="button" onClick={exportBoardPresets} disabled={!boardPresets.length}>Exportar vistas</button><label className="board-preset-import">Importar vistas<input type="file" accept="application/json,.json" onChange={importBoardPresets} /></label></div>
        {boardPresetImportError ? <p className="board-preset-error" role="alert">{boardPresetImportError}</p> : null}
        {boardPresets.length ? <div className="board-preset-list">{boardPresets.map((preset) => <div key={preset.name}><button type="button" onClick={() => applyBoardPreset(preset)}>{preset.name}</button><button type="button" onClick={() => removeBoardPreset(preset.name)} aria-label={'Eliminar preset ' + preset.name}>×</button></div>)}</div> : <p className="board-preset-empty">Todavía no hay vistas guardadas.</p>}
      </div> : null}
      <div className="space-board-navigation" aria-label="Navegación de la pizarra">
        <span>VISTA</span>
        <button type="button" aria-label="Alejar pizarra" onClick={() => setBoardZoom((current) => Math.max(0.7, Number((current - 0.1).toFixed(2))))}>−</button>
        <strong>{Math.round(boardZoom * 100)}%</strong>
        <button type="button" aria-label="Acercar pizarra" onClick={() => setBoardZoom((current) => Math.min(1.35, Number((current + 0.1).toFixed(2))))}>+</button>
        <button type="button" onClick={() => setBoardZoom(1)}>Restablecer</button>
        <button type="button" onClick={() => fitBoardToViewport()}>Ver toda</button>
      </div>
<div className={'space-board' + (focusedConnectionId ? ' has-focused-connection' : '') + (focusedBoardCardId ? ' has-focused-card' : '')} style={{ minHeight: boardHeight, transform: 'scale(' + boardZoom + ')', transformOrigin: 'top left', width: (100 / boardZoom) + '%' }}>
        <svg className="board-connections-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{visibleBoardConnections.map((connection) => { const fromIndex = cards.findIndex((card) => card.id === connection.fromId); const toIndex = cards.findIndex((card) => card.id === connection.toId); if (fromIndex < 0 || toIndex < 0 || (boardFilter !== 'ALL' && (!visibleCards.some((card) => card.id === connection.fromId) || !visibleCards.some((card) => card.id === connection.toId)))) return null; const from = boardConnectionPosition(boardPosition(connection.fromId, fromIndex)); const to = boardConnectionPosition(boardPosition(connection.toId, toIndex)); const endpoints = boardConnectionEndpoints(from, to); return <line className={'board-link board-link--' + connection.type.toLowerCase() + ' board-link--scope-' + connection.scope.toLowerCase() + (focusedConnectionId === boardConnectionKey(connection) || Boolean(focusedBoardCardId && (connection.fromId === focusedBoardCardId || connection.toId === focusedBoardCardId)) ? ' is-focused' : '')} key={boardConnectionKey(connection)} x1={endpoints.from.x} y1={endpoints.from.y} x2={endpoints.to.x} y2={endpoints.to.y} style={{ stroke: connection.color || undefined }} onClick={() => focusConnection(connection)} onDoubleClick={() => editConnection(connection)} aria-label={connection.scope === 'PERSONAL' ? 'Enfocar relación privada; doble pulsación para editar' : canManageSharedBoard ? 'Enfocar relación oficial; doble pulsación para editar' : 'Enfocar relación oficial'} /> })}</svg>
        <svg className="board-arrows-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="board-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L6,3 z" fill="context-stroke" /></marker></defs>{visibleBoardConnections.filter((connection) => connection.arrow).map((connection) => { const fromIndex = cards.findIndex((card) => card.id === connection.fromId); const toIndex = cards.findIndex((card) => card.id === connection.toId); if (fromIndex < 0 || toIndex < 0 || (boardFilter !== 'ALL' && (!visibleCards.some((card) => card.id === connection.fromId) || !visibleCards.some((card) => card.id === connection.toId)))) return null; const from = boardConnectionPosition(boardPosition(connection.fromId, fromIndex)); const to = boardConnectionPosition(boardPosition(connection.toId, toIndex)); const endpoints = boardConnectionArrowEndpoints(from, to); return <line className={'board-link board-link--arrow board-link--' + connection.type.toLowerCase() + ' board-link--scope-' + connection.scope.toLowerCase()} key={'arrow-' + boardConnectionKey(connection)} x1={endpoints.from.x} y1={endpoints.from.y} x2={endpoints.to.x} y2={endpoints.to.y} style={{ stroke: connection.color || undefined }} markerEnd="url(#board-arrow)" /> })}</svg>
        <div className="board-connect-hint">{boardUpdateAvailable ? <span className="board-update-notice">Hay cambios oficiales nuevos.<button type="button" onClick={() => window.location.reload()}>Recargar pizarra</button></span> : boardSaving ? 'Guardando la vista oficial…' : connectionSourceId ? 'Selecciona otra tarjeta para conectarla.' : boardViewMode === 'ALL' && !canManageSharedBoard ? 'Vista oficial en modo consulta. Cambia a «Mi vista» para organizar tus propias teorías.' : 'Arrastra las tarjetas libremente; pueden solaparse. Usa «Conectar» para crear una relación.'}</div>
        {visibleCards.length ? visibleCards.map((card) => { const index = cards.findIndex((item) => item.id === card.id); const position = boardPosition(card.id, index); return <article className={'board-card board-card--' + ((index % 6) + 1) + (connectionSourceId === card.id ? ' is-connect-source' : '') + (draggingBoardId === card.id ? ' is-dragging' : '') + (highlightedBoardCardId === card.id ? ' is-highlighted' : '') + (isFocusedConnectionEndpoint(card.id) ? ' is-focused-endpoint' : '') + (isFocusedBoardCardEndpoint(card.id) ? ' is-focused-card' : '')} key={card.id} data-board-card-id={card.id} style={{ left: position.x + '%', top: (position.y / 100 * BOARD_POSITION_HEIGHT) + 'px' }} onPointerDown={(event) => beginBoardDrag(event, card.id)} onPointerMove={(event) => moveBoardCard(event, card.id)} onPointerUp={finishBoardDrag}><span className="board-card__drag-handle" title="Arrastrar tarjeta">⠿ Mover</span>
          <button className="board-card__open" data-card-id={card.id} type="button" onClick={() => focusBoardCard(card)}><i className={'card-pin card-pin--' + card.kind.toLowerCase()} /><small>{kindLabel(card.kind)}</small><strong>{card.title}</strong></button>
          <button className="board-card__connect" type="button" onClick={() => startConnection(card)} disabled={!canCreateBoardConnection} title={!canCreateBoardConnection ? 'Las relaciones oficiales solo puede modificarlas el Narrador' : undefined}>{connectionSourceId === card.id ? 'Origen seleccionado' : 'Conectar'}</button>
          {focusedBoardCardId === card.id ? <div className="board-card__focus-actions"><span>FOCO ACTIVO</span><button type="button" onClick={() => openBoardCardPreview(card)}>Abrir tarjeta</button><button type="button" onClick={() => setFocusedBoardCardId(null)}>Quitar foco</button></div> : null}
        </article> }) : <p className="space-empty">No hay tarjetas de este tipo para la crónica seleccionada.</p>}
      </div>
      {timelineSession ? <div className="space-overlay"><button className="space-overlay__dismiss" type="button" aria-label="Cerrar ficha de sesión" tabIndex={-1} onClick={() => closeTimelineSession()} /><section className="space-detail timeline-session-detail" role="dialog" aria-modal="true" aria-label={'Sesión ' + (timelineSession.title || 'sin título')} onClick={(event) => event.stopPropagation()}><button className="detail-close" type="button" onClick={() => closeTimelineSession()}>Cerrar</button><span className="space-kicker">FICHA DE SESIÓN</span><figure className="space-detail__visual space-detail__visual--session"><div className="space-detail__visual-frame"><img src={timelineSessionPreview?.imageUrl || '/api/chronicles/' + chronicleId + '/assets/SESSION/' + timelineSession.id + '/image'} alt={'Imagen de ' + (timelineSession.title || 'sesión')} onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add('is-missing') }} /><span className="space-detail__visual-fallback" aria-hidden="true">SESIÓN</span></div><figcaption>{timelineSessionPreview?.imageUrl ? 'Imagen de la sesión' : 'Capa visual de la sesión'}</figcaption></figure><h2>{timelineSession.title || 'Sesión sin título'}</h2><small className="timeline-session-detail__meta">{dateLabel(timelineSession.realDate)} · {timelineSession.status === 'completed' ? 'Completada' : timelineSession.status === 'preparation' ? 'En preparación' : 'Archivada'}</small><p className="detail-copy">{timelineSession.summary || 'Esta sesión todavía no tiene un resumen.'}</p><dl><div><dt>Identificador</dt><dd>{timelineSession.sessionNumber ? 'Sesión ' + timelineSession.sessionNumber : 'Registro'}</dd></div><div><dt>Anotaciones</dt><dd>{notes.filter((note) => note.sessionId === timelineSession.id).length}</dd></div></dl>{notes.filter((note) => note.sessionId === timelineSession.id).length ? <div className="timeline-session-detail__notes"><span>ANOTACIONES DE LA SESIÓN</span>{notes.filter((note) => note.sessionId === timelineSession.id).map((note) => <button className="timeline-note" type="button" key={note.id} onClick={() => { closeTimelineSession(); openBoardCardPreview({ id: 'note-' + note.id, kind: 'NOTA', title: note.title, meta: note.visibility === 'PRIVATE' ? 'Privada' : 'Compartida', description: note.content }) }}><strong>{note.title}</strong><small>{note.author?.displayName || note.author?.username || 'Anotación'} · {dateLabel(note.updatedAt)}</small></button>)}</div> : <p className="timeline-session-detail__empty">Esta sesión todavía no tiene anotaciones vinculadas.</p>}<button className="detail-action" type="button" onClick={() => closeTimelineSession()}>Volver a cronología</button></section></div> : null}
      {boardPreviewCard ? <div className="board-preview-backdrop"><button className="space-overlay__dismiss" type="button" aria-label="Cerrar previsualización" tabIndex={-1} onClick={() => setBoardPreviewCard(null)} /><section className="board-preview-dialog" role="dialog" aria-modal="true" aria-label={'Previsualización de ' + boardPreviewCard.title} onClick={(event) => event.stopPropagation()}><button className="board-preview-close" type="button" aria-label="Cerrar previsualización" onClick={() => setBoardPreviewCard(null)}>×</button><span>{kindLabel(boardPreviewCard.kind)}{boardPreviewCard.meta ? ' · ' + boardPreviewCard.meta : ''}{boardPreviewCard.author ? ' · ' + boardPreviewCard.author : ''}</span><h3>{boardPreviewCard.title}</h3><p>{boardPreviewCard.kind === 'NOTA' ? renderMentionText(boardPreviewCard.description, openMention) : (boardPreviewCard.description || 'Sin información adicional disponible.')}</p><div className="board-preview-actions"><button type="button" onClick={() => void openBoardCardRecord(boardPreviewCard)}>{boardPreviewCard.kind === 'NOTA' ? 'Abrir anotación completa' : 'Abrir ficha completa'}</button><button type="button" onClick={() => openBoardFocus(boardPreviewCard)}>Ver conexiones</button><button type="button" onClick={() => addBoardNoteFor(boardPreviewCard)}>Añadir nota</button><button type="button" onClick={() => toggleBoardHighlight(boardPreviewCard.id)}>{highlightedBoardCardId === boardPreviewCard.id ? 'Quitar destacado' : 'Destacar'}</button><button type="button" onClick={() => setBoardPreviewCard(null)}>Cerrar</button></div></section></div> : null}
      {boardFocusCard ? <div className="board-focus-backdrop"><button className="space-overlay__dismiss" type="button" aria-label="Cerrar foco" tabIndex={-1} onClick={() => setBoardFocusCard(null)} /><section className="board-focus-dialog" role="dialog" aria-modal="true" aria-label={'Foco de ' + boardFocusCard.title} onClick={(event) => event.stopPropagation()}><button className="board-focus-close" type="button" aria-label="Cerrar foco" onClick={() => setBoardFocusCard(null)}>×</button><span>FOCO DE INVESTIGACIÓN</span><small>{kindLabel(boardFocusCard.kind)}{boardFocusCard.meta ? ' · ' + boardFocusCard.meta : ''}</small><h3>{boardFocusCard.title}</h3><p>{plainMentionText(boardFocusCard.description) || 'Sin información adicional disponible.'}</p>{getBoardAttachedNotes(boardFocusCard).length ? <div className="board-focus-notes"><strong>Notas vinculadas</strong>{getBoardAttachedNotes(boardFocusCard).map((note) => { const noteCard = cards.find((item) => item.id === 'note-' + note.id); return noteCard ? <button type="button" key={note.id} onClick={() => { setBoardFocusCard(null); openBoardCardPreview(noteCard) }}>{note.title}</button> : <p key={note.id}>{note.title}</p> })}</div> : null}<div className="board-focus-related"><strong>Conectado con</strong>{getBoardFocusRelated(boardFocusCard).length ? getBoardFocusRelated(boardFocusCard).map((related) => <button type="button" key={related.id} onClick={() => { setBoardFocusCard(null); openBoardCardPreview(related) }}>{kindLabel(related.kind)} · {related.title}</button>) : <p>No hay conexiones guardadas para este elemento.</p>}</div><div className="board-focus-actions"><button type="button" onClick={() => void openBoardCardRecord(boardFocusCard)}>{boardFocusCard.kind === 'NOTA' ? 'Abrir anotación' : 'Abrir ficha'}</button><button type="button" disabled={!canCreateBoardConnection} onClick={() => { setBoardFocusCard(null); startConnection(boardFocusCard) }}>Conectar</button><button type="button" onClick={() => addBoardNoteFor(boardFocusCard)}>Añadir nota</button><button type="button" onClick={() => toggleBoardHighlight(boardFocusCard.id)}>{highlightedBoardCardId === boardFocusCard.id ? 'Quitar destacado' : 'Destacar'}</button></div></section></div> : null}
      {pendingConnection ? <form className="connection-composer connection-composer--editor" onSubmit={saveConnection}><div><span>{editingConnectionId ? 'EDITAR RELACIÓN' : 'CONEXIÓN DE LA PIZARRA'}</span><strong>{cards.find((card) => card.id === pendingConnection.fromId)?.title || 'Elemento'} <b>→</b> {cards.find((card) => card.id === pendingConnection.toId)?.title || 'Elemento'}</strong><button className="connection-direction" type="button" onClick={invertConnectionDirection}>Invertir dirección</button></div><p className={'connection-scope-label connection-scope-label--' + pendingConnectionScope.toLowerCase()}><b>{pendingConnectionScope === 'PERSONAL' ? 'Privada' : 'Oficial'}</b>{pendingConnectionScope === 'PERSONAL' ? 'Solo tú puedes verla' : 'Visible para toda la crónica'}</p><label>Tipo de conexión<select value={pendingConnectionType} onChange={(event) => { const type = event.target.value as BoardConnectionType; setPendingConnectionType(type); setPendingConnectionColor(boardConnectionColor(type)) }}><option value="VISUAL">Conexión visual</option><option value="KNOWN">Relación conocida</option><option value="SUSPICION">Teoría o sospecha</option></select></label>{pendingConnectionType === 'VISUAL' ? <p className="connection-visual-help">Línea visual sin etiqueta.</p> : <label>{pendingConnectionType === 'KNOWN' ? 'Etiqueta de la relación' : 'Pregunta o sospecha'}<input value={connectionLabel} onChange={(event) => setConnectionLabel(event.target.value)} placeholder={pendingConnectionType === 'KNOWN' ? 'Ej.: trabaja para' : 'Ej.: ¿se reúne aquí?'} autoFocus /></label>}<label className="connection-arrow-option"><span>Punta de flecha</span><span><input type="checkbox" checked={pendingConnectionArrow} onChange={(event) => setPendingConnectionArrow(event.target.checked)} /> Mostrar dirección</span></label><label className="connection-color-option"><span>Color</span><input type="color" value={pendingConnectionColor} onChange={(event) => setPendingConnectionColor(event.target.value)} /></label>{connectionEditorMessage ? <p className="connection-editor-message" role="alert">{connectionEditorMessage}</p> : null}<button type="button" onClick={resetConnectionEditor}>Cancelar</button><button className="connection-save" type="submit">{editingConnectionId ? 'Guardar cambios' : 'Guardar conexión'}</button></form> : null}      {focusedBoardCardId && !boardPreviewCard && !boardFocusCard ? <div className="board-mobile-actions" role="toolbar" aria-label="Acciones de la tarjeta enfocada">
        <div className="board-mobile-actions__title"><span>FOCO ACTIVO</span><strong>{cards.find((card) => card.id === focusedBoardCardId)?.title || "Tarjeta"}</strong></div>
        <button type="button" onClick={() => { const card = cards.find((item) => item.id === focusedBoardCardId); if (card) openBoardCardPreview(card) }}>Abrir</button>
        <button type="button" disabled={!canCreateBoardConnection} onClick={() => { const card = cards.find((item) => item.id === focusedBoardCardId); if (card) startConnection(card) }}>Conectar</button>
        <button type="button" onClick={() => setFocusedBoardCardId(null)}>Quitar foco</button>
      </div> : null}

      {visibleBoardConnections.length ? <section className="board-connections"><header><div><span>RELACIONES DE LA PIZARRA</span><h3>Conexiones guardadas</h3></div><b>{filteredBoardConnections.length}/{visibleBoardConnections.length}</b></header><div className="connection-list-tools"><label>Buscar relación<input value={connectionListQuery} onChange={(event) => setConnectionListQuery(event.target.value)} placeholder="Tarjeta o etiqueta…" /></label><div className="connection-filter-buttons" aria-label="Filtrar relaciones"><button className={'connection-filter-button ' + (connectionListFilter === 'ALL' ? 'is-active' : '')} type="button" onClick={() => setConnectionListFilter('ALL')}>Todas</button><button className={'connection-filter-button connection-filter-button--visual ' + (connectionListFilter === 'VISUAL' ? 'is-active' : '')} type="button" onClick={() => setConnectionListFilter('VISUAL')}>Visuales</button><button className={'connection-filter-button connection-filter-button--known ' + (connectionListFilter === 'KNOWN' ? 'is-active' : '')} type="button" onClick={() => setConnectionListFilter('KNOWN')}>Conocidas</button><button className={'connection-filter-button connection-filter-button--suspicion ' + (connectionListFilter === 'SUSPICION' ? 'is-active' : '')} type="button" onClick={() => setConnectionListFilter('SUSPICION')}>Sospechas</button></div></div>{focusedConnectionId ? <div className="connection-focus-banner"><span>Foco activo: se resaltan los dos extremos de la relación.</span><button type="button" onClick={() => setFocusedConnectionId(null)}>Quitar foco</button></div> : null}{focusedBoardCardId ? <div className="connection-focus-banner card-focus-banner"><span>Foco de tarjeta: se resaltan sus relaciones.</span><button type="button" onClick={() => setFocusedBoardCardId(null)}>Quitar foco</button></div> : null}{filteredBoardConnections.length ? filteredBoardConnections.map((connection) => <article className={focusedConnectionId === boardConnectionKey(connection) ? 'is-focused-row' : ''} key={boardConnectionKey(connection)}><strong>{cards.find((card) => card.id === connection.fromId)?.title || 'Elemento'} <i className={'connection-scope-badge connection-scope-badge--' + connection.scope.toLowerCase()}>{connection.scope === 'PERSONAL' ? 'Privada' : 'Oficial'}</i><i className={'connection-type-badge connection-type-badge--' + connection.type.toLowerCase()}>{connection.type === 'KNOWN' ? 'Relación conocida' : connection.type === 'SUSPICION' ? 'Teoría o sospecha' : 'Conexión visual'}</i>{connection.type !== 'VISUAL' ? <b>— {connection.label} —</b> : null} {cards.find((card) => card.id === connection.toId)?.title || 'Elemento'}</strong><div className="connection-row-actions"><button className="connection-focus" type="button" onClick={() => focusConnection(connection)}>{focusedConnectionId === boardConnectionKey(connection) ? 'Quitar foco' : 'Enfocar'}</button>{connection.scope === 'PERSONAL' || canManageSharedBoard ? <><button className="connection-edit" type="button" onClick={() => editConnection(connection)}>Editar</button><button type="button" onClick={() => removeConnection(connection)}>Quitar</button></> : <span className="connection-readonly">Solo lectura</span>}</div></article>) : <p className="connection-list-empty">No hay relaciones que coincidan con el filtro actual.</p>}</section> : null}
    </section> : null}
      {/* CHRONICLE_SPACE_TIMELINE_GLOBAL_OVERLAYS_V1 — disponibles también desde Cronología y Archivo. */}
      {section !== 'BOARD' && boardPreviewCard ? <div className="board-preview-backdrop"><button className="space-overlay__dismiss" type="button" aria-label="Cerrar previsualización" tabIndex={-1} onClick={() => setBoardPreviewCard(null)} /><section className="board-preview-dialog" role="dialog" aria-modal="true" aria-label={'Previsualización de ' + boardPreviewCard.title} onClick={(event) => event.stopPropagation()}><button className="board-preview-close" type="button" aria-label="Cerrar previsualización" onClick={() => setBoardPreviewCard(null)}>×</button><span>{kindLabel(boardPreviewCard.kind)}{boardPreviewCard.meta ? ' · ' + boardPreviewCard.meta : ''}</span><h3>{boardPreviewCard.title}</h3><p>{boardPreviewCard.kind === 'NOTA' ? renderMentionText(boardPreviewCard.description, openMention) : (boardPreviewCard.description || 'Sin información adicional disponible.')}</p><div className="board-preview-actions"><button type="button" onClick={() => void openBoardCardRecord(boardPreviewCard)}>{boardPreviewCard.kind === 'NOTA' ? 'Abrir anotación completa' : 'Abrir ficha completa'}</button><button type="button" onClick={() => setBoardPreviewCard(null)}>Cerrar</button></div></section></div> : null}
      {section !== 'BOARD' && timelineSession ? <div className="space-overlay"><button className="space-overlay__dismiss" type="button" aria-label="Cerrar ficha de sesión" tabIndex={-1} onClick={() => closeTimelineSession()} /><section className="space-detail timeline-session-detail" role="dialog" aria-modal="true" aria-label={'Sesión ' + (timelineSession.title || 'sin título')} onClick={(event) => event.stopPropagation()}><button className="detail-close" type="button" onClick={() => closeTimelineSession()}>Cerrar</button><span className="space-kicker">FICHA DE SESIÓN</span><figure className="space-detail__visual space-detail__visual--session"><div className="space-detail__visual-frame"><img src={timelineSessionPreview?.imageUrl || '/api/chronicles/' + chronicleId + '/assets/SESSION/' + timelineSession.id + '/image'} alt={'Imagen de ' + (timelineSession.title || 'sesión')} onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add('is-missing') }} /><span className="space-detail__visual-fallback" aria-hidden="true">SESIÓN</span></div><figcaption>{timelineSessionPreview?.imageUrl ? 'Imagen de la sesión' : 'Capa visual de la sesión'}</figcaption></figure><h2>{timelineSession.title || 'Sesión sin título'}</h2><small className="timeline-session-detail__meta">{dateLabel(timelineSession.realDate)} · {timelineSession.status === 'completed' ? 'Completada' : timelineSession.status === 'preparation' ? 'En preparación' : 'Archivada'}</small><p className="detail-copy">{timelineSession.summary || 'Esta sesión todavía no tiene un resumen.'}</p><dl><div><dt>Identificador</dt><dd>{timelineSession.sessionNumber ? 'Sesión ' + timelineSession.sessionNumber : 'Registro'}</dd></div><div><dt>Anotaciones</dt><dd>{notes.filter((note) => note.sessionId === timelineSession.id).length}</dd></div></dl>{notes.filter((note) => note.sessionId === timelineSession.id).length ? <div className="timeline-session-detail__notes"><span>ANOTACIONES DE LA SESIÓN</span>{notes.filter((note) => note.sessionId === timelineSession.id).map((note) => <button className="timeline-note" type="button" key={note.id} onClick={() => { closeTimelineSession(); openBoardCardPreview({ id: 'note-' + note.id, kind: 'NOTA', title: note.title, meta: note.visibility === 'PRIVATE' ? 'Privada' : 'Compartida', description: note.content }) }}><strong>{note.title}</strong><small>{note.author?.displayName || note.author?.username || 'Anotación'} · {dateLabel(note.updatedAt)}</small></button>)}</div> : <p className="timeline-session-detail__empty">Esta sesión todavía no tiene anotaciones vinculadas.</p>}<button className="detail-action" type="button" onClick={() => closeTimelineSession()}>Volver a cronología</button></section></div> : null}
      {section === 'TIMELINE' ? <section className="space-panel"><div className="panel-heading"><div><span>MEMORIA DE LA CRÓNICA</span><h2>La historia en el tiempo</h2></div><p>Las sesiones reales de la crónica, ordenadas para volver a ellas sin perder contexto.</p></div><div className="timeline-tools"><label className="timeline-search"><span>BUSCAR EN LA CRONOLOGÍA</span><input value={timelineSearch} onChange={(event) => setTimelineSearch(event.target.value)} placeholder="Título o resumen…" /></label><div className="timeline-filters" aria-label="Filtrar sesiones"><span>FILTRAR</span>{([['ALL', 'Todas'], ['PREPARATION', 'En preparación'], ['COMPLETED', 'Completadas'], ['WITH_NOTES', 'Con anotaciones'], ['WITHOUT_NOTES', 'Sin anotaciones']] as const).map(([value, label]) => <button className={timelineFilter === value ? 'is-active' : ''} type="button" key={value} onClick={() => setTimelineFilter(value)}>{label}</button>)}</div><span className="timeline-result-count">{filteredTimelineSessions.length} de {sessions.length} sesiones</span></div><div className="timeline">{filteredTimelineSessions.length ? filteredTimelineSessions.map((session, index) => { const sessionNotes = notes.filter((note) => note.sessionId === session.id); return <article className="timeline-card" key={session.id}><div className="timeline-marker">{String(index + 1).padStart(2, '0')}</div><div className="timeline-card__body"><div className="timeline-card__visual-v1"><img src={'/api/chronicles/' + chronicleId + '/assets/SESSION/' + session.id + '/image'} alt={'Portada de ' + (session.title || 'sesión')} onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add('is-missing') }} /><span aria-hidden="true">SESIÓN</span></div><small>{dateLabel(session.realDate)} · {session.status === 'completed' ? 'Completada' : session.status === 'preparation' ? 'En preparación' : 'Archivada'}</small><h3>{session.title || 'Sesión sin título'}</h3><p>{session.summary || 'Esta sesión todavía no tiene un resumen.'}</p><span className="timeline-card__note-count">{sessionNotes.length ? sessionNotes.length + (sessionNotes.length === 1 ? ' anotación vinculada' : ' anotaciones vinculadas') : 'Sin anotaciones vinculadas'}</span>{sessionNotes.length ? <div className="timeline-card__notes"><span>{sessionNotes.length === 1 ? 'ANOTACIÓN DE LA SESIÓN' : 'ANOTACIONES DE LA SESIÓN'}</span>{sessionNotes.map((note) => <button className="timeline-note" type="button" key={note.id} onClick={() => openBoardCardPreview({ id: 'note-' + note.id, kind: 'NOTA', title: note.title, meta: note.visibility === 'PRIVATE' ? 'Privada' : 'Compartida', description: note.content })}><strong>{note.title}</strong><small>{note.author?.displayName || note.author?.username || 'Anotación'} · {dateLabel(note.updatedAt)}</small></button>)}</div> : null}</div><div className="timeline-card__aside"><span>{session.sessionNumber ? 'Sesión ' + session.sessionNumber : 'Registro'}</span><button className="timeline-session-action" type="button" onClick={() => void openTimelineSession(session)}>Abrir sesión</button></div></article> }) : <p className="space-empty">{sessions.length ? 'No hay sesiones que coincidan con el filtro.' : 'Todavía no hay sesiones registradas.'}</p>}</div>{notes.some((note) => !note.sessionId) ? <section className="timeline-independent"><header><div><span>MEMORIA SIN SESIÓN</span><h3>Anotaciones independientes</h3></div><b>{notes.filter((note) => !note.sessionId).length}</b></header><div>{notes.filter((note) => !note.sessionId).map((note) => <button className="timeline-note" type="button" key={note.id} onClick={() => openBoardCardPreview({ id: 'note-' + note.id, kind: 'NOTA', title: note.title, meta: note.visibility === 'PRIVATE' ? 'Privada' : 'Compartida', description: note.content })}><strong>{note.title}</strong><small>{note.author?.displayName || note.author?.username || 'Anotación'} · {dateLabel(note.updatedAt)}</small></button>)}</div></section> : null}</section> : null}
      {section === 'ARCHIVE' ? <section className="space-panel"><div className="panel-heading"><div><span>MATERIAL CONSULTABLE</span><h2>Archivo de la crónica</h2></div><p>La información queda agrupada por tipo para encontrarla sin atravesar varias pantallas.</p></div><div className="archive-tools">
  <label className="archive-search"><span>BUSCAR EN EL ARCHIVO</span><input type="search" value={archiveSearch} onChange={(event) => setArchiveSearch(event.target.value)} placeholder="Nombre, título o texto…" /></label>
  <div className="archive-filters" aria-label="Filtrar archivo"><span>MOSTRAR</span>{([['ALL', 'Todo'], ['NOTES', 'Anotaciones'], ['PEOPLE', 'Personas'], ['PLACES', 'Lugares'], ['ORGANIZATIONS', 'Organizaciones'], ['ARTIFACTS', 'Artefactos'], ['DOCUMENTS', 'Documentos']] as const).map(([value, label]) => <button type="button" key={value} className={archiveFilter === value ? 'is-active' : ''} onClick={() => setArchiveFilter(value)}>{label}</button>)}</div>
  <label className="archive-sort"><span>ORDENAR</span><select value={archiveSort} onChange={(event) => setArchiveSort(event.target.value as ArchiveSort)}><option value="DEFAULT">Orden actual</option><option value="NAME">Nombre A-Z</option><option value="RECENT">Más recientes</option></select></label><span className="archive-result-count">{archiveVisibleCount} de {archiveTotalCount} fichas</span>
</div><div className="archive-grid"><Archive title="Anotaciones" count={archiveNotes.length} expandable={archiveNotes.length > 8} expanded={archiveExpandedGroups.includes('NOTES')} onToggle={() => toggleArchiveGroup('NOTES')}>{archiveNotesVisible.map((note) => <button className="archive-row" key={note.id} type="button" onClick={() => void openCard({ id: 'note-' + note.id, kind: 'NOTA', title: note.title, meta: note.visibility === 'PRIVATE' ? 'Privada' : 'Compartida', description: note.content })}><strong>{note.title}</strong><small>{note.visibility === 'PRIVATE' ? 'Privada' : 'Compartida'} · {dateLabel(note.updatedAt)}</small></button>)}</Archive><Archive title="Personas" count={archivePeople.length} expandable={archivePeople.length > 8} expanded={archiveExpandedGroups.includes('PEOPLE')} onToggle={() => toggleArchiveGroup('PEOPLE')}>{archivePeopleVisible.map((item) => <button className="archive-row" key={item.id} type="button" onClick={() => void openCard({ id: 'npc-' + item.id, kind: 'PNJ', title: item.name, meta: item.category || 'Persona', description: item.description || 'Sin descripción.', targetType: 'NPC', targetId: item.id })}><strong>{item.name}</strong><small>{item.category || item.narrativeRole || 'Persona'}</small></button>)}</Archive><Archive title="Lugares" count={archivePlaces.length} expandable={archivePlaces.length > 8} expanded={archiveExpandedGroups.includes('PLACES')} onToggle={() => toggleArchiveGroup('PLACES')}>{archivePlacesVisible.map((item) => <button className="archive-row" key={item.id} type="button" onClick={() => void openCard({ id: 'loc-' + item.id, kind: 'LUGAR', title: item.name, meta: item.category || 'Lugar', description: item.description || 'Sin descripción.', targetType: 'LOCATION', targetId: item.id })}><strong>{item.name}</strong><small>{item.category || 'Lugar'}</small></button>)}</Archive><Archive title="Organizaciones" count={archiveOrganizations.length} expandable={archiveOrganizations.length > 8} expanded={archiveExpandedGroups.includes('ORGANIZATIONS')} onToggle={() => toggleArchiveGroup('ORGANIZATIONS')}>{archiveOrganizationsVisible.map((item) => <button className="archive-row" key={item.id} type="button" onClick={() => void openCard({ id: 'organization-' + item.id, kind: 'ORGANIZACION', title: item.name, meta: 'Organización', description: item.summary || 'Sin descripción.', targetType: 'ORGANIZATION', targetId: item.id })}><strong>{item.name}</strong><small>Organización</small></button>)}</Archive><Archive title="Artefactos" count={archiveArtifacts.length} expandable={archiveArtifacts.length > 8} expanded={archiveExpandedGroups.includes('ARTIFACTS')} onToggle={() => toggleArchiveGroup('ARTIFACTS')}>{archiveArtifactsVisible.map((item) => <button className="archive-row" key={item.id} type="button" onClick={() => void openCard({ id: 'artifact-' + item.id, kind: 'ARTEFACTO', title: item.name, meta: 'Artefacto', description: item.summary || 'Sin descripción.', targetType: 'ARTIFACT', targetId: item.id })}><strong>{item.name}</strong><small>Artefacto</small></button>)}</Archive><Archive title="Documentos" count={archiveDocuments.length} expandable={archiveDocuments.length > 8} expanded={archiveExpandedGroups.includes('DOCUMENTS')} onToggle={() => toggleArchiveGroup('DOCUMENTS')}>{archiveDocumentsVisible.map((item) => <button className="archive-row" key={item.id} type="button" onClick={() => void openCard({ id: 'document-' + item.id, kind: 'DOCUMENTO', title: item.name, meta: 'Documento', description: item.summary || 'Sin descripción.', targetType: 'DOCUMENT', targetId: item.id })}><strong>{item.name}</strong><small>Documento</small></button>)}</Archive>{archiveVisibleCount === 0 ? <p className="space-empty archive-empty">No hay fichas que coincidan con la búsqueda o el filtro.</p> : null}</div></section> : null}
    </>}
    {noteComposerOpen ? <div className="space-overlay"><button className="space-overlay__dismiss" type="button" aria-label="Cerrar editor de nota" tabIndex={-1} onClick={closeComposer} /><form className="space-composer" onSubmit={saveNote} onClick={(event) => event.stopPropagation()}><button className="detail-close" type="button" onClick={closeComposer}>Cerrar</button><span className="space-kicker">{noteEditingId ? 'EDITAR ANOTACIÓN' : 'NUEVA ANOTACIÓN'}</span><h2>{noteEditingId ? 'Editar la anotación' : 'Escribir en la crónica'}</h2><label>Título<input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} required placeholder="Título de la nota" /></label><label>Contenido<textarea value={displayChronicleMentions(noteContent)} onChange={(event) => { const nextValue = event.target.value; const nextCaret = event.target.selectionStart ?? nextValue.length; setNoteMentionCaret(nextCaret); setNoteContent((current) => applyChronicleMentionEdit(current, nextValue)); const nextQuery = noteMentionQuery(nextValue, nextCaret); setNoteMentionSearch(nextQuery || ''); setNoteMentionMenuOpen(nextQuery !== null) }} onKeyDown={(event) => { if (event.key === 'Escape') setNoteMentionMenuOpen(false) }} required placeholder="Escribe la pista, recuerdo o decisión…" />{noteMentionMenuOpen ? <div className="space-composer__mention-menu" role="listbox" aria-label="Menciones disponibles">{filteredChronicleMentionOptions.length ? filteredChronicleMentionOptions.map((option) => <button key={option.targetType + ':' + option.targetId} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => insertChronicleMention(option)}><span>@{option.title}</span><small>{option.kind === 'PERSONAJE' ? 'Personaje jugador' : option.kind === 'PNJ' ? 'Persona' : option.kind === 'LUGAR' ? 'Lugar' : 'Recurso'}</small></button>) : <p>No hay elementos que coincidan.</p>}</div> : null}</label>{noteReferenceTarget ? <div className="note-reference-context"><span>NOTA VINCULADA A</span><strong>{noteReferenceTarget.label}</strong><button type="button" onClick={() => setNoteReferenceTarget(null)}>Quitar vínculo</button></div> : null}{noteContextImageOptions.length ? <label className="context-image-field">Imagen contextual<select value={noteContextImageTarget} onChange={(event) => setNoteContextImageTarget(event.target.value)}><option value="">Automática</option>{noteContextImageOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select><small>Solo aparecen menciones con una imagen asignada.</small></label> : null}<div className="composer-grid"><label>Visibilidad<select value={noteVisibility} onChange={(event) => setNoteVisibility(event.target.value as 'PRIVATE' | 'CHRONICLE')}><option value="PRIVATE">Privada</option><option value="CHRONICLE">Compartida</option></select></label><label>Sesión<select value={noteSessionId} onChange={(event) => setNoteSessionId(event.target.value)}><option value="">Sin sesión</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.title || 'Sesión sin título'}</option>)}</select></label></div><button className="detail-action" type="submit" disabled={savingNote}>{savingNote ? 'Guardando…' : 'Guardar nota'}</button></form></div> : null}
    {selected ? <div className="space-overlay"><button className="space-overlay__dismiss" type="button" aria-label="Cerrar ficha" tabIndex={-1} onClick={closeCard} /><aside className="space-detail" role="dialog" aria-modal="true" aria-label={selected.title} onClick={(event) => event.stopPropagation()}><button className="detail-close" type="button" onClick={closeCard}>Cerrar</button>{selected.kind !== 'NOTA' && preview ? <figure className="space-detail__visual space-detail__visual--resource"><div className="space-detail__visual-frame"><img src={preview.imageUrl || '/api/library/resources/' + selected.targetId + '/image'} alt={'Imagen de ' + selected.title} onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add('is-missing') }} /><span className="space-detail__visual-fallback" aria-hidden="true">{selected.meta}</span></div><figcaption>Ficha visual · {preview.category || kindLabel(selected.kind)}</figcaption></figure> : null}<span className="space-kicker">{kindLabel(selected.kind)} · {selected.meta}</span><h2>{selected.title}</h2>{selectedNoteContextImage ? <figure className="detail-context-image"><img src={selectedNoteContextImage.imageUrl} alt={selectedNoteContextImage.name} onError={(event) => { event.currentTarget.hidden = true }} /><figcaption>Imagen contextual · {selectedNoteContextImage.name}</figcaption></figure> : null}{previewLoading ? <p>Cargando fic{selectedRelatedNotes.length ? <section className="space-detail__related"><span>NOTAS VINCULADAS</span>{selectedRelatedNotes.map((note) => <button className="space-detail__related-note" type="button" key={note.id} onClick={() => openRelatedNote(note)}><strong>{note.title}</strong><small>{note.visibility === 'PRIVATE' ? 'Privada' : 'Compartida'} · {note.author?.displayName || note.author?.username || 'Anotación'}</small></button>)}</section> : null}ha…</p> : <><p className="detail-copy">{selected.kind === 'NOTA' && !preview ? renderMentionText(selected.description, openMention) : (preview?.description || selected.description)}</p>{preview ? <dl><div><dt>Estado</dt><dd>{preview.status}</dd></div><div><dt>Rol narrativo</dt><dd>{preview.narrativeRole || 'No indicado'}</dd></div><div><dt>Presencia</dt><dd>{(preview.metrics?.appearances ?? 0)} apariciones · {(preview.metrics?.histories ?? 0)} historias</dd></div></dl> : null}</>}{selected.kind === 'NOTA' ? <button className="detail-secondary" type="button" onClick={openEditNote}>Editar nota</button> : null}{selectedRelatedNotes.length ? <section className="space-detail__related-v3"><span>ANOTACIONES VINCULADAS</span>{selectedRelatedNotes.map((note) => <button className="space-detail__related-note-v3" type="button" key={note.id} onClick={() => openRelatedResourceNote(note)}><strong>{note.title}</strong><small>{note.visibility === 'PRIVATE' ? 'Privada' : 'Compartida'} · {note.author?.displayName || note.author?.username || 'Anotación'}</small></button>)}</section> : <p className="space-detail__related-empty-v3">No hay anotaciones vinculadas a este recurso.</p>}<button className="detail-action" type="button" onClick={closeCard}>Volver a la pizarra</button></aside></div> : null}
  </main>
}

// CHRONICLE_SPACE_VISUAL_FIX_V1
// CHRONICLE_SPACE_MENTIONS_V1
// CHRONICLE_SPACE_NOTES_V1
// CHRONICLE_SPACE_NOTE_EDIT_V1
// CHRONICLE_SPACE_BOARD_V1
// CHRONICLE_SPACE_BOARD_DRAG_HANDLE_V1
// CHRONICLE_SPACE_BOARD_SERVER_V1
// CHRONICLE_SPACE_BOARD_RESOURCE_NOTES_V1
  // CHRONICLE_SPACE_RESOURCE_RELATED_NOTES_V1
// CHRONICLE_SPACE_TIMELINE_NOTES_V1
// CHRONICLE_SPACE_TIMELINE_INDEPENDENT_LINE_V1
// CHRONICLE_SPACE_RESOURCE_RELATED_NOTES_V2
// CHRONICLE_SPACE_NOTE_MENTIONS_PICKER_V1
// CHRONICLE_NOTE_MENTIONS_FILTER_V1
// CHRONICLE_NOTE_MENTIONS_CURSOR_POSITION_V1
// CHRONICLE_SPACE_NOTE_CONTEXT_IMAGE_SELECTOR_V1
function Archive(props: { readonly title: string; readonly count: number; readonly children: ReactNode; readonly expandable?: boolean; readonly expanded?: boolean; readonly onToggle?: () => void }) { return <section className="archive-box"><header className="archive-box__header"><span>{props.title}</span><div className="archive-box__summary"><b>{props.count}</b>{props.expandable ? <button className="archive-box__expand" type="button" onClick={props.onToggle}>{props.expanded ? 'Mostrar menos' : 'Mostrar todas'}</button> : null}</div></header>{props.children}</section> }

// CHRONICLE_SPACE_BOARD_FREE_OVERLAP_V2 — el jugador decide la composición; se permite el solapamiento.

// CHRONICLE_SPACE_BOARD_FREE_OVERLAP_V3 — el selector de crónica permanece operativo y la composición es libre.

// CHRONICLE_SPACE_BOARD_CONNECTION_EDITOR_V1
// CHRONICLE_SPACE_BOARD_CONNECTION_DIRECTION_LENGTH_V1 — la dirección refleja el orden elegido por el jugador.

// CHRONICLE_SPACE_BOARD_CONNECTION_EXTEND_V1 — los extremos llegan un poco más cerca de las tarjetas.

// CHRONICLE_SPACE_BOARD_SMOOTH_DRAG_CONNECTIONS_V1 — arrastre en píxeles y extremos ajustados al borde.

// CHRONICLE_SPACE_BOARD_CONNECTION_FILTERS_V1 — búsqueda y filtros del listado de relaciones.

// CHRONICLE_SPACE_BOARD_CONNECTION_FOCUS_V1 — foco visual y desplazamiento hacia relaciones.

// CHRONICLE_SPACE_BOARD_CARD_FOCUS_V1 — foco contextual desde una tarjeta con acción de apertura explícita.

// CHRONICLE_SPACE_BOARD_NAVIGATION_V1 — zoom acotado y restablecimiento de la superficie.

// CHRONICLE_SPACE_BOARD_NAVIGATION_FOCUS_V1 — el foco centra la tarjeta y Ver toda encuadra la superficie.

// CHRONICLE_SPACE_BOARD_MOBILE_ACTIONS_V1 — acciones visibles en móvil para la tarjeta enfocada.

// CHRONICLE_SPACE_NOTE_CONTEXT_IMAGE_ANY_REFERENCE_V1

// RESEARCH_ROOM_LABEL_V1

// CHRONICLE_SPACE_GLOBAL_HEADER_V1
