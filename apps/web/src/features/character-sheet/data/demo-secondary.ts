import type {
  CharacterSecondaryData,
} from '../types/character-secondary.types'

export const demoSecondary: CharacterSecondaryData = {
  inventory: [
    {
      id: 'motorcycle',
      name: 'Motocicleta',
      quantity: 1,
      description: 'Vehículo personal',
      category: 'Transporte',
      notes: null,
      status: 'active',
    },
    {
      id: 'phone',
      name: 'Teléfono móvil',
      quantity: 1,
      description: 'Identidad mortal',
      category: 'Tecnología',
      notes: null,
      status: 'active',
    },
    {
      id: 'jacket',
      name: 'Chaqueta reforzada',
      quantity: 1,
      description: null,
      category: 'Ropa',
      notes: null,
      status: 'active',
    },
    {
      id: 'cash',
      name: 'Efectivo',
      quantity: 1,
      description: '200 €',
      category: 'Recursos',
      notes: null,
      status: 'active',
    },
  ],

  notes: [
    {
      id: 'mortal-family',
      content:
        'Mantener discreción sobre los vínculos con la familia mortal.',
    },
    {
      id: 'court-favor',
      content:
        'Debe un favor menor a un miembro de la corte.',
    },
  ],

  history: [
    {
      id: 'embrace',
      title: 'Abrazo',
      description:
        'Convertido hace aproximadamente cincuenta años.',
    },
    {
      id: 'coruna',
      title: 'Regreso a A Coruña',
      description:
        'Recuperó contactos políticos y sociales en la ciudad.',
    },
    {
      id: 'court',
      title: 'Acercamiento a la corte',
      description:
        'Busca consolidar una posición de influencia.',
    },
  ],
}
