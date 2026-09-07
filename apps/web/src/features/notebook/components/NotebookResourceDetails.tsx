import type { NotebookResourcePreview } from '../types/notebook.types'

const fieldNames: Record<string, string> = {
  alias: 'Alias', clan: 'Clan', generation: 'Generación', sire: 'Sire', sect: 'Secta', title: 'Título',
  territory: 'Territorio', domain: 'Dominio', faction: 'Facción', influence: 'Influencia', resources: 'Recursos',
  traits: 'Rasgos', disciplines: 'Disciplinas', allies: 'Aliados', rivals: 'Rivales', history: 'Historia',
  attributes: 'Atributos', disciplineDetails: 'Detalle de disciplinas', strength: 'Fuerza', dexterity: 'Destreza',
  stamina: 'Resistencia', charisma: 'Carisma', manipulation: 'Manipulación', composure: 'Compostura',
  intelligence: 'Inteligencia', wits: 'Astucia', resolve: 'Resolución', name: 'Nombre', rating: 'Nivel', powers: 'Poderes',
  description: 'Descripción', summary: 'Resumen', url: 'Enlace', type: 'Tipo', notes: 'Notas',
}
function Details({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined || value === '') return <span className="nb2-muted">Sin registrar</span>
  if (typeof value === 'string' || typeof value === 'number') return <span className="nb2-detail-value">{String(value)}</span>
  if (typeof value === 'boolean') return <span>{value ? 'Sí' : 'No'}</span>
  if (depth > 8) return <span>Detalle anidado no disponible en esta vista.</span>
  if (Array.isArray(value)) return value.length ? <ul className="nb2-detail-list">{value.map((item, index) => <li key={index}><Details value={item} depth={depth + 1} /></li>)}</ul> : <span className="nb2-muted">Sin registros</span>
  if (typeof value === 'object') return <dl className="nb2-definition">{Object.entries(value).map(([key, item]) => <div key={key}><dt>{fieldNames[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')}</dt><dd><Details value={item} depth={depth + 1} /></dd></div>)}</dl>
  return null
}
export function NotebookResourceDetails({ resource }: { resource: NotebookResourcePreview }) {
  return <>
    {resource.imageUrl && <img className="nb2-resource-image" src={resource.imageUrl} alt={'Imagen de ' + resource.label} />}
    {resource.targetType === 'SESSION' && <dl className="nb2-definition"><div><dt>Sesión</dt><dd>{resource.sessionNumber ?? 'Sin numerar'}</dd></div><div><dt>Fecha</dt><dd>{resource.sessionDate ? new Date(resource.sessionDate).toLocaleString('es-ES') : 'Sin fecha programada'}</dd></div></dl>}
    {resource.deepProfile !== null && resource.deepProfile !== undefined && <section className="nb2-dossier"><h3>Dossier del PNJ</h3><p className="nb2-muted">Información reservada al narrador.</p><Details value={resource.deepProfile} /></section>}
    {resource.metadata !== null && resource.metadata !== undefined && <section className="nb2-dossier"><h3>Información adicional del recurso</h3><p className="nb2-muted">Información reservada al narrador.</p><Details value={resource.metadata} /></section>}
  </>
}
