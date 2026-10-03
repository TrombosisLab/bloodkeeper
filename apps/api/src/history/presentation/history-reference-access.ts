import { BadRequestException, ForbiddenException } from '@nestjs/common'

export type HistoryReference = { key: string; type: 'resource' | 'character' | 'npc' | 'location'; id: string; label: string }
export type HistoryActor = { userId: string; admin: boolean; narrator: boolean }

export function managerChronicleWhere(actor: HistoryActor) {
  return actor.admin ? {} : { OR: [{ narratorId: actor.userId }, { participants: { some: { userId: actor.userId, role: 'NARRATOR', status: 'ACTIVE' } } }] }
}

export function characterWhere(actor: HistoryActor) {
  return actor.admin ? {} : { OR: [{ ownerId: actor.userId }, { chronicle: managerChronicleWhere(actor) }] }
}

export function nativeWhere(actor: HistoryActor) {
  return { status: 'ACTIVE', ...(actor.admin ? {} : { chronicle: { OR: [{ narratorId: actor.userId }, { participants: { some: { userId: actor.userId, status: 'ACTIVE' } } }] } }) }
}

export function resourceWhere(actor: HistoryActor) {
  if (actor.admin) return { status: 'active' }
  return { status: 'active', OR: [
    { ownerId: actor.userId },
    { bindings: { some: { status: 'attached', chronicle: managerChronicleWhere(actor) } } },
    { bindings: { some: { status: 'attached', chronicle: { participants: { some: { userId: actor.userId, status: 'ACTIVE' } } }, OR: [{ visibility: 'chronicle_participants' }, { visibility: 'selected_players', audiences: { some: { userId: actor.userId } } }] } } },
  ] }
}

export async function referenceCatalog(db: any, actor: HistoryActor) {
  const [resources, characters, npcs, locations] = await Promise.all([
    db.libraryResource.findMany({ where: resourceWhere(actor), select: { id: true, name: true, kind: true }, orderBy: { name: 'asc' } }),
    db.character.findMany({ where: characterWhere(actor), select: { id: true, identity: { select: { name: true } } } }),
    db.chronicleNpc.findMany({ where: { status: 'ACTIVE', chronicle: managerChronicleWhere(actor) }, select: { id: true, name: true } }),
    db.chronicleLocation.findMany({ where: { status: 'ACTIVE', chronicle: managerChronicleWhere(actor) }, select: { id: true, name: true } }),
  ])
  return [...resources.map((r: any) => ({ key: `resource:${r.id}`, type: 'resource', id: r.id, label: r.name, category: r.kind })), ...characters.map((r: any) => ({ key: `character:${r.id}`, type: 'character', id: r.id, label: r.identity?.name ?? 'Personaje sin nombre', category: 'character' })), ...npcs.map((r: any) => ({ key: `npc:${r.id}`, type: 'npc', id: r.id, label: r.name, category: 'PNJ' })), ...locations.map((r: any) => ({ key: `location:${r.id}`, type: 'location', id: r.id, label: r.name, category: 'Lugar' }))]
}

export async function validateReferences(db: any, actor: HistoryActor, value: unknown, existing: unknown = []) {
  if (!Array.isArray(value) || value.length > 50) throw new BadRequestException({ code: 'INVALID_HISTORY_REFERENCES' })
  const catalog = await referenceCatalog(db, actor)
  const previous = Array.isArray(existing) ? existing : []
  const result: HistoryReference[] = []
  for (const raw of value) {
    const target = raw && typeof raw === 'object' ? catalog.find((r: any) => r.key === raw.key) ?? previous.find((r: any) => r.key === raw.key) : null
    if (!target) throw new ForbiddenException({ code: 'HISTORY_REFERENCE_NOT_ACCESSIBLE' })
    if (!result.some(r => r.key === target.key)) result.push({ key: target.key, type: target.type, id: target.id, label: target.label })
  }
  return result
}
