import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { notebookApi } from '../../notebook/infrastructure/notebook.api'
import type { NotebookResourcePreview } from '../../notebook/types/notebook.types'
import { chronicleMapApi, type ChronicleMapAreaLabelVertical, type ChronicleMapAreaLabelSize, type ChronicleMapAreaLabelHorizontal, type ChronicleMapMarkerSize, type ChronicleMapRequest, type ChronicleMapResource, type ChronicleMapSnapshot, type ChronicleMapWorkspace } from '../infrastructure/chronicle-map.api'
import './chronicle-map.css'

type Chronicle = { readonly id: string; readonly name: string }
type Resource = ChronicleMapResource
type MapClick = { readonly x: number; readonly y: number }
type AreaRectangle = { readonly type: 'RECT'; readonly x: number; readonly y: number; readonly width: number; readonly height: number }
type CanvasPointEvent = { readonly clientX: number; readonly clientY: number; readonly currentTarget: HTMLDivElement }
const AREA_COLORS = ['#bd3e57', '#8f2038', '#d2693d', '#d6a72c', '#7b9e45', '#3e9b73', '#3a9ca6', '#4d83bd', '#5d6cc0', '#7b5ba7', '#b04b9b', '#a77654', '#8d8d8d', '#d7d1ca', '#fff3ed', '#2b2228'] as const
type AreaColor = typeof AREA_COLORS[number]

const api = async <T,>(path: string): Promise<T> => {
  const response = await fetch('/api' + path, { credentials: 'include' })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'No se pudo cargar el mapa.')
  return body as T
}

function childrenOf(maps: readonly ChronicleMapSnapshot[], parentMapId: string | null) { return maps.filter(map => map.parentMapId === parentMapId).sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'es')) }

