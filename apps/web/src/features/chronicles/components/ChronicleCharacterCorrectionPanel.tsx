import { useEffect, useMemo, useRef, useState } from 'react'
import { characterDisciplineCatalog, characterSkillCatalog } from '@v5r/character-rules'
import type { CharacterDraftApiAdvantageSelection, CharacterDraftApiSnapshot } from '../../character-creation/types/character-draft-api.types.ts'
import type { CharacterAdvantageSelectionDraft } from '../../character-creation/types/character-advantages-draft.types.ts'
import type { ChronicleCharacterCorrectionRequest } from '../../character-sheet/infrastructure/chronicle-character-read.api'
import { characterAdvantageDefinitions } from '../../character-creation/data/character-advantage-definitions'
import { createInitialAdvantageInstanceDetails } from '../../character-creation/domain/advantage-instance-details-rules'
import { AdvantageInstanceDetailsEditor } from '../../character-creation/components/advantages/AdvantageInstanceDetailsEditor'
import type { ChronicleCharacterReadGateways } from '../../character-sheet/infrastructure/chronicle-character-read.api'

interface Props {
  readonly characterId: string
  readonly gateway: ChronicleCharacterReadGateways
  readonly onSaved: () => void
  readonly onClose: () => void
}

const attributeNames: Record<string, string> = {
  strength: 'Fuerza', dexterity: 'Destreza', stamina: 'Resistencia',
  charisma: 'Carisma', manipulation: 'Manipulación', composure: 'Compostura',
  intelligence: 'Inteligencia', wits: 'Astucia', resolve: 'Resolución',
}

function apiToDraft(selection: CharacterDraftApiAdvantageSelection): CharacterAdvantageSelectionDraft {
  return {
    ...selection,
    details: selection.details ?? undefined,
    parentSelectionId: selection.parentSelectionId ?? undefined,
  }
}

function draftToApi(selection: CharacterAdvantageSelectionDraft): CharacterDraftApiAdvantageSelection {
  return {
    ...selection,
    details: selection.details ?? null,
    parentSelectionId: selection.parentSelectionId ?? null,
  }
}

