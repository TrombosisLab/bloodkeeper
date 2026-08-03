import {
  characterValidationContexts,
  characterValidationSections,
} from '../types/character-validation.types.ts'

import type {
  CharacterSectionState,
  CharacterSectionValidation,
  CharacterValidationContext,
  CharacterValidationDetail,
  CharacterValidationIssue,
  CharacterValidationReport,
  CharacterValidationSeverity,
  CharacterValidationTarget,
} from '../types/character-validation.types.ts'

export class CharacterValidationApiError
  extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string) {
    super(code)
    this.name = 'CharacterValidationApiError'
    this.status = status
    this.code = code
  }
}

export interface CharacterValidationGateway {
  validate(
    characterId: string,
    context: CharacterValidationContext,
  ): Promise<CharacterValidationReport>
}

type FetchImplementation = typeof globalThis.fetch

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function invalidResponse(): never {
  throw new CharacterValidationApiError(
    502,
    'INVALID_CHARACTER_VALIDATION_RESPONSE',
  )
}

function parseDetails(
  value: unknown,
): Record<string, CharacterValidationDetail> |
  undefined {
  if (value === undefined) return undefined
  if (!isRecord(value)) return invalidResponse()

  const details:
    Record<string, CharacterValidationDetail> = {}

  for (const [key, detail] of Object.entries(value)) {
    if (
      detail !== null &&
      typeof detail !== 'string' &&
      typeof detail !== 'number' &&
      typeof detail !== 'boolean'
    ) {
      return invalidResponse()
    }

    details[key] = detail
  }

  return details
}

function parseIssue(
  value: unknown,
): CharacterValidationIssue {
  if (
    !isRecord(value) ||
    typeof value.code !== 'string' ||
    (value.severity !== 'error' &&
      value.severity !== 'warning') ||
    ![
      ...characterValidationSections,
      'lifecycle',
    ].includes(value.section as CharacterValidationTarget) ||
    (value.field !== null &&
      typeof value.field !== 'string') ||
    typeof value.message !== 'string'
  ) {
    return invalidResponse()
  }

  return {
    code: value.code,
    severity:
      value.severity as CharacterValidationSeverity,
    section:
      value.section as CharacterValidationTarget,
    field: value.field,
    message: value.message,
    details: parseDetails(value.details),
  }
}

function parseSection(
  value: unknown,
): CharacterSectionValidation {
  if (
    !isRecord(value) ||
    !characterValidationSections.includes(
      value.section as CharacterSectionValidation['section'],
    ) ||
    !['complete', 'pending', 'invalid'].includes(
      value.state as CharacterSectionState,
    ) ||
    !Array.isArray(value.issues)
  ) {
    return invalidResponse()
  }

  return {
    section:
      value.section as CharacterSectionValidation['section'],
    state: value.state as CharacterSectionState,
    issues: value.issues.map(parseIssue),
  }
}

function parseReport(
  value: unknown,
): CharacterValidationReport {
  if (
    !isRecord(value) ||
    !characterValidationContexts.includes(
      value.context as CharacterValidationContext,
    ) ||
    typeof value.valid !== 'boolean' ||
    typeof value.canProceed !== 'boolean' ||
    !Array.isArray(value.sections) ||
    !Array.isArray(value.issues)
  ) {
    return invalidResponse()
  }

  const sections = value.sections.map(parseSection)
  const sectionKeys = sections.map(
    (section) => section.section,
  )

  if (
    sectionKeys.length !==
      characterValidationSections.length ||
    new Set(sectionKeys).size !== sectionKeys.length ||
    characterValidationSections.some(
      (section) => !sectionKeys.includes(section),
    )
  ) {
    return invalidResponse()
  }

  return {
    context:
      value.context as CharacterValidationContext,
    valid: value.valid,
    canProceed: value.canProceed,
    sections,
    issues: value.issues.map(parseIssue),
  }
}

async function responseError(
  response: Response,
): Promise<CharacterValidationApiError> {
  let code = 'CHARACTER_VALIDATION_REQUEST_FAILED'

  try {
    const body: unknown = await response.json()

    if (
      isRecord(body) &&
      typeof body.code === 'string'
    ) {
      code = body.code
    }
  } catch {
    // The HTTP status remains useful without a JSON body.
  }

  return new CharacterValidationApiError(
    response.status,
    code,
  )
}

export function createCharacterValidationGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): CharacterValidationGateway {
  return {
    async validate(characterId, context) {
      const response = await fetchImplementation(
        `/api/characters/${encodeURIComponent(characterId)}/validation?context=${encodeURIComponent(context)}`,
        { credentials: 'include' },
      )

      if (!response.ok) {
        throw await responseError(response)
      }

      try {
        return parseReport(await response.json())
      } catch (error: unknown) {
        if (
          error instanceof CharacterValidationApiError
        ) {
          throw error
        }

        return invalidResponse()
      }
    },
  }
}
