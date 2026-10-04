import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react'

import type {
  ChronicleStoryGuide,
  ChronicleStoryGuideCard,
  ChronicleStoryGuideCardKind,
  ChronicleStoryGuideCardState,
  ChronicleStoryGuideConnection,
  ChronicleStoryGuideConnectionColor,
} from '../types/chronicle-story-api.types'

import './chronicle-story-guide-workspace.css'

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
  readonly guide: ChronicleStoryGuide | null | undefined
  readonly readOnly: boolean
  readonly saving: boolean
  readonly onDirtyChange: (dirty: boolean) => void
  readonly onSave: (guide: ChronicleStoryGuide) => Promise<boolean>
}

export function ChronicleStoryGuideWorkspace({ guide, readOnly, saving, onDirtyChange, onSave }: Props) {
  const [draft, setDraft] = useState<ChronicleStoryGuide>(guide ?? emptyGuide)
  const [selectedId, setSelectedId] = useState<string | null>(guide?.cards[0]?.id ?? null)
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

  function openEditor(id: string | null) {
    setSelectedId(id)
    setConnectionTarget('')
    setConnectionLabel('')
    setEditorOpen(true)
  }

  const selected = draft.cards.find((card) => card.id === selectedId) ?? null
  const cardById = useMemo(() => new Map(draft.cards.map((card) => [card.id, card])), [draft.cards])

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
    if (readOnly || title.length === 0) return
    const nextCard: ChronicleStoryGuideCard = {
      id: newId(), kind: newKind, state: 'hidden', title, summary: '', narratorNote: '',
      x: 32 + (draft.cards.length % 3) * 318,
      y: 32 + Math.floor(draft.cards.length / 3) * 174,
    }
    changeGuide({ ...draft, cards: [...draft.cards, nextCard] })
    setSelectedId(nextCard.id)
    setNewTitle('')
    setEditorOpen(false)
  }

  function addConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly || selected === null || connectionTarget.length === 0 || selected.id === connectionTarget) return
    const duplicate = draft.connections.some((connection) => connection.from === selected.id && connection.to === connectionTarget)
    if (duplicate) return
    const connection: ChronicleStoryGuideConnection = {
      id: newId(), from: selected.id, to: connectionTarget, label: connectionLabel.trim(), color: connectionColor,
    }
    changeGuide({ ...draft, connections: [...draft.connections, connection] })
    setConnectionLabel('')
  }

  function onCardPointerDown(event: ReactPointerEvent<HTMLElement>, card: ChronicleStoryGuideCard) {
    if (readOnly || (event.target as HTMLElement).closest('button')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.dataset.dragStartX = String(event.clientX)
    event.currentTarget.dataset.dragStartY = String(event.clientY)
    event.currentTarget.dataset.cardStartX = String(card.x)
    event.currentTarget.dataset.cardStartY = String(card.y)
    setSelectedId(card.id)
  }

  function onCardPointerMove(event: ReactPointerEvent<HTMLElement>, card: ChronicleStoryGuideCard) {
    const element = event.currentTarget
    if (!element.hasPointerCapture(event.pointerId) || readOnly) return
    const startX = Number(element.dataset.dragStartX)
    const startY = Number(element.dataset.dragStartY)
    const cardX = Number(element.dataset.cardStartX)
    const cardY = Number(element.dataset.cardStartY)
    updateCard(card.id, {
      x: Math.max(0, Math.min(920, cardX + (event.clientX - startX) / zoom)),
      y: Math.max(0, Math.min(560, cardY + (event.clientY - startY) / zoom)),
    })
  }

  const canvasWidth = 1200
  const canvasHeight = Math.max(700, ...draft.cards.map((card) => card.y + 150))

  return (
    <section className="story-guide" aria-label="Guion privado del Narrador">
      <header className="story-guide__toolbar">
        <div><span>FLUJO DE PISTAS</span><p>Organiza la verdad y las rutas posibles. Solo tú ves este guion.</p></div>
        <div className="story-guide__toolbar-actions">
          <span className="story-guide__private"><i /> Solo visible para ti</span>
          <button type="button" className="story-guide__add-toolbar" disabled={readOnly} onClick={() => openEditor(null)}>＋ Añadir tarjeta</button>
          {dirty ? <span className="story-guide__unsaved">Cambios sin guardar</span> : null}
          <button type="button" disabled={readOnly || saving || !dirty} onClick={() => void onSave(draft).then((saved) => { if (saved) { setDirty(false); onDirtyChange(false) } })}>{saving ? 'Guardando…' : dirty ? 'Guardar guion' : '✓ Guardado'}</button>
        </div>
      </header>

      <div className="story-guide__layout">
        <div className="story-guide__board-wrap">
          <div className="story-guide__board-tools">
            <button type="button" disabled={readOnly} onClick={() => setZoom((value) => Math.max(0.65, value - 0.1))}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" disabled={readOnly} onClick={() => setZoom((value) => Math.min(1.25, value + 0.1))}>＋</button>
            <span className="story-guide__tool-separator" />
            <span className="story-guide__board-hint">Arrastra las tarjetas para ordenar el flujo · Editar abre notas y conexiones</span>
          </div>
          <div className="story-guide__viewport">
            {draft.cards.length === 0 ? (
              <div className="story-guide__empty"><span>✦</span><h3>Empieza con una pista</h3><p>Añade lo que la coterie encuentra primero. Después conecta esa pista con personas, lugares, documentos o decisiones.</p></div>
            ) : (
              <div className="story-guide__canvas-scale" style={{ width: canvasWidth * zoom, height: canvasHeight * zoom }}>
                <div className="story-guide__canvas" style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${zoom})` }}>
                  <svg className="story-guide__edges" width={canvasWidth} height={canvasHeight} aria-label="Conexiones entre tarjetas">
                    <defs>{colors.map((color) => <marker key={color.value} id={`story-guide-arrow-${color.value}`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" /></marker>)}</defs>
                    {draft.connections.map((connection) => {
                      const from = cardById.get(connection.from)
                      const to = cardById.get(connection.to)
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
                  {draft.cards.map((card) => <article
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
                    <button className="story-guide-card__edit" type="button" onClick={(event) => { event.stopPropagation(); openEditor(card.id) }}>Editar</button>
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
            <label className="story-guide__field">Descripción<textarea value={selected.summary} disabled={readOnly} maxLength={1200} rows={3} onChange={(event) => updateCard(selected.id, { summary: event.target.value })} placeholder="¿Qué encuentran o descubren?" /></label>
            <label className="story-guide__field">Nota privada del Narrador<textarea value={selected.narratorNote} disabled={readOnly} maxLength={4000} rows={3} onChange={(event) => updateCard(selected.id, { narratorNote: event.target.value })} placeholder="La verdad, condición o consecuencia…" /></label>
            <label className="story-guide__field">Estado<select value={selected.state} disabled={readOnly} onChange={(event) => updateCard(selected.id, { state: event.target.value as ChronicleStoryGuideCardState })}>{cardStates.map((state) => <option value={state.value} key={state.value}>{state.label}</option>)}</select></label>

            <form className="story-guide__connection-form" onSubmit={addConnection}>
              <strong>Crear conexión</strong>
              <label>Esta tarjeta lleva a<select value={connectionTarget} disabled={readOnly || draft.cards.length < 2} onChange={(event) => setConnectionTarget(event.target.value)}><option value="">Elige otra tarjeta</option>{draft.cards.filter((card) => card.id !== selected.id).map((card) => <option key={card.id} value={card.id}>{card.title}</option>)}</select></label>
              <label>Significado<input value={connectionLabel} disabled={readOnly} maxLength={120} onChange={(event) => setConnectionLabel(event.target.value)} placeholder="Ej. Elena reconoce el símbolo" /></label>
              <label>Color<select value={connectionColor} disabled={readOnly} onChange={(event) => setConnectionColor(event.target.value as ChronicleStoryGuideConnectionColor)}>{colors.map((color) => <option value={color.value} key={color.value}>{color.label}</option>)}</select></label>
              <button type="submit" disabled={readOnly || !connectionTarget || connectionTarget === selected.id}>＋ Añadir flecha</button>
            </form>

            <div className="story-guide__selected-connections"><strong>Sale hacia</strong>{draft.connections.filter((connection) => connection.from === selected.id).map((connection) => <div key={connection.id}><span>{connection.label || 'Se relaciona con'} → {cardById.get(connection.to)?.title ?? 'Tarjeta'}</span><button type="button" aria-label="Eliminar conexión" disabled={readOnly} onClick={() => changeGuide({ ...draft, connections: draft.connections.filter((item) => item.id !== connection.id) })}>×</button></div>)}{draft.connections.every((connection) => connection.from !== selected.id) ? <small>Aún no hay salidas. Puedes crear más de una ruta.</small> : null}</div>
            <div className="story-guide__inspector-actions"><button type="button" className="story-guide__text-button" onClick={() => setEditorOpen(false)}>Volver al lienzo</button><button type="button" className="story-guide__delete-button" disabled={readOnly} onClick={() => { changeGuide({ cards: draft.cards.filter((card) => card.id !== selected.id), connections: draft.connections.filter((item) => item.from !== selected.id && item.to !== selected.id) }); setSelectedId(null); setEditorOpen(false) }}>Eliminar tarjeta</button></div>
            <p className="story-guide__privacy-note">Al descubrirla, comparte la información manualmente en la pizarra de la coterie si corresponde.</p>
          </>}
          </div>
          <footer className="story-guide__dialog-footer"><span>Los cambios quedan en el borrador hasta guardar el guion.</span><button type="button" onClick={() => setEditorOpen(false)}>Listo · volver al lienzo</button></footer>
        </dialog> : null}
      </div>
    </section>
  )
}
