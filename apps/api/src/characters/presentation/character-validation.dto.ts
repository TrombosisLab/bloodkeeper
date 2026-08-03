import type {
  CharacterValidationContext,
  CharacterValidationReport,
} from '../domain/character-validation.types'

export type CharacterValidationResponseDto =
  CharacterValidationReport

export class InvalidCharacterValidationRequestError
  extends Error {
  constructor(path: string, expectation: string) {
    super(`${path} ${expectation}`)
    this.name =
      'InvalidCharacterValidationRequestError'
  }
}

const contexts = [
  'draftSave',
  'activation',
  'editing',
  'evolution',
  'play',
] as const

export function parseCharacterValidationContext(
  input: unknown,
): CharacterValidationContext {
  if (
    typeof input !== 'string' ||
    !contexts.includes(
      input as CharacterValidationContext,
    )
  ) {
    throw new InvalidCharacterValidationRequestError(
      'context',
      'contains an unsupported value',
    )
  }

  return input as CharacterValidationContext
}

export function toCharacterValidationResponse(
  report: CharacterValidationReport,
): CharacterValidationResponseDto {
  return {
    context: report.context,
    valid: report.valid,
    canProceed: report.canProceed,
    sections: report.sections.map(
      (section) => ({
        section: section.section,
        state: section.state,
        issues: section.issues.map((issue) => ({
          ...issue,
          details:
            issue.details === undefined
              ? undefined
              : { ...issue.details },
        })),
      }),
    ),
    issues: report.issues.map((issue) => ({
      ...issue,
      details:
        issue.details === undefined
          ? undefined
          : { ...issue.details },
    })),
  }
}
