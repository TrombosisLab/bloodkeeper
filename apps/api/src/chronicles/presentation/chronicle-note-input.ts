import { BadRequestException } from '@nestjs/common'

// Mantiene en un único punto la normalización y los límites del payload HTTP de notas.
// El controlador se ocupa de permisos y persistencia, no de interpretar valores sin tipo.
export type NoteInput = {
  title?: unknown
  content?: unknown
  visibility?: unknown
  sessionId?: unknown
  pinned?: unknown
  references?: unknown
  audienceUserIds?: unknown
  tags?: unknown
  contextLocationId?: unknown
  contextImageTargetType?: unknown
  contextImageTargetId?: unknown
}

export type NoteReference = {
  targetType: string
  targetId: string
  label?: string
}

export const targetTypes = new Set([
  'CHARACTER',
  'NPC',
  'LOCATION',
  'EVENT',
  'STORY',
  'SESSION',
  'RESOURCE',
  'ORGANIZATION',
  'ARTIFACT',
  'DOCUMENT',
])

export function text(
  value: unknown,
  field: string,
  required = false,
): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new BadRequestException({
        code: 'INVALID_NOTE_REQUEST',
        message: field + ' es obligatorio',
      })
    }
    return null
  }

  if (typeof value !== 'string' || value.length > 20000) {
    throw new BadRequestException({
      code: 'INVALID_NOTE_REQUEST',
      message: field + ' no es válido',
    })
  }

  const result = value.trim()
  if (required && !result) {
    throw new BadRequestException({
      code: 'INVALID_NOTE_REQUEST',
      message: field + ' es obligatorio',
    })
  }
  return result
}

export function visibility(
  value: unknown,
): 'PRIVATE' | 'CHRONICLE' | 'SELECTED_PLAYERS' {
  if (value === undefined || value === null || value === '') {
    return 'CHRONICLE'
  }
  if (
    value === 'PRIVATE' ||
    value === 'CHRONICLE' ||
    value === 'SELECTED_PLAYERS'
  ) {
    return value
  }
  throw new BadRequestException({ code: 'INVALID_NOTE_VISIBILITY' })
}

export function references(value: unknown): NoteReference[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.length > 40) {
    throw new BadRequestException({ code: 'INVALID_NOTE_REFERENCES' })
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new BadRequestException({ code: 'INVALID_NOTE_REFERENCES' })
    }

    const row = item as Record<string, unknown>
    const targetType = text(row.targetType, 'references.targetType', true)!.toUpperCase()
    const targetId = text(row.targetId, 'references.targetId', true)!
    if (!targetTypes.has(targetType)) {
      throw new BadRequestException({ code: 'INVALID_NOTE_REFERENCE_TYPE' })
    }

    return {
      targetType,
      targetId,
      label: text(row.label, 'references.label') ?? undefined,
    }
  })
}

export function contentReferences(
  value: string,
): Array<{ targetType: string; targetId: string }> {
  const result: Array<{ targetType: string; targetId: string }> = []
  const pattern = /@\[[^\]]+\]\(([A-Z_]+):([^\)]+)\)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(value)) !== null) {
    const targetType = match[1]!.toUpperCase()
    const targetId = match[2]!
    if (targetTypes.has(targetType) && targetId) {
      result.push({ targetType, targetId })
    }
  }
  return result
}

export function noteTags(value: unknown): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.length > 12) {
    throw new BadRequestException({ code: 'INVALID_NOTE_TAGS' })
  }

  const normalized = value.map((item) => {
    if (typeof item !== 'string') {
      throw new BadRequestException({ code: 'INVALID_NOTE_TAGS' })
    }
    const tag = item.trim().replace(/^#/, '')
    if (!tag || tag.length > 32) {
      throw new BadRequestException({ code: 'INVALID_NOTE_TAGS' })
    }
    return tag
  })
  return [...new Set(normalized)]
}

export function contextLocationId(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new BadRequestException({ code: 'INVALID_NOTE_CONTEXT_LOCATION' })
  }
  return value
}

export function contextImageTargetType(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (
    typeof value !== 'string' ||
    !/^(NPC|LOCATION|RESOURCE|ORGANIZATION|ARTIFACT|DOCUMENT|SESSION)$/i.test(value)
  ) {
    throw new BadRequestException({
      code: 'INVALID_NOTE_CONTEXT_IMAGE_TARGET_TYPE',
    })
  }
  return value.toUpperCase()
}

export function contextImageTargetId(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new BadRequestException({
      code: 'INVALID_NOTE_CONTEXT_IMAGE_TARGET_ID',
    })
  }
  return value
}

export function contextLocationReferences(
  value: string,
): Array<{ targetType: string; targetId: string }> {
  const result: Array<{ targetType: string; targetId: string }> = []
  const pattern = /@\[[^\]]+\]\(LOCATION:([^\)]+)\)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(value)) !== null) {
    result.push({ targetType: 'LOCATION', targetId: match[1]! })
  }
  return result
}

export function audience(value: unknown): string[] {
  if (value === undefined || value === null) return []
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'string') ||
    value.length > 50
  ) {
    throw new BadRequestException({ code: 'INVALID_NOTE_AUDIENCE' })
  }
  return [...new Set(value as string[])]
}
