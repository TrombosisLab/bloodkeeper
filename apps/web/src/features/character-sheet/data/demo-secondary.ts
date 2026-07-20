import type {
  CharacterSecondaryData,
} from '../types/character-secondary.types'

export const demoSecondary: CharacterSecondaryData = {
  inventory: [
    {
      key: 'motorcycle',
      name: 'Motocicleta',
      detail: 'Vehículo personal',
    },
    {
      key: 'phone',
      name: 'Teléfono móvil',
      detail: 'Identidad mortal',
    },
    {
      key: 'jacket',
      name: 'Chaqueta reforzada',
    },
    {
      key: 'cash',
      name: 'Efectivo',
      detail: '200 €',
    },
  ],

  notes: [
    'Mantener discreción sobre los vínculos con la familia mortal.',
    'Debe un favor menor a un miembro de la corte.',
  ],

  history: [
    {
      key: 'embrace',
      title: 'Abrazo',
      detail: 'Convertido hace aproximadamente cincuenta años.',
    },
    {
      key: 'coruna',
      title: 'Regreso a A Coruña',
      detail: 'Recuperó contactos políticos y sociales en la ciudad.',
    },
    {
      key: 'court',
      title: 'Acercamiento a la corte',
      detail: 'Busca consolidar una posición de influencia.',
    },
  ],
}
