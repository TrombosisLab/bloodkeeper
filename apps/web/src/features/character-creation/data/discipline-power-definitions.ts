import type {
  DisciplinePowerDefinition,
} from '../types/discipline-power.types'

/*
 * CATÁLOGO TEMPORAL DE DESARROLLO.
 *
 * Estos poderes NO representan todavía el catálogo oficial completo.
 * Su finalidad es validar el circuito:
 *
 * catálogo -> reglas -> selección -> CharacterDraft -> validación.
 *
 * Se sustituirá/ampliará posteriormente sin modificar el motor.
 */

export const disciplinePowerDefinitions:
  DisciplinePowerDefinition[] = [
    {
      key: 'animalism-dev-1-a',
      disciplineKey: 'animalism',
      name: 'Poder de Animalismo A',
      level: 1,
    },
    {
      key: 'animalism-dev-1-b',
      disciplineKey: 'animalism',
      name: 'Poder de Animalismo B',
      level: 1,
    },

    {
      key: 'auspex-dev-1-a',
      disciplineKey: 'auspex',
      name: 'Poder de Auspex A',
      level: 1,
    },
    {
      key: 'auspex-dev-1-b',
      disciplineKey: 'auspex',
      name: 'Poder de Auspex B',
      level: 1,
    },

    {
      key: 'blood-sorcery-dev-1-a',
      disciplineKey: 'bloodSorcery',
      name: 'Poder de Hechicería de Sangre A',
      level: 1,
    },
    {
      key: 'blood-sorcery-dev-1-b',
      disciplineKey: 'bloodSorcery',
      name: 'Poder de Hechicería de Sangre B',
      level: 1,
    },

    {
      key: 'celerity-dev-1-a',
      disciplineKey: 'celerity',
      name: 'Poder de Celeridad A',
      level: 1,
    },
    {
      key: 'celerity-dev-1-b',
      disciplineKey: 'celerity',
      name: 'Poder de Celeridad B',
      level: 1,
    },

    {
      key: 'dominate-dev-1-a',
      disciplineKey: 'dominate',
      name: 'Poder de Dominación A',
      level: 1,
    },
    {
      key: 'dominate-dev-1-b',
      disciplineKey: 'dominate',
      name: 'Poder de Dominación B',
      level: 1,
    },

    {
      key: 'fortitude-dev-1-a',
      disciplineKey: 'fortitude',
      name: 'Poder de Fortaleza A',
      level: 1,
    },
    {
      key: 'fortitude-dev-1-b',
      disciplineKey: 'fortitude',
      name: 'Poder de Fortaleza B',
      level: 1,
    },

    {
      key: 'obfuscate-dev-1-a',
      disciplineKey: 'obfuscate',
      name: 'Poder de Ofuscación A',
      level: 1,
    },
    {
      key: 'obfuscate-dev-1-b',
      disciplineKey: 'obfuscate',
      name: 'Poder de Ofuscación B',
      level: 1,
    },

    {
      key: 'oblivion-dev-1-a',
      disciplineKey: 'oblivion',
      name: 'Poder de Olvido A',
      level: 1,
    },
    {
      key: 'oblivion-dev-1-b',
      disciplineKey: 'oblivion',
      name: 'Poder de Olvido B',
      level: 1,
    },

    {
      key: 'potence-dev-1-a',
      disciplineKey: 'potence',
      name: 'Poder de Potencia A',
      level: 1,
    },
    {
      key: 'potence-dev-1-b',
      disciplineKey: 'potence',
      name: 'Poder de Potencia B',
      level: 1,
    },

    {
      key: 'presence-dev-1-a',
      disciplineKey: 'presence',
      name: 'Poder de Presencia A',
      level: 1,
    },
    {
      key: 'presence-dev-1-b',
      disciplineKey: 'presence',
      name: 'Poder de Presencia B',
      level: 1,
    },

    {
      key: 'protean-dev-1-a',
      disciplineKey: 'protean',
      name: 'Poder de Protean A',
      level: 1,
    },
    {
      key: 'protean-dev-1-b',
      disciplineKey: 'protean',
      name: 'Poder de Protean B',
      level: 1,
    },

    /*
     * Poderes técnicos de nivel 2.
     * Permiten comprobar que una Disciplina a 2
     * puede seleccionar dos poderes.
     */

    {
      key: 'celerity-dev-2-a',
      disciplineKey: 'celerity',
      name: 'Poder de Celeridad nivel 2',
      level: 2,
    },
    {
      key: 'potence-dev-2-a',
      disciplineKey: 'potence',
      name: 'Poder de Potencia nivel 2',
      level: 2,
    },
    {
      key: 'presence-dev-2-a',
      disciplineKey: 'presence',
      name: 'Poder de Presencia nivel 2',
      level: 2,
    },
    {
      key: 'animalism-dev-2-a',
      disciplineKey: 'animalism',
      name: 'Poder de Animalismo nivel 2',
      level: 2,
    },
    {
      key: 'fortitude-dev-2-a',
      disciplineKey: 'fortitude',
      name: 'Poder de Fortaleza nivel 2',
      level: 2,
    },
    {
      key: 'protean-dev-2-a',
      disciplineKey: 'protean',
      name: 'Poder de Protean nivel 2',
      level: 2,
    },
  ]
