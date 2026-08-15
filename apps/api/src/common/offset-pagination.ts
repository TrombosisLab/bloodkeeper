export const DEFAULT_OFFSET_PAGE_LIMIT = 25
export const MAX_OFFSET_PAGE_LIMIT = 50
export const DEFAULT_OFFSET = 0

export interface OffsetPaginationQuery {
  readonly limit: number
  readonly offset: number
}

export interface OffsetPage<T> {
  readonly items: readonly T[]
  readonly nextOffset: number | null
}

export class InvalidOffsetPaginationQueryError
  extends Error {
  constructor(
    readonly field: 'limit' | 'offset',
  ) {
    super(`Invalid pagination field: ${field}`)
    this.name =
      'InvalidOffsetPaginationQueryError'
  }
}

const decimalIntegerPattern =
  /^(0|[1-9][0-9]*)$/

function parseInteger(
  value: unknown,
  field: 'limit' | 'offset',
  fallback: number,
): number {
  if (value === undefined) {
    return fallback
  }

  if (
    typeof value !== 'string' ||
    !decimalIntegerPattern.test(value)
  ) {
    throw new InvalidOffsetPaginationQueryError(
      field,
    )
  }

  const parsed = Number(value)

  if (!Number.isSafeInteger(parsed)) {
    throw new InvalidOffsetPaginationQueryError(
      field,
    )
  }

  return parsed
}

export function parseOffsetPaginationQuery(
  input: {
    readonly limit?: unknown
    readonly offset?: unknown
  },
): OffsetPaginationQuery {
  const limit =
    parseInteger(
      input.limit,
      'limit',
      DEFAULT_OFFSET_PAGE_LIMIT,
    )

  const offset =
    parseInteger(
      input.offset,
      'offset',
      DEFAULT_OFFSET,
    )

  if (
    limit < 1 ||
    limit > MAX_OFFSET_PAGE_LIMIT
  ) {
    throw new InvalidOffsetPaginationQueryError(
      'limit',
    )
  }

  if (offset < 0) {
    throw new InvalidOffsetPaginationQueryError(
      'offset',
    )
  }

  return {
    limit,
    offset,
  }
}

export function offsetPageFromRows<T>(
  rows: readonly T[],
  query: OffsetPaginationQuery,
): OffsetPage<T> {
  const hasMore =
    rows.length > query.limit

  const items =
    hasMore
      ? rows.slice(0, query.limit)
      : rows

  return {
    items,
    nextOffset:
      hasMore
        ? query.offset + query.limit
        : null,
  }
}
