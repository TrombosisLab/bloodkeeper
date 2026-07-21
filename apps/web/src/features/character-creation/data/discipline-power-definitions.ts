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
     * PROTEAN
     * Fuente: Vampiro V5 — Libro Básico ES
     */

    {
      key: 'protean-eyes-of-the-beast',
      disciplineKey: 'protean',
      name: 'Ojos de la Bestia',
      level: 1,
      summary:
        'Permite ver con claridad sobrenatural en la oscuridad y manifiesta rasgos depredadores en los ojos.',
      sourceKey: 'core-v5-es',
      sourcePage: 270,
    },
    {
      key: 'protean-weight-of-the-feather',
      disciplineKey: 'protean',
      name: 'Peso de la Pluma',
      level: 1,
      summary:
        'Reduce sobrenaturalmente el peso efectivo del vampiro para evitar o mitigar determinados peligros físicos.',
      sourceKey: 'core-v5-es',
      sourcePage: 270,
    },
    {
      key: 'protean-feral-weapons',
      disciplineKey: 'protean',
      name: 'Armas Salvajes',
      level: 2,
      summary:
        'Transforma partes del cuerpo en armas naturales sobrenaturales apropiadas para el combate.',
      sourceKey: 'core-v5-es',
      sourcePage: 270,
    },
    {
      key: 'protean-earth-meld',
      disciplineKey: 'protean',
      name: 'Fusión con la Tierra',
      level: 3,
      summary:
        'Permite fundirse sobrenaturalmente con la tierra y permanecer oculto en ella.',
      sourceKey: 'core-v5-es',
      sourcePage: 271,
    },
    {
      key: 'protean-shapechange',
      disciplineKey: 'protean',
      name: 'Metamorfosis',
      level: 3,
      summary:
        'Permite adoptar una forma animal asociada a la naturaleza depredadora del vampiro.',
      sourceKey: 'core-v5-es',
      sourcePage: 271,
    },
    {
      key: 'protean-horrid-form',
      disciplineKey: 'protean',
      name: 'Forma Horrenda',
      level: 4,
      summary:
        'Transforma el cuerpo en una forma monstruosa especialmente poderosa y aterradora.',
      sourceKey: 'core-v5-es',
      sourcePage: 272,
    },
    {
      key: 'protean-heart-of-darkness',
      disciplineKey: 'protean',
      name: 'Corazón de la Oscuridad',
      level: 5,
      summary:
        'Permite alterar sobrenaturalmente la ubicación del corazón para dificultar su destrucción.',
      sourceKey: 'core-v5-es',
      sourcePage: 272,
    },
    {
      key: 'protean-mist-form',
      disciplineKey: 'protean',
      name: 'Forma de Niebla',
      level: 5,
      summary:
        'Permite transformar el cuerpo en una nube de niebla sobrenatural.',
      sourceKey: 'core-v5-es',
      sourcePage: 272,
    },

    /*
     * FORTALEZA
     * Fuente: Vampiro V5 — Libro Básico ES
     */

    {
      key: 'fortitude-resilience',
      disciplineKey: 'fortitude',
      name: 'Resiliencia',
      level: 1,
      summary:
        'Refuerza sobrenaturalmente la capacidad del vampiro para soportar daño físico.',
      sourceKey: 'core-v5-es',
      sourcePage: 258,
    },
    {
      key: 'fortitude-unswayable-mind',
      disciplineKey: 'fortitude',
      name: 'Mente Inquebrantable',
      level: 1,
      summary:
        'Refuerza la resistencia mental frente a coerción e influencia sobrenatural.',
      sourceKey: 'core-v5-es',
      sourcePage: 258,
    },
    {
      key: 'fortitude-toughness',
      disciplineKey: 'fortitude',
      name: 'Dureza',
      level: 2,
      summary:
        'Permite resistir mejor las heridas mediante una resistencia sobrenatural.',
      sourceKey: 'core-v5-es',
      sourcePage: 258,
    },
    {
      key: 'fortitude-defy-bane',
      disciplineKey: 'fortitude',
      name: 'Desafiar la Perdición',
      level: 3,
      summary:
        'Permite resistir temporalmente fuentes de daño especialmente peligrosas para los vampiros.',
      sourceKey: 'core-v5-es',
      sourcePage: 259,
    },
    {
      key: 'fortitude-fortify-inner-facade',
      disciplineKey: 'fortitude',
      name: 'Fortificar la Fachada Interior',
      level: 3,
      summary:
        'Protege la mente frente a intentos sobrenaturales de leer pensamientos o descubrir secretos.',
      sourceKey: 'core-v5-es',
      sourcePage: 259,
    },
    {
      key: 'fortitude-draught-of-endurance',
      disciplineKey: 'fortitude',
      name: 'Sorbo de Resistencia',
      level: 4,
      summary:
        'Permite transmitir temporalmente parte de Fortaleza mediante la Sangre.',
      sourceKey: 'core-v5-es',
      sourcePage: 259,
    },
    {
      key: 'fortitude-flesh-of-marble',
      disciplineKey: 'fortitude',
      name: 'Carne de Mármol',
      level: 5,
      summary:
        'Endurece sobrenaturalmente el cuerpo hasta hacerlo extremadamente difícil de dañar.',
      sourceKey: 'core-v5-es',
      sourcePage: 259,
    },
    {
      key: 'fortitude-prowess-from-pain',
      disciplineKey: 'fortitude',
      name: 'Proeza del Dolor',
      level: 5,
      summary:
        'Convierte las heridas sufridas en una fuente de capacidad física sobrenatural.',
      sourceKey: 'core-v5-es',
      sourcePage: 260,
    },
    {
      key: 'fortitude-skin-of-the-sarcophagus',
      disciplineKey: 'fortitude',
      name: 'Piel de Sarcófago',
      level: 5,
      summary:
        'Representa una manifestación extrema de resistencia sobrenatural.',
      sourceKey: 'core-v5-es',
      sourcePage: 260,
    },

    /*
     * ANIMALISMO
     * Fuente: Vampiro V5 — Libro Básico ES
     * Págs. 245–248.
     */

    {
      key: 'animalism-sense-the-beast',
      disciplineKey: 'animalism',
      name: 'Sentir a la Bestia',
      level: 1,
      summary:
        'Permite percibir la naturaleza bestial, hostilidad y determinados impulsos sobrenaturales de otros seres.',
      sourceKey: 'core-v5-es',
      sourcePage: 245,
    },
    {
      key: 'animalism-bond-famulus',
      disciplineKey: 'animalism',
      name: 'Vínculo con Famulus',
      level: 1,
      summary:
        'Crea un vínculo especial con un animal convertido en famulus y facilita otros usos de Animalismo.',
      sourceKey: 'core-v5-es',
      sourcePage: 245,
    },
    {
      key: 'animalism-feral-whispers',
      disciplineKey: 'animalism',
      name: 'Susurros Salvajes',
      level: 2,
      summary:
        'Permite comunicarse con animales y, según las circunstancias, convocarlos o solicitar su ayuda.',
      sourceKey: 'core-v5-es',
      sourcePage: 246,
    },
    {
      key: 'animalism-unliving-hive',
      disciplineKey: 'animalism',
      name: 'Colmena No-Muerta',
      level: 3,
      summary:
        'Extiende la influencia de Animalismo a enjambres de insectos y permite tratarlos como una criatura vinculada.',
      sourceKey: 'core-v5-es',
      sourcePage: 247,
      requirements: {
        amalgam: {
          disciplineKey: 'obfuscate',
          minimumLevel: 2,
        },
      },
    },
    {
      key: 'animalism-quell-the-beast',
      disciplineKey: 'animalism',
      name: 'Reprimir a la Bestia',
      level: 3,
      summary:
        'Permite someter temporalmente los impulsos bestiales de un objetivo mediante la fuerza sobrenatural del vampiro.',
      sourceKey: 'core-v5-es',
      sourcePage: 247,
    },
    {
      key: 'animalism-animal-succulence',
      disciplineKey: 'animalism',
      name: 'Suculencia Animal',
      level: 3,
      summary:
        'Permite obtener mayor sustento de la sangre animal y beneficios especiales relacionados con el famulus.',
      sourceKey: 'core-v5-es',
      sourcePage: 247,
    },
    {
      key: 'animalism-subsume-the-spirit',
      disciplineKey: 'animalism',
      name: 'Comunión de Espíritus',
      level: 4,
      summary:
        'Permite transferir la mente del vampiro al cuerpo de un animal y controlarlo directamente.',
      sourceKey: 'core-v5-es',
      sourcePage: 248,
    },
    {
      key: 'animalism-animal-dominion',
      disciplineKey: 'animalism',
      name: 'Control Animal',
      level: 5,
      summary:
        'Permite dominar grupos numerosos de animales como extensiones de la voluntad del vampiro.',
      sourceKey: 'core-v5-es',
      sourcePage: 248,
    },
    {
      key: 'animalism-drawing-out-the-beast',
      disciplineKey: 'animalism',
      name: 'Extraer a la Bestia',
      level: 5,
      summary:
        'Permite proyectar la propia Bestia sobre otra persona y desplazar hacia ella sus impulsos más peligrosos.',
      sourceKey: 'core-v5-es',
      sourcePage: 248,
    },

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

    /*
     * Poderes técnicos de nivel 2.
     * Permiten comprobar que una Disciplina a 2
     * puede seleccionar dos poderes.
     */
  ]
