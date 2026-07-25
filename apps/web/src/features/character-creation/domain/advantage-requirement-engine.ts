import type {
  CharacterAdvantageRequirement,
  CharacterAdvantageRequirementContext,
  CharacterAdvantageRequirementEvaluation,
  CharacterAdvantageRequirementFailure,
} from '../types/character-advantage-requirements.types'

function findSelectionRating(
  definitionKey: string,
  context: CharacterAdvantageRequirementContext,
): number | undefined {
  const matchingRatings = context.selections
    .filter(
      (selection) =>
        selection.definitionKey === definitionKey,
    )
    .map(
      (selection) =>
        selection.rating,
    )

  if (matchingRatings.length === 0) {
    return undefined
  }

  return Math.max(...matchingRatings)
}

export function evaluateCharacterAdvantageRequirement(
  requirement: CharacterAdvantageRequirement,
  context: CharacterAdvantageRequirementContext,
): CharacterAdvantageRequirementFailure | undefined {
  switch (requirement.type) {
    case 'advantage': {
      const rating = findSelectionRating(
        requirement.definitionKey,
        context,
      )

      if (rating === undefined) {
        return {
          requirement,
          code: 'missingAdvantage',
        }
      }

      const minRating = requirement.minRating ?? 1

      if (rating < minRating) {
        return {
          requirement,
          code: 'insufficientAdvantageRating',
        }
      }

      return undefined
    }

    case 'clan': {
      if (!context.clanKey) {
        return {
          requirement,
          code: 'missingClan',
        }
      }

      if (
        !requirement.allowedClanKeys.includes(
          context.clanKey,
        )
      ) {
        return {
          requirement,
          code: 'clanNotAllowed',
        }
      }

      return undefined
    }

    case 'predatorType': {
      if (!context.predatorTypeKey) {
        return {
          requirement,
          code: 'missingPredatorType',
        }
      }

      if (
        !requirement.allowedPredatorTypeKeys.includes(
          context.predatorTypeKey,
        )
      ) {
        return {
          requirement,
          code: 'predatorTypeNotAllowed',
        }
      }

      return undefined
    }

    case 'thinBlood': {
      if (context.isThinBlood !== requirement.expected) {
        return {
          requirement,
          code: 'thinBloodMismatch',
        }
      }

      return undefined
    }

    case 'humanity': {
      if (context.humanity === undefined) {
        return {
          requirement,
          code: 'missingHumanity',
        }
      }

      if (context.humanity < requirement.min) {
        return {
          requirement,
          code: 'insufficientHumanity',
        }
      }

      return undefined
    }

    case 'generation': {
      if (context.generation === undefined) {
        return {
          requirement,
          code: 'missingGeneration',
        }
      }

      if (context.generation > requirement.max) {
        return {
          requirement,
          code: 'generationTooHigh',
        }
      }

      return undefined
    }
  }
}

export function evaluateCharacterAdvantageRequirements(
  requirements: readonly CharacterAdvantageRequirement[],
  context: CharacterAdvantageRequirementContext,
): CharacterAdvantageRequirementEvaluation {
  const failures = requirements
    .map(
      (requirement) =>
        evaluateCharacterAdvantageRequirement(
          requirement,
          context,
        ),
    )
    .filter(
      (
        failure,
      ): failure is CharacterAdvantageRequirementFailure =>
        failure !== undefined,
    )

  return {
    satisfied: failures.length === 0,
    failures,
  }
}

export function isCharacterAdvantageRequirementSatisfied(
  requirement: CharacterAdvantageRequirement,
  context: CharacterAdvantageRequirementContext,
): boolean {
  return (
    evaluateCharacterAdvantageRequirement(
      requirement,
      context,
    ) === undefined
  )
}

export function areCharacterAdvantageRequirementsSatisfied(
  requirements: readonly CharacterAdvantageRequirement[],
  context: CharacterAdvantageRequirementContext,
): boolean {
  return evaluateCharacterAdvantageRequirements(
    requirements,
    context,
  ).satisfied
}

export function collectMissingCharacterAdvantageRequirements(
  requirements: readonly CharacterAdvantageRequirement[],
  context: CharacterAdvantageRequirementContext,
): CharacterAdvantageRequirementFailure[] {
  return evaluateCharacterAdvantageRequirements(
    requirements,
    context,
  ).failures
}
