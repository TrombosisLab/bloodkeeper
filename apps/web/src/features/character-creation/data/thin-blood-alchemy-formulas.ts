import type {
  ThinBloodAlchemyFormulaDefinition,
  ThinBloodAlchemyFormulaLevel,
  ThinBloodAlchemyFormulaSource,
} from '../types/thin-blood-alchemy-formula.types.ts'

export const thinBloodAlchemyFormulaCatalog:
  ThinBloodAlchemyFormulaDefinition[] = [
    // Libro Básico — CORE

    {
      key: 'farReach',
      name: 'Alcance Lejano',
      level: 1,
      source: 'core',
      kind: 'named',
    },
    {
      key: 'profaneHierosGamos',
      name: 'Hieros Gamos Profano',
      level: 1,
      source: 'core',
      kind: 'named',
    },
    {
      key: 'haze',
      name: 'Neblina',
      level: 1,
      source: 'core',
      kind: 'named',
    },
    {
      key: 'envelop',
      name: 'Envolver',
      level: 2,
      source: 'core',
      kind: 'named',
    },
    {
      key: 'defractionate',
      name: 'Defraccionar',
      level: 3,
      source: 'core',
      kind: 'named',
    },
    {
      key: 'airborneMomentum',
      name: 'Ímpetu Aéreo',
      level: 4,
      source: 'core',
      kind: 'named',
    },
    {
      key: 'awakenTheSleeper',
      name: 'Despertar al Durmiente',
      level: 5,
      source: 'core',
      kind: 'named',
    },

    // Guía de Juego

    {
      key: 'plugIn',
      name: 'Enchufar',
      level: 1,
      source: 'playersGuide',
      kind: 'named',
    },
    {
      key: 'mercurianTongue',
      name: 'Lengua Mercuriana',
      level: 1,
      source: 'playersGuide',
      kind: 'named',
    },
    {
      key: 'friendsList',
      name: 'Lista de Amigos',
      level: 2,
      source: 'playersGuide',
      kind: 'named',
    },
    {
      key: 'mandagloire',
      name: 'Mandagloire',
      level: 3,
      source: 'playersGuide',
      kind: 'named',
    },
    {
      key: 'rumor',
      name: 'Rumor',
      level: 3,
      source: 'playersGuide',
      kind: 'named',
    },
    {
      key: 'tank',
      name: 'Tanque',
      level: 3,
      source: 'playersGuide',
      kind: 'named',
    },
    {
      key: 'shortCircuit',
      name: 'Cortocircuito',
      level: 4,
      source: 'playersGuide',
      kind: 'named',
    },
    {
      key: 'toxicPersonality',
      name: 'Personalidad Tóxica',
      level: 4,
      source: 'playersGuide',
      kind: 'named',
    },
    {
      key: 'floweringAmaranth',
      name: 'Amaranto Floreciente',
      level: 5,
      source: 'playersGuide',
      kind: 'named',
    },

    // Sellos de Sangre

    {
      key: 'elevated',
      name: 'Elevada',
      level: 1,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'heartToHeart',
      name: 'Hablar de Corazón',
      level: 1,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'checkOutTime',
      name: 'Hora de Salida',
      level: 1,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'foodStain',
      name: 'Mancha de Comida',
      level: 1,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'bodyPaint',
      name: 'Pintura Corporal',
      level: 1,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'blueState',
      name: 'Estado Azul',
      level: 2,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'advancedTorpor',
      name: 'Letargo Avanzado',
      level: 2,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'blacklightSurprise',
      name: 'Sorpresa de Luz Negra',
      level: 2,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'hospitalChains',
      name: 'Cadenas de Hospital',
      level: 3,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'unmask',
      name: 'Desenmascarar',
      level: 3,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'adamantineSkin',
      name: 'Piel Adamantina',
      level: 3,
      source: 'bloodSigils',
      kind: 'named',
      relatedFormulaKeys: [
        'tank',
      ],
    },
    {
      key: 'fireskin',
      name: 'Pieldefuego',
      level: 3,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'martianPurity',
      name: 'Pureza Marciana',
      level: 3,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'tlc',
      name: 'TLC',
      level: 3,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'trollThePious',
      name: 'Trolear a los Píos',
      level: 3,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'semiLivingConductor',
      name: 'Conductor Semi-Vivo',
      level: 4,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'redState',
      name: 'Estado Rojo',
      level: 4,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'msgVitae',
      name: 'GMS Vitae',
      level: 4,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'imitator',
      name: 'Imitador',
      level: 4,
      source: 'bloodSigils',
      kind: 'named',
    },
    {
      key: 'saturnFlow',
      name: 'Flujo de Saturno',
      level: 5,
      source: 'bloodSigils',
      kind: 'named',
    },
  ]

export function getThinBloodAlchemyFormulaByKey(
  key: string,
): ThinBloodAlchemyFormulaDefinition | null {
  return (
    thinBloodAlchemyFormulaCatalog.find(
      (formula) =>
        formula.key === key,
    ) ?? null
  )
}

export function getThinBloodAlchemyFormulasByLevel(
  level: ThinBloodAlchemyFormulaLevel,
): ThinBloodAlchemyFormulaDefinition[] {
  return thinBloodAlchemyFormulaCatalog.filter(
    (formula) =>
      formula.level === level,
  )
}

export function getThinBloodAlchemyFormulasBySource(
  source: ThinBloodAlchemyFormulaSource,
): ThinBloodAlchemyFormulaDefinition[] {
  return thinBloodAlchemyFormulaCatalog.filter(
    (formula) =>
      formula.source === source,
  )
}
