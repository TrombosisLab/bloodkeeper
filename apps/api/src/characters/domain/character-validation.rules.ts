import {
  CHARACTER_VALIDATION_SECTIONS,
} from './character-validation.types'

import type {
  CharacterSectionValidation,
  CharacterValidationContext,
  CharacterValidationIssue,
  CharacterValidationReport,
  CharacterValidationSection,
} from './character-validation.types'

function pendingSection(
  section: CharacterValidationSection,
): CharacterSectionValidation {
  return {
    section,
    state: 'pending',
    issues: [],
  }
}

function cloneIssue(
  issue: CharacterValidationIssue,
): CharacterValidationIssue {
  return {
    ...issue,
    details:
      issue.details === undefined
        ? undefined
        : { ...issue.details },
  }
}

function cloneSection(
  result: CharacterSectionValidation,
): CharacterSectionValidation {
  return {
    section: result.section,
    state: result.state,
    issues: result.issues.map(cloneIssue),
  }
}

function assertSectionContract(
  result: CharacterSectionValidation,
): void {
  if (
    result.issues.some(
      (issue) => issue.section !== result.section,
    )
  ) {
    throw new Error(
      `Validation issue does not belong to ${result.section}`,
    )
  }

  const hasError = result.issues.some(
    (issue) => issue.severity === 'error',
  )

  if (result.state === 'invalid' && !hasError) {
    throw new Error(
      `Invalid section ${result.section} requires an error`,
    )
  }

  if (result.state !== 'invalid' && hasError) {
    throw new Error(
      `Section ${result.section} with errors must be invalid`,
    )
  }
}

function normalizeSections(
  results:
    readonly CharacterSectionValidation[],
): CharacterSectionValidation[] {
  const bySection = new Map<
    CharacterValidationSection,
    CharacterSectionValidation
  >()

  for (const result of results) {
    if (bySection.has(result.section)) {
      throw new Error(
        `Validation section ${result.section} is duplicated`,
      )
    }

    assertSectionContract(result)
    bySection.set(result.section, result)
  }

  return CHARACTER_VALIDATION_SECTIONS.map(
    (section) =>
      cloneSection(
        bySection.get(section) ??
          pendingSection(section),
      ),
  )
}

export function buildCharacterValidationReport(
  context: CharacterValidationContext,
  results:
    readonly CharacterSectionValidation[],
): CharacterValidationReport {
  const sections = normalizeSections(results)
  const issues = sections.flatMap(
    (section) => section.issues,
  )
  const hasErrors = issues.some(
    (issue) => issue.severity === 'error',
  )
  const allSectionsComplete = sections.every(
    (section) => section.state === 'complete',
  )
  const valid =
    !hasErrors && allSectionsComplete

  return {
    context,
    valid,
    canProceed:
      context === 'activation'
        ? valid
        : !hasErrors,
    sections,
    issues,
  }
}

export function sectionValidation(
  section: CharacterValidationSection,
  state: CharacterSectionValidation['state'],
  issues:
    readonly CharacterValidationIssue[] = [],
): CharacterSectionValidation {
  return {
    section,
    state,
    issues,
  }
}
