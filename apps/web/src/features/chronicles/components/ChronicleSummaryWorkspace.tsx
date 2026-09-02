import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

import { createChronicleGateway } from '../infrastructure/chronicle.api.ts'
import { createChronicleStoryGateway } from '../infrastructure/chronicle-story.api.ts'
import type {
  ChronicleApiSnapshot,
  ChronicleCharacterApiSummary,
  ChronicleEventApiSnapshot,
  ChronicleParticipantApiSnapshot,
  ChronicleSessionApiSnapshot,
} from '../types/chronicle-api.types.ts'
import type { ChronicleStoryApiSnapshot } from '../types/chronicle-story-api.types.ts'
import './chronicle-summary-workspace.css'
import './chronicle-summary-progress-containment.css'

const gateway = createChronicleGateway()
const storyGateway = createChronicleStoryGateway()

interface Props {
  readonly chronicle: ChronicleApiSnapshot
  readonly participants: readonly ChronicleParticipantApiSnapshot[]
  readonly characters: readonly ChronicleCharacterApiSummary[]
  readonly canManage: boolean
  readonly onNavigate: (section: 'stories' | 'sessions' | 'timeline', intent?: 'create-story' | 'create-session' | 'create-event') => void
  readonly lifecycleLabel: string
  readonly lifecycleBusy: boolean
  readonly onLifecycle: () => void
}

interface Snapshot {
  readonly sessions: readonly ChronicleSessionApiSnapshot[]
  readonly stories: readonly SummaryStory[]
  readonly events: readonly ChronicleEventApiSnapshot[]
}

type SummaryStory = Pick<
  ChronicleStoryApiSnapshot,
  'id' | 'title' | 'status' | 'progress' | 'updatedAt'
>

const statusLabels = {
  preparation: 'Preparaci\u00f3n',
  active: 'Activa',
  archived: 'Archivada',
} as const

const stages = ['Inicio', 'Desarrollo', 'Crisis', 'Cl\u00edmax'] as const

function sessionLabel(session: ChronicleSessionApiSnapshot): string {
  return session.title ?? (
    session.sessionNumber === null
      ? 'Sesi\u00f3n sin t\u00edtulo'
      : 'Sesi\u00f3n ' + session.sessionNumber
  )
}

