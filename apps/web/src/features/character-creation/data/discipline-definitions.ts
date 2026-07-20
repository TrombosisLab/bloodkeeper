import type {
  DisciplineDefinition,
  DisciplineKey,
} from '../types/discipline.types.ts'

export const disciplineDefinitions:
  DisciplineDefinition[] = [
    {
      key: 'animalism',
      name: 'Animalismo',
    },
    {
      key: 'auspex',
      name: 'Auspex',
    },
    {
      key: 'bloodSorcery',
      name: 'Hechicería de Sangre',
    },
    {
      key: 'celerity',
      name: 'Celeridad',
    },
    {
      key: 'dominate',
      name: 'Dominación',
    },
    {
      key: 'fortitude',
      name: 'Fortaleza',
    },
    {
      key: 'obfuscate',
      name: 'Ofuscación',
    },
    {
      key: 'oblivion',
      name: 'Olvido',
    },
    {
      key: 'potence',
      name: 'Potencia',
    },
    {
      key: 'presence',
      name: 'Presencia',
    },
    {
      key: 'protean',
      name: 'Protean',
    },
    {
      key: 'thinBloodAlchemy',
      name: 'Alquimia de Sangre Débil',
    },
  ]

export const disciplineKeys:
  DisciplineKey[] =
    disciplineDefinitions.map(
      (discipline) =>
        discipline.key,
    )