export function ChronicleCharacterCorrectionPanel({ characterId, gateway, onSaved, onClose }: Props) {
  const [snapshot, setSnapshot] = useState<CharacterDraftApiSnapshot | null>(null)
  const [reason, setReason] = useState('')
  const [attributes, setAttributes] = useState<CharacterDraftApiSnapshot['attributes']>({} as CharacterDraftApiSnapshot['attributes'])
  const [skills, setSkills] = useState<CharacterDraftApiSnapshot['skills']>({} as CharacterDraftApiSnapshot['skills'])
  const [disciplines, setDisciplines] = useState<CharacterDraftApiSnapshot['disciplines']>([])
  const [advantages, setAdvantages] = useState<CharacterDraftApiAdvantageSelection[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'attributes' | 'skills' | 'disciplines' | 'advantages'>('attributes')
  const dialogRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.querySelector<HTMLElement>('button, input, select, textarea')?.focus()
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')]
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      previousFocus?.focus()
    }
  }, [onClose])

  useEffect(() => {
    let live = true
    setSnapshot(null)
    setError(null)
    void gateway.character.load(characterId).then((loaded) => {
      if (!live) return
      setSnapshot(loaded)
      setAttributes(loaded.attributes)
      setSkills(loaded.skills)
      setDisciplines(loaded.disciplines)
      setAdvantages(loaded.advantages.selections)
    }).catch(() => {
      if (live) setError('No se pudo cargar la ficha para corregirla.')
    })
    return () => { live = false }
  }, [characterId, gateway])

  const skillNames = useMemo(() => new Map(characterSkillCatalog.definitions.map((item) => [item.key, item.name])), [])
  const disciplineNames = useMemo(() => new Map(characterDisciplineCatalog.disciplines.map((item) => [item.key, item.name])), [])

  function changeAdvantage(index: number, next: CharacterAdvantageSelectionDraft) {
    setAdvantages((current) => current.map((item, itemIndex) => itemIndex === index ? draftToApi(next) : item))
  }

  function replaceAdvantage(index: number, definitionKey: string) {
    const definition = characterAdvantageDefinitions.find((item) => item.key === definitionKey && item.active !== false)
    if (!definition) return
    const current = apiToDraft(advantages[index])
    const initialDetails = createInitialAdvantageInstanceDetails(definition)
    changeAdvantage(index, {
      ...current,
      definitionKey: definition.key,
      category: definition.category,
      rating: definition.allowedRatings[0] ?? 1,
      origin: 'narratorCorrection',
      parentSelectionId: current.parentSelectionId,
      details: initialDetails,
    })
  }

  function addAdvantage(category: 'merit' | 'background' | 'flaw') {
    const definition = characterAdvantageDefinitions.find((item) => item.category === category && item.active !== false)
    if (!definition) return
    const details = createInitialAdvantageInstanceDetails(definition)
    setAdvantages((current) => [...current, {
      selectionId: globalThis.crypto?.randomUUID?.() ?? `correction-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      definitionKey: definition.key,
      category,
      rating: definition.allowedRatings[0] ?? 1,
      origin: 'narratorCorrection',
      parentSelectionId: null,
      details: details ?? null,
    }])
  }

  async function save() {
    if (!snapshot || saving) return
    const request: ChronicleCharacterCorrectionRequest = {
      expectedRevision: snapshot.revision,
      reason: reason.trim(),
      attributes,
      skills,
      disciplines,
      advantages: { selections: advantages },
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await gateway.correction.update(characterId, request)
      setSnapshot(updated)
      setAttributes(updated.attributes)
      setSkills(updated.skills)
      setDisciplines(updated.disciplines)
      setAdvantages(updated.advantages.selections)
      setReason('')
      onSaved()
      onClose()
    } catch (failure) {
      setError(failure instanceof Error && 'status' in failure && failure.status === 409
        ? 'La ficha cambió mientras la editabas. Cierra y vuelve a abrir la corrección para cargar la última versión.'
        : 'No se pudo guardar la corrección. Revisa los valores y vuelve a intentarlo.')
    } finally {
      setSaving(false)
    }
  }

  if (!snapshot) return <div className="character-correction-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="character-correction-panel" role="dialog" aria-modal="true" aria-labelledby="character-correction-title"><h2 id="character-correction-title">Editar ficha</h2><p role="status">{error ?? 'Cargando ficha…'}</p><button type="button" onClick={onClose}>Cerrar</button></section></div>

  return (
    <div className="character-correction-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <form ref={dialogRef} className="character-correction-panel" role="dialog" aria-modal="true" aria-labelledby="character-correction-title" onSubmit={(event) => { event.preventDefault(); void save() }}>
      <header className="character-correction-header">
        <div><span className="participant-eyebrow participant-eyebrow--red">Corrección del Narrador</span><h4 id="character-correction-title">Editar ficha: {snapshot.identity.name}</h4><p>Elige un apartado. Solo se mostrarán sus datos para que la corrección sea más manejable.</p></div>
        <button type="button" className="character-correction-close" aria-label="Cerrar edición" onClick={onClose}>×</button>
      </header>
      <nav className="character-correction-tabs" aria-label="Apartados de la ficha">
        {([
          ['attributes', 'Atributos'], ['skills', 'Habilidades'], ['disciplines', 'Disciplinas'], ['advantages', 'Méritos, defectos y trasfondos'],
        ] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={activeSection === key} onClick={() => setActiveSection(key)}>{label}</button>)}
      </nav>
      {activeSection === 'attributes' ? <section className="character-correction-section">
        <h5>Atributos</h5>
        <div className="character-correction-grid">
          {Object.entries(attributes).map(([key, value]) => <label key={key}>{attributeNames[key] ?? key}<input type="number" min="1" max="5" value={value} onChange={(event) => setAttributes((current) => ({ ...current, [key]: Number(event.target.value) }))} /></label>)}
        </div>
      </section> : null}
      {activeSection === 'skills' ? <section className="character-correction-section">
        <h5>Habilidades</h5>
        <div className="character-correction-grid">
          {Object.entries(skills).map(([key, value]) => <label key={key}>{skillNames.get(key) ?? key}<input type="number" min="0" max="5" value={value} onChange={(event) => setSkills((current) => ({ ...current, [key]: Number(event.target.value) }))} /></label>)}
        </div>
      </section> : null}
      {activeSection === 'disciplines' ? <section className="character-correction-section">
        <h5>Disciplinas</h5>
        {disciplines.length === 0 ? <p>Esta ficha no tiene disciplinas.</p> : disciplines.map((discipline, index) => <label className="character-correction-row" key={`${discipline.disciplineKey}-${index}`}>{disciplineNames.get(discipline.disciplineKey) ?? discipline.disciplineKey}<input aria-label={`Puntuación de ${disciplineNames.get(discipline.disciplineKey) ?? discipline.disciplineKey}`} type="number" min="1" max="5" value={discipline.rating} onChange={(event) => setDisciplines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, rating: Number(event.target.value) } : item))} /></label>)}
      </section> : null}
      {activeSection === 'advantages' ? <section className="character-correction-section">
        <h5>Ventajas, Trasfondos y Defectos</h5>
        <p className="character-correction-section-help">Las selecciones existentes se mantienen juntas aquí. Cambia su tipo, nombre o puntuación, o añade y quita elementos.</p>
        {advantages.map((selection, index) => {
          const draft = apiToDraft(selection)
          const definition = characterAdvantageDefinitions.find((item) => item.key === selection.definitionKey)
          const options = characterAdvantageDefinitions.filter((item) => item.category === selection.category && item.active !== false)
          const ratings = definition?.allowedRatings ?? [selection.rating]
          const parentOptions = advantages.flatMap((candidate) => {
            if (candidate.selectionId === selection.selectionId) return []
            const parentDefinition = characterAdvantageDefinitions.find((item) => item.key === candidate.definitionKey)
            if (!parentDefinition || (definition?.allowedParentDefinitionKeys && !definition.allowedParentDefinitionKeys.includes(parentDefinition.key))) return []
            if (definition?.minimumParentRating && candidate.rating < definition.minimumParentRating) return []
            return [{ id: candidate.selectionId, name: parentDefinition.name }]
          })
          return <article className="character-correction-advantage" key={selection.selectionId}>
            <div className="character-correction-row">
              <label>Tipo<select value={selection.category} onChange={(event) => {
                const category = event.target.value as 'merit' | 'background' | 'flaw'
                const first = characterAdvantageDefinitions.find((item) => item.category === category && item.active !== false)
                if (first) replaceAdvantage(index, first.key)
              }}><option value="merit">Mérito</option><option value="background">Trasfondo</option><option value="flaw">Defecto</option></select></label>
              <label>Selección<select value={selection.definitionKey} onChange={(event) => replaceAdvantage(index, event.target.value)}>{options.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label>
              <label>Puntuación<select value={selection.rating} onChange={(event) => changeAdvantage(index, { ...draft, rating: Number(event.target.value) })}>{[...new Set([...ratings, selection.rating])].sort((a, b) => a - b).map((rating) => <option key={rating} value={rating}>{rating}</option>)}</select></label>
              <button type="button" onClick={() => setAdvantages((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Quitar</button>
            </div>
            {definition?.requiresParentSelection || definition?.allowsOptionalParentSelection ? <label>Vincular con<select required={definition.requiresParentSelection} value={selection.parentSelectionId ?? ''} onChange={(event) => changeAdvantage(index, { ...draft, parentSelectionId: event.target.value || undefined })}><option value="">{definition.requiresParentSelection ? 'Selecciona un elemento asociado' : 'Sin vínculo'}</option>{parentOptions.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select></label> : null}
            {draft.details ? <AdvantageInstanceDetailsEditor selection={draft} onChange={(next) => changeAdvantage(index, next)} /> : null}
          </article>
        })}
        <div className="character-correction-add-actions">
          <button type="button" onClick={() => addAdvantage('merit')}>Añadir Mérito</button>
          <button type="button" onClick={() => addAdvantage('background')}>Añadir Trasfondo</button>
          <button type="button" onClick={() => addAdvantage('flaw')}>Añadir Defecto</button>
        </div>
      </section> : null}
      <label className="character-correction-reason">Motivo de la corrección<textarea required minLength={5} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ej.: se corrigió una puntuación introducida por error durante la creación." /></label>
      {error ? <p role="alert">{error}</p> : null}
      <footer className="character-correction-footer"><p>Se registrará quién hizo el cambio y por qué. Los PX y estados de juego no se modifican.</p><div><button type="button" className="character-correction-cancel" onClick={onClose} disabled={saving}>Cancelar</button><button className="character-correction-save" type="submit" disabled={saving || reason.trim().length < 5}>{saving ? 'Guardando…' : 'Guardar corrección'}</button></div></footer>
    </form>
    </div>
  )
}
