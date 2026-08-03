import {
  characterDisciplineCatalog,
} from '@v5r/character-rules'

import type {
  ThinBloodAlchemyFormulaDefinition,
  ThinBloodAlchemyFormulaLevel,
  ThinBloodAlchemyFormulaSource,
} from '../types/thin-blood-alchemy-formula.types.ts'

export const thinBloodAlchemyFormulaCatalog:
  ThinBloodAlchemyFormulaDefinition[] =
    JSON.parse(
      JSON.stringify(
        characterDisciplineCatalog
          .thinBloodAlchemyFormulas,
      ),
    )

export function getThinBloodAlchemyFormulaByKey(
  key: string,
): ThinBloodAlchemyFormulaDefinition | null {
  return (
    thinBloodAlchemyFormulaCatalog.find(
      (formula) => formula.key === key,
    ) ?? null
  )
}

export function getThinBloodAlchemyFormulasByLevel(
  level: ThinBloodAlchemyFormulaLevel,
): ThinBloodAlchemyFormulaDefinition[] {
  return thinBloodAlchemyFormulaCatalog.filter(
    (formula) => formula.level === level,
  )
}

export function getThinBloodAlchemyFormulasBySource(
  source: ThinBloodAlchemyFormulaSource,
): ThinBloodAlchemyFormulaDefinition[] {
  return thinBloodAlchemyFormulaCatalog.filter(
    (formula) => formula.source === source,
  )
}
