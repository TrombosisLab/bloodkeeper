import type {
  ContentSourceDefinition,
} from '../types/content-source.types'

export const contentSources:
  ContentSourceDefinition[] = [
    {
      key: 'development',
      name: 'Contenido técnico de desarrollo',
      shortName: 'DEV',
      edition: 'V5',
      category: 'development',
    },

    {
      key: 'core-v5-es',
      name: 'Vampiro: La Mascarada V5 — Libro Básico',
      shortName: 'V5 Básico',
      edition: 'V5',
      category: 'core',
    },

    /*
     * Las fuentes reales se añadirán
     * explícitamente conforme se incorpore
     * contenido verificado al catálogo.
     */
  ]

export function getContentSource(
  key: string,
): ContentSourceDefinition | undefined {
  return contentSources.find(
    (source) =>
      source.key === key,
  )
}
