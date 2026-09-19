import { DatabaseService } from '../../database/database.service'

export type NoteReferenceTarget = {
  id: string
  label: string | null
  category: string | null
  description: string | null
  status: string | null
  narrativeRole: string | null
  detailLevel: string | null
  narratorDetails: string | null
  deepProfile: unknown
  metadata: unknown
  sessionDate: Date | null
  sessionNumber: number | null
  parentLocationId: string | null
}

type ReferenceLookupOptions = {
  chronicleId: string
  targetType: string
  targetId: string
  narrator: boolean
}

const resourceTargetTypes = new Set([
  'RESOURCE',
  'ORGANIZATION',
  'ARTIFACT',
  'DOCUMENT',
])

function emptyTarget(id: string): NoteReferenceTarget {
  return {
    id,
    label: null,
    category: null,
    description: null,
    status: null,
    narrativeRole: null,
    detailLevel: null,
    narratorDetails: null,
    deepProfile: null,
    metadata: null,
    sessionDate: null,
    sessionNumber: null,
    parentLocationId: null,
  }
}

function resourceKind(targetType: string): string | null {
  if (targetType === 'ORGANIZATION') return 'organization'
  if (targetType === 'ARTIFACT') return 'artifact'
  if (targetType === 'DOCUMENT') return 'document'
  return null
}

function resourceTarget(
  row: {
    id: string
    name: string
    kind: string
    summary: string | null
    narratorNotes: string | null
    metadata: unknown
    status: string
  },
): NoteReferenceTarget {
  return {
    ...emptyTarget(row.id),
    label: row.name,
    category: row.kind,
    description: row.summary,
    status: row.status,
    narratorDetails: row.narratorNotes,
    metadata: row.metadata,
  }
}

/**
 * Resolves a mention through the canonical chronicle source.
 * Resource bindings are filtered here so preview and save validation share the
 * same narrator/player visibility rule.
 */
export async function findNoteReferenceTarget(
  database: DatabaseService,
  options: ReferenceLookupOptions,
): Promise<NoteReferenceTarget | null> {
  const {
    chronicleId,
    targetType,
    targetId,
    narrator,
  } = options

  if (resourceTargetTypes.has(targetType)) {
    const kind = resourceKind(targetType)
    const row = await database.libraryResource.findFirst({
      where: {
        id: targetId,
        status: 'active',
        ...(kind ? { kind } : {}),
        bindings: {
          some: {
            chronicleId,
            status: 'attached',
            ...(narrator ? {} : { visibility: 'chronicle_participants' }),
          },
        },
      },
      select: {
        id: true,
        name: true,
        kind: true,
        summary: true,
        narratorNotes: true,
        metadata: true,
        status: true,
      },
    })
    return row ? resourceTarget(row) : null
  }

  switch (targetType) {
    case 'CHARACTER': {
      const row = await database.character.findFirst({
        where: { id: targetId, chronicleId },
        select: {
          id: true,
          status: true,
          identity: { select: { name: true, concept: true } },
        },
      })
      if (!row) return null
      return {
        ...emptyTarget(row.id),
        label: row.identity?.name ?? null,
        description: row.identity?.concept ?? null,
        status: row.status,
      }
    }
    case 'NPC': {
      const row = await database.chronicleNpc.findFirst({
        where: { id: targetId, chronicleId },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          narrativeRole: true,
          notes: true,
          status: true,
          detailLevel: true,
          deepProfile: true,
        },
      })
      if (!row) return null
      return {
        ...emptyTarget(row.id),
        label: row.name,
        category: row.category,
        description: row.description,
        status: row.status,
        narrativeRole: row.narrativeRole,
        detailLevel: row.detailLevel,
        narratorDetails: row.notes,
        deepProfile: row.deepProfile,
      }
    }
    case 'LOCATION': {
      const row = await database.chronicleLocation.findFirst({
        where: { id: targetId, chronicleId },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          narratorNotes: true,
          status: true,
          parentLocationId: true,
        },
      })
      if (!row) return null
      return {
        ...emptyTarget(row.id),
        label: row.name,
        category: row.category,
        description: row.description,
        status: row.status,
        narratorDetails: row.narratorNotes,
        parentLocationId: row.parentLocationId,
      }
    }
    case 'EVENT': {
      const row = await database.chronicleEvent.findFirst({
        where: { id: targetId, chronicleId },
        select: {
          id: true,
          title: true,
          description: true,
          narratorNotes: true,
          realDate: true,
          status: true,
        },
      })
      if (!row) return null
      return {
        ...emptyTarget(row.id),
        label: row.title,
        description: row.description,
        status: row.status,
        narratorDetails: row.narratorNotes,
        sessionDate: row.realDate,
      }
    }
    case 'STORY': {
      const row = await database.chronicleStory.findFirst({
        where: { id: targetId, chronicleId },
        select: {
          id: true,
          title: true,
          type: true,
          premise: true,
          narratorNotes: true,
          status: true,
        },
      })
      if (!row) return null
      return {
        ...emptyTarget(row.id),
        label: row.title,
        category: row.type,
        description: row.premise,
        status: row.status,
        narratorDetails: row.narratorNotes,
      }
    }
    case 'SESSION': {
      const row = await database.chronicleSession.findFirst({
        where: { id: targetId, chronicleId },
        select: {
          id: true,
          title: true,
          summary: true,
          narratorNotes: true,
          objective: true,
          realDate: true,
          sessionNumber: true,
          status: true,
        },
      })
      if (!row) return null
      return {
        ...emptyTarget(row.id),
        label: row.title,
        description: row.summary ?? row.objective,
        status: row.status,
        narratorDetails: row.narratorNotes,
        sessionDate: row.realDate,
        sessionNumber: row.sessionNumber,
      }
    }
    default:
      return null
  }
}

export function previewImageType(targetType: string): string {
  return targetType === 'NPC' || targetType === 'LOCATION'
    ? targetType
    : 'RESOURCE'
}
