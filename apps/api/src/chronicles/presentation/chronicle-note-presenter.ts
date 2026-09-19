export type ChronicleNoteForPresentation = {
  id: string
  chronicleId: string
  sessionId: string | null
  contextLocationId: string | null
  title: string
  content: string
  visibility: string
  status: string
  authorUserId: string
  tags: string[]
  revision: number
  createdAt: Date
  updatedAt: Date
  favorites: Array<{ userId: string }>
  references: Array<{
    id: string
    targetType: string
    targetId: string
    label: string | null
  }>
  audiences: Array<{ userId: string }>
  author: {
    id: string
    displayName: string
    username: string
  }
  session: {
    id: string
    title: string | null
    sessionNumber: number | null
  } | null
}

// Traduce el registro persistido al contrato que consume la interfaz de notas.
// La autorización ya se ha aplicado en la consulta; aquí sólo se filtran datos de audiencia.
export function presentChronicleNote(
  note: ChronicleNoteForPresentation,
  narrator: boolean,
  userId: string,
) {
  return {
    id: note.id,
    chronicleId: note.chronicleId,
    sessionId: note.sessionId,
    contextLocationId: note.contextLocationId,
    title: note.title,
    content: note.content,
    visibility: note.visibility,
    status: note.status,
    pinned: note.favorites.some((favorite) => favorite.userId === userId),
    tags: note.tags,
    canEdit: narrator || note.authorUserId === userId,
    revision: note.revision,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    author: note.author,
    session: note.session,
    references: note.references.map((reference) => ({
      id: reference.id,
      targetType: reference.targetType,
      targetId: reference.targetId,
      label: reference.label,
    })),
    audienceUserIds: narrator || note.authorUserId === userId
      ? note.audiences.map((audience) => audience.userId)
      : [],
  }
}
