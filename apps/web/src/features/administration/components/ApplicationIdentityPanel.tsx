import { useEffect, useRef, useState } from 'react'
import { displayApplicationIdentity, loadApplicationIdentity, type ApplicationIdentity } from '../../installation/application-identity'
import './application-identity.css'

export function ApplicationIdentityPanel() {
  const [identity, setIdentity] = useState<ApplicationIdentity | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const mounted = useRef(true)
  async function reload() {
    try { const current = await loadApplicationIdentity(); if (mounted.current) setIdentity(current) }
    catch { if (mounted.current) setMessage('No se pudo cargar la identidad. Vuelve a abrir este apartado para reintentar.') }
  }
  useEffect(() => { mounted.current = true; void reload(); return () => { mounted.current = false } }, [])
  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function save(reset: boolean) {
    if (!identity || busy || (!reset && !file)) return
    if (reset && !window.confirm('¿Restaurar el icono predeterminado para toda la aplicación?')) return
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/application/identity/icon', {
        method: reset ? 'DELETE' : 'PUT', credentials: 'include',
        headers: { 'If-Match': identity.revision, ...(!reset ? { 'Content-Type': 'application/octet-stream' } : {}) },
        body: reset ? undefined : file!,
      })
      if (!response.ok) {
        if (response.status === 409) { await reload(); throw new Error('Otro administrador cambió el icono. Revisa la versión actual y vuelve a intentarlo.') }
        throw new Error(response.status === 403 || response.status === 401 ? 'Necesitas una sesión de administrador activa.' : 'No se pudo guardar. Usa PNG, JPEG o WebP estático, hasta 5 MB y 16 megapíxeles. El icono anterior se conserva.')
      }
      const current: ApplicationIdentity = await response.json()
      if (!mounted.current) return
      setIdentity(current); displayApplicationIdentity(current); setFile(null)
      if (input.current) input.current.value = ''
      setMessage(reset ? 'Icono predeterminado restaurado.' : 'Icono guardado para toda la aplicación. Los dispositivos instalados pueden tardar en actualizarlo.')
    } catch (error) { if (mounted.current) setMessage(error instanceof Error ? error.message : 'No se pudo guardar; comprueba la conexión.') }
    finally { if (mounted.current) setBusy(false) }
  }

  return <section className="administration-hub__card application-identity" aria-labelledby="identity-title">
    <h2 id="identity-title">Identidad de la aplicación</h2>
    <p>Este icono es público y común para todos los usuarios. No subas retratos ni información privada de la partida.</p>
    <p>PNG, JPEG o WebP estático, hasta 5 MB y 16 megapíxeles. Recomendado: imagen cuadrada de 512 × 512 píxeles o mayor. Se ajusta sin recortar; se añade margen para los iconos redondos.</p>
    {identity && <div className="application-identity__previews"><figure><img src={identity.icon} alt="Icono actual de BloodKeeper" /><figcaption>{identity.custom ? 'Icono personalizado actual' : 'Icono predeterminado actual'}</figcaption></figure>
      {preview && <figure><img src={preview} alt="Imagen seleccionada, todavía sin guardar" /><figcaption>Selección sin guardar</figcaption></figure>}</div>}
    <label>Seleccionar nuevo icono<input ref={input} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy || !identity} onChange={event => {
      const candidate = event.currentTarget.files?.[0] ?? null
      if (candidate && (!['image/png', 'image/jpeg', 'image/webp'].includes(candidate.type) || candidate.size > 5 * 1024 * 1024)) {
        setMessage('Selecciona PNG, JPEG o WebP de hasta 5 MB.'); event.currentTarget.value = ''; setFile(null); return
      }
      setFile(candidate); setMessage('')
    }} /></label>
    <div className="application-identity__actions"><button type="button" disabled={busy || !file || !identity} onClick={() => void save(false)}>{busy ? 'Procesando…' : 'Guardar icono para todos'}</button>
      <button type="button" disabled={busy || !identity?.custom} onClick={() => void save(true)}>Restaurar predeterminado</button></div>
    {message && <p role="status">{message}</p>}
    <p>HTTP por IP local sigue funcionando. Instalar como aplicación requiere HTTPS. Los navegadores controlan cuándo se actualiza el icono de una aplicación ya instalada.</p>
  </section>
}
