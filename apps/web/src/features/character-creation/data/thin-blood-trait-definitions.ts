import type {
  ThinBloodTraitDefinition,
} from '../types/thin-blood-trait.types.ts'

/*
 * Méritos y Defectos específicos de Sangre Débil
 * del Libro Básico V5.
 *
 * Este catálogo modela únicamente identidad, categoría
 * y procedencia.
 *
 * Las reglas de cantidad, equilibrio, incompatibilidades
 * y efectos mecánicos se incorporarán incrementalmente
 * en checkpoints posteriores.
 */
export const thinBloodTraitDefinitions:
  readonly ThinBloodTraitDefinition[] = [

    // Defectos CORE

    {
      key: 'dead-flesh',
      name: 'Carne Muerta',
      category: 'flaw',
      source: 'core',
      incompatibleWithKeys: [
        'lively',
      ],
    },
    {
      key: 'vitae-dependency',
      name: 'Dependencia de Vitae',
      category: 'flaw',
      source: 'core',
    },
    {
      key: 'baby-teeth',
      name: 'Dientes de Leche',
      category: 'flaw',
      source: 'core',
    },
    {
      key: 'mortal-frailty',
      name: 'Fragilidad Mortal',
      category: 'flaw',
      source: 'core',
      incompatibleWithKeys: [
        'vampiric-resilience',
      ],
    },
    {
      key: 'clan-curse',
      name: 'Maldición de Clan',
      category: 'flaw',
      source: 'core',
    },
    {
      key: 'camarilla-branded',
      name: 'Marcado por la Camarilla',
      category: 'flaw',
      source: 'core',
    },
    {
      key: 'anarch-rejected',
      name: 'Rechazado por los Anarquistas',
      category: 'flaw',
      source: 'core',
      incompatibleWithKeys: [
        'anarch-comrades',
      ],
    },
    {
      key: 'bestial-temper',
      name: 'Temperamento Bestial',
      category: 'flaw',
      source: 'core',
    },

    // Méritos CORE

    {
      key: 'thin-blood-alchemist',
      name: 'Alquimista de Sangre Débil',
      category: 'merit',
      source: 'core',
    },
    {
      key: 'day-drinker',
      name: 'Bebedor Diurno',
      category: 'merit',
      source: 'core',
    },
    {
      key: 'anarch-comrades',
      name: 'Camaradas Anarquistas',
      category: 'merit',
      source: 'core',
      incompatibleWithKeys: [
        'anarch-rejected',
      ],
    },
    {
      key: 'camarilla-contact',
      name: 'Contacto de la Camarilla',
      category: 'merit',
      source: 'core',
    },
    {
      key: 'discipline-affinity',
      name: 'Disciplina Afín',
      category: 'merit',
      source: 'core',
    },
    {
      key: 'vampiric-resilience',
      name: 'Resiliencia Vampírica',
      category: 'merit',
      source: 'core',
      incompatibleWithKeys: [
        'mortal-frailty',
      ],
    },
    {
      key: 'bonding-blood',
      name: 'Sangre Vinculante',
      category: 'merit',
      source: 'core',
    },
    {
      key: 'lively',
      name: 'Vívido',
      category: 'merit',
      source: 'core',
      incompatibleWithKeys: [
        'dead-flesh',
      ],
    },
  ]

export function getThinBloodTraitDefinition(
  key: string,
): ThinBloodTraitDefinition | null {
  return (
    thinBloodTraitDefinitions.find(
      (definition) =>
        definition.key === key,
    ) ?? null
  )
}

export function getThinBloodTraitDefinitionsByCategory(
  category: ThinBloodTraitDefinition['category'],
): ThinBloodTraitDefinition[] {
  return thinBloodTraitDefinitions.filter(
    (definition) =>
      definition.category === category,
  )
}
