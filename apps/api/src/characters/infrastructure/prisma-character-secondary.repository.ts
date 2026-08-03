import { Injectable } from '@nestjs/common'

import {
  CharacterStatus as PrismaCharacterStatus,
  InventoryItemStatus as PrismaInventoryItemStatus,
  Prisma,
} from '@prisma/client'

import {
  CharacterSecondaryWriteConflictError,
} from '../application/character-secondary.repository'

import type {
  CharacterSecondaryRepository,
} from '../application/character-secondary.repository'

import type {
  CharacterInventoryItemStatus,
  PersistedCharacterHistoryEntry,
  PersistedCharacterInventoryItem,
  PersistedCharacterNote,
  PersistedCharacterSecondaryData,
  UpdateCharacterSecondaryData,
} from '../domain/persisted-character-secondary.types'

import { DatabaseService } from '../../database/database.service'

const statusToPrisma: Record<
  CharacterInventoryItemStatus,
  PrismaInventoryItemStatus
> = {
  active: PrismaInventoryItemStatus.ACTIVE,
  archived: PrismaInventoryItemStatus.ARCHIVED,
}

const statusFromPrisma: Record<
  PrismaInventoryItemStatus,
  CharacterInventoryItemStatus
> = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
}

const secondaryRelations = {
  inventoryItems: {
    orderBy: [
      { status: 'asc' as const },
      { createdAt: 'asc' as const },
      { id: 'asc' as const },
    ],
  },
  notes: {
    orderBy: [
      { createdAt: 'asc' as const },
      { id: 'asc' as const },
    ],
  },
  historyEntries: {
    orderBy: [
      { createdAt: 'asc' as const },
      { id: 'asc' as const },
    ],
  },
} satisfies Prisma.CharacterInclude

type CharacterWithSecondaryData =
  Prisma.CharacterGetPayload<{
    include: typeof secondaryRelations
  }>

function toPersistedSecondaryData(
  row: CharacterWithSecondaryData,
): PersistedCharacterSecondaryData {
  return {
    characterId: row.id,
    revision: row.revision,
    inventory: row.inventoryItems.map(
      (item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        description: item.description,
        category: item.category,
        notes: item.notes,
        status: statusFromPrisma[item.status],
      }),
    ),
    notes: row.notes.map((note) => ({
      id: note.id,
      content: note.content,
    })),
    history: row.historyEntries.map(
      (entry) => ({
        id: entry.id,
        title: entry.title,
        description: entry.description,
      }),
    ),
  }
}

async function syncInventory(
  transaction: Prisma.TransactionClient,
  characterId: string,
  inventory:
    PersistedCharacterInventoryItem[],
): Promise<void> {
  const ids = inventory.map((item) => item.id)

  await transaction.characterInventoryItem
    .deleteMany({
      where: {
        characterId,
        ...(ids.length > 0
          ? { id: { notIn: ids } }
          : {}),
      },
    })

  for (const item of inventory) {
    const data = {
      name: item.name,
      quantity: item.quantity,
      description: item.description,
      category: item.category,
      notes: item.notes,
      status: statusToPrisma[item.status],
    }
    const updated =
      await transaction.characterInventoryItem
        .updateMany({
          where: {
            id: item.id,
            characterId,
          },
          data,
        })

    if (updated.count === 0) {
      await transaction.characterInventoryItem
        .create({
          data: {
            id: item.id,
            characterId,
            ...data,
          },
        })
    }
  }
}

async function syncNotes(
  transaction: Prisma.TransactionClient,
  characterId: string,
  notes: PersistedCharacterNote[],
): Promise<void> {
  const ids = notes.map((note) => note.id)

  await transaction.characterNote.deleteMany({
    where: {
      characterId,
      ...(ids.length > 0
        ? { id: { notIn: ids } }
        : {}),
    },
  })

  for (const note of notes) {
    const updated =
      await transaction.characterNote.updateMany({
        where: {
          id: note.id,
          characterId,
        },
        data: { content: note.content },
      })

    if (updated.count === 0) {
      await transaction.characterNote.create({
        data: {
          id: note.id,
          characterId,
          content: note.content,
        },
      })
    }
  }
}

async function syncHistory(
  transaction: Prisma.TransactionClient,
  characterId: string,
  history:
    PersistedCharacterHistoryEntry[],
): Promise<void> {
  const ids = history.map((entry) => entry.id)

  await transaction.characterHistoryEntry
    .deleteMany({
      where: {
        characterId,
        ...(ids.length > 0
          ? { id: { notIn: ids } }
          : {}),
      },
    })

  for (const entry of history) {
    const data = {
      title: entry.title,
      description: entry.description,
    }
    const updated =
      await transaction.characterHistoryEntry
        .updateMany({
          where: {
            id: entry.id,
            characterId,
          },
          data,
        })

    if (updated.count === 0) {
      await transaction.characterHistoryEntry
        .create({
          data: {
            id: entry.id,
            characterId,
            ...data,
          },
        })
    }
  }
}

@Injectable()
export class PrismaCharacterSecondaryRepository
  implements CharacterSecondaryRepository {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async findByCharacterId(
    ownerId: string,
    characterId: string,
  ): Promise<PersistedCharacterSecondaryData | null> {
    const row = await this.database.character
      .findFirst({
        where: {
          id: characterId,
          ownerId,
        },
        include: secondaryRelations,
      })

    return row === null
      ? null
      : toPersistedSecondaryData(row)
  }

  async update(
    ownerId: string,
    data: UpdateCharacterSecondaryData,
  ): Promise<PersistedCharacterSecondaryData> {
    return this.database.$transaction(
      async (transaction) => {
        const claimed =
          await transaction.character.updateMany({
            where: {
              id: data.characterId,
              ownerId,
              revision: data.expectedRevision,
              status: {
                in: [
                  PrismaCharacterStatus.DRAFT,
                  PrismaCharacterStatus.ACTIVE,
                ],
              },
            },
            data: {
              revision: { increment: 1 },
            },
          })

        if (claimed.count !== 1) {
          throw new CharacterSecondaryWriteConflictError(
            data.characterId,
          )
        }

        switch (data.section) {
          case 'inventory':
            await syncInventory(
              transaction,
              data.characterId,
              data.inventory,
            )
            break

          case 'notes':
            await syncNotes(
              transaction,
              data.characterId,
              data.notes,
            )
            break

          case 'history':
            await syncHistory(
              transaction,
              data.characterId,
              data.history,
            )
            break
        }

        const row =
          await transaction.character
            .findUniqueOrThrow({
              where: { id: data.characterId },
              include: secondaryRelations,
            })

        return toPersistedSecondaryData(row)
      },
    )
  }
}
