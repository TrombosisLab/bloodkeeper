import { useEffect, useState } from 'react'

export const ACTIVE_CHRONICLE_STORAGE_KEY = 'bloodkeeper.activeChronicleId'
export const CHRONICLE_CONTEXT_EVENT = 'bloodkeeper:active-chronicle-change'

export function rememberActiveChronicle(id: string | null) {
  if (typeof window === 'undefined') return
  if (id) window.localStorage.setItem(ACTIVE_CHRONICLE_STORAGE_KEY, id)
  else window.localStorage.removeItem(ACTIVE_CHRONICLE_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(CHRONICLE_CONTEXT_EVENT, { detail: id }))
}

export function rememberNotebookChronicle(id: string | null) {
  if (typeof window === 'undefined') return
  if (id) window.sessionStorage.setItem('bloodkeeper.notebookChronicleId', id)
  else window.sessionStorage.removeItem('bloodkeeper.notebookChronicleId')
  window.dispatchEvent(new CustomEvent(CHRONICLE_CONTEXT_EVENT, { detail: id }))
}

export function useActiveChronicleHeader() {
  const [chronicleId, setChronicleId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(ACTIVE_CHRONICLE_STORAGE_KEY)
  })

  useEffect(() => {
    const sync = () => setChronicleId(window.localStorage.getItem(ACTIVE_CHRONICLE_STORAGE_KEY))
    window.addEventListener(CHRONICLE_CONTEXT_EVENT, sync)
    window.addEventListener('storage', sync)
    sync()
    return () => {
      window.removeEventListener(CHRONICLE_CONTEXT_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (chronicleId) root.style.setProperty('--app-active-chronicle-cover', `url("/api/chronicles/${chronicleId}/cover")`)
    else root.style.removeProperty('--app-active-chronicle-cover')
    root.toggleAttribute('data-active-chronicle', Boolean(chronicleId))
    return () => {
      root.style.removeProperty('--app-active-chronicle-cover')
      root.removeAttribute('data-active-chronicle')
    }
  }, [chronicleId])
}
