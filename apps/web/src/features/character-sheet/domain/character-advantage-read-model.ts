import {
  characterAdvantageCatalog,
} from '@v5r/character-rules'

import type {
  CharacterAdvantageDefinition,
  CharacterAdvantageSource,
} from '../../character-creation/types/character-advantage-definition.types'
import type {
  CharacterAdvantageFunctionalType,
  CharacterAdvantageNarrativeCompletionStatus,
} from '../../character-creation/types/character-advantage-functional.types'
import type {
  CharacterAdvantageCategory,
  CharacterAdvantageInstanceDetails,
  CharacterAdvantageSelectionOrigin,
  CharacterAdvantageSelectionDraft,
} from '../../character-creation/types/character-advantages-draft.types'
import {
  getCharacterAdvantageFunctionalType,
  getCharacterAdvantageNarrativeState,
} from '../../character-creation/domain/advantage-functional-model.ts'
import type {
  CharacterAdvantages,
  RatedTrait,
} from '../types/character-advantages.types'

const CATEGORY_LABELS:
  Record<CharacterAdvantageCategory, string> = {
    merit: 'Mérito',
    background: 'Trasfondo',
    flaw: 'Defecto',
  }

const FUNCTIONAL_TYPE_LABELS:
  Record<CharacterAdvantageFunctionalType, string> = {
    scalar: 'Valor',
    entity: 'Entidad',
    location: 'Localización',
    collection: 'Colección',
    dependent: 'Elemento dependiente',
    fixed: 'Rasgo fijo',
  }

const ORIGIN_LABELS:
  Record<CharacterAdvantageSelectionOrigin, string> = {
    creation: 'Creación',
    predatorType: 'Tipo de Depredador',
    thinBlood: 'Sangre Débil',
  }

const SOURCE_LABELS:
  Record<CharacterAdvantageSource, string> = {
    core: 'Libro Básico',
    playersGuide: 'Guía del Jugador',
    bloodSigils: 'Blood Sigils',
  other: 'Otra fuente autorizada',
}

const NARRATIVE_STATUS_LABELS:
  Record<
    CharacterAdvantageNarrativeCompletionStatus,
    string
  > = {
    notApplicable:
      'Sin información narrativa pendiente',
    pending:
      'Información narrativa pendiente',
    complete:
      'Información narrativa completa',
  }

function textOrUndefined(
  value: string | undefined,
): string | undefined {
  const normalized = value?.trim()

  return normalized || undefined
}

function getCharacterAdvantageDetail(
  details:
    CharacterAdvantageInstanceDetails | undefined,
): string | undefined {
  if (!details) {
    return undefined
  }

  switch (details.kind) {
    case 'allies':
      return (
        textOrUndefined(details.identity) ??
        `Efectividad ${details.effectiveness} · Fiabilidad ${details.reliability}`
      )

    case 'contact':
    case 'retainer':
    case 'mawla':
    case 'herd':
    case 'haven':
    case 'famousFace':
    case 'enemy':
    case 'stalker':
      return textOrUndefined(
        details.identity,
      )

    case 'status':
    case 'fame':
    case 'influence':
      return textOrUndefined(
        details.sphere,
      )

    case 'mask':
      return textOrUndefined(
        details.identity,
      )

    case 'resources':
      return textOrUndefined(
        details.source,
      )

    case 'substanceUse': {
      const substance =
        textOrUndefined(
          details.substance,
        )
      const poolCategory =
        textOrUndefined(
          details.poolCategory,
        )

      return [
        substance,
        poolCategory,
      ].filter(Boolean).join(' · ') || undefined
    }

    case 'preyExclusion':
      return textOrUndefined(
        details.excludedPrey,
      )

    case 'folkloricBane':
      return textOrUndefined(
        details.source,
      )

    case 'folkloricBlock':
      return textOrUndefined(
        details.taboo,
      )

    case 'loresheet': {
      const loresheet =
        characterAdvantageCatalog.loresheets.find(
          (definition) =>
            definition.key ===
            details.loresheetKey,
        )

      const benefit =
        loresheet?.benefits.find(
          (definition) =>
            definition.key ===
            details.benefitKey,
        )

      return [
        loresheet?.name ??
          details.loresheetKey,
        benefit?.name ??
          details.benefitKey,
      ].filter(Boolean).join(' · ') || undefined
    }

    case 'linguistics':
      return (
        details.languages
          .map((language) => language.trim())
          .filter(Boolean)
          .join(', ') || undefined
      )

    case 'methuselahVisage':
      return textOrUndefined(
        details.resembles,
      )

    case 'childOfTheScene':
      return textOrUndefined(
        details.subculture,
      )

    case 'darkSecret':
      return textOrUndefined(
        details.secret,
      )

    case 'infamy':
    case 'despised':
    case 'hatred':
    case 'exiled':
    case 'suspect':
    case 'shunned':
    case 'mortalPretender':
      return textOrUndefined(
        details.description,
      )

    default: {
      const exhaustiveCheck: never =
        details

      return exhaustiveCheck
    }
  }
}

function createRatedTrait(
  selection: CharacterAdvantageSelectionDraft,
  definition: CharacterAdvantageDefinition | undefined,
): RatedTrait {
  const category =
    definition?.category ??
    selection.category

  const functionalType =
    definition
      ? getCharacterAdvantageFunctionalType(
          definition,
        )
      : 'fixed'

  const narrativeStatus =
    definition
      ? getCharacterAdvantageNarrativeState(
          definition,
          selection.details,
        ).status
      : 'notApplicable'

  return {
    key: selection.selectionId,
    definitionKey:
      selection.definitionKey,
    name:
      definition?.name ??
      selection.definitionKey,
    value: selection.rating,
    category,
    categoryLabel:
      CATEGORY_LABELS[category],
    functionalType,
    functionalTypeLabel:
      FUNCTIONAL_TYPE_LABELS[
        functionalType
      ],
    origin: selection.origin,
    originLabel:
      ORIGIN_LABELS[
        selection.origin
      ],
    detail:
      getCharacterAdvantageDetail(
        selection.details,
      ),
    sourceLabel: definition
      ? SOURCE_LABELS[
          definition.source
        ]
      : undefined,
    sourcePage:
      definition?.sourcePage,
    catalogStatus: definition
      ? 'resolved'
      : 'missing',
    narrativeStatus,
    narrativeStatusLabel:
      NARRATIVE_STATUS_LABELS[
        narrativeStatus
      ],
  }
}

export function buildCharacterAdvantageReadModel(
  selections:
    readonly CharacterAdvantageSelectionDraft[],
  definitions:
    readonly CharacterAdvantageDefinition[],
): CharacterAdvantages {
  const definitionsByKey =
    new Map(
      definitions.map(
        (definition) => [
          definition.key,
          definition,
        ],
      ),
    )

  const result: CharacterAdvantages = {
    advantages: [],
    backgrounds: [],
    flaws: [],
  }

  for (const selection of selections) {
    const trait =
      createRatedTrait(
        selection,
        definitionsByKey.get(
          selection.definitionKey,
        ),
      )

    switch (trait.category) {
      case 'merit':
        result.advantages.push(trait)
        break

      case 'background':
        result.backgrounds.push(trait)
        break

      case 'flaw':
        result.flaws.push(trait)
        break

      default: {
        const exhaustiveCheck: never =
          trait.category

        void exhaustiveCheck
      }
    }
  }

  return result
}
