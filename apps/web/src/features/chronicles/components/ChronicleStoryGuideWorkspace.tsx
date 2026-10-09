import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react'

import type {
  ChronicleStoryGuide,
  ChronicleStoryApiSnapshot,
  ChronicleStoryGuideCard,
  ChronicleStoryGuideCardKind,
  ChronicleStoryGuideCardState,
  ChronicleStoryGuideConnection,
  ChronicleStoryGuideConnectionColor,
} from '../types/chronicle-story-api.types'

import './chronicle-story-guide-workspace.css'
import { resolveStoryGuideLink } from '../domain/story-guide-links'
import { FIRST_GUIDE_PAGE, continueGuideOnNewPage, guideCardPages, guidePageCards, guidePageConnections, normalizeGuidePages, removeGuideCardAppearance, updateGuideCardPosition } from '../domain/story-guide-pages'

const emptyGuide: ChronicleStoryGuide = { cards: [], connections: [] }
const cardKinds: readonly { readonly value: ChronicleStoryGuideCardKind; readonly label: string }[] = [
  { value: 'clue', label: 'Pista' },
  { value: 'npc', label: 'Personaje' },
  { value: 'location', label: 'Lugar' },
  { value: 'document', label: 'Documento / recurso' },
  { value: 'event', label: 'Suceso' },
  { value: 'decision', label: 'Decisión' },
  { value: 'outcome', label: 'Resultado' },
]
const cardStates: readonly { readonly value: ChronicleStoryGuideCardState; readonly label: string }[] = [
  { value: 'hidden', label: 'Secreto / pendiente' },
  { value: 'discovered', label: 'Descubierto por la coterie' },
  { value: 'resolved', label: 'Resuelto' },
]
const colors: readonly { readonly value: ChronicleStoryGuideConnectionColor; readonly label: string }[] = [
  { value: 'rose', label: 'Carmesí' },
  { value: 'gold', label: 'Oro' },
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
]
const kindLabel = Object.fromEntries(cardKinds.map((kind) => [kind.value, kind.label])) as Record<ChronicleStoryGuideCardKind, string>

function newId(): string {
  if (globalThis.crypto?.randomUUID !== undefined) return globalThis.crypto.randomUUID()
  const bytes = new Uint8Array(16)
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256)
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

interface Props {
  readonly storyId: string
  readonly stories: readonly ChronicleStoryApiSnapshot[]
  readonly initialCardId?: string
  readonly onStoryLink: (storyId: string, cardId?: string) => void
  readonly initialPageId?: string
  readonly onPageChange?: (pageId: string) => void
  readonly guide: ChronicleStoryGuide | null | undefined
  readonly readOnly: boolean
  readonly saving: boolean
  readonly onDirtyChange: (dirty: boolean) => void
  readonly onSave: (guide: ChronicleStoryGuide) => Promise<boolean>
}

