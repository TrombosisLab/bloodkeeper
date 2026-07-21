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
     * PRESENCIA
     * Fuente: Vampiro V5 — Libro Básico ES
     * Págs. 267–269.
     */

    {
      key: 'presence-daunt',
      disciplineKey: 'presence',
      name: 'Atemorizar',
      level: 1,
      summary:
        'Proyecta una presencia amenazante que dificulta enfrentarse o actuar contra el vampiro.',
      sourceKey: 'core-v5-es',
      sourcePage: 267,
    },
    {
      key: 'presence-awe',
      disciplineKey: 'presence',
      name: 'Fascinación',
      level: 1,
      summary:
        'Hace al vampiro sobrenaturalmente atractivo y aumenta su capacidad de influir socialmente.',
      sourceKey: 'core-v5-es',
      sourcePage: 267,
    },
    {
      key: 'presence-lingering-kiss',
      disciplineKey: 'presence',
      name: 'Beso Persistente',
      level: 2,
      summary:
        'Hace que el Beso resulte especialmente adictivo para los mortales que lo experimentan.',
      sourceKey: 'core-v5-es',
      sourcePage: 268,
    },
    {
      key: 'presence-entrancement',
      disciplineKey: 'presence',
      name: 'Encantamiento',
      level: 3,
      summary:
        'Concentra el magnetismo sobrenatural sobre una persona concreta y genera una fuerte fascinación.',
      sourceKey: 'core-v5-es',
      sourcePage: 268,
    },
    {
      key: 'presence-dread-gaze',
      disciplineKey: 'presence',
      name: 'Mirada Aterradora',
      level: 3,
      summary:
        'Revela brevemente la naturaleza depredadora del vampiro para infundir un miedo extremo.',
      sourceKey: 'core-v5-es',
      sourcePage: 268,
    },
    {
      key: 'presence-summon',
      disciplineKey: 'presence',
      name: 'Invocación',
      level: 4,
      summary:
        'Permite llamar sobrenaturalmente a una persona con la que existe una conexión adecuada.',
      sourceKey: 'core-v5-es',
      sourcePage: 269,
    },
    {
      key: 'presence-irresistible-voice',
      disciplineKey: 'presence',
      name: 'Voz Irresistible',
      level: 4,
      summary:
        'Permite canalizar Dominación mediante la voz sin depender del contacto visual habitual.',
      sourceKey: 'core-v5-es',
      sourcePage: 269,
      requirements: {
        amalgam: {
          disciplineKey: 'dominate',
          minimumLevel: 1,
        },
      },
    },
    {
      key: 'presence-star-magnetism',
      disciplineKey: 'presence',
      name: 'Magnetismo de Estrella',
      level: 5,
      summary:
        'Permite extender determinados efectos de Presencia a transmisiones en directo y comunicaciones.',
      sourceKey: 'core-v5-es',
      sourcePage: 269,
    },
    {
      key: 'presence-majesty',
      disciplineKey: 'presence',
      name: 'Majestad',
      level: 5,
      summary:
        'Amplifica la presencia sobrenatural del vampiro hasta un nivel abrumador para quienes lo contemplan.',
      sourceKey: 'core-v5-es',
      sourcePage: 269,
    },

    /*
     * POTENCIA
     * Fuente: Vampiro V5 — Libro Básico ES
     * Págs. 263–266.
     */

    {
      key: 'potence-lethal-body',
      disciplineKey: 'potence',
      name: 'Cuerpo Letal',
      level: 1,
      summary:
        'Permite causar daños devastadores a mortales con ataques sin armas.',
      sourceKey: 'core-v5-es',
      sourcePage: 264,
    },
    {
      key: 'potence-soaring-leap',
      disciplineKey: 'potence',
      name: 'Salto Vertiginoso',
      level: 1,
      summary:
        'Permite realizar saltos extraordinarios gracias a una fuerza sobrenatural.',
      sourceKey: 'core-v5-es',
      sourcePage: 264,
    },
    {
      key: 'potence-prowess',
      disciplineKey: 'potence',
      name: 'Bravura',
      level: 2,
      summary:
        'Aumenta de forma sobrenatural la fuerza física y el daño del usuario.',
      sourceKey: 'core-v5-es',
      sourcePage: 264,
    },
    {
      key: 'potence-uncanny-grip',
      disciplineKey: 'potence',
      name: 'Agarre Asombroso',
      level: 3,
      summary:
        'Permite trepar y aferrarse a superficies mediante una fuerza extraordinaria.',
      sourceKey: 'core-v5-es',
      sourcePage: 264,
    },
    {
      key: 'potence-brutal-feed',
      disciplineKey: 'potence',
      name: 'Alimentación Brutal',
      level: 3,
      summary:
        'Convierte la alimentación en una agresión física especialmente destructiva.',
      sourceKey: 'core-v5-es',
      sourcePage: 265,
    },
    {
      key: 'potence-spark-of-rage',
      disciplineKey: 'potence',
      name: 'Chispa de Ira',
      level: 3,
      summary:
        'Permite provocar o intensificar la ira y empujar a otros hacia la violencia.',
      sourceKey: 'core-v5-es',
      sourcePage: 265,
      requirements: {
        amalgam: {
          disciplineKey: 'presence',
          minimumLevel: 3,
        },
      },
    },
    {
      key: 'potence-draught-of-might',
      disciplineKey: 'potence',
      name: 'Sorbo de Poderío',
      level: 4,
      summary:
        'Permite transmitir temporalmente parte de la Potencia mediante la Sangre.',
      sourceKey: 'core-v5-es',
      sourcePage: 265,
    },
    {
      key: 'potence-fist-of-caine',
      disciplineKey: 'potence',
      name: 'Puño de Caín',
      level: 5,
      summary:
        'Permite infligir heridas extremadamente graves con ataques cuerpo a cuerpo.',
      sourceKey: 'core-v5-es',
      sourcePage: 266,
    },
    {
      key: 'potence-earthshock',
      disciplineKey: 'potence',
      name: 'Temblor de Tierra',
      level: 5,
      summary:
        'Permite crear una onda de choque golpeando el suelo con fuerza sobrenatural.',
      sourceKey: 'core-v5-es',
      sourcePage: 266,
    },

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
