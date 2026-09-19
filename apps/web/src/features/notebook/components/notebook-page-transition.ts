// SPEC071_ANIMATED_NOTEBOOK_V2
export type NotebookPageTransitionPhase = 'idle' | 'preparing' | 'turning-forward' | 'turning-backward' | 'settling' | 'reduced-motion'
export type NotebookPageTransitionDirection = 'forward' | 'backward'
export type NotebookPageTransitionState = { readonly activeKey: string; readonly pendingKey: string | null; readonly direction: NotebookPageTransitionDirection | null; readonly phase: NotebookPageTransitionPhase }
export type NotebookPageTransitionAction = { readonly type: 'request'; readonly targetKey: string; readonly direction: NotebookPageTransitionDirection; readonly reducedMotion: boolean } | { readonly type: 'start' } | { readonly type: 'finish' } | { readonly type: 'settle' }
export function notebookPageDirection(order: readonly string[], from: string, to: string): NotebookPageTransitionDirection { const a = order.indexOf(from); const b = order.indexOf(to); return a < 0 || b < 0 || b >= a ? 'forward' : 'backward' }
export function notebookPageTransitionInitial(activeKey: string): NotebookPageTransitionState { return { activeKey, pendingKey: null, direction: null, phase: 'idle' } }
export function notebookPageTransitionReducer(state: NotebookPageTransitionState, action: NotebookPageTransitionAction): NotebookPageTransitionState {
  if (action.type === 'request') { if (action.targetKey === state.activeKey && state.pendingKey === null) return state; if (action.reducedMotion) return { activeKey: action.targetKey, pendingKey: null, direction: action.direction, phase: 'reduced-motion' }; return { activeKey: state.activeKey, pendingKey: action.targetKey, direction: action.direction, phase: 'preparing' } }
  if (action.type === 'start') return state.pendingKey === null || state.phase !== 'preparing' ? state : { ...state, phase: state.direction === 'backward' ? 'turning-backward' : 'turning-forward' }
  if (action.type === 'finish') return state.pendingKey === null ? state : { activeKey: state.pendingKey, pendingKey: null, direction: state.direction, phase: 'settling' }
  return state.phase === 'settling' || state.phase === 'reduced-motion' ? { ...state, phase: 'idle' } : state
}