// SPEC071_ANIMATED_NOTEBOOK_V2
import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, TransitionEvent } from 'react'
import { useNotebookPageTransition } from './useNotebookPageTransition'
type Layer = { readonly key: string; readonly content: ReactNode }
type Props = { readonly activeKey: string; readonly order: readonly string[]; readonly children: ReactNode }
export function NotebookPageTransition({ activeKey, order, children }: Props) {
  const transition = useNotebookPageTransition({ activeKey, order })
  const stable = useRef<Layer>({ key: activeKey, content: children })
  const [pending, setPending] = useState<Layer | null>(null)
  const state = transition.state
  useLayoutEffect(() => { if (state.activeKey === activeKey && state.pendingKey === null) { stable.current = { key: activeKey, content: children }; setPending(null); return }; if (activeKey !== stable.current.key) setPending((value) => value?.key === activeKey ? value : { key: activeKey, content: children }) }, [activeKey, children, state.activeKey, state.pendingKey])
  const settled = state.activeKey === activeKey && state.pendingKey === null && (state.phase === 'idle' || state.phase === 'settling' || state.phase === 'reduced-motion')
  if (settled) return <section className="nb2-page-transition" aria-live="polite" aria-busy={state.phase === "settling"}>{children}</section>
  const outgoing = stable.current; const incoming = pending; const direction = state.direction || 'forward'; const phase = state.phase
  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => { if (event.target === event.currentTarget && event.propertyName === 'transform') transition.finish() }
  return <section className="nb2-page-transition" aria-live="polite" aria-busy="true"><div className="nb2-page-transition__base" aria-hidden={Boolean(incoming)}>{outgoing.content}</div>{incoming && <div className={"nb2-page-turn nb2-page-turn--" + direction + " nb2-page-turn--" + phase} aria-hidden="true" onTransitionEnd={onTransitionEnd}><div className="nb2-page-face nb2-page-face--front">{direction === 'forward' ? outgoing.content : incoming.content}</div><div className="nb2-page-face nb2-page-face--back">{direction === 'forward' ? incoming.content : outgoing.content}</div></div>}</section>
}