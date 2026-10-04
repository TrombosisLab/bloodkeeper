import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { continueGuideOnNewPage, FIRST_GUIDE_PAGE, guidePageCards, normalizeGuidePages, removeGuideCardAppearance, updateGuideCardPosition } from '../../chronicles/domain/story-guide-pages'
import { relationshipMapApi } from '../infrastructure/relationship-map.api'
import { relationColor, relationId, relationLabel, relationTypes, removeRelationCard, type RelationCard, type RelationEdge, type RelationMap, type RelationReference, type RelationSnapshot, type RelationType } from '../domain/relationship-map'
import '../../chronicles/components/chronicle-story-guide-workspace.css'
import './relationship-maps.css'

type ReferenceOption = { targetType: string; targetId: string; title: string }
type Props = { chronicleId: string; options: readonly ReferenceOption[]; onOpenReference: (name: string, type: string, id: string) => void; onDirtyChange: (dirty: boolean) => void }

export function RelationshipMaps({ chronicleId, options, onOpenReference, onDirtyChange }: Props) {
  const [own, setOwn] = useState<RelationSnapshot | null>(null)
  const [owners, setOwners] = useState<readonly { ownerId: string; name: string }[]>([])
  const [scope, setScope] = useState<'private' | 'shared'>('private')
  const [ownerId, setOwnerId] = useState('')
  const [other, setOther] = useState<RelationMap | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const generation = useRef(0)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let cancelled = false
    setOwn(null); setError(''); setScope('private'); setDirty(false); onDirtyChange(false)
    Promise.all([relationshipMapApi.me(chronicleId), relationshipMapApi.list(chronicleId)]).then(([snapshot, list]) => {
      if (!cancelled) { setOwn(snapshot); setOwnerId(snapshot.ownerId); setOwners(list) }
    }).catch(e => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [chronicleId])
  useEffect(() => {
    if (scope !== 'shared') return
    let cancelled = false
    relationshipMapApi.list(chronicleId).then(list => { if (!cancelled) setOwners(list) }).catch(e => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [chronicleId, scope, refresh])
  useEffect(() => {
    const token = ++generation.current
    setOther(null)
    if (scope !== 'shared' || !own || ownerId === own.ownerId) return
    relationshipMapApi.shared(chronicleId, ownerId).then(result => { if (token === generation.current) setOther(result.map) })
      .catch(e => { if (token === generation.current) setError(e.message) })
  }, [chronicleId, ownerId, scope, own?.ownerId, refresh])
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
  const changeDirty = (value: boolean) => { setDirty(value); onDirtyChange(value) }
  function allowSwitch() {
    if (saving) return false
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Descartarlos y cambiar de mapa?')) return false
    changeDirty(false); setError(''); return true
  }
  async function save(map: RelationMap): Promise<boolean> {
    if (!own || saving || (scope === 'shared' && ownerId !== own.ownerId)) return false
    setSaving(true); setError('')
    try { setOwn(await relationshipMapApi.save(chronicleId, scope, own.revision, map)); changeDirty(false); return true }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar.'); return false }
    finally { setSaving(false) }
  }
  async function publish(card: RelationCard, visible: boolean): Promise<boolean> {
    if (!own || dirty || saving || scope !== 'private') return false
    if (!visible && !window.confirm('¿Retirar esta tarjeta de tu mapa compartido? Se quitará de todas sus páginas y se eliminarán sus relaciones compartidas; el privado no cambia.')) return false
    setSaving(true); setError('')
    try { setOwn(await relationshipMapApi.publication(chronicleId, own.revision, card.id, visible)); return true }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo publicar.'); return false }
    finally { setSaving(false) }
  }
  const readOnly = scope === 'shared' && ownerId !== own?.ownerId
  const map = own ? scope === 'private' ? own.privateMap : readOnly ? other : own.sharedMap : null
  const controls = <div className="relationship-maps__views">
      <button type="button" aria-pressed={scope === 'private'} onClick={() => { if (scope !== 'private' && allowSwitch()) setScope('private') }}>Mi mapa privado</button>
      <button type="button" aria-pressed={scope === 'shared'} onClick={() => { if (scope !== 'shared' && allowSwitch()) { setOwnerId(own?.ownerId ?? ''); setScope('shared') } }}>Mapas compartidos</button>
      {scope === 'shared' && own ? <label>Mapa de<select value={ownerId} onChange={e => { if (allowSwitch()) setOwnerId(e.target.value) }}><option value={own.ownerId}>Mi mapa compartido</option>{owners.filter(o => o.ownerId !== own.ownerId).map(o => <option key={o.ownerId} value={o.ownerId}>{o.name}</option>)}</select></label> : null}
      <span className="relationship-maps__permission">{scope === 'private' ? '🔒 Solo tú' : readOnly ? 'Solo lectura · mapa de otra persona' : 'Visible para la coterie · solo tú editas'}</span>
      {scope === 'shared' ? <button type="button" onClick={() => setRefresh(n => n + 1)}>Actualizar mapas disponibles</button> : null}
    </div>
  return <section className="relationship-maps" aria-label="Mapas de relaciones">
    {!map ? <header className="relationship-canvas__header"><h2>Relaciones</h2>{controls}</header> : null}
    {error ? <p className="relationship-maps__error" role="alert">{error}</p> : null}
    {!own ? <p role="status">{error ? 'No se pudo abrir Relaciones. Puedes volver a este apartado para reintentar.' : 'Cargando tus mapas…'}</p> : !map ? <p role="status">Cargando mapa compartido…</p> :
      <RelationCanvas controls={controls} key={`${scope}-${ownerId}`} map={map} scope={scope} readOnly={readOnly} saving={saving} options={options} onOpenReference={onOpenReference} onSave={save} onDirtyChange={changeDirty} onPublish={publish} publishedIds={own.sharedMap.cards.flatMap(c => c.sourceId ? [c.sourceId] : [])} />}
  </section>
}

type CanvasProps = { map: RelationMap; scope: 'private' | 'shared'; readOnly: boolean; saving: boolean; options: readonly ReferenceOption[]; publishedIds: readonly string[]; onOpenReference: Props['onOpenReference']; onSave: (map: RelationMap) => Promise<boolean>; onDirtyChange: (v: boolean) => void; onPublish: (card: RelationCard, visible: boolean) => Promise<boolean> }
export function RelationCanvas({ controls, map, scope, readOnly, saving, options, publishedIds, onOpenReference, onSave, onDirtyChange, onPublish }: CanvasProps & { controls?: ReactNode }) {
  const [draft, setDraft] = useState<RelationMap>(() => normalizeGuidePages(map) as RelationMap)
  const [dirty, setDirty] = useState(false)
  const [pageId, setPageId] = useState(map.pages?.[0]?.id ?? FIRST_GUIDE_PAGE)
  const [zoom, setZoom] = useState(1)
  const [editor, setEditor] = useState<string | 'new' | null>(null)
  const [pageEditor, setPageEditor] = useState<{ cardId?: string; rename?: boolean } | null>(null)
  const [pageTitle, setPageTitle] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newReference, setNewReference] = useState('')
  const [edgeId, setEdgeId] = useState<string | null>(null)
  const [target, setTarget] = useState('')
  const [relationType, setRelationType] = useState<RelationType>('friendship')
  const [label, setLabel] = useState('')
  const [direction, setDirection] = useState<RelationEdge['direction']>('forward')
  const [customColor, setCustomColor] = useState('#c7bab1')
  const [sizes, setSizes] = useState<Record<string, number>>({})
  const viewport = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const pageDialog = useRef<HTMLDialogElement>(null)
  const prefix = useId().replace(/:/g, '')
  const selected = draft.cards.find(c => c.id === editor)
  const pages = draft.pages!
  const visible = guidePageCards(draft, pageId) as RelationCard[]
  const byId = new Map(draft.cards.map(c => [c.id, c]))
  const local = new Map(visible.map(c => [c.id, c]))
  const pageName = (id?: string) => pages.find(p => p.id === id)?.title ?? 'Inicio'
  useEffect(() => { if (editor && dialog.current && !dialog.current.open) dialog.current.showModal() }, [editor])
  useEffect(() => { if (pageEditor && pageDialog.current && !pageDialog.current.open) pageDialog.current.showModal() }, [pageEditor])
  useLayoutEffect(() => {
    if (!viewport.current) return
    const observer = new ResizeObserver(entries => {
      const updates: Record<string, number> = {}
      for (const entry of entries) updates[(entry.target as HTMLElement).dataset.relationCard!] = entry.target.getBoundingClientRect().height / zoom
      setSizes(current => ({ ...current, ...updates }))
    })
    viewport.current.querySelectorAll('[data-relation-card]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [pageId, zoom, visible.length])
  function change(next: RelationMap) { if (readOnly || saving) return; setDraft(next); setDirty(true); onDirtyChange(true) }
  function patchCard(card: RelationCard, patch: Partial<RelationCard>) { change({ ...draft, cards: draft.cards.map(c => c.id === card.id ? { ...c, ...patch } : c) }) }
  function switchPage(id: string) { setPageId(id); setEditor(null); viewport.current?.scrollTo(0, 0) }
  function showCard(cardId: string, destination?: string) { const card = byId.get(cardId); if (!card) return; switchPage(destination ?? card.pageId!); setTimeout(() => viewport.current?.scrollTo({ left: Math.max(0,card.x*zoom-32), top: Math.max(0,card.y*zoom-32) }), 0) }
  function openEditor(id: string) { setEditor(id); setEdgeId(null); setTarget(''); setLabel(''); setRelationType('friendship'); setDirection('forward'); setNewTitle(''); setNewReference('') }
  function editEdge(edge: RelationEdge) { setEditor(edge.from); setEdgeId(edge.id); setTarget(edge.to); setRelationType(edge.relationType); setLabel(edge.label); setDirection(edge.direction); setCustomColor(edge.customColor || '#c7bab1') }
  function pointerDown(e: ReactPointerEvent<HTMLElement>, card: RelationCard) {
    if (readOnly || saving || (e.target as HTMLElement).closest('button,select')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    Object.assign(e.currentTarget.dataset, { startX: String(e.clientX), startY: String(e.clientY), cardX: String(card.x), cardY: String(card.y) })
  }
  function pointerMove(e: ReactPointerEvent<HTMLElement>, card: RelationCard) {
    if (readOnly || saving || !e.currentTarget.hasPointerCapture(e.pointerId)) return
    const d = e.currentTarget.dataset
    change(updateGuideCardPosition(draft, card.id, pageId, Math.max(0,Math.min(920,Number(d.cardX)+(e.clientX-Number(d.startX))/zoom)), Math.max(0,Math.min(560,Number(d.cardY)+(e.clientY-Number(d.startY))/zoom))) as RelationMap)
  }
  function continuation(cardId: string) { setEditor(null); setPageTitle(''); setPageEditor({ cardId }) }
  const referenceOptions = options.filter(o => o.targetType === 'CHARACTER' || o.targetType === 'NPC')
  const referenceKey = (r?: RelationReference) => r ? `${r.type}:${r.id}` : ''
  const parseReference = (key: string): RelationReference | undefined => { const o = referenceOptions.find(o => `${o.targetType}:${o.targetId}` === key); return o ? { type: o.targetType as RelationReference['type'], id: o.targetId } : undefined }
  const width = Math.max(1200,...visible.map(c => c.x+280)), height = Math.max(700,...visible.map(c => c.y+(sizes[c.id]??205)+32))
  return <div className="story-guide relationship-canvas">
    <header className="relationship-canvas__header">
      <h2>Relaciones</h2>{controls}
      <div className="relationship-canvas__save"><button type="button" disabled={readOnly || saving || draft.cards.length>=120} onClick={() => openEditor('new')}>＋ Añadir tarjeta</button>{dirty ? <span className="story-guide__unsaved">Cambios sin guardar</span> : null}<button type="button" disabled={readOnly || saving || !dirty} onClick={() => void onSave(draft).then(ok => { if (ok) { setDirty(false); onDirtyChange(false) } })}>{saving ? 'Guardando…' : dirty ? 'Guardar mapa' : '✓ Guardado'}</button></div>
      <div className="relationship-canvas__navigation">
      <label>Página <select aria-label="Página del mapa" value={pageId} onChange={e => switchPage(e.target.value)}>{pages.map(p => <option key={p.id} value={p.id}>{p.title} · {guidePageCards(draft,p.id).length} tarjetas</option>)}</select></label>
      <button type="button" disabled={readOnly || saving || pages.length>=30} onClick={() => { setPageTitle(''); setPageEditor({}) }}>＋ Página</button>
    <details className="relationship-canvas__legend"><summary>Tipos de relación · leyenda de colores</summary><div>{relationTypes.map(t => <span key={t.id}><i style={{ background:t.color }} />{t.label}</span>)}</div></details>
      <details className="relationship-canvas__menu"><summary>Opciones de página</summary><div><button type="button" disabled={readOnly || saving} onClick={() => { setPageTitle(pageName(pageId)); setPageEditor({ rename:true }) }}>Renombrar</button><button type="button" disabled={readOnly || saving || pages.length<=1 || visible.length>0} onClick={() => { const remaining=pages.filter(p=>p.id!==pageId); change({...draft,pages:remaining}); switchPage(remaining[0]!.id) }}>Eliminar página vacía</button></div></details>
      <div className="relationship-canvas__zoom"><button type="button" aria-label="Reducir zoom" onClick={()=>setZoom(z=>Math.max(.65,z-.1))}>−</button><span>{Math.round(zoom*100)}%</span><button type="button" aria-label="Aumentar zoom" onClick={()=>setZoom(z=>Math.min(1.25,z+.1))}>＋</button></div>
      <details className="relationship-canvas__menu"><summary>Ayuda y privacidad</summary><div><p>{scope === 'private' ? 'Solo tú puedes ver este mapa. Publicar una tarjeta comparte únicamente su nombre y ficha vinculada, nunca notas ni relaciones.' : readOnly ? 'Este mapa es de otra persona: puedes consultarlo, pero no editarlo.' : 'La coterie puede ver este mapa. Solo tú lo editas y sus relaciones son independientes de tu mapa privado.'}</p><p>Arrastra para ordenar. Abre una tarjeta para definir relaciones o continuar en una nueva página. Ver un nombre no concede permiso para abrir su ficha.</p></div></details>
      </div>
    </header>
    <div className="story-guide__continuations">{draft.connections.filter(e => local.has(e.from)!==local.has(e.to)).map(e => { const destination=local.has(e.from)?e.to:e.from; return <div className="story-guide__portal" key={e.id}><small>Otra página · {pageName(byId.get(destination)?.pageId)}</small><strong>{byId.get(e.from)?.title} {e.direction==='forward'?'→':e.direction==='both'?'↔':'—'} {byId.get(e.to)?.title}</strong><span style={{color:relationColor(e)}}>{relationLabel(e)}</span><button type="button" onClick={()=>showCard(destination)}>Abrir tarjeta →</button></div> })}</div>
    <div className="story-guide__board-wrap"><div ref={viewport} className="story-guide__viewport">
      {!visible.length ? <div className="story-guide__empty"><span>✦</span><h3>{readOnly?'Esta página no tiene tarjetas':'Empieza por las personas'}</h3><p>{scope==='private'?'Añade un PJ, un PNJ o un nombre libre. Después dibuja sus vínculos.':'Añade tarjetas aquí o publica las que elijas desde tu mapa privado. Las relaciones privadas nunca se copian.'}</p></div> : <div className="story-guide__canvas-scale" style={{width:width*zoom,height:height*zoom}}><div className="story-guide__canvas" style={{width,height,transform:`scale(${zoom})`}}>
        <svg className="story-guide__edges relationship-canvas__edges" width={width} height={height} aria-label="Relaciones entre personas"><defs>{draft.connections.map(e=><marker key={e.id} id={`${prefix}-${e.id}`} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto-start-reverse"><path d="M0 0L9 4.5L0 9Z" style={{fill:relationColor(e),stroke:relationColor(e)}} /></marker>)}</defs>{draft.connections.filter(e=>local.has(e.from)&&local.has(e.to)).map(e=>{
          const a=local.get(e.from)!, b=local.get(e.to)!, ah=sizes[a.id]??205,bh=sizes[b.id]??205
          const ax=a.x+130,ay=a.y+ah/2,bx=b.x+130,by=b.y+bh/2,dx=bx-ax,dy=by-ay
          const ratio=(h:number)=>Math.min(dx===0?Infinity:130/Math.abs(dx),dy===0?Infinity:h/2/Math.abs(dy),.49)
          const ar=ratio(ah),br=ratio(bh), x1=ax+dx*ar,y1=ay+dy*ar,x2=bx-dx*br,y2=by-dy*br
          const parallel=draft.connections.filter(other=>(other.from===e.from&&other.to===e.to)||(other.from===e.to&&other.to===e.from))
          const offset=(parallel.findIndex(other=>other.id===e.id)-(parallel.length-1)/2)*36
          const length=Math.max(1,Math.hypot(dx,dy)),sign=e.from<e.to?1:-1,nx=-dy/length*sign,ny=dx/length*sign
          const mx=(x1+x2)/2,my=(y1+y2)/2,path=`M${x1} ${y1}Q${mx+nx*offset*2} ${my+ny*offset*2} ${x2} ${y2}`
          return <g key={e.id} style={{color:relationColor(e)}} onClick={()=>editEdge(e)}><path d={path} style={{stroke:relationColor(e)}} markerStart={e.direction==='both'?`url(#${prefix}-${e.id})`:undefined} markerEnd={e.direction!=='none'?`url(#${prefix}-${e.id})`:undefined}/><path className="relationship-canvas__hit" d={path}/><text x={mx+nx*offset} y={my+ny*offset-8}>{relationLabel(e)}</text></g>
        })}</svg>
        {visible.map(c=><article key={c.id} data-relation-card={c.id} data-person-status={c.personStatus ?? 'active'} className="story-guide-card story-guide-card--npc" style={{left:c.x,top:c.y}} onPointerDown={e=>pointerDown(e,c)} onPointerMove={e=>pointerMove(e,c)} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}}>
          {c.personStatus === 'deceased' ? <span className="relationship-card__deceased">FALLECIDO</span> : c.personStatus === 'missing' ? <span className="relationship-card__missing">DESAPARECIDO</span> : null}
          <span className="story-guide-card__kind">{c.reference?.type==='CHARACTER'?'Personaje jugador':c.reference?.type==='NPC'?'PNJ':'Persona · nombre libre'}</span><strong title={c.title}>{c.title}</strong><p>{c.summary || 'Sin descripción'}</p><small>{scope==='private'?publishedIds.includes(c.id)?'Visible en tu mapa compartido':'Solo en tu mapa privado':'Compartida con la coterie'}</small><div className="story-guide-card__actions"><button type="button" disabled={readOnly||saving||pages.length>=30} onClick={()=>continuation(c.id)}>＋ Nueva página</button><button type="button" onClick={()=>openEditor(c.id)}>{readOnly?'Consultar':'Abrir'}</button></div>
          {(c.appearances??[]).filter(a=>a.pageId===pageId||a.sourcePageId===pageId).map(a=><button className="story-guide-card__page-link" type="button" key={a.pageId} onClick={()=>switchPage(a.pageId===pageId?a.sourcePageId:a.pageId)}>{a.pageId===pageId?'← Volver a':'Continuar en'} {pageName(a.pageId===pageId?a.sourcePageId:a.pageId)}</button>)}
        </article>)}
      </div></div>}
    </div></div>
    {editor ? <dialog ref={dialog} className="story-guide__dialog" aria-label={selected?'Tarjeta y relaciones':'Añadir persona'} onCancel={()=>setEditor(null)} onClose={()=>setEditor(null)}><header className="story-guide__dialog-header"><h3>{selected?.title||'Añadir persona'}</h3><button type="button" aria-label="Cerrar" onClick={()=>setEditor(null)}>×</button></header><div className="story-guide__inspector">
      {!selected ? <form onSubmit={e=>{e.preventDefault();if(readOnly||saving||!newTitle.trim()||draft.cards.length>=120)return;const ref=parseReference(newReference);const c:RelationCard={id:relationId(),pageId,kind:'npc',state:'hidden',title:newTitle.trim(),summary:'',narratorNote:'',x:32+visible.length%3*318,y:Math.min(5000,32+Math.floor(visible.length/3)*240),...(ref?{reference:ref}:{})};change({...draft,cards:[...draft.cards,c]});setEditor(c.id)}}>
        <label className="story-guide__field">Vincular ficha<select disabled={readOnly||saving} value={newReference} onChange={e=>{setNewReference(e.target.value);const option=referenceOptions.find(o=>`${o.targetType}:${o.targetId}`===e.target.value);if(option)setNewTitle(option.title)}}><option value="">Nombre libre · sin ficha</option>{referenceOptions.map(o=><option key={`${o.targetType}:${o.targetId}`} value={`${o.targetType}:${o.targetId}`}>{o.targetType==='CHARACTER'?'PJ':'PNJ'} · {o.title}</option>)}</select></label><label className="story-guide__field">Nombre<input required autoFocus maxLength={140} disabled={readOnly||saving} value={newTitle} onChange={e=>setNewTitle(e.target.value)}/></label><button type="submit" disabled={readOnly||saving||!newTitle.trim()}>Añadir tarjeta</button>
      </form> : <>
        <label className="story-guide__field">Nombre<input maxLength={140} value={selected.title} disabled={readOnly||saving} onChange={e=>patchCard(selected,{title:e.target.value})}/></label>
        <label className="story-guide__field">Estado de la persona<select value={selected.personStatus ?? 'active'} disabled={readOnly||saving} onChange={e=>patchCard(selected,{personStatus:e.target.value as RelationCard['personStatus']})}><option value="active">Sin marca especial</option><option value="deceased">Fallecido</option><option value="missing">Desaparecido</option></select></label>
        <p className="story-guide__privacy-note">Este estado pertenece solo a este mapa: no modifica la ficha ni se copia al publicar una tarjeta. Puedes quitar la marca seleccionando «Sin marca especial».</p>
        <label className="story-guide__field">Vincular ficha<select value={referenceKey(selected.reference)} disabled={readOnly||saving} onChange={e=>patchCard(selected,{reference:parseReference(e.target.value)})}><option value="">Sin ficha vinculada</option>{selected.reference&&!referenceOptions.some(o=>`${o.targetType}:${o.targetId}`===referenceKey(selected.reference))?<option value={referenceKey(selected.reference)}>Referencia vinculada · {selected.title}</option>:null}{referenceOptions.map(o=><option key={`${o.targetType}:${o.targetId}`} value={`${o.targetType}:${o.targetId}`}>{o.targetType==='CHARACTER'?'PJ':'PNJ'} · {o.title}</option>)}</select></label>
        {selected.reference?<button type="button" onClick={()=>{setEditor(null);onOpenReference(selected.title,selected.reference!.type,selected.reference!.id)}}>Abrir ficha vinculada</button>:null}<p className="story-guide__privacy-note">Ver un nombre no concede acceso a su ficha. Se comprobarán tus permisos al abrirla.</p>
        <label className="story-guide__field">{scope==='private'?'Descripción privada':'Descripción compartida'}<textarea maxLength={1200} value={selected.summary} disabled={readOnly||saving} onChange={e=>patchCard(selected,{summary:e.target.value})}/></label>
        {scope==='private'?<><label className="story-guide__field">Nota privada<textarea maxLength={4000} value={selected.narratorNote} disabled={saving} onChange={e=>patchCard(selected,{narratorNote:e.target.value})}/></label><button type="button" disabled={dirty||saving} onClick={()=>void onPublish(selected,!publishedIds.includes(selected.id))}>{publishedIds.includes(selected.id)?'Retirar de mi mapa compartido':'Mostrar en mi mapa compartido'}</button><p className="story-guide__privacy-note">Guarda primero el mapa. Solo se publica el nombre y el vínculo a la ficha; nunca descripciones, notas, relaciones ni páginas. Los cambios posteriores son independientes.</p></>:null}
        <label className="story-guide__field">Página de origen<select value={selected.pageId} disabled={readOnly||saving||!!selected.appearances?.length} onChange={e=>{patchCard(selected,{pageId:e.target.value});setPageId(e.target.value)}}>{pages.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label><button type="button" disabled={readOnly||saving||pages.length>=30} onClick={()=>continuation(selected.id)}>Continuar en una nueva página</button>
        {selected.pageId!==pageId?<button type="button" disabled={readOnly||saving} onClick={()=>{change(removeGuideCardAppearance(draft,selected.id,pageId) as RelationMap);setEditor(null)}}>Quitar solo de esta página</button>:null}
        <form className="story-guide__connection-form" onSubmit={e=>{e.preventDefault();if(readOnly||saving||!target||target===selected.id||(!edgeId&&draft.connections.length>=240)||(relationType==='custom'&&!label.trim()))return;const edge:RelationEdge={id:edgeId??relationId(),from:selected.id,to:target,label:label.trim(),color:'rose',relationType,direction,...(relationType==='custom'?{customColor}:{})};change({...draft,connections:edgeId?draft.connections.map(c=>c.id===edgeId?edge:c):[...draft.connections,edge]});setEdgeId(null);setLabel('')}}>
          <strong>{edgeId?'Consultar / editar relación':'Crear relación'}</strong><label>Desde {selected.title} hacia<select value={target} disabled={readOnly||saving} onChange={e=>setTarget(e.target.value)}><option value="">Elige una persona</option>{draft.cards.filter(c=>c.id!==selected.id).map(c=><option key={c.id} value={c.id}>{c.title} · {pageName(c.pageId)}</option>)}</select></label>
          <label>Tipo de relación<select value={relationType} disabled={readOnly||saving} onChange={e=>setRelationType(e.target.value as RelationType)}>{relationTypes.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label><label>{relationType==='custom'?'Nombre de la relación personalizada':'Detalle opcional'}<input maxLength={120} required={relationType==='custom'} value={label} disabled={readOnly||saving} onChange={e=>setLabel(e.target.value)}/></label><label>Dirección<select value={direction} disabled={readOnly||saving} onChange={e=>setDirection(e.target.value as RelationEdge['direction'])}><option value="forward">Una flecha · origen → destino</option><option value="both">Ambas direcciones · ↔</option><option value="none">Sin flechas</option></select></label>
          {relationType==='custom'?<label>Color<input type="color" value={customColor} disabled={readOnly||saving} onChange={e=>setCustomColor(e.target.value)}/></label>:<span className="relationship-canvas__color" style={{color:relationTypes.find(t=>t.id===relationType)!.color}}>━ Color automático según el tipo</span>}
          <button type="submit" disabled={readOnly||saving||!target||(!edgeId&&draft.connections.length>=240)}>{edgeId?'Aplicar relación':'Añadir relación'}</button>{edgeId?<button type="button" onClick={()=>{setEdgeId(null);setTarget('');setLabel('')}}>Cancelar edición de relación</button>:null}
        </form>
        <div className="story-guide__selected-connections"><strong>Relaciones de esta persona</strong>{draft.connections.filter(e=>e.from===selected.id||e.to===selected.id).map(e=><div key={e.id}><span style={{color:relationColor(e)}}>{byId.get(e.from)?.title} {e.direction==='forward'?'→':e.direction==='both'?'↔':'—'} {byId.get(e.to)?.title} · {relationLabel(e)}</span><button type="button" onClick={()=>editEdge(e)}>{readOnly?'Consultar':'Editar'}</button><button type="button" aria-label="Eliminar relación" disabled={readOnly||saving} onClick={()=>change({...draft,connections:draft.connections.filter(c=>c.id!==e.id)})}>×</button></div>)}</div>
        <button className="story-guide__delete-button" type="button" disabled={readOnly||saving} onClick={()=>{if(!window.confirm(scope==='private'?'¿Eliminar esta tarjeta de tu mapa privado y, si está publicada, también de tu mapa compartido? Al guardar se eliminará de todas sus páginas junto con sus relaciones. No afecta a los mapas de otras personas.':'¿Eliminar esta tarjeta solo de tu mapa compartido? Al guardar se eliminará de todas sus páginas junto con sus relaciones compartidas. Tu mapa privado no cambia.'))return;change(removeRelationCard(draft,selected.id));setEditor(null)}}>{scope==='private'?'Eliminar de mis mapas (privado y compartido)':'Eliminar solo de mi mapa compartido'}</button>
      </>}
      </div><footer className="story-guide__dialog-footer"><span>{readOnly?'Mapa de otra persona · solo lectura':'Los cambios se conservan al pulsar Guardar mapa.'}</span><button type="button" onClick={()=>setEditor(null)}>Volver al mapa</button></footer></dialog>:null}
    {pageEditor?<dialog ref={pageDialog} className="story-guide__dialog" aria-label="Página del mapa" onClose={()=>setPageEditor(null)} onCancel={()=>setPageEditor(null)}><header className="story-guide__dialog-header"><h3>{pageEditor.rename?'Renombrar página':pageEditor.cardId?'Continuar desde esta tarjeta':'Nueva página'}</h3><button type="button" onClick={()=>setPageEditor(null)}>×</button></header><form className="story-guide__inspector" onSubmit={e=>{e.preventDefault();if(readOnly||saving||!pageTitle.trim()||(!pageEditor.rename&&pages.length>=30))return;const id=pageEditor.rename?pageId:relationId();change(pageEditor.cardId?continueGuideOnNewPage(draft,pageEditor.cardId,pageId,id,pageTitle) as RelationMap:{...draft,pages:pageEditor.rename?pages.map(p=>p.id===id?{...p,title:pageTitle.trim()}:p):[...pages,{id,title:pageTitle.trim()}]});switchPage(id);setPageEditor(null)}}><label className="story-guide__field">Nombre<input autoFocus required maxLength={80} value={pageTitle} onChange={e=>setPageTitle(e.target.value)}/></label><p>La tarjeta continúa en la nueva página y sigue en la original. Sus datos son los mismos y su posición es independiente. No se publica nada entre mapas.</p><button type="submit" disabled={readOnly||saving||!pageTitle.trim()}>Aplicar</button></form></dialog>:null}
  </div>
}
