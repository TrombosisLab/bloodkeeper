import type {
  BloodSorceryRitualDefinition,
} from '../types/blood-sorcery-ritual.types'

export const BLOOD_SORCERY_RITUAL_DEFINITIONS:
  BloodSorceryRitualDefinition[] = [
    {
      key: 'blood-sorcery-ritual-clinging-of-the-insect',
      name: 'Adherencia del Insecto',
      level: 1,
      summary:
        'Permite al vampiro desplazarse aferrándose a paredes y otras superficies.',
      sourceKey: 'core-v5-es',
      sourcePage: 276,
    },
    {
      key: 'blood-sorcery-ritual-blood-walk',
      name: 'Camino de la Sangre',
      level: 1,
      summary:
        'Permite obtener información sobrenatural adicional sobre la sangre de un vampiro.',
      sourceKey: 'core-v5-es',
      sourcePage: 276,
    },
    {
      key: 'blood-sorcery-ritual-craft-bloodstone',
      name: 'Crear Piedrasangre',
      level: 1,
      summary:
        'Crea un objeto vinculado místicamente que puede utilizarse como referencia de localización.',
      sourceKey: 'core-v5-es',
      sourcePage: 276,
    },
    {
      key: 'blood-sorcery-ritual-wake-with-evenings-freshness',
      name: 'Despertar con la Frescura de la Tarde',
      level: 1,
      summary:
        'Ayuda al vampiro a despertar durante el día cuando se encuentra amenazado.',
      sourceKey: 'core-v5-es',
      sourcePage: 276,
    },
    {
      key: 'blood-sorcery-ritual-ward-against-ghouls',
      name: 'Protección contra Ghouls',
      level: 1,
      summary:
        'Crea una protección sobrenatural destinada a repeler a los ghouls.',
      sourceKey: 'core-v5-es',
      sourcePage: 277,
    },
  ]

export function getBloodSorceryRitualDefinition(
  ritualKey: string,
): BloodSorceryRitualDefinition | undefined {
  return BLOOD_SORCERY_RITUAL_DEFINITIONS.find(
    (definition) =>
      definition.key === ritualKey,
  )
}

export function getBloodSorceryRitualDefinitionsByLevel(
  level: number,
): BloodSorceryRitualDefinition[] {
  return BLOOD_SORCERY_RITUAL_DEFINITIONS.filter(
    (definition) =>
      definition.level === level,
  )
}
