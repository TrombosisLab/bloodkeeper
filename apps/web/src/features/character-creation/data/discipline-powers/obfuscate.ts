import type {
  DisciplinePowerDefinition,
} from '../../types/discipline-power.types'

export const obfuscatePowerDefinitions:
  DisciplinePowerDefinition[] = [
  {
      key: 'obfuscate-cloak-of-shadows',
      disciplineKey: 'obfuscate',
      name: 'Capa de Sombras',
      level: 1,
      summary: 'Permite permanecer oculto al fundirse con el entorno mientras el vampiro evita llamar la atención.',
      sourceKey: 'core-v5-es',
    },
  {
      key: 'obfuscate-silence-of-death',
      disciplineKey: 'obfuscate',
      name: 'Silencio de la Muerte',
      level: 1,
      summary: 'Suprime los sonidos producidos por el vampiro y facilita actuar sin ser oído.',
      sourceKey: 'core-v5-es',
    },
  {
      key: 'obfuscate-unseen-passage',
      disciplineKey: 'obfuscate',
      name: 'Paso Inadvertido',
      level: 2,
      summary: 'Permite desplazarse sin ser percibido mientras se mantengan las condiciones necesarias para conservar la ocultación.',
      sourceKey: 'core-v5-es',
    },
  {
      key: 'obfuscate-mask-of-a-thousand-faces',
      disciplineKey: 'obfuscate',
      name: 'Máscara de las Mil Caras',
      level: 3,
      summary: 'Hace que los observadores perciban al vampiro con una apariencia anónima y poco memorable.',
      sourceKey: 'core-v5-es',
    },
  {
      key: 'obfuscate-ghost-in-the-machine',
      disciplineKey: 'obfuscate',
      name: 'Fantasma en la Máquina',
      level: 3,
      summary: 'Extiende los efectos de Ofuscación frente a dispositivos y sistemas de observación tecnológica.',
      sourceKey: 'core-v5-es',
    },
  {
      key: 'obfuscate-vanish',
      disciplineKey: 'obfuscate',
      name: 'Desvanecimiento',
      level: 4,
      summary: 'Permite desaparecer de la percepción incluso ante observadores que estaban prestando atención al vampiro.',
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
      summary: 'Permite extender determinados efectos de Ofuscación a varios acompañantes.',
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
      summary: 'Permite adoptar mediante Ofuscación la apariencia percibida de otra persona.',
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
  ]
