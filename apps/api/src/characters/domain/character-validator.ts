import {
  CHARACTER_VALIDATION_SECTIONS,
} from './character-validation.types'

import {
  buildCharacterValidationReport,
} from './character-validation.rules'

import type {
  PersistedCharacterDraft,
} from './persisted-character.types'

import type {
  CharacterSectionValidation,
  CharacterValidationContext,
  CharacterValidationReport,
  CharacterValidationSection,
} from './character-validation.types'

export interface CharacterValidationContributor {
  readonly sections:
    readonly CharacterValidationSection[]

  validate(
    character: PersistedCharacterDraft,
    context: CharacterValidationContext,
  ): readonly CharacterSectionValidation[]
}

export class InvalidPersistedCharacterStateError
  extends Error {
  readonly report: CharacterValidationReport

  constructor(report: CharacterValidationReport) {
    super(
      'Persisted character state cannot proceed in this context',
    )
    this.name =
      'InvalidPersistedCharacterStateError'
    this.report = report
  }
}

function assertContributorContract(
  contributor: CharacterValidationContributor,
  claimed:
    Set<CharacterValidationSection>,
): void {
  if (contributor.sections.length === 0) {
    throw new Error(
      'Character validation contributor must declare a section',
    )
  }

  for (const section of contributor.sections) {
    if (
      !CHARACTER_VALIDATION_SECTIONS.includes(
        section,
      )
    ) {
      throw new Error(
        `Unknown character validation section ${section}`,
      )
    }

    if (claimed.has(section)) {
      throw new Error(
        `Character validation section ${section} has multiple contributors`,
      )
    }

    claimed.add(section)
  }
}

function assertContributorResults(
  contributor: CharacterValidationContributor,
  results:
    readonly CharacterSectionValidation[],
): void {
  const declared = new Set(contributor.sections)
  const returned = new Set<CharacterValidationSection>()

  for (const result of results) {
    if (!declared.has(result.section)) {
      throw new Error(
        `Contributor returned undeclared section ${result.section}`,
      )
    }

    if (returned.has(result.section)) {
      throw new Error(
        `Contributor returned section ${result.section} more than once`,
      )
    }

    returned.add(result.section)
  }

  for (const section of declared) {
    if (!returned.has(section)) {
      throw new Error(
        `Contributor omitted declared section ${section}`,
      )
    }
  }
}

export class CharacterValidator {
  private readonly contributors:
    readonly CharacterValidationContributor[]

  constructor(
    contributors:
      readonly CharacterValidationContributor[],
  ) {
    const claimed =
      new Set<CharacterValidationSection>()

    for (const contributor of contributors) {
      assertContributorContract(
        contributor,
        claimed,
      )
    }

    this.contributors = [...contributors]
  }

  validate(
    character: PersistedCharacterDraft,
    context: CharacterValidationContext,
  ): CharacterValidationReport {
    const results:
      CharacterSectionValidation[] = []

    for (const contributor of this.contributors) {
      const contributed = contributor.validate(
        character,
        context,
      )

      assertContributorResults(
        contributor,
        contributed,
      )
      results.push(...contributed)
    }

    return buildCharacterValidationReport(
      context,
      results,
    )
  }

  assertCanProceed(
    character: PersistedCharacterDraft,
    context: CharacterValidationContext,
  ): CharacterValidationReport {
    const report = this.validate(
      character,
      context,
    )

    if (!report.canProceed) {
      throw new InvalidPersistedCharacterStateError(
        report,
      )
    }

    return report
  }
}
