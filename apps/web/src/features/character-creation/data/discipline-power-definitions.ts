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
    /*
     * CELERIDAD
     * Fuente: Vampiro V5 — Libro Básico ES
     * Págs. 252–254.
     */

    {
      key: 'celerity-cats-grace',
      disciplineKey: 'celerity',
      name: 'Gracia Felina',
      level: 1,
      summary:
        'Permite un equilibrio sobrenatural incluso en apoyos extremadamente difíciles.',
      sourceKey: 'core-v5-es',
      sourcePage: 252,
    },
    {
      key: 'celerity-rapid-reflexes',
      disciplineKey: 'celerity',
      name: 'Reflejos Rápidos',
      level: 1,
      summary:
        'Mejora las reacciones defensivas y permite realizar ciertas acciones menores con gran rapidez.',
      sourceKey: 'core-v5-es',
      sourcePage: 252,
    },
    {
      key: 'celerity-fleetness',
      disciplineKey: 'celerity',
      name: 'Presteza',
      level: 2,
      summary:
        'Potencia de forma sobrenatural las acciones basadas en Destreza.',
      sourceKey: 'core-v5-es',
      sourcePage: 253,
    },
    {
      key: 'celerity-blink',
      disciplineKey: 'celerity',
      name: 'Pestañeo',
      level: 3,
      summary:
        'Permite cubrir una distancia considerable en un instante aparente.',
      sourceKey: 'core-v5-es',
      sourcePage: 253,
    },
    {
      key: 'celerity-traversal',
      disciplineKey: 'celerity',
      name: 'Recorrido',
      level: 3,
      summary:
        'Permite desplazarse a gran velocidad por superficies difíciles, verticales o incluso sobre líquidos.',
      sourceKey: 'core-v5-es',
      sourcePage: 253,
    },
    {
      key: 'celerity-unerring-aim',
      disciplineKey: 'celerity',
      name: 'Puntería Certera',
      level: 4,
      summary:
        'Permite realizar un ataque a distancia con una precisión sobrenatural.',
      sourceKey: 'core-v5-es',
      sourcePage: 254,
      requirements: {
        amalgam: {
          disciplineKey: 'auspex',
          minimumLevel: 2,
        },
      },
    },
    {
      key: 'celerity-draught-of-elegance',
      disciplineKey: 'celerity',
      name: 'Sorbo de Elegancia',
      level: 4,
      summary:
        'Permite transmitir temporalmente parte de la Celeridad mediante la Sangre.',
      sourceKey: 'core-v5-es',
      sourcePage: 254,
    },
    {
      key: 'celerity-lightning-strike',
      disciplineKey: 'celerity',
      name: 'Golpe Relámpago',
      level: 5,
      summary:
        'Permite ejecutar un ataque cuerpo a cuerpo a una velocidad extraordinaria.',
      sourceKey: 'core-v5-es',
      sourcePage: 254,
    },
    {
      key: 'celerity-split-second',
      disciplineKey: 'celerity',
      name: 'Segundo Quebrado',
      level: 5,
      summary:
        'Permite reaccionar a acontecimientos con una velocidad que parece anticiparse a los demás.',
      sourceKey: 'core-v5-es',
      sourcePage: 254,
    },

    {
      key: 'animalism-dev-1-a',
      disciplineKey: 'animalism',
      name: 'Poder de Animalismo A',
      level: 1,
      sourceKey: 'development',
    },
    {
      key: 'animalism-dev-1-b',
      disciplineKey: 'animalism',
      name: 'Poder de Animalismo B',
      level: 1,
      sourceKey: 'development',
    },

    {
      key: 'auspex-dev-1-a',
      disciplineKey: 'auspex',
      name: 'Poder de Auspex A',
      level: 1,
      sourceKey: 'development',
    },
    {
      key: 'auspex-dev-1-b',
      disciplineKey: 'auspex',
      name: 'Poder de Auspex B',
      level: 1,
      sourceKey: 'development',
    },

    {
      key: 'blood-sorcery-dev-1-a',
      disciplineKey: 'bloodSorcery',
      name: 'Poder de Hechicería de Sangre A',
      level: 1,
      sourceKey: 'development',
    },
    {
      key: 'blood-sorcery-dev-1-b',
      disciplineKey: 'bloodSorcery',
      name: 'Poder de Hechicería de Sangre B',
      level: 1,
      sourceKey: 'development',
    },

    {
      key: 'dominate-dev-1-a',
      disciplineKey: 'dominate',
      name: 'Poder de Dominación A',
      level: 1,
      sourceKey: 'development',
    },
    {
      key: 'dominate-dev-1-b',
      disciplineKey: 'dominate',
      name: 'Poder de Dominación B',
      level: 1,
      sourceKey: 'development',
    },

    {
      key: 'fortitude-dev-1-a',
      disciplineKey: 'fortitude',
      name: 'Poder de Fortaleza A',
      level: 1,
      sourceKey: 'development',
    },
    {
      key: 'fortitude-dev-1-b',
      disciplineKey: 'fortitude',
      name: 'Poder de Fortaleza B',
      level: 1,
      sourceKey: 'development',
    },

    {
      key: 'obfuscate-dev-1-a',
      disciplineKey: 'obfuscate',
      name: 'Poder de Ofuscación A',
      level: 1,
      sourceKey: 'development',
    },
    {
      key: 'obfuscate-dev-1-b',
      disciplineKey: 'obfuscate',
      name: 'Poder de Ofuscación B',
      level: 1,
      sourceKey: 'development',
    },

    {
      key: 'oblivion-dev-1-a',
      disciplineKey: 'oblivion',
      name: 'Poder de Olvido A',
      level: 1,
      sourceKey: 'development',
    },
    {
      key: 'oblivion-dev-1-b',
      disciplineKey: 'oblivion',
      name: 'Poder de Olvido B',
      level: 1,
      sourceKey: 'development',
    },

    {
      key: 'potence-dev-1-a',
      disciplineKey: 'potence',
      name: 'Poder de Potencia A',
      level: 1,
      sourceKey: 'development',
    },
    {
      key: 'potence-dev-1-b',
      disciplineKey: 'potence',
      name: 'Poder de Potencia B',
      level: 1,
      sourceKey: 'development',
    },

    {
      key: 'presence-dev-1-a',
      disciplineKey: 'presence',
      name: 'Poder de Presencia A',
      level: 1,
      sourceKey: 'development',
    },
    {
      key: 'presence-dev-1-b',
      disciplineKey: 'presence',
      name: 'Poder de Presencia B',
      level: 1,
      sourceKey: 'development',
    },

    {
      key: 'protean-dev-1-a',
      disciplineKey: 'protean',
      name: 'Poder de Protean A',
      level: 1,
      sourceKey: 'development',
    },
    {
      key: 'protean-dev-1-b',
      disciplineKey: 'protean',
      name: 'Poder de Protean B',
      level: 1,
      sourceKey: 'development',
    },

    /*
     * Poderes técnicos de nivel 2.
     * Permiten comprobar que una Disciplina a 2
     * puede seleccionar dos poderes.
     */
    {
      key: 'potence-dev-2-a',
      disciplineKey: 'potence',
      name: 'Poder de Potencia nivel 2',
      level: 2,
      sourceKey: 'development',
    },
    {
      key: 'presence-dev-2-a',
      disciplineKey: 'presence',
      name: 'Poder de Presencia nivel 2',
      level: 2,
      sourceKey: 'development',
    },
    {
      key: 'animalism-dev-2-a',
      disciplineKey: 'animalism',
      name: 'Poder de Animalismo nivel 2',
      level: 2,
      sourceKey: 'development',
    },
    {
      key: 'fortitude-dev-2-a',
      disciplineKey: 'fortitude',
      name: 'Poder de Fortaleza nivel 2',
      level: 2,
      sourceKey: 'development',
    },
    {
      key: 'protean-dev-2-a',
      disciplineKey: 'protean',
      name: 'Poder de Protean nivel 2',
      level: 2,
      sourceKey: 'development',
    },
  ]
