import type {
  CreateChronicleData,
} from './chronicle.types'

export interface ChronicleCreationIssue {
  readonly code: 'CHRONICLE_NAME_REQUIRED'
  readonly field: 'name'
  readonly message: string
}

export class InvalidChronicleCreationError
  extends Error {
  readonly issues: readonly ChronicleCreationIssue[]

  constructor(
    issues: readonly ChronicleCreationIssue[],
  ) {
    super('Chronicle creation is invalid')
    this.name = 'InvalidChronicleCreationError'
    this.issues = issues.map((issue) => ({
      ...issue,
    }))
  }
}

export function normalizeChronicleCreation(
  data: CreateChronicleData,
): CreateChronicleData {
  const name = data.name.trim()

  if (name.length === 0) {
    throw new InvalidChronicleCreationError([
      {
        code: 'CHRONICLE_NAME_REQUIRED',
        field: 'name',
        message:
          'La crónica debe tener un nombre.',
      },
    ])
  }

  const normalizedDescription =
    data.description?.trim() ?? ''

  return {
    narratorId: data.narratorId,
    name,
    description:
      normalizedDescription.length === 0
        ? null
        : normalizedDescription,
  }
}