export function ChronicleMapPage() {
  const [chronicles, setChronicles] = useState<readonly Chronicle[]>([])
  const [chronicleId, setChronicleId] = useState(() => new URLSearchParams(window.location.search).get('chronicleId') ?? '')
  const [workspace, setWorkspace] = useState<ChronicleMapWorkspace | null>(null)
  const [selectedMapId, setSelectedMapId] = useState('')
  const [requests, setRequests] = useState<readonly ChronicleMapRequest[]>([])
  const [resources, setResources] = useState<readonly Resource[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newParentId, setNewParentId] = useState('')
  const [parentDraft, setParentDraft] = useState('')
  const [click, setClick] = useState<MapClick | null>(null)
  const [interaction, setInteraction] = useState<'marker' | 'request' | 'area' | null>(null)
  const [interactionTitle, setInteractionTitle] = useState('')
  const [interactionDescription, setInteractionDescription] = useState('')
  const [interactionKind, setInteractionKind] = useState('LOCATION')
  const [interactionSize, setInteractionSize] = useState<ChronicleMapMarkerSize>('large')
  const [interactionResourceId, setInteractionResourceId] = useState('')
  const [drawingArea, setDrawingArea] = useState(false)
  const [areaStart, setAreaStart] = useState<MapClick | null>(null)
  const [areaPreview, setAreaPreview] = useState<AreaRectangle | null>(null)
  const [areaColor, setAreaColor] = useState<AreaColor>('#bd3e57')
  const [areaFillColor, setAreaFillColor] = useState<AreaColor>('#bd3e57')
  const [areaLabelColor, setAreaLabelColor] = useState<AreaColor>('#fff3ed')
  const [areaLabelSize, setAreaLabelSize] = useState<ChronicleMapAreaLabelSize>('medium')
  const [areaLabelVertical, setAreaLabelVertical] = useState<ChronicleMapAreaLabelVertical>('top')
  const [areaLabelHorizontal, setAreaLabelHorizontal] = useState<ChronicleMapAreaLabelHorizontal>('left')
  const [editing, setEditing] = useState(false)
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null)
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null)
  const [selectedMarkerId, setSelectedMarkerId] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [zoom, setZoom] = useState(1)
  const [resourcePreview, setResourcePreview] = useState<NotebookResourcePreview | null>(null)
  const [resourcePreviewLoading, setResourcePreviewLoading] = useState(false)
  const [resourcePreviewError, setResourcePreviewError] = useState('')
  const mapContentRef = useRef<HTMLDivElement>(null)
  const skipNextCanvasClickRef = useRef(false)

  const maps = workspace?.maps ?? []
  const activeMap = maps.find(map => map.id === selectedMapId) ?? maps[0] ?? null

  useEffect(() => {
    void (async () => {
      try {
        const result = await api<{ items?: Chronicle[] } | Chronicle[]>('/chronicles?limit=50')
        const items = Array.isArray(result) ? result : result.items ?? []
        setChronicles(items)
        if (!chronicleId && items[0]) setChronicleId(items[0].id)
      } catch { setMessage('No se pudieron cargar las crónicas.') }
    })()
  }, [])

  useEffect(() => {
    if (!chronicleId) return
    const url = new URL(window.location.href)
    url.searchParams.set('chronicleId', chronicleId)
    window.history.replaceState(window.history.state, '', url.toString())
    void loadWorkspace(chronicleId)
  }, [chronicleId])

  useEffect(() => {
    setParentDraft(activeMap?.parentMapId ?? '')
    if (!activeMap || !workspace?.canManage) { setRequests([]); return }
    void chronicleMapApi.listRequests(activeMap.chronicleId, activeMap.id).then(result => setRequests(result.items)).catch(() => setRequests([]))
  }, [activeMap?.id, workspace?.canManage])

  async function loadWorkspace(id: string) {
    setLoading(true)
    try {
      const result = await chronicleMapApi.list(id)
      setWorkspace(result)
      setSelectedMapId(current => result.maps.some(map => map.id === current) ? current : result.maps[0]?.id ?? '')
      if (result.canManage) {
        const resourceResult = await api<{ items: Resource[] }>('/library/resources/for-chronicle/' + encodeURIComponent(id) + '?kind=location')
        setResources(resourceResult.items ?? [])
      } else setResources([])
    } catch { setWorkspace(null); setMessage('No se pudo cargar la cartografía.') }
    finally { setLoading(false) }
  }

  function selectChronicle(id: string) { setChronicleId(id); setSelectedMapId('') }

  async function createMap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!chronicleId || !newName.trim()) return
    try {
      const created = await chronicleMapApi.create(chronicleId, { name: newName.trim(), description: newDescription.trim() || null, parentMapId: newParentId || null })
      setNewName(''); setNewDescription(''); setNewParentId(''); setCreating(false)
      await loadWorkspace(chronicleId); setSelectedMapId(created.id); setMessage('Mapa creado. Ahora puedes subir su imagen.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo crear el mapa.') }
  }

  async function uploadMap(file: File) {
    if (!activeMap || !chronicleId) return
    try { await chronicleMapApi.uploadImage(chronicleId, activeMap.id, file); await loadWorkspace(chronicleId); setMessage('Imagen del mapa actualizada.') }
    catch { setMessage('No se pudo subir la imagen del mapa.') }
  }

  async function saveParent() {
    if (!activeMap || !chronicleId) return
    try { await chronicleMapApi.update(chronicleId, activeMap.id, { parentMapId: parentDraft || null }); await loadWorkspace(chronicleId); setMessage('Mapa superior actualizado.') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo cambiar el mapa superior.') }
  }

  function canvasPoint(event: CanvasPointEvent): MapClick | null {
    if (!activeMap || !activeMap.hasImage) return null
    const rect = mapContentRef.current?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect()
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) }
  }

  function rectangleBetween(start: MapClick, end: MapClick): AreaRectangle {
    return { type: 'RECT', x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) }
  }

  function mapClick(event: MouseEvent<HTMLDivElement>) {
    if (skipNextCanvasClickRef.current) { skipNextCanvasClickRef.current = false; return }
    if (drawingArea || areaPreview) return
    if (workspace?.canManage && !editing) return
    const point = canvasPoint(event)
    if (!point) return
    setClick(point)
    setInteraction(workspace?.canManage ? 'marker' : 'request')
    setInteractionTitle(''); setInteractionDescription(''); setInteractionResourceId(''); setInteractionKind('LOCATION'); setInteractionSize('large')
  }

  function startArea(event: PointerEvent<HTMLDivElement>) {
    if (!drawingArea || !editing || !workspace?.canManage) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = canvasPoint(event)
    if (point) setAreaStart(point)
  }

  function moveArea(event: PointerEvent<HTMLDivElement>) {
    if (!drawingArea || !areaStart) return
    event.preventDefault()
    const point = canvasPoint(event)
    if (point) setAreaPreview(rectangleBetween(areaStart, point))
  }

  function finishArea(event: PointerEvent<HTMLDivElement>) {
    if (!drawingArea || !areaStart) return
    event.preventDefault(); event.stopPropagation(); skipNextCanvasClickRef.current = true
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    const point = canvasPoint(event)
    if (!point) return
    const next = rectangleBetween(areaStart, point)
    setAreaStart(null); setDrawingArea(false)
    if (next.width > 0.01 && next.height > 0.01) { setAreaPreview(next); setClick(null); setInteraction('area'); if (!editingAreaId) { setInteractionTitle(''); setInteractionDescription(''); resetAreaStyle() } }
  }

  function resetAreaStyle() { setAreaColor('#bd3e57'); setAreaFillColor('#bd3e57'); setAreaLabelColor('#fff3ed'); setAreaLabelSize('medium'); setAreaLabelVertical('top'); setAreaLabelHorizontal('left') }

  function closeInteraction() { setClick(null); setInteraction(null); setAreaPreview(null); setAreaStart(null); setDrawingArea(false); setEditingMarkerId(null); setEditingAreaId(null) }

  function beginNewArea() { setEditingAreaId(null); setAreaPreview(null); setAreaStart(null); setClick(null); setInteraction(null); setInteractionTitle(''); setInteractionDescription(''); resetAreaStyle(); setDrawingArea(true); setMessage('Arrastra sobre el mapa para delimitar una zona.') }

  function beginAreaRedraw() { setAreaPreview(null); setAreaStart(null); setClick(null); setInteraction(null); setDrawingArea(true); setMessage('Redibuja la zona sobre el mapa. La forma anterior se reemplazará al guardar.') }

  function enterOrLeaveEditing() {
    if (editing) { setEditing(false); closeInteraction(); setSelectedMarkerId(''); setSelectedAreaId(''); return }
    setEditing(true)
  }

  function openMarker(marker: ChronicleMapSnapshot['markers'][number]) {
    setSelectedMarkerId(marker.id); setSelectedAreaId('')
    if (!editing || !workspace?.canManage) return
    setEditingMarkerId(marker.id); setClick({ x: marker.x, y: marker.y }); setInteraction('marker'); setInteractionTitle(marker.label || marker.resource?.name || marker.location?.name || ''); setInteractionDescription(''); setInteractionKind(marker.kind); setInteractionResourceId(marker.resourceId || ''); setInteractionSize(marker.size || 'large')
  }

  function openArea(area: ChronicleMapSnapshot['areas'][number]) {
    setSelectedAreaId(area.id); setSelectedMarkerId('')
    if (!editing || !workspace?.canManage) return
    const shape = area.geometry as Partial<AreaRectangle>
    if (shape.type !== 'RECT') return
    setEditingAreaId(area.id); setAreaPreview(shape as AreaRectangle); setInteraction('area'); setInteractionTitle(area.name); setInteractionDescription(''); setAreaColor((area.color as AreaColor) || '#bd3e57'); setAreaFillColor((area.fillColor as AreaColor) || (area.color as AreaColor) || '#bd3e57'); setAreaLabelColor((area.labelColor as AreaColor) || '#fff3ed'); setAreaLabelSize(area.labelSize || 'medium'); setAreaLabelVertical(area.labelVertical || 'top'); setAreaLabelHorizontal(area.labelHorizontal || 'left')
  }

  async function openLinkedResource(marker: ChronicleMapSnapshot['markers'][number]) {
    setResourcePreview(null); setResourcePreviewError(''); setResourcePreviewLoading(true)
    if (marker.resource) {
      setResourcePreview({ id: marker.resource.id, targetType: marker.resource.kind.toUpperCase(), targetId: marker.resource.id, label: marker.resource.name, category: marker.resource.kind, status: 'ACTIVE', description: marker.resource.summary, narrativeRole: null, detailLevel: null, metrics: { appearances: null, histories: null }, narratorDetails: null, deepProfile: null, metadata: null, canViewPrivateDetails: false, sessionDate: null, sessionNumber: null, parentLocationId: null, imageUrl: marker.resource.imageUrl, privateNotice: 'Se muestra la información disponible para esta crónica.' })
      setResourcePreviewLoading(false)
      return
    }
    if (!marker.locationId || !chronicleId) { setResourcePreviewError('Este marcador no tiene un recurso consultable vinculado.'); setResourcePreviewLoading(false); return }
    try { setResourcePreview(await notebookApi.resourcePreview(chronicleId, 'LOCATION', marker.locationId)) }
    catch (error) { setResourcePreviewError(error instanceof Error ? error.message : 'No se pudo abrir el recurso vinculado.') }
    finally { setResourcePreviewLoading(false) }
  }

  function closeResourcePreview() { setResourcePreview(null); setResourcePreviewError(''); setResourcePreviewLoading(false) }

  async function saveInteraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeMap || !interactionTitle.trim() || !chronicleId || (interaction !== 'area' && !click)) return
    try {
      if (interaction === 'area') {
        if (!areaPreview) return
        const areaInput = { name: interactionTitle.trim(), geometry: areaPreview, color: areaColor, fillColor: areaFillColor, labelColor: areaLabelColor, labelSize: areaLabelSize, labelVertical: areaLabelVertical, labelHorizontal: areaLabelHorizontal }
        if (editingAreaId) await chronicleMapApi.updateArea(chronicleId, activeMap.id, editingAreaId, areaInput)
        else await chronicleMapApi.createArea(chronicleId, activeMap.id, areaInput)
      } else {
        if (!click) return
        if (interaction === 'marker') {
          const input = { label: interactionTitle.trim(), kind: interactionKind, resourceId: interactionResourceId || null, x: click.x, y: click.y, size: interactionSize }
          if (editingMarkerId) await chronicleMapApi.updateMarker(chronicleId, activeMap.id, editingMarkerId, input)
          else await chronicleMapApi.createMarker(chronicleId, activeMap.id, { ...input, title: interactionTitle.trim(), description: interactionDescription.trim() || null })
        }
        else await chronicleMapApi.requestMarker(chronicleId, activeMap.id, { title: interactionTitle.trim(), description: interactionDescription.trim() || null, kind: interactionKind, resourceId: interactionResourceId || null, x: click.x, y: click.y })
      }
      const wasEditing = Boolean(editingMarkerId || editingAreaId); closeInteraction(); await loadWorkspace(chronicleId); setMessage(wasEditing ? 'Elemento actualizado.' : interaction === 'marker' ? 'Marcador añadido al mapa.' : interaction === 'area' ? 'Zona añadida al mapa.' : 'Solicitud enviada al narrador.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo guardar la ubicación.') }
  }

  async function removeMarker(markerId: string) {
    if (!activeMap || !chronicleId || !window.confirm('¿Eliminar este marcador del mapa?')) return
    try { await chronicleMapApi.deleteMarker(chronicleId, activeMap.id, markerId); closeInteraction(); setSelectedMarkerId(''); await loadWorkspace(chronicleId); setMessage('Marcador eliminado.') }
    catch { setMessage('No se pudo eliminar el marcador.') }
  }

  async function removeArea(areaId: string) {
    if (!activeMap || !chronicleId || !window.confirm('¿Eliminar esta zona del mapa?')) return
    try { await chronicleMapApi.deleteArea(chronicleId, activeMap.id, areaId); closeInteraction(); setSelectedAreaId(''); await loadWorkspace(chronicleId); setMessage('Zona eliminada.') }
    catch { setMessage('No se pudo eliminar la zona.') }
  }

  async function removeMap() {
    if (!activeMap || !chronicleId || !window.confirm('¿Eliminar el mapa «' + activeMap.name + '»? Esta acción no se puede deshacer.')) return
    try {
      await chronicleMapApi.delete(chronicleId, activeMap.id)
      closeInteraction()
      setEditing(false)
      setSelectedMapId('')
      await loadWorkspace(chronicleId)
      setMessage('Mapa eliminado.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo eliminar el mapa.') }
  }

  async function review(request: ChronicleMapRequest, status: 'APPROVED' | 'REJECTED') {
    if (!activeMap || !chronicleId) return
    try { await chronicleMapApi.reviewRequest(chronicleId, activeMap.id, request.id, status); const next = await chronicleMapApi.listRequests(chronicleId, activeMap.id); setRequests(next.items); await loadWorkspace(chronicleId); setMessage(status === 'APPROVED' ? 'Solicitud aprobada y añadida al mapa.' : 'Solicitud rechazada.') }
    catch { setMessage('No se pudo revisar la solicitud.') }
  }

  function renderTree(parentMapId: string | null): ReactNode {
    const items = childrenOf(maps, parentMapId)
    if (!items.length) return null
    return <ul>{items.map(map => <li key={map.id}><button type="button" className={'chronicle-map-tree__item' + (map.id === activeMap?.id ? ' is-active' : '')} onClick={() => setSelectedMapId(map.id)}><span>{map.status === 'archived' ? '◌' : '⌖'}</span>{map.name}</button>{renderTree(map.id)}</li>)}</ul>
  }

  function areaPalette(label: string, selected: AreaColor, select: (color: AreaColor) => void): ReactNode {
    return <div className="chronicle-map-area-style-group"><span>{label}</span><div className="chronicle-map-color-palette" role="group" aria-label={label}>{AREA_COLORS.map(color => <button key={label + color} type="button" className={'chronicle-map-color-swatch' + (selected === color ? ' is-selected' : '')} style={{ backgroundColor: color }} aria-label={label + ': ' + color} aria-pressed={selected === color} onClick={() => select(color)} />)}</div></div>
  }

  function areaStyleControls(): ReactNode {
    return <div className="chronicle-map-area-editor">
      {areaPalette('Color del borde', areaColor, setAreaColor)}
      {areaPalette('Color del relleno', areaFillColor, setAreaFillColor)}
      {areaPalette('Color del texto', areaLabelColor, setAreaLabelColor)}
      <div className="chronicle-map-area-layout">
        <label>Tamaño de letra<select value={areaLabelSize} onChange={event => setAreaLabelSize(event.target.value as ChronicleMapAreaLabelSize)}><option value="small">Pequeña</option><option value="medium">Mediana</option><option value="large">Grande</option></select></label>
        <label>Posición vertical<select value={areaLabelVertical} onChange={event => setAreaLabelVertical(event.target.value as ChronicleMapAreaLabelVertical)}><option value="top">Arriba</option><option value="center">Centro</option><option value="bottom">Abajo</option></select></label>
        <label>Posición horizontal<select value={areaLabelHorizontal} onChange={event => setAreaLabelHorizontal(event.target.value as ChronicleMapAreaLabelHorizontal)}><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></label>
      </div>
      <button type="button" className="chronicle-map-button" onClick={beginAreaRedraw}>Redibujar zona en el mapa</button>
    </div>
  }

  return <main className="chronicle-map-page">
    {typeof document !== 'undefined' && document.getElementById('app-header-page-actions') ? createPortal(<div className="chronicle-map-global-actions"><label className="chronicle-map-page__chronicle-select">Crónica<select value={chronicleId} onChange={event => selectChronicle(event.target.value)}>{chronicles.map(chronicle => <option key={chronicle.id} value={chronicle.id}>{chronicle.name}</option>)}</select></label>{workspace?.canManage ? <button type="button" className="chronicle-map-button chronicle-map-button--primary" onClick={() => setCreating(true)}>＋ Nuevo mapa</button> : null}{activeMap && workspace?.canManage ? <><button type="button" className={'chronicle-map-button' + (editing ? ' chronicle-map-button--primary' : '')} onClick={enterOrLeaveEditing}>{editing ? 'Salir de edición' : 'Editar mapa'}</button>{editing ? <><button type="button" className="chronicle-map-button" onClick={beginNewArea}>＋ Dibujar zona</button><label className="chronicle-map-upload chronicle-map-global-actions__upload">Subir o reemplazar imagen<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void uploadMap(file); event.currentTarget.value = '' }} /></label></> : null}<label className="chronicle-map-global-actions__parent">Mapa superior<select value={parentDraft} onChange={event => setParentDraft(event.target.value)}><option value="">Sin mapa superior</option>{maps.filter(map => map.id !== activeMap.id && map.status === 'active').map(map => <option key={map.id} value={map.id}>{map.name}</option>)}</select></label><button type="button" className="chronicle-map-button" onClick={() => void saveParent()}>Guardar jerarquía</button><button type="button" className="chronicle-map-button chronicle-map-button--danger" onClick={() => void removeMap()}>Eliminar mapa</button></> : null}</div>, document.getElementById('app-header-page-actions')!) : null}
    {loading ? <p className="chronicle-map-page__status">Cargando cartografía…</p> : null}
    {!loading && workspace && !maps.length ? <section className="chronicle-map-empty"><h2>Aún no hay mapas</h2><p>El narrador puede subir una ciudad, provincia o cualquier otro mapa y añadir después mapas superiores o submapas.</p>{workspace.canManage ? <button type="button" className="chronicle-map-button chronicle-map-button--primary" onClick={() => setCreating(true)}>Crear el primer mapa</button> : null}</section> : null}
    {activeMap ? <section className="chronicle-map-workspace">
      <aside className="chronicle-map-tree"><h2>Mapas de la crónica</h2><p>Selecciona una escala para trabajar con ella.</p>{renderTree(null)}</aside>
      <section className="chronicle-map-detail">
        <header className="chronicle-map-detail__header"><div><small>{activeMap.status === 'archived' ? 'MAPA ARCHIVADO' : 'MAPA ACTIVO'}</small><h2>{activeMap.name}</h2><p>{activeMap.description || 'Sin descripción.'}</p></div>{workspace?.canManage ? <div className="chronicle-map-detail__tools"><button type="button" className={'chronicle-map-button' + (editing ? ' chronicle-map-button--primary' : '')} onClick={enterOrLeaveEditing}>{editing ? 'Salir de edición' : 'Editar mapa'}</button>{editing ? <><button type="button" className="chronicle-map-button" onClick={beginNewArea}>＋ Dibujar zona</button><label className="chronicle-map-upload">Subir o reemplazar imagen<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void uploadMap(file); event.currentTarget.value = '' }} /></label></> : null}</div> : null}</header>
        {workspace?.canManage ? <div className="chronicle-map-detail__parent"><label>Mapa superior<select value={parentDraft} onChange={event => setParentDraft(event.target.value)}><option value="">Sin mapa superior</option>{maps.filter(map => map.id !== activeMap.id && map.status === 'active').map(map => <option key={map.id} value={map.id}>{map.name}</option>)}</select></label><button type="button" className="chronicle-map-button" onClick={() => void saveParent()}>Guardar jerarquía</button></div> : null}
        <div className={'chronicle-map-canvas' + (activeMap.hasImage ? '' : ' chronicle-map-canvas--empty') + (editing ? ' is-editing' : '')} onClick={mapClick} onPointerDown={startArea} onPointerMove={moveArea} onPointerUp={finishArea} onPointerCancel={finishArea}>{activeMap.hasImage ? <div ref={mapContentRef} className="chronicle-map-canvas__content" style={{ transform: `scale(${zoom})` }}><img src={activeMap.imageUrl} alt={`Mapa de ${activeMap.name}`} />{activeMap.areas.map(area => { const shape = area.geometry as Partial<AreaRectangle>; return shape.type === 'RECT' ? <div key={area.id} className={'chronicle-map-area chronicle-map-area--size-' + (area.labelSize || 'medium') + ' chronicle-map-area--v-' + (area.labelVertical || 'top') + ' chronicle-map-area--h-' + (area.labelHorizontal || 'left') + (selectedAreaId === area.id ? ' is-selected' : '')} style={{ left: `${Number(shape.x) * 100}%`, top: `${Number(shape.y) * 100}%`, width: `${Number(shape.width) * 100}%`, height: `${Number(shape.height) * 100}%`, borderColor: area.color || '#bd3e57', color: area.labelColor || '#fff3ed', backgroundColor: area.fillColor ? `color-mix(in srgb, ${area.fillColor} 20%, transparent)` : 'rgba(189, 62, 87, .16)' }} title={area.name} onPointerDown={event => { if (!drawingArea) event.stopPropagation() }} onClick={event => { event.stopPropagation(); openArea(area) }}>{area.name}</div> : null })}{areaPreview && (drawingArea || !editingAreaId) ? <div className="chronicle-map-area chronicle-map-area--preview" style={{ left: `${areaPreview.x * 100}%`, top: `${areaPreview.y * 100}%`, width: `${areaPreview.width * 100}%`, height: `${areaPreview.height * 100}%` }}>Vista previa</div> : null}{activeMap.markers.map(marker => <button key={marker.id} type="button" className={'chronicle-map-marker chronicle-map-marker--' + marker.kind.toLowerCase() + ' chronicle-map-marker--size-' + (marker.size || 'large') + (selectedMarkerId === marker.id ? ' is-selected' : '')} style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }} title={marker.label || marker.resource?.name || marker.location?.name || 'Ubicación'} aria-label={`Abrir ${marker.label || marker.resource?.name || marker.location?.name || 'ubicación'}`} onClick={event => { event.stopPropagation(); openMarker(marker) }}>{marker.kind === 'REFUGE' ? '⌂' : marker.kind === 'DANGER' ? '!' : '⌖'}</button>)}</div> : <div><strong>Este mapa todavía no tiene imagen</strong><span>{workspace?.canManage ? 'Sube una imagen para empezar a colocar lugares.' : 'El narrador todavía no ha publicado una imagen.'}</span></div>}</div>
        <div className="chronicle-map-canvas__controls" aria-label="Controles de zoom"><span>VISTA</span><button type="button" onClick={() => setZoom(current => Math.max(.75, Number((current - .25).toFixed(2))))} aria-label="Alejar">−</button><strong>{Math.round(zoom * 100)}%</strong><button type="button" onClick={() => setZoom(current => Math.min(2.5, Number((current + .25).toFixed(2))))} aria-label="Acercar">＋</button><button type="button" onClick={() => setZoom(1)}>Restablecer</button></div>
        {selectedMarkerId ? (() => { const marker = activeMap.markers.find(item => item.id === selectedMarkerId); return marker ? <aside className="chronicle-map-inspector"><div><small>PUNTO DEL MAPA</small><h3>{marker.label || marker.resource?.name || marker.location?.name || 'Ubicación sin nombre'}</h3><p>{marker.resource?.summary || marker.location?.category || 'Sin información adicional.'}</p><span>{marker.kind} · {Math.round(marker.x * 100)}% / {Math.round(marker.y * 100)}%</span></div><div>{marker.resource || marker.location ? <button type="button" className="chronicle-map-button" onClick={() => void openLinkedResource(marker)}>Abrir recurso</button> : null}{editing ? <><button type="button" className="chronicle-map-button" onClick={() => openMarker(marker)}>Modificar</button><button type="button" className="chronicle-map-button chronicle-map-button--danger" onClick={() => void removeMarker(marker.id)}>Eliminar</button></> : <span className="chronicle-map-inspector__hint">Activa «Editar mapa» para modificarlo.</span>}<button type="button" className="chronicle-map-button" onClick={() => setSelectedMarkerId('')}>Cerrar</button></div></aside> : null })() : null}
        {selectedAreaId ? (() => { const area = activeMap.areas.find(item => item.id === selectedAreaId); return area ? <aside className="chronicle-map-inspector"><div><small>ZONA DEL MAPA</small><h3>{area.name}</h3><p>Zona delimitada en la cartografía.</p></div><div>{editing ? <><button type="button" className="chronicle-map-button" onClick={() => openArea(area)}>Modificar</button><button type="button" className="chronicle-map-button chronicle-map-button--danger" onClick={() => void removeArea(area.id)}>Eliminar</button></> : <span className="chronicle-map-inspector__hint">Activa «Editar mapa» para modificarla.</span>}<button type="button" className="chronicle-map-button" onClick={() => setSelectedAreaId('')}>Cerrar</button></div></aside> : null })() : null}
        {!workspace?.canManage ? <p className="chronicle-map-hint">Pulsa sobre el mapa para solicitar una ubicación. Pulsa un marcador o una zona para consultar su información.</p> : editing ? <p className="chronicle-map-hint">Pulsa sobre el mapa para colocar un punto o utiliza “Dibujar zona”. Pulsa un elemento para editarlo.</p> : <p className="chronicle-map-hint">Modo consulta. Pulsa un marcador o una zona para ver sus detalles; activa “Editar mapa” para realizar cambios.</p>}
        {workspace?.canManage && requests.length ? <section className="chronicle-map-requests"><header><small>SOLICITUDES DE JUGADORES</small><h3>Ubicaciones pendientes</h3></header>{requests.map(request => <article key={request.id} className="chronicle-map-request"><div><strong>{request.title}</strong><p>{request.description || 'Sin explicación adicional.'}</p><small>{request.requester?.displayName || 'Jugador'} · {request.status}</small></div>{request.status === 'pending' ? <div><button type="button" className="chronicle-map-button chronicle-map-button--primary" onClick={() => void review(request, 'APPROVED')}>Aprobar</button><button type="button" className="chronicle-map-button" onClick={() => void review(request, 'REJECTED')}>Rechazar</button></div> : null}</article>)}</section> : null}
      </section>
    </section> : null}
    {creating ? <div className="chronicle-map-dialog-backdrop"><form className="chronicle-map-dialog" onSubmit={createMap}><button type="button" className="chronicle-map-dialog__close" onClick={() => setCreating(false)}>×</button><small>NUEVO MAPA</small><h2>Añadir mapa a la crónica</h2><label>Nombre<input autoFocus required value={newName} onChange={event => setNewName(event.target.value)} placeholder="Provincia, ciudad, barrio…" /></label><label>Descripción<textarea value={newDescription} onChange={event => setNewDescription(event.target.value)} rows={3} /></label><label>Mapa superior<select value={newParentId} onChange={event => setNewParentId(event.target.value)}><option value="">Sin mapa superior</option>{maps.filter(map => map.status === 'active').map(map => <option key={map.id} value={map.id}>{map.name}</option>)}</select></label><footer><button type="button" className="chronicle-map-button" onClick={() => setCreating(false)}>Cancelar</button><button className="chronicle-map-button chronicle-map-button--primary">Crear mapa</button></footer></form></div> : null}
    {interaction && (click || interaction === 'area') ? <div className="chronicle-map-dialog-backdrop"><form className="chronicle-map-dialog" onSubmit={saveInteraction}><button type="button" className="chronicle-map-dialog__close" onClick={closeInteraction}>×</button><small>{interaction === 'marker' ? (editingMarkerId ? 'EDITAR MARCADOR' : 'NUEVO MARCADOR') : interaction === 'area' ? (editingAreaId ? 'EDITAR ZONA' : 'NUEVA ZONA') : 'SOLICITUD AL NARRADOR'}</small><h2>{interaction === 'marker' ? (editingMarkerId ? 'Modificar ubicación' : 'Colocar ubicación') : interaction === 'area' ? (editingAreaId ? 'Modificar zona' : 'Nombrar zona') : 'Solicitar ubicación'}</h2>{click ? <p className="chronicle-map-dialog__coordinates">Posición: {Math.round(click.x * 100)}% / {Math.round(click.y * 100)}%</p> : null}<label>Nombre o título<input autoFocus required value={interactionTitle} onChange={event => setInteractionTitle(event.target.value)} /></label>{interaction !== 'area' ? <><label>Tipo<select value={interactionKind} onChange={event => setInteractionKind(event.target.value)}><option value="LOCATION">Lugar</option><option value="REFUGE">Refugio</option><option value="LANDMARK">Punto de interés</option><option value="DANGER">Zona peligrosa</option></select></label>{interaction === 'marker' ? <><label>Recurso de localización<select value={interactionResourceId} onChange={event => setInteractionResourceId(event.target.value)}><option value="">Sin vincular por ahora</option>{resources.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></label><label>Tamaño del marcador<select value={interactionSize} onChange={event => setInteractionSize(event.target.value as ChronicleMapMarkerSize)}><option value="small">Pequeño · 1/3 del tamaño actual</option><option value="medium">Medio · 1/2 del tamaño actual</option><option value="large">Grande · tamaño actual</option></select></label></> : null}<label>Descripción<textarea rows={4} value={interactionDescription} onChange={event => setInteractionDescription(event.target.value)} placeholder="Explica por qué es importante…" /></label></> : areaStyleControls()}<footer>{editingMarkerId ? <button type="button" className="chronicle-map-button chronicle-map-button--danger" onClick={() => void removeMarker(editingMarkerId)}>Eliminar marcador</button> : null}{editingAreaId ? <button type="button" className="chronicle-map-button chronicle-map-button--danger" onClick={() => void removeArea(editingAreaId)}>Eliminar zona</button> : null}<button type="button" className="chronicle-map-button" onClick={closeInteraction}>Cancelar</button><button className="chronicle-map-button chronicle-map-button--primary">{interaction === 'marker' ? (editingMarkerId ? 'Guardar cambios' : 'Colocar marcador') : interaction === 'area' ? (editingAreaId ? 'Guardar cambios' : 'Guardar zona') : 'Enviar solicitud'}</button></footer></form></div> : null}
    {(resourcePreviewLoading || resourcePreviewError || resourcePreview) ? <div className="chronicle-map-resource-backdrop" onClick={closeResourcePreview}><aside className="chronicle-map-resource-dialog" role="dialog" aria-modal="true" aria-label="Recurso vinculado" onClick={event => event.stopPropagation()}><button type="button" className="chronicle-map-dialog__close" onClick={closeResourcePreview}>×</button>{resourcePreviewLoading ? <p role="status">Cargando recurso…</p> : resourcePreviewError ? <p role="alert">{resourcePreviewError}</p> : resourcePreview ? <><small>RECURSO VINCULADO · {resourcePreview.category}</small><h2>{resourcePreview.label}</h2>{resourcePreview.imageUrl ? <img className="chronicle-map-resource-dialog__image" src={resourcePreview.imageUrl} alt={'Imagen de ' + resourcePreview.label} onError={event => { event.currentTarget.hidden = true }} /> : null}<p className="chronicle-map-resource-dialog__description">{resourcePreview.description || 'Sin descripción disponible.'}</p><dl className="chronicle-map-resource-dialog__facts"><div><dt>Estado</dt><dd>{resourcePreview.status.toLowerCase() === 'active' ? 'Activo' : resourcePreview.status}</dd></div>{resourcePreview.narrativeRole ? <div><dt>Función narrativa</dt><dd>{resourcePreview.narrativeRole}</dd></div> : null}</dl>{resourcePreview.privateNotice ? <p className="chronicle-map-resource-dialog__notice">{resourcePreview.privateNotice}</p> : null}</> : null}</aside></div> : null}
    {message ? <p className="chronicle-map-page__message" role="status">{message}</p> : null}
  </main>
}
