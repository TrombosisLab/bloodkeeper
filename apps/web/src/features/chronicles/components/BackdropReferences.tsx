import { useState } from 'react'
import type { BackdropReference, ReferenceOption } from '../domain/chronicle-backdrop'
import { referenceKey } from '../domain/chronicle-backdrop'
export function BackdropReferences({ references, options, onChange, disabled }: {
  references: BackdropReference[]; options: ReferenceOption[]; onChange: (refs: BackdropReference[]) => void; disabled: boolean
}) {
  const [query, setQuery] = useState(''), [choice, setChoice] = useState('')
  return <fieldset disabled={disabled} className="chronicle-backdrop__references"><legend>Referencias</legend>
    {references.map(ref => {
      const option = options.find(o => referenceKey(o) === referenceKey(ref))
      return <div key={referenceKey(ref)}><div className="chronicle-backdrop__reference"><span>{option?.label ?? 'Referencia no disponible'}</span>
        <button type="button" aria-label="Retirar referencia" onClick={() => onChange(references.filter(r => referenceKey(r) !== referenceKey(ref)))}>×</button></div>
        {option?.milestones && <details><summary>Hitos del guion · Solo consulta · {option.cardCount ?? 0} tarjetas</summary>
          <ul>{option.milestones.map((m, i) => <li key={i}>{m.completed ? '✓' : '○'} {m.label}{m.note ? ': ' + m.note : ''}</li>)}</ul>
        </details>}
      </div>
    })}
    <label>Buscar recurso, historia o tarjeta<input value={query} onChange={e => setQuery(e.target.value)} /></label>
    <select aria-label="Referencia para añadir" value={choice} onChange={e => setChoice(e.target.value)}><option value="">Elige una referencia</option>
      {options.filter(o => o.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()) && !references.some(r => referenceKey(r) === referenceKey(o))).map(o => <option key={referenceKey(o)} value={referenceKey(o)}>{o.label}</option>)}
    </select>
    <button type="button" disabled={!choice || references.length >= 20} onClick={() => {
      const o = options.find(o => referenceKey(o) === choice)
      if (o && !references.some(r => referenceKey(r) === choice)) {
        onChange([...references, { kind: o.kind, id: o.id, ...(o.cardId === undefined ? {} : { cardId: o.cardId }) }]); setChoice('')
      }
    }}>Añadir referencia</button><small>Vincular no copia ni modifica la ficha o el guion.</small>
  </fieldset>
}
