// SPEC071_PROTOTYPE_PORT_V1
import type { ReactNode } from 'react'

type Props = { readonly children: ReactNode }

/**
 * La carcasa física no conoce notas ni permisos. Sólo presenta el árbol real
 * del Cuaderno como un objeto editorial: tapa, bloque de hojas y cinta.
 */
export function NotebookPhysicalBook({ children }: Props) {
  return <section className="nb-physical-stage" aria-label="Cuaderno físico de la crónica"><div className="nb-physical-stage__back" aria-hidden="true" /><div className="nb-physical-stage__stack" aria-hidden="true" /><div className="nb-physical-stage__inner">{children}</div><span className="nb-physical-stage__bookmark" aria-hidden="true" /></section>
}