function dateLabel(value: string | null): string {
  if (value === null) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function averageProgress(stories: readonly SummaryStory[]): number {
  if (stories.length === 0) return 0
  return Math.round(
    stories.reduce((total, story) => total + story.progress.percentage, 0) / stories.length,
  )
}

function stageFor(progress: number): number {
  if (progress >= 75) return 3
  if (progress >= 50) return 2
  if (progress > 0) return 1
  return 0
}

export function ChronicleSummaryWorkspace({
  chronicle,
  participants,
  characters,
  canManage,
  onNavigate,
  lifecycleLabel,
  lifecycleBusy,
  onLifecycle,
}: Props) {
  const [data, setData] = useState<Snapshot | null>(null)
  const [error, setError] = useState(false)

  async function loadSummary() {
    setError(false)
    try {
      const [sessionPage, storyPage, events] = await Promise.all([
        gateway.sessions(chronicle.id, { limit: 25, offset: 0 }),
        canManage
          ? storyGateway.list(chronicle.id)
          : storyGateway.listShared(chronicle.id),
        canManage
          ? gateway.events(chronicle.id)
          : Promise.resolve([]),
      ])
      setData({
        sessions: sessionPage.items,
        stories: storyPage.items,
        events,
      })
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    void loadSummary()
  }, [chronicle.id, canManage])

  const sessions = data?.sessions ?? []
  const stories = data?.stories ?? []
  const events = data?.events ?? []
  const activeStories = stories.filter((story) => story.status === 'active')
  const preparationSessions = sessions.filter((session) => session.status === 'preparation')
  const completedSessions = sessions.filter((session) => session.status === 'completed')
  const nextSession = [...preparationSessions]
    .sort((left, right) => (left.realDate ?? '9999').localeCompare(right.realDate ?? '9999'))[0] ?? null
  const activeParticipants = participants.filter((participant) => participant.status === 'active')
  const progress = averageProgress(activeStories)
  const currentStage = stageFor(progress)
  const pending = [
    {
      label: 'Preparar pr\u00f3xima sesi\u00f3n',
      done: nextSession !== null,
      detail: nextSession === null ? 'Sin fecha' : dateLabel(nextSession.realDate),
    },
    {
      label: 'Revisar historias en curso',
      done: activeStories.length === 0 || activeStories.every((story) => story.progress.percentage >= 100),
      detail: activeStories.length === 0 ? 'Sin historias' : activeStories.length + ' activas',
    },
    {
      label: 'Actualizar cronolog\u00eda',
      done: events.length > 0,
      detail: events.length > 0 ? events.length + ' sucesos' : 'Sin sucesos',
    },
    {
      label: 'Asociar personajes',
      done: characters.length > 0,
      detail: characters.length > 0 ? characters.length + ' asociados' : 'Sin personajes',
    },
  ]
  const recent = [
    ...events.map((event) => ({
      id: 'event-' + event.id,
      title: event.title,
      description: event.description ?? event.narrativeTimeLabel ?? 'Suceso registrado en la cr\u00f3nica.',
      kind: 'Suceso',
      at: event.updatedAt,
    })),
    ...stories.map((story) => ({
      id: 'story-' + story.id,
      title: story.title,
      description: story.progress.percentage + '% de progreso narrativo',
      kind: 'Historia',
      at: story.updatedAt,
    })),
    ...sessions.map((session) => ({
      id: 'session-' + session.id,
      title: sessionLabel(session),
      description: session.summary ?? 'Sesi\u00f3n actualizada.',
      kind: 'Sesi\u00f3n',
      at: session.updatedAt,
    })),
  ].sort((left, right) => right.at.localeCompare(left.at)).slice(0, 4)

  const tone = {
    tension: activeStories.length > 1 ? 'Alta' : activeStories.length === 1 ? 'Media' : 'Baja',
    darkness: events.length > 3 ? 'Profunda' : events.length > 0 ? 'Media' : 'Leve',
    instability: preparationSessions.length > 0 ? 'Media' : 'Estable',
    protagonism: activeParticipants.length > 1 ? 'Equilibrado' : 'Concentrado',
  }

  return (
    <section className="chronicle-summary-workspace" aria-labelledby="chronicle-summary-title" data-chronicle-name={chronicle.name}>
      <aside className="chronicle-summary-workspace__rail">
        <section className="summary-card summary-card--identity">
          <div className="summary-card__heading">
            <div>
              <span className="summary-eyebrow">Cr&oacute;nica</span>
              <h2 id="chronicle-summary-title">Resumen</h2>
            </div>
            <span className="summary-status">{statusLabels[chronicle.status]}</span>
          </div>
        </section>

        <section className="summary-card">
          <h3>Estado de la cr&oacute;nica</h3>
          <dl className="summary-stat-list">
            <div><dt><span aria-hidden="true">▣</span> Historias activas</dt><dd>{data === null ? '—' : activeStories.length}<span>›</span></dd></div>
            <div><dt><span aria-hidden="true">◷</span> Sesiones realizadas</dt><dd>{data === null ? '—' : completedSessions.length}<span>›</span></dd></div>
            <div><dt><span aria-hidden="true">♧</span> Participantes</dt><dd>{activeParticipants.length}<span>›</span></dd></div>
          </dl>
        </section>

        {canManage ? (
          <section className="summary-card">
            <span className="summary-eyebrow">Atajos</span>
            <div className="summary-shortcuts">
              <button type="button" onClick={() => onNavigate('sessions', 'create-session')}>＋ Preparar sesi&oacute;n</button>
              <button type="button" onClick={() => onNavigate('stories', 'create-story')}>＋ Nueva historia</button>
              <button type="button" onClick={() => onNavigate('timeline', 'create-event')}>＋ A&ntilde;adir suceso</button>
            </div>
          </section>
        ) : null}

        <section className="summary-card summary-card--activity">
          <span className="summary-eyebrow">Actividad reciente</span>
          <ul className="summary-activity-list">
            {recent.map((item) => (
              <li key={item.id}>
                <span className="summary-timeline-dot" aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                  <time>{item.kind} · {dateLabel(item.at)}</time>
                </div>
              </li>
            ))}
            {recent.length === 0 ? <li className="summary-empty">Sin actividad registrada.</li> : null}
          </ul>
          <button className="summary-link-button" type="button" onClick={() => onNavigate('timeline')}>Ver toda la actividad <span>›</span></button>
        </section>
      </aside>

      <main className="chronicle-summary-workspace__center">
        <section className="summary-card summary-card--overview">
          <div className="summary-card__heading">
            <h3>Visi&oacute;n general</h3>
          </div>
          <div className="summary-block-grid">
            <article>
              <span className="summary-eyebrow">Premisa</span>
              <p id="chronicle-summary-premise" tabIndex={-1}>{chronicle.description ?? 'A\u00f1ade una premisa para fijar el tono y el conflicto de esta cr\u00f3nica.'}</p>
            </article>
            <article>
              <span className="summary-eyebrow">Situaci&oacute;n actual</span>
              <p>{nextSession?.summary ?? (events[0]?.description ?? 'La situaci\u00f3n actual aparecer\u00e1 al registrar sesiones y sucesos.')}</p>
            </article>
          </div>
        </section>

        <section className="summary-card summary-card--progress">
          <div className="summary-card__heading">
            <span className="summary-eyebrow">Progreso de la cr&oacute;nica</span>
            <strong className="summary-progress-value">{progress}%</strong>
          </div>
          <div className="summary-stage-track" style={{ '--summary-progress': progress + '%' } as CSSProperties}>
            {stages.map((stage, index) => {
              const complete = index < currentStage
              const current = index === currentStage
              return (
                <div className={'summary-stage ' + (complete ? 'summary-stage--complete ' : '') + (current ? 'summary-stage--current' : '')} key={stage}>
                  <span className="summary-stage__node">{index + 1}</span>
                  <strong>{stage}</strong>
                  <small>{complete ? 'Completado' : current ? (progress === 0 ? 'Pendiente' : 'En progreso') : 'Pendiente'}</small>
                </div>
              )
            })}
          </div>
        </section>

        <div className="summary-split-grid">
          <section className="summary-card summary-card--session">
            <div className="summary-card__heading">
              <span className="summary-eyebrow">Pr&oacute;xima sesi&oacute;n</span>
              {nextSession ? <time>{dateLabel(nextSession.realDate)}</time> : null}
            </div>
            <h3>{nextSession ? sessionLabel(nextSession) : 'Sin sesi\u00f3n preparada'}</h3>
            <p>{nextSession?.summary ?? 'Prepara una sesi\u00f3n para que el siguiente paso de la cr\u00f3nica quede listo.'}</p>
            <div className="summary-meter"><span style={{ width: (nextSession ? Math.min(100, Math.max(8, (nextSession.summary?.length ?? 0) / 2)) : 0) + '%' }} /></div>
            <div className="summary-meter-label"><span>Preparaci&oacute;n</span><strong>{nextSession ? 'En curso' : 'Pendiente'}</strong></div>
            {nextSession ? <button className="summary-link-button" type="button" onClick={() => onNavigate('sessions')}>Ver preparaci&oacute;n <span>›</span></button> : null}
          </section>

          <section className="summary-card summary-card--stories">
            <div className="summary-card__heading">
              <span className="summary-eyebrow">Historias en curso</span>
              <button className="summary-inline-button" type="button" onClick={() => onNavigate('stories')}>Ver todas</button>
            </div>
            <ul className="summary-story-list">
              {activeStories.slice(0, 3).map((story) => (
                <li key={story.id}>
                  <span className="summary-story-icon" aria-hidden="true">▣</span>
                  <div><strong>{story.title}</strong><div className="summary-mini-meter"><span style={{ width: story.progress.percentage + '%' }} /></div></div>
                  <b>{story.progress.percentage}%</b>
                </li>
              ))}
              {activeStories.length === 0 ? <li className="summary-empty">No hay historias activas.</li> : null}
            </ul>
          </section>
        </div>

        <section className="summary-card summary-card--events">
          <div className="summary-card__heading">
              <span className="summary-eyebrow">&Uacute;ltimos sucesos</span>
            <button className="summary-inline-button" type="button" onClick={() => onNavigate('timeline')}>Ver todos los sucesos <span>›</span></button>
          </div>
          <ul className="summary-event-list">
            {events.slice(0, 4).map((event) => (
              <li key={event.id}>
                <span className="summary-event-marker" aria-hidden="true" />
                <div><strong>{event.title}</strong><small>{event.description ?? event.narrativeTimeLabel ?? 'Sin descripci\u00f3n'}</small></div>
                <time>{dateLabel(event.realDate ?? event.updatedAt)}</time>
              </li>
            ))}
            {events.length === 0 ? <li className="summary-empty">No hay sucesos registrados.</li> : null}
          </ul>
        </section>

        {error ? <div className="summary-error" role="status"><span>No se pudo actualizar el resumen.</span><button type="button" onClick={() => void loadSummary()}>Reintentar</button></div> : null}
      </main>

      <aside className="chronicle-summary-workspace__rail chronicle-summary-workspace__rail--right">
        <section className="summary-card summary-card--pulse">
          <h3><span className="summary-diamond" aria-hidden="true">◇</span> Pulso de la cr&oacute;nica</h3>
          <div className="summary-pulse-grid">
            <div><span>Tensi&oacute;n</span><strong className="summary-tone--red">{tone.tension}</strong></div>
            <div><span>Oscuridad</span><strong className="summary-tone--red">{tone.darkness}</strong></div>
            <div><span>Inestabilidad</span><strong className="summary-tone--amber">{tone.instability}</strong></div>
            <div><span>Protagonismo</span><strong className="summary-tone--amber">{tone.protagonism}</strong></div>
          </div>
          <button className="summary-link-button" type="button" onClick={() => onNavigate('stories')}>Ver an&aacute;lisis detallado <span>›</span></button>
        </section>

        {canManage ? <section className="summary-card summary-card--pending">
          <h3>Pendientes del Narrador</h3>
          <ul className="summary-pending-list">
            {pending.map((item) => (
              <li key={item.label}>
                <span className={'summary-checkbox ' + (item.done ? 'summary-checkbox--done' : '')} aria-hidden="true">{item.done ? '✓' : ''}</span>
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </li>
            ))}
          </ul>
          <button className="summary-link-button" type="button" onClick={() => onNavigate('sessions')}>Ver todos los pendientes <span>›</span></button>
        </section> : null}

        {canManage ? <section className="summary-card summary-card--critical">
          <span className="summary-eyebrow">Acciones cr&iacute;ticas</span>
          <button className="summary-action-button summary-action-button--danger" type="button" disabled={lifecycleBusy} onClick={onLifecycle}>▣ <span>{lifecycleBusy ? 'Actualizando…' : lifecycleLabel}</span><b>›</b></button>
        </section> : null}
      </aside>
    </section>
  )
}
