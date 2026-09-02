export interface ChronicleSessionSharedNote {
  readonly authorUserId: string
  readonly authorName: string
  readonly content: string
  readonly updatedAt: string
}

export interface ChronicleSessionParticipantNotesSnapshot {
  readonly privateNotes: string
  readonly publicNotes: string
  readonly revision: number
  readonly sharedNotes: readonly ChronicleSessionSharedNote[]
}

interface NotesPatch {
  readonly expectedRevision: number
  readonly privateNotes?: string | null
  readonly publicNotes?: string | null
}

async function response<T>(request: Promise<Response>): Promise<T> {
  const result = await request
  const payload = await result.json().catch(() => null)
  if (!result.ok) {
    throw new Error(
      typeof payload?.code === 'string'
        ? payload.code
        : 'CHRONICLE_SESSION_NOTE_REQUEST_FAILED',
    )
  }
  return payload as T
}

function endpoint(chronicleId: string, sessionId: string) {
  return `/api/chronicles/${chronicleId}/sessions/${sessionId}/participant-notes`
}

export const chronicleSessionParticipantNotesApi = {
  load: (chronicleId: string, sessionId: string) =>
    response<ChronicleSessionParticipantNotesSnapshot>(
      fetch(endpoint(chronicleId, sessionId), {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      }),
    ),
  update: (chronicleId: string, sessionId: string, input: NotesPatch) =>
    response<ChronicleSessionParticipantNotesSnapshot>(
      fetch(endpoint(chronicleId, sessionId), {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      }),
    ),
}
