import {useEffect, useRef, useState} from 'react'
import './installation.css'

interface InstallPrompt extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'; platform: string}>
}

export function InstallApplication() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [installed, setInstalled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const secure = window.isSecureContext

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)')
    const sync = () => setInstalled(standalone.matches || Boolean((navigator as Navigator & {standalone?: boolean}).standalone))
    const available = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPrompt)
      setMessage('')
    }
    const complete = () => { setInstalled(true); setPrompt(null); setMessage('') }
    sync()
    window.addEventListener('beforeinstallprompt', available)
    window.addEventListener('appinstalled', complete)
    standalone.addEventListener('change', sync)
    return () => {
      window.removeEventListener('beforeinstallprompt', available)
      window.removeEventListener('appinstalled', complete)
      standalone.removeEventListener('change', sync)
    }
  }, [])

  async function install() {
    if (!prompt || !secure) { dialog.current?.showModal(); return }
    const request = prompt
    // The browser event can only be consumed once. A new offer requires a new event.
    setPrompt(null)
    setBusy(true)
    try {
      await request.prompt()
      const choice = await request.userChoice
      setMessage(choice.outcome === 'accepted' ? 'Solicitud aceptada. Completa la instalación que muestra el navegador.' : 'Instalación cancelada. Puedes usar el menú del navegador cuando quieras.')
    } catch {
      setMessage('El navegador no pudo abrir la instalación. Consulta las instrucciones o utiliza su menú.')
      dialog.current?.showModal()
    } finally { setBusy(false) }
  }

  return <div className="bk-install">
    {installed ? <p className="bk-install__installed">BloodKeeper · aplicación instalada</p> : <button ref={trigger} type="button" className="bk-install__button" disabled={busy} onClick={() => void install()}>{busy ? 'Abriendo instalación…' : 'Instalar aplicación'}</button>}
    {message && <p role="status" className="bk-install__message">{message}</p>}
    <dialog ref={dialog} className="bk-install__dialog" aria-labelledby="bk-install-title" onClose={() => trigger.current?.focus()}>
      <h2 id="bk-install-title">Instalar BloodKeeper</h2>
      {!secure && <p role="note">Esta dirección no permite una instalación segura. Abre BloodKeeper desde su dirección HTTPS de Cloudflare, no desde la IP local por HTTP. No necesitas instalar certificados en el dispositivo.</p>}
      <p>La aplicación necesita conexión al servidor. No ofrece modo sin conexión ni guarda operaciones para enviarlas después. Instalarla no cambia tu cuenta ni tus permisos.</p>
      <ul>
        <li><strong>Android · Chrome:</strong> abre el menú ⋮ y elige «Instalar aplicación» o «Añadir a pantalla de inicio», según la opción que ofrezca tu navegador.</li>
        <li><strong>iPhone o iPad:</strong> usa Compartir → Añadir a pantalla de inicio.</li>
        <li><strong>PC · Chrome o Edge:</strong> utiliza el icono de instalación de la barra de direcciones o la opción de instalación del menú.</li>
      </ul>
      <p>Si la opción todavía no aparece, recarga la dirección HTTPS, espera a que cargue y comprueba si la aplicación ya está instalada. El navegador decide cuándo ofrecer la instalación; un acceso directo no siempre equivale a una aplicación instalada.</p>
      <form method="dialog"><button type="submit" autoFocus>Cerrar</button></form>
    </dialog>
  </div>
}