export function ChronicleStoryGuideWorkspace({ guide, readOnly, saving, onDirtyChange, onSave, initialPageId, onPageChange, storyId, stories, initialCardId, onStoryLink }: Props) {
  const [draft, setDraft] = useState<ChronicleStoryGuide>(() => normalizeGuidePages(guide ?? emptyGuide))
  const [pageId, setPageId] = useState(() => guide?.pages?.some((page) => page.id === initialPageId) ? initialPageId! : guide?.pages?.[0]?.id ?? FIRST_GUIDE_PAGE)
  const [pageEditorOpen, setPageEditorOpen] = useState(false)
  const [editingPage, setEditingPage] = useState(false)
  const [pageTitle, setPageTitle] = useState('')
  const [continuingCardId, setContinuingCardId] = useState<string | null>(null)
  const pageDialogRef = useRef<HTMLDialogElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [focusedCard, setFocusedCard] = useState<string | null>(initialCardId ?? null)
  const [selectedId, setSelectedId] = useState<string | null>(initialCardId ?? guide?.cards[0]?.id ?? null)
  const [targetStoryId, setTargetStoryId] = useState('')
  const [targetCardId, setTargetCardId] = useState('')
  const [storyLinkLabel, setStoryLinkLabel] = useState('')
  const [zoom, setZoom] = useState(1)
  const [newKind, setNewKind] = useState<ChronicleStoryGuideCardKind>('clue')
  const [newTitle, setNewTitle] = useState('')
  const [connectionTarget, setConnectionTarget] = useState('')
  const [connectionLabel, setConnectionLabel] = useState('')
  const [connectionColor, setConnectionColor] = useState<ChronicleStoryGuideConnectionColor>('rose')
  const [dirty, setDirty] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (editorOpen && dialogRef.current !== null && !dialogRef.current.open) dialogRef.current.showModal()
  }, [editorOpen])

  useEffect(() => {
    if (pageEditorOpen && pageDialogRef.current !== null && !pageDialogRef.current.open) pageDialogRef.current.showModal()
  }, [pageEditorOpen])

  useEffect(() => {
    if (focusedCard === null) return
    const card = guidePageCards(draft, pageId).find((item) => item.id === focusedCard)
    if (card !== undefined) viewportRef.current?.scrollTo({
      left: Math.max(0, card.x * zoom - 32), top: Math.max(0, card.y * zoom - 32), behavior: 'auto',
    })
  }, [focusedCard, pageId, zoom, draft.cards])

  function openEditor(id: string | null) {
    setSelectedId(id)
    setConnectionTarget('')
    setConnectionLabel('')
    setTargetStoryId('')
    setTargetCardId('')
    setStoryLinkLabel('')
    setEditorOpen(true)
  }

  const selected = draft.cards.find((card) => card.id === selectedId) ?? null
  const cardById = useMemo(() => new Map(draft.cards.map((card) => [card.id, card])), [draft.cards])
  const pages = draft.pages ?? []
  const currentPage = pages.find((page) => page.id === pageId)
  const visibleCards = guidePageCards(draft, pageId)
  const visibleConnections = guidePageConnections(draft, pageId)
  const visibleById = new Map(visibleCards.map((card) => [card.id, card]))
  const pageName = (id: string | undefined) => pages.find((page) => page.id === id)?.title ?? 'Inicio'

  function goToCard(id: string, destinationPageId?: string) {
    const card = cardById.get(id)
    if (card === undefined) return
    const destination = destinationPageId ?? (guideCardPages(card).includes(pageId) ? pageId : card.pageId ?? FIRST_GUIDE_PAGE)
    if (!guideCardPages(card).includes(destination)) return
    setPageId(destination)
    onPageChange?.(destination)
    setSelectedId(id)
    setFocusedCard(id)
    setEditorOpen(false)
  }

  function switchPage(id: string) {
    setPageId(id)
    onPageChange?.(id)
    setSelectedId(null)
    setFocusedCard(null)
    viewportRef.current?.scrollTo({ left: 0, top: 0 })
  }

  function savePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly || !pageTitle.trim() || (!editingPage && pages.length >= 30)) return
    const id = editingPage ? pageId : newId()
    if (continuingCardId !== null && !editingPage) {
      changeGuide(continueGuideOnNewPage(draft, continuingCardId, pageId, id, pageTitle))
      setPageId(id)
      onPageChange?.(id)
      setSelectedId(continuingCardId)
      setFocusedCard(continuingCardId)
    } else {
      changeGuide({ ...draft, pages: editingPage
      ? pages.map((page) => page.id === id ? { ...page, title: pageTitle.trim() } : page)
      : [...pages, { id, title: pageTitle.trim() }] })
      switchPage(id)
    }
    setPageEditorOpen(false)
    setContinuingCardId(null)
  }

  function openContinuation(id: string) {
    if (readOnly || pages.length >= 30 || !visibleById.has(id)) return
    setEditorOpen(false)
    setContinuingCardId(id)
    setEditingPage(false)
    setPageTitle('')
    setPageEditorOpen(true)
  }

  function renderPageLinks(card: ChronicleStoryGuideCard) {
    const links = (card.appearances ?? []).flatMap((item) => item.sourcePageId === pageId
      ? [{ destination: item.pageId, label: `Continuar en ${pageName(item.pageId)} →` }]
      : item.pageId === pageId ? [{ destination: item.sourcePageId, label: `← Volver a ${pageName(item.sourcePageId)}` }] : [])
    if (links.length === 0) return null
    if (links.length === 1) {
      const link = links[0]!
      return <button className="story-guide-card__page-link" type="button" onClick={(event) => { event.stopPropagation(); goToCard(card.id, link.destination) }}>{link.label}</button>
    }
    return <select className="story-guide-card__page-link" aria-label={`Continuaciones de ${card.title}`} value="" onClick={(event) => event.stopPropagation()} onChange={(event) => goToCard(card.id, event.target.value)}>
      <option value="">Ir a otra página… ({links.length})</option>
      {links.map((link) => <option key={link.destination} value={link.destination}>{link.label}</option>)}
    </select>
  }

  function changeGuide(next: ChronicleStoryGuide) {
    setDraft(next)
    setDirty(true)
    onDirtyChange(true)
  }

  function updateCard(id: string, patch: Partial<ChronicleStoryGuideCard>) {
    changeGuide({ ...draft, cards: draft.cards.map((card) => card.id === id ? { ...card, ...patch } : card) })
  }

  function addCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTitle.trim()
    if (readOnly || title.length === 0 || draft.cards.length >= 120) return
    const nextCard: ChronicleStoryGuideCard = {
      id: newId(), pageId, kind: newKind, state: 'hidden', title, summary: '', narratorNote: '',
      x: 32 + (visibleCards.length % 3) * 318,
      y: 32 + Math.floor(visibleCards.length / 3) * 240,
    }
    changeGuide({ ...draft, cards: [...draft.cards, nextCard] })
    setSelectedId(nextCard.id)
    setNewTitle('')
    setEditorOpen(false)
  }

  function addConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly || selected === null || connectionTarget.length === 0 || selected.id === connectionTarget || draft.connections.length >= 240) return
    const duplicate = draft.connections.some((connection) => connection.from === selected.id && connection.to === connectionTarget)
    if (duplicate) return
    const connection: ChronicleStoryGuideConnection = {
      id: newId(), from: selected.id, to: connectionTarget, label: connectionLabel.trim(), color: connectionColor,
    }
    changeGuide({ ...draft, connections: [...draft.connections, connection] })
    setConnectionLabel('')
  }

  function onCardPointerDown(event: ReactPointerEvent<HTMLElement>, card: ChronicleStoryGuideCard) {
    // Link controls must not start a drag.
    if (readOnly || (event.target as HTMLElement).closest('button, select')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.dataset.dragStartX = String(event.clientX)
    event.currentTarget.dataset.dragStartY = String(event.clientY)
    event.currentTarget.dataset.cardStartX = String(card.x)
    event.currentTarget.dataset.cardStartY = String(card.y)
    setFocusedCard(null)
    setSelectedId(card.id)
  }

  function onCardPointerMove(event: ReactPointerEvent<HTMLElement>, card: ChronicleStoryGuideCard) {
    const element = event.currentTarget
    if (!element.hasPointerCapture(event.pointerId) || readOnly) return
    const startX = Number(element.dataset.dragStartX)
    const startY = Number(element.dataset.dragStartY)
    const cardX = Number(element.dataset.cardStartX)
    const cardY = Number(element.dataset.cardStartY)
    changeGuide(updateGuideCardPosition(draft, card.id, pageId,
      Math.max(0, Math.min(920, cardX + (event.clientX - startX) / zoom)),
      Math.max(0, Math.min(560, cardY + (event.clientY - startY) / zoom))))
  }

  const canvasWidth = Math.max(1200, ...visibleCards.map((card) => card.x + 280))
  function addStoryLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly || selected === null || !targetStoryId || targetStoryId === storyId) return
    const links = selected.storyLinks ?? []
    const link = { id: newId(), storyId: targetStoryId, ...(targetCardId ? { cardId: targetCardId } : {}), label: storyLinkLabel.trim() }
    if (links.length >= 8 || !resolveStoryGuideLink(stories, link).available || links.some((item) => item.storyId === targetStoryId && item.cardId === link.cardId)) return
    updateCard(selected.id, { storyLinks: [...links, link] })
    setStoryLinkLabel('')
  }
  const canvasHeight = Math.max(700, ...visibleCards.map((card) => card.y + 260))

  return (
    <section className="story-guide" aria-label="Guion privado del Narrador">
      <header className="story-guide__toolbar">
        <div><span>FLUJO DE PISTAS</span><p>Organiza la verdad y las rutas posibles. Solo tú ves este guion.</p></div>
        <div className="story-guide__toolbar-actions">
          <span className="story-guide__private"><i /> Solo visible para ti</span>
          <button type="button" className="story-guide__add-toolbar" disabled={readOnly || draft.cards.length >= 120} onClick={() => openEditor(null)}>＋ Añadir tarjeta</button>
          {dirty ? <span className="story-guide__unsaved">Cambios sin guardar</span> : null}
          <button type="button" disabled={readOnly || saving || !dirty} onClick={() => void onSave(draft).then((saved) => { if (saved) { setDirty(false); onDirtyChange(false) } })}>{saving ? 'Guardando…' : dirty ? 'Guardar guion' : '✓ Guardado'}</button>
        </div>
      </header>

      <nav className="story-guide__pages" aria-label="Páginas del guion">
        {pages.map((page) => <button key={page.id} type="button" aria-current={page.id === pageId ? 'page' : undefined} onClick={() => switchPage(page.id)}>{page.title} <small>{guidePageCards(draft, page.id).length}</small></button>)}
        <button type="button" disabled={readOnly || pages.length >= 30} onClick={() => { setContinuingCardId(null); setEditingPage(false); setPageTitle(''); setPageEditorOpen(true) }}>＋ Página</button>
      </nav>
      <div className="story-guide__page-context">
        <span>Página {pages.findIndex((page) => page.id === pageId) + 1} de {pages.length} · {currentPage?.title} · {visibleCards.length} tarjetas</span>
        <button type="button" disabled={readOnly} onClick={() => { setContinuingCardId(null); setEditingPage(true); setPageTitle(currentPage?.title ?? ''); setPageEditorOpen(true) }}>Renombrar</button>
        <button type="button" disabled={readOnly || pages.length <= 1 || visibleCards.length > 0} onClick={() => {
          if (readOnly || visibleCards.length || pages.length <= 1) return
          const remaining = pages.filter((page) => page.id !== pageId)
          changeGuide({ ...draft, pages: remaining })
          switchPage(remaining[0]!.id)
        }}>Eliminar página vacía</button>
      </div>
      <div className="story-guide__continuations" aria-label="Conexiones con otras páginas">
        {draft.connections.map((connection) => {
          const from = cardById.get(connection.from)
          const to = cardById.get(connection.to)
          if (!from || !to || visibleById.has(from.id) === visibleById.has(to.id)) return null
          const outgoing = visibleById.has(from.id)
          return <div key={connection.id} className="story-guide__portal">
            <small>{outgoing ? 'Continúa en otra página' : 'Viene de otra página'} · {pageName(outgoing ? to.pageId : from.pageId)}</small>
            <strong>{from.title} → {to.title}</strong>
            <span>{connection.label || 'Se relaciona con'}</span>
            <button type="button" onClick={() => goToCard(outgoing ? to.id : from.id)}>{outgoing ? 'Abrir destino →' : '← Volver al origen'}</button>
          </div>
        })}
      </div>

      <div className="story-guide__layout">
        <div className="story-guide__board-wrap">
          <div className="story-guide__board-tools">
            <button type="button" disabled={readOnly} onClick={() => setZoom((value) => Math.max(0.65, value - 0.1))}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" disabled={readOnly} onClick={() => setZoom((value) => Math.min(1.25, value + 0.1))}>＋</button>
            <span className="story-guide__tool-separator" />
            <span className="story-guide__board-hint">Arrastra las tarjetas para ordenar el flujo · Editar abre notas y conexiones</span>
          </div>
          <div className="story-guide__viewport" ref={viewportRef}>
            {visibleCards.length === 0 ? (
              <div className="story-guide__empty"><span>✦</span><h3>Empieza con una pista</h3><p>Añade lo que la coterie encuentra primero. Después conecta esa pista con personas, lugares, documentos o decisiones.</p></div>
            ) : (
              <div className="story-guide__canvas-scale" style={{ width: canvasWidth * zoom, height: canvasHeight * zoom }}>
                <div className="story-guide__canvas" style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${zoom})` }}>
                  <svg className="story-guide__edges" width={canvasWidth} height={canvasHeight} aria-label="Conexiones entre tarjetas">
                    <defs>{colors.map((color) => <marker key={color.value} id={`story-guide-arrow-${color.value}`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" /></marker>)}</defs>
                    {visibleConnections.map((connection) => {
                      const from = visibleById.get(connection.from)
                      const to = visibleById.get(connection.to)
                      if (from === undefined || to === undefined) return null
                      const x1 = from.x + 260
                      const y1 = from.y + 62
                      const x2 = to.x
                      const y2 = to.y + 62
                      const bend = Math.max(42, Math.abs(x2 - x1) * 0.45)
                      const path = `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
                      const middleX = (x1 + x2) / 2
                      const middleY = (y1 + y2) / 2 - 9
                      return <g key={connection.id} className={`is-${connection.color}`}><path d={path} markerEnd={`url(#story-guide-arrow-${connection.color})`} /><text x={middleX} y={middleY}>{connection.label || 'se relaciona con'}</text></g>
                    })}
                  </svg>
                  {visibleCards.map((card) => <article
                    key={card.id}
                    className={`story-guide-card story-guide-card--${card.kind} story-guide-card--${card.state}${selectedId === card.id ? ' is-selected' : ''}`}
                    style={{ left: card.x, top: card.y }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedId === card.id}
                    onClick={() => setSelectedId(card.id)}
                    onDoubleClick={() => openEditor(card.id)}
                    onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openEditor(card.id) } }}
                    onPointerDown={(event) => onCardPointerDown(event, card)}
                    onPointerMove={(event) => onCardPointerMove(event, card)}
                    onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}
                  >
                    <span className="story-guide-card__kind">{kindLabel[card.kind]} · {card.state === 'hidden' ? 'Secreto' : card.state === 'discovered' ? 'Descubierto' : 'Resuelto'}</span>
                    <strong>{card.title}</strong>
                    <p>{card.summary || 'Añade una breve descripción…'}</p>
                    <small>{card.narratorNote ? '✦ Nota privada' : 'Movible · arrastrar'}</small>
                    <div className="story-guide-card__actions">
                      <button className="story-guide-card__continue" type="button" aria-label={`Continuar en una nueva página desde ${card.title}`} disabled={readOnly || pages.length >= 30} onClick={(event) => { event.stopPropagation(); openContinuation(card.id) }}>＋ Nueva página</button>
                      <button className="story-guide-card__edit" type="button" onClick={(event) => { event.stopPropagation(); openEditor(card.id) }}>Editar</button>
                    </div>
                    {renderPageLinks(card)}
                    {(card.storyLinks?.length ?? 0) > 0 ? <select className="story-guide-card__page-link" aria-label={`Enlaces a otras historias desde ${card.title}`} value="" onClick={(event) => event.stopPropagation()} onChange={(event) => {
                      const link = card.storyLinks?.find((item) => item.id === event.target.value)
                      if (link && resolveStoryGuideLink(stories, link).available) onStoryLink(link.storyId, link.cardId)
                    }}><option value="">↗ Otra historia… ({card.storyLinks!.length})</option>{card.storyLinks!.map((link) => {
                      const target = resolveStoryGuideLink(stories, link)
                      return <option key={link.id} value={link.id} disabled={!target.available}>{target.label}</option>
                    })}</select> : null}
                  </article>)}
                </div>
              </div>
            )}
          </div>
        </div>

        {editorOpen ? <dialog ref={dialogRef} className="story-guide__dialog" aria-labelledby="story-guide-editor-title" onCancel={() => setEditorOpen(false)} onClose={() => setEditorOpen(false)}>
          <header className="story-guide__dialog-header"><h3 id="story-guide-editor-title">{selected === null ? 'Añadir tarjeta' : 'Tarjeta · notas y conexiones'}</h3><button type="button" aria-label="Cerrar editor" onClick={() => setEditorOpen(false)}>×</button></header>
          <div className="story-guide__inspector">
          {selected === null ? <>
            <div className="story-guide__inspector-heading"><span>TU PREPARACIÓN PRIVADA</span><strong>Tarjetas del guion</strong><small>{draft.cards.length} tarjetas · {draft.connections.length} conexiones</small></div>
            <form className="story-guide__add-form" onSubmit={addCard}>
              <label>Tipo<select value={newKind} disabled={readOnly} onChange={(event) => setNewKind(event.target.value as ChronicleStoryGuideCardKind)}>{cardKinds.map((kind) => <option value={kind.value} key={kind.value}>{kind.label}</option>)}</select></label>
              <label>Título<input autoFocus value={newTitle} disabled={readOnly} maxLength={140} onChange={(event) => setNewTitle(event.target.value)} placeholder="Ej. El sello de la morgue" /></label>
              <button type="submit" disabled={readOnly || newTitle.trim().length === 0}>＋ Añadir tarjeta</button>
            </form>
            <p className="story-guide__privacy-note">Este mapa es tu preparación. No se publica ni se copia automáticamente a la pizarra compartida.</p>
          </> : <>
            <div className="story-guide__inspector-heading"><span>TARJETA SELECCIONADA</span><strong>{selected.title}</strong><small>{kindLabel[selected.kind]}</small></div>
            <label className="story-guide__field">Título<input value={selected.title} disabled={readOnly} maxLength={140} onChange={(event) => updateCard(selected.id, { title: event.target.value })} /></label>
            <label className="story-guide__field">Página de origen<select value={selected.pageId} disabled={readOnly || (selected.appearances?.length ?? 0) > 0} onChange={(event) => {
              updateCard(selected.id, { pageId: event.target.value })
              setPageId(event.target.value)
              onPageChange?.(event.target.value)
              setFocusedCard(selected.id)
            }}>{pages.map((page) => <option key={page.id} value={page.id}>{page.title}</option>)}</select></label>
            {(selected.appearances?.length ?? 0) > 0 ? <p className="story-guide__privacy-note">Una sola tarjeta compartida entre páginas. Título, descripción, nota y estado se actualizan en todas; la posición es independiente. El origen se conserva mientras tenga continuaciones.</p> : null}
            <button type="button" className="story-guide__continue-button" disabled={readOnly || pages.length >= 30} onClick={() => openContinuation(selected.id)}>Continuar en una nueva página</button>
            {selected.pageId !== pageId ? <button type="button" disabled={readOnly} onClick={() => {
              changeGuide(removeGuideCardAppearance(draft, selected.id, pageId))
              setSelectedId(null)
              setEditorOpen(false)
            }}>Quitar solo de esta página</button> : null}
            <label className="story-guide__field">Descripción<textarea value={selected.summary} disabled={readOnly} maxLength={1200} rows={3} onChange={(event) => updateCard(selected.id, { summary: event.target.value })} placeholder="¿Qué encuentran o descubren?" /></label>
            <label className="story-guide__field">Nota privada del Narrador<textarea value={selected.narratorNote} disabled={readOnly} maxLength={4000} rows={3} onChange={(event) => updateCard(selected.id, { narratorNote: event.target.value })} placeholder="La verdad, condición o consecuencia…" /></label>
            <label className="story-guide__field">Estado<select value={selected.state} disabled={readOnly} onChange={(event) => updateCard(selected.id, { state: event.target.value as ChronicleStoryGuideCardState })}>{cardStates.map((state) => <option value={state.value} key={state.value}>{state.label}</option>)}</select></label>

            <form className="story-guide__connection-form" onSubmit={addStoryLink}>
              <strong>Enlazar con otra historia</strong>
              <label>Historia de destino<select value={targetStoryId} disabled={readOnly} onChange={(event) => { setTargetStoryId(event.target.value); setTargetCardId('') }}><option value="">Elige otra historia</option>{stories.filter((item) => item.id !== storyId).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
              <label>Destino<select value={targetCardId} disabled={readOnly || !targetStoryId} onChange={(event) => setTargetCardId(event.target.value)}><option value="">Inicio del guion</option>{stories.find((item) => item.id === targetStoryId)?.narratorGuide?.cards.map((card) => <option key={card.id} value={card.id}>{card.title}</option>)}</select></label>
              <label>Significado<input maxLength={120} value={storyLinkLabel} disabled={readOnly} onChange={(event) => setStoryLinkLabel(event.target.value)} placeholder="Ej. Esta pista abre el arco personal" /></label>
              <button type="submit" disabled={readOnly || !targetStoryId || (selected.storyLinks?.length ?? 0) >= 8}>＋ Añadir enlace</button>
              <small>Preparación privada. No mueve tarjetas ni publica información.</small>
            </form>
            <div className="story-guide__selected-connections"><strong>Otras historias</strong>{(selected.storyLinks ?? []).map((link) => {
              const target = resolveStoryGuideLink(stories, link)
              return <div key={link.id}><span>{link.label || 'Continúa en'} → {target.label}</span><button type="button" disabled={!target.available} onClick={() => onStoryLink(link.storyId, link.cardId)}>Abrir destino</button><button type="button" aria-label="Eliminar enlace entre historias" disabled={readOnly} onClick={() => updateCard(selected.id, { storyLinks: selected.storyLinks?.filter((item) => item.id !== link.id) })}>×</button></div>
            })}</div>
            <form className="story-guide__connection-form" onSubmit={addConnection}>
              <strong>Crear conexión</strong>
              <label>Esta tarjeta lleva a<select value={connectionTarget} disabled={readOnly || draft.cards.length < 2} onChange={(event) => setConnectionTarget(event.target.value)}><option value="">Elige otra tarjeta</option>{pages.map((page) => <optgroup key={page.id} label={page.title}>{guidePageCards(draft, page.id).filter((card) => card.id !== selected.id).map((card) => <option key={card.id} value={card.id}>{card.title}</option>)}</optgroup>)}</select></label>
              <label>Significado<input value={connectionLabel} disabled={readOnly} maxLength={120} onChange={(event) => setConnectionLabel(event.target.value)} placeholder="Ej. Elena reconoce el símbolo" /></label>
              <label>Color<select value={connectionColor} disabled={readOnly} onChange={(event) => setConnectionColor(event.target.value as ChronicleStoryGuideConnectionColor)}>{colors.map((color) => <option value={color.value} key={color.value}>{color.label}</option>)}</select></label>
              <button type="submit" disabled={readOnly || !connectionTarget || connectionTarget === selected.id || draft.connections.length >= 240}>＋ Añadir flecha</button>
            </form>

            <div className="story-guide__selected-connections"><strong>Sale hacia</strong>{draft.connections.filter((connection) => connection.from === selected.id).map((connection) => <div key={connection.id}><span>{connection.label || 'Se relaciona con'} → {cardById.get(connection.to)?.title ?? 'Tarjeta'} · {pageName(cardById.get(connection.to)?.pageId)}</span><button type="button" onClick={() => goToCard(connection.to)}>Abrir destino</button><button type="button" aria-label="Eliminar conexión" disabled={readOnly} onClick={() => changeGuide({ ...draft, connections: draft.connections.filter((item) => item.id !== connection.id) })}>×</button></div>)}{draft.connections.every((connection) => connection.from !== selected.id) ? <small>Aún no hay salidas. Puedes crear más de una ruta.</small> : null}</div>
            <div className="story-guide__inspector-actions"><button type="button" className="story-guide__text-button" onClick={() => setEditorOpen(false)}>Volver al lienzo</button><button type="button" className="story-guide__delete-button" disabled={readOnly} onClick={() => {
              if ((selected.appearances?.length ?? 0) > 0 && !window.confirm('Esta tarjeta está en varias páginas. ¿Eliminarla de todas, junto con sus conexiones?')) return
              changeGuide({ ...draft, cards: draft.cards.filter((card) => card.id !== selected.id), connections: draft.connections.filter((item) => item.from !== selected.id && item.to !== selected.id) }); setSelectedId(null); setEditorOpen(false)
            }}>{(selected.appearances?.length ?? 0) > 0 ? 'Eliminar de todas las páginas' : 'Eliminar tarjeta'}</button></div>
            <p className="story-guide__privacy-note">Al descubrirla, comparte la información manualmente en la pizarra de la coterie si corresponde.</p>
          </>}
          </div>
          <footer className="story-guide__dialog-footer"><span>Los cambios quedan en el borrador hasta guardar el guion.</span><button type="button" onClick={() => setEditorOpen(false)}>Listo · volver al lienzo</button></footer>
        </dialog> : null}
        {pageEditorOpen ? <dialog ref={pageDialogRef} className="story-guide__dialog" aria-labelledby="story-guide-page-title" onCancel={() => setPageEditorOpen(false)} onClose={() => setPageEditorOpen(false)}>
          <header className="story-guide__dialog-header"><h3 id="story-guide-page-title">{editingPage ? 'Renombrar página' : continuingCardId ? 'Continuar en una nueva página' : 'Añadir página'}</h3><button type="button" aria-label="Cerrar" onClick={() => setPageEditorOpen(false)}>×</button></header>
          <form className="story-guide__inspector" onSubmit={savePage}>
            <label className="story-guide__field">Nombre<input autoFocus required maxLength={80} value={pageTitle} disabled={readOnly} onChange={(event) => setPageTitle(event.target.value)} placeholder="Ej. Investigación" /></label>
            <p className="story-guide__privacy-note">{continuingCardId ? 'La tarjeta seguirá en la página actual y será la primera de la nueva. Es una sola tarjeta: sus datos se comparten y su posición es independiente.' : 'Cada página es un lienzo del mismo guion privado. Las tarjetas pueden conectarse entre páginas sin duplicarse.'} Guarda el guion para conservar los cambios.</p>
            <button type="submit" disabled={readOnly || !pageTitle.trim()}>{editingPage ? 'Aplicar nombre' : continuingCardId ? 'Crear página y continuar' : 'Crear página'}</button>
          </form>
        </dialog> : null}
      </div>
    </section>
  )
}
