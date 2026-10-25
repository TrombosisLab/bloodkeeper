export interface ApplicationIdentity { revision: string; custom: boolean; icon: string; appleIcon: string }

export async function loadApplicationIdentity(): Promise<ApplicationIdentity> {
  const response = await fetch('/api/application/identity', { credentials: 'same-origin', cache: 'no-store', redirect: 'error' })
  if (!response.ok) throw new Error('No se pudo cargar el icono de la aplicación.')
  return response.json()
}

export function displayApplicationIdentity(identity: ApplicationIdentity) {
  // Only same-origin, application-owned image URLs are accepted.
  for (const [relation, source] of [['icon', identity.icon], ['apple-touch-icon', identity.appleIcon]]) {
    if (!source.startsWith('/icons/bloodkeeper-') && !/^\/api\/application\/icons\/[0-9a-f-]{36}\/(180|192)\.png$/.test(source)) continue
    document.querySelector<HTMLLinkElement>(`link[rel="${relation}"]`)?.setAttribute('href', source)
  }
}

export async function refreshApplicationIdentity() {
  try { displayApplicationIdentity(await loadApplicationIdentity()) }
  catch { /* Default icons and HTTP navigation remain usable if the API is unavailable. */ }
}
