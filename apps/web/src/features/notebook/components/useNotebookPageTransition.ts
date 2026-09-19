// SPEC071_ANIMATED_NOTEBOOK_V2
import { useCallback, useEffect, useReducer, useState } from 'react'
import { notebookPageDirection, notebookPageTransitionInitial, notebookPageTransitionReducer } from './notebook-page-transition'
import type { NotebookPageTransitionState } from './notebook-page-transition'
type Options = { readonly activeKey: string; readonly order: readonly string[]; readonly durationMs?: number }
const reduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
export function useNotebookPageTransition({ activeKey, order, durationMs = 440 }: Options) {
  const [reducedMotion, setReducedMotion] = useState(reduced)
  const [state, dispatch] = useReducer(notebookPageTransitionReducer, activeKey, notebookPageTransitionInitial)
  useEffect(() => { if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return; const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReducedMotion(media.matches); update(); media.addEventListener?.('change', update); return () => media.removeEventListener?.('change', update) }, [])
  useEffect(() => { if (activeKey === state.activeKey && state.pendingKey === null) return; if (activeKey === state.pendingKey) return; dispatch({ type: 'request', targetKey: activeKey, direction: notebookPageDirection(order, state.activeKey, activeKey), reducedMotion }) }, [activeKey, order, reducedMotion, state.activeKey, state.pendingKey])
  useEffect(() => { if (state.phase === 'preparing') { const frame = requestAnimationFrame(() => dispatch({ type: 'start' })); return () => cancelAnimationFrame(frame) }; if (state.phase === 'turning-forward' || state.phase === 'turning-backward') { const timer = window.setTimeout(() => dispatch({ type: 'finish' }), durationMs + 140); return () => window.clearTimeout(timer) }; if (state.phase === 'settling' || state.phase === 'reduced-motion') { const timer = window.setTimeout(() => dispatch({ type: 'settle' }), state.phase === 'settling' ? 90 : 0); return () => window.clearTimeout(timer) }; return undefined }, [durationMs, state.phase])
  const finish = useCallback(() => dispatch({ type: 'finish' }), [])
  return { state: state as NotebookPageTransitionState, reducedMotion, durationMs, finish }
}