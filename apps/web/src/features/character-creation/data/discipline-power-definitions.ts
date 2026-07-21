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
     * HECHICERÍA DE SANGRE
     * Fuente: Vampiro V5 — Libro Básico ES
     * Págs. 272–275.
     *
     * Los Rituales NO se modelan aquí.
     * Tendrán catálogo y reglas independientes.
     */

    {
      key: 'blood-sorcery-taste-for-blood',
      disciplineKey: 'bloodSorcery',
      name: 'Sabor de la Sangre',
      level: 1,
      summary:
        'Permite analizar sobrenaturalmente una muestra de sangre y obtener información sobre su naturaleza.',
      sourceKey: 'core-v5-es',
      sourcePage: 272,
    },
    {
      key: 'blood-sorcery-corrosive-vitae',
      disciplineKey: 'bloodSorcery',
      name: 'Vitae Corrosiva',
      level: 1,
      summary:
        'Permite transformar la propia Vitae en una sustancia capaz de corroer materiales inertes.',
      sourceKey: 'core-v5-es',
      sourcePage: 273,
    },
    {
      key: 'blood-sorcery-extinguish-vitae',
      disciplineKey: 'bloodSorcery',
      name: 'Extinguir Vitae',
      level: 2,
      summary:
        'Debilita sobrenaturalmente la Sangre de otro vampiro y aumenta su Ansia.',
      sourceKey: 'core-v5-es',
      sourcePage: 273,
    },
    {
      key: 'blood-sorcery-blood-of-potency',
      disciplineKey: 'bloodSorcery',
      name: 'Sangre de Potencia',
      level: 3,
      summary:
        'Concentra temporalmente la Sangre del vampiro para incrementar su Potencia de Sangre.',
      sourceKey: 'core-v5-es',
      sourcePage: 273,
    },
    {
      key: 'blood-sorcery-scorpions-touch',
      disciplineKey: 'bloodSorcery',
      name: 'Toque de Escorpión',
      level: 3,
      summary:
        'Transforma parte de la Vitae en un veneno sobrenatural capaz de afectar a mortales y vampiros.',
      sourceKey: 'core-v5-es',
      sourcePage: 273,
    },
    {
      key: 'blood-sorcery-theft-of-vitae',
      disciplineKey: 'bloodSorcery',
      name: 'Robo de Vitae',
      level: 4,
      summary:
        'Permite extraer sangre sobrenaturalmente de una víctima y atraerla hacia el vampiro.',
      sourceKey: 'core-v5-es',
      sourcePage: 274,
    },
    {
      key: 'blood-sorcery-cauldron-of-blood',
      disciplineKey: 'bloodSorcery',
      name: 'Caldero de Sangre',
      level: 5,
      summary:
        'Hace hervir sobrenaturalmente la sangre de una víctima dentro de su propio cuerpo.',
      sourceKey: 'core-v5-es',
      sourcePage: 274,
    },
    {
      key: 'blood-sorcery-baals-caress',
      disciplineKey: 'bloodSorcery',
      name: 'Caricia de Baal',
      level: 5,
      summary:
        'Transforma la Vitae en un veneno sobrenatural extremadamente destructivo.',
      sourceKey: 'core-v5-es',
      sourcePage: 275,
    },

    /*
     * DOMINACIÓN
     * Fuente: Vampiro V5 — Libro Básico ES
     */

    {
      key: 'dominate-cloud-memory',
      disciplineKey: 'dominate',
      name: 'Nublar la Memoria',
      level: 1,
      summary:
        'Permite borrar o enturbiar recuerdos recientes mediante una orden sobrenatural.',
      sourceKey: 'core-v5-es',
      sourcePage: 255,
    },
    {
      key: 'dominate-compel',
      disciplineKey: 'dominate',
      name: 'Compelir',
      level: 1,
      summary:
        'Impone una orden breve e inmediata que el objetivo se ve sobrenaturalmente obligado a obedecer.',
      sourceKey: 'core-v5-es',
      sourcePage: 255,
    },
    {
      key: 'dominate-mesmerize',
      disciplineKey: 'dominate',
      name: 'Mesmerismo',
      level: 2,
      summary:
        'Permite implantar instrucciones verbales más complejas en la mente de un objetivo.',
      sourceKey: 'core-v5-es',
      sourcePage: 256,
    },
    {
      key: 'dominate-the-forgetful-mind',
      disciplineKey: 'dominate',
      name: 'La Mente Olvidadiza',
      level: 3,
      summary:
        'Permite alterar y reconstruir recuerdos del objetivo mediante manipulación sobrenatural.',
      sourceKey: 'core-v5-es',
      sourcePage: 256,
    },
    {
      key: 'dominate-submerged-directive',
      disciplineKey: 'dominate',
      name: 'Instrucciones Subconscientes',
      level: 3,
      summary:
        'Permite implantar una orden latente que se activa cuando se cumplen determinadas circunstancias.',
      sourceKey: 'core-v5-es',
      sourcePage: 256,
    },
    {
      key: 'dominate-rationalize',
      disciplineKey: 'dominate',
      name: 'Racionalización',
      level: 4,
      summary:
        'Hace que el objetivo racionalice las acciones realizadas bajo Dominación como decisiones propias.',
      sourceKey: 'core-v5-es',
      sourcePage: 257,
    },
    {
      key: 'dominate-terminal-decree',
      disciplineKey: 'dominate',
      name: 'Decreto Terminal',
      level: 5,
      summary:
        'Permite imponer órdenes que pueden conducir al objetivo a sufrir daños graves o incluso a la muerte.',
      sourceKey: 'core-v5-es',
      sourcePage: 257,
    },
    {
      key: 'dominate-mass-manipulation',
      disciplineKey: 'dominate',
      name: 'Manipulación Masiva',
      level: 5,
      summary:
        'Permite extender determinados efectos de Dominación a múltiples objetivos simultáneamente.',
      sourceKey: 'core-v5-es',
      sourcePage: 257,
    },
    {
      key: 'dominate-total-subjugation',
      disciplineKey: 'dominate',
      name: 'Sumisión Total',
      level: 5,
      summary:
        'Representa una forma extrema de control sobrenatural sobre la voluntad de un objetivo.',
      sourceKey: 'core-v5-es',
      sourcePage: 257,
    },

    /*
     * AUSPEX
     * Fuente: Vampiro V5 — Libro Básico ES
     * Págs. 249–252.
     */

    {
      key: 'auspex-heightened-senses',
      disciplineKey: 'auspex',
      name: 'Sentidos Agudizados',
      level: 1,
      summary:
        'Amplifica sobrenaturalmente uno o varios sentidos del vampiro.',
      sourceKey: 'core-v5-es',
      sourcePage: 249,
    },
    {
      key: 'auspex-sense-the-unseen',
      disciplineKey: 'auspex',
      name: 'Sentir lo Invisible',
      level: 1,
      summary:
        'Permite percibir fenómenos sobrenaturales que normalmente permanecerían ocultos.',
      sourceKey: 'core-v5-es',
      sourcePage: 249,
    },
    {
      key: 'auspex-premonition',
      disciplineKey: 'auspex',
      name: 'Premonición',
      level: 2,
      summary:
        'Proporciona destellos intuitivos de información sobre peligros o acontecimientos relevantes.',
      sourceKey: 'core-v5-es',
      sourcePage: 250,
    },
    {
      key: 'auspex-share-the-senses',
      disciplineKey: 'auspex',
      name: 'Compartir los Sentidos',
      level: 3,
      summary:
        'Permite experimentar a distancia las percepciones sensoriales de otro ser.',
      sourceKey: 'core-v5-es',
      sourcePage: 250,
    },
    {
      key: 'auspex-scry-the-soul',
      disciplineKey: 'auspex',
      name: 'Escudriñar el Alma',
      level: 3,
      summary:
        'Permite observar aspectos sobrenaturales y emocionales profundos de un individuo.',
      sourceKey: 'core-v5-es',
      sourcePage: 250,
    },
    {
      key: 'auspex-spirits-touch',
      disciplineKey: 'auspex',
      name: 'Toque del Espíritu',
      level: 4,
      summary:
        'Permite obtener impresiones psíquicas asociadas a objetos o lugares mediante el contacto.',
      sourceKey: 'core-v5-es',
      sourcePage: 251,
    },
    {
      key: 'auspex-clairvoyance',
      disciplineKey: 'auspex',
      name: 'Clarividencia',
      level: 5,
      summary:
        'Extiende la percepción sobrenatural para obtener información de un área situada más allá de los sentidos normales.',
      sourceKey: 'core-v5-es',
      sourcePage: 251,
    },
    {
      key: 'auspex-possession',
      disciplineKey: 'auspex',
      name: 'Posesión',
      level: 5,
      summary:
        'Permite proyectar la mente del vampiro sobre un mortal y controlar su cuerpo.',
      sourceKey: 'core-v5-es',
      sourcePage: 251,
      requirements: {
        amalgam: {
          disciplineKey: 'dominate',
          minimumLevel: 3,
        },
      },
    },
    {
      key: 'auspex-telepathy',
      disciplineKey: 'auspex',
      name: 'Telepatía',
      level: 5,
      summary:
        'Permite leer pensamientos y establecer comunicación mental sobrenatural.',
      sourceKey: 'core-v5-es',
      sourcePage: 252,
    },

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
      key: 'obfuscate-cloak-of-shadows',
      disciplineKey: 'obfuscate',
      name: 'Capa de Sombras',
      level: 1,
      summary:
        'Permite permanecer oculto al fundirse con el entorno mientras el vampiro evita llamar la atención.',
      sourceKey: 'core-v5-es',
    },
    {
      key: 'obfuscate-silence-of-death',
      disciplineKey: 'obfuscate',
      name: 'Silencio de la Muerte',
      level: 1,
      summary:
        'Suprime los sonidos producidos por el vampiro y facilita actuar sin ser oído.',
      sourceKey: 'core-v5-es',
    },
    {
      key: 'obfuscate-unseen-passage',
      disciplineKey: 'obfuscate',
      name: 'Paso Inadvertido',
      level: 2,
      summary:
        'Permite desplazarse sin ser percibido mientras se mantengan las condiciones necesarias para conservar la ocultación.',
      sourceKey: 'core-v5-es',
    },
    {
      key: 'obfuscate-mask-of-a-thousand-faces',
      disciplineKey: 'obfuscate',
      name: 'Máscara de las Mil Caras',
      level: 3,
      summary:
        'Hace que los observadores perciban al vampiro con una apariencia anónima y poco memorable.',
      sourceKey: 'core-v5-es',
    },
    {
      key: 'obfuscate-ghost-in-the-machine',
      disciplineKey: 'obfuscate',
      name: 'Fantasma en la Máquina',
      level: 3,
      summary:
        'Extiende los efectos de Ofuscación frente a dispositivos y sistemas de observación tecnológica.',
      sourceKey: 'core-v5-es',
    },
    {
      key: 'obfuscate-vanish',
      disciplineKey: 'obfuscate',
      name: 'Desvanecimiento',
      level: 4,
      summary:
        'Permite desaparecer de la percepción incluso ante observadores que estaban prestando atención al vampiro.',
      sourceKey: 'core-v5-es',
      requirements: {
        prerequisitePowerKeys: [
          'obfuscate-cloak-of-shadows',
        ],
      },
    },
    {
      key: 'obfuscate-cloak-the-gathering',
      disciplineKey: 'obfuscate',
      name: 'Encubrimiento de la Asamblea',
      level: 5,
      summary:
        'Permite extender determinados efectos de Ofuscación a varios acompañantes.',
      sourceKey: 'core-v5-es',
      requirements: {
        prerequisitePowerKeys: [
          'obfuscate-unseen-passage',
        ],
      },
    },
    {
      key: 'obfuscate-impostors-guise',
      disciplineKey: 'obfuscate',
      name: 'Impostura',
      level: 5,
      summary:
        'Permite adoptar mediante Ofuscación la apariencia percibida de otra persona.',
      sourceKey: 'core-v5-es',
      requirements: {
        prerequisitePowerKeys: [
          'obfuscate-mask-of-a-thousand-faces',
        ],
        amalgam: {
          disciplineKey: 'presence',
          minimumLevel: 3,
        },
      },
    },

    {
      key: 'oblivion-ashes-to-ashes',
      disciplineKey: 'oblivion',
      name: 'Cenizas a las Cenizas',
      level: 1,
      summary:
        'Canaliza la entropía de Olvido sobre restos mortales y la materia muerta.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 85,
    },
    {
      key: 'oblivion-binding-fetter',
      disciplineKey: 'oblivion',
      name: 'El Grillete Vinculante',
      level: 1,
      summary:
        'Permite percibir vínculos sobrenaturales relacionados con los muertos y sus Grilletes.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 85,
    },
    {
      key: 'oblivion-shadow-cloak',
      disciplineKey: 'oblivion',
      name: 'Manto de Sombras',
      level: 1,
      summary:
        'Manipula las sombras para envolver al vampiro y dificultar su percepción.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 85,
    },
    {
      key: 'oblivion-oblivions-sight',
      disciplineKey: 'oblivion',
      name: 'Visión del Olvido',
      level: 1,
      summary:
        'Permite percibir manifestaciones sobrenaturales vinculadas con la muerte y los fantasmas.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 85,
    },
    {
      key: 'oblivion-cast-shadows',
      disciplineKey: 'oblivion',
      name: 'Arrojar Sombras',
      level: 2,
      summary:
        'Conjura una sombra sobrenatural que facilita la manifestación de otros Poderes de Olvido.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 86,
    },
    {
      key: 'oblivion-arms-of-ahriman',
      disciplineKey: 'oblivion',
      name: 'Brazos de Ahrimán',
      level: 2,
      summary:
        'Invoca extensiones de sombra capaces de actuar físicamente sobre objetivos.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 86,
      requirements: {
        amalgam: {
          disciplineKey: 'potence',
          minimumLevel: 2,
        },
      },
    },
    {
      key: 'oblivion-where-the-shroud-thins',
      disciplineKey: 'oblivion',
      name: 'Donde el Velo se Adelgaza',
      level: 2,
      summary:
        'Permite percibir lugares donde la separación entre el mundo de los vivos y los muertos es especialmente débil.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 87,
    },
    {
      key: 'oblivion-fatal-prediction',
      disciplineKey: 'oblivion',
      name: 'Predicción Fatal',
      level: 2,
      summary:
        'Manipula fuerzas entrópicas para incrementar el riesgo de daño o muerte de un mortal.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 88,
      requirements: {
        amalgam: {
          disciplineKey: 'auspex',
          minimumLevel: 2,
        },
      },
    },

    {
      key: 'oblivion-aura-of-decay',
      disciplineKey: 'oblivion',
      name: 'Aura de Descomposición',
      level: 3,
      summary:
        'Extiende una influencia entrópica que acelera la decadencia y deteriora la materia y la vitalidad próximas.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 88,
    },
    {
      key: 'oblivion-passion-feast',
      disciplineKey: 'oblivion',
      name: 'Festín de Pasión',
      level: 3,
      summary:
        'Permite alimentarse sobrenaturalmente de las Pasiones de los espíritus en lugar de recurrir temporalmente a la sangre.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 88,
      requirements: {
        amalgam: {
          disciplineKey: 'fortitude',
          minimumLevel: 2,
        },
      },
    },
    {
      key: 'oblivion-shadow-perspective',
      disciplineKey: 'oblivion',
      name: 'Perspectiva de Sombra',
      level: 3,
      summary:
        'Permite proyectar los sentidos a través de una sombra visible y observar desde su perspectiva.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 89,
    },
    {
      key: 'oblivion-shadow-servant',
      disciplineKey: 'oblivion',
      name: 'Sirviente Sombrío',
      level: 3,
      summary:
        'Concede independencia temporal a una porción de la sombra para emplearla como explorador o espía.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 89,
      requirements: {
        amalgam: {
          disciplineKey: 'auspex',
          minimumLevel: 1,
        },
      },
    },
    {
      key: 'oblivion-touch',
      disciplineKey: 'oblivion',
      name: 'Toque de Olvido',
      level: 3,
      summary:
        'Canaliza la entropía mediante el contacto para deteriorar gravemente una parte del cuerpo de la víctima.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 89,
    },
    {
      key: 'oblivion-stygian-shroud',
      disciplineKey: 'oblivion',
      name: 'Manto Estigio',
      level: 4,
      summary:
        'Extiende una oscuridad sobrenatural que amortigua los sentidos y consume la vitalidad de quienes quedan atrapados.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 89,
    },
    {
      key: 'oblivion-necrotic-plague',
      disciplineKey: 'oblivion',
      name: 'Plaga Necrótica',
      level: 4,
      summary:
        'Imbuye a una víctima con una enfermedad sobrenatural capaz de deteriorar su cuerpo y propagarse en determinadas condiciones.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 90,
    },
    {
      key: 'oblivion-tenebrous-avatar',
      disciplineKey: 'oblivion',
      name: 'Avatar Tenebroso',
      level: 5,
      summary:
        'Transforma al vampiro en una manifestación de sombra capaz de deslizarse por superficies y atravesar pequeñas aberturas.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 90,
    },
    {
      key: 'oblivion-shadow-step',
      disciplineKey: 'oblivion',
      name: 'Caminar por las Sombras',
      level: 5,
      summary:
        'Permite desaparecer dentro de una sombra y emerger desde otra sombra distante que el vampiro pueda percibir.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 91,
    },
    {
      key: 'oblivion-skuld-fulfilled',
      disciplineKey: 'oblivion',
      name: 'Skuld Cumplido',
      level: 5,
      summary:
        'Hace regresar enfermedades, lesiones o deterioros previamente superados por una víctima mortal o Ghoul.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 91,
    },

    /*
     * Poderes técnicos de nivel 2.
     * Permiten comprobar que una Disciplina a 2
     * puede seleccionar dos poderes.
     */
  ]
