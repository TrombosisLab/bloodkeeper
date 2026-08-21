import {
  Injectable,
} from '@nestjs/common'

import {
  CharacterBloodDyscrasiaKey as PrismaCharacterBloodDyscrasiaKey,
  CharacterNature as PrismaCharacterNature,
  CharacterStatus as PrismaCharacterStatus,
  Prisma,
} from '@prisma/client'

import {
  characterBloodDyscrasiaCatalog,
} from '@v5r/character-rules'

import type {
  CharacterRulesBloodDyscrasiaKey,
} from '@v5r/character-rules'

import {
  CharacterBlushOfLifeOperationConflictError,
  CharacterBlushOfLifeWriteConflictError,
} from '../application/character-blush-of-life.repository'

import type {
  CharacterBlushOfLifeRepository,
} from '../application/character-blush-of-life.repository'

import {
  isSameCharacterBlushOfLifeExemptionOperation,
} from '../domain/character-blush-of-life.types'

import type {
  CharacterBlushOfLifeActiveDyscrasia,
  PersistCharacterBlushOfLifeExemptionData,
  PersistedCharacterBlushOfLifeExemptionOperation,
} from '../domain/character-blush-of-life.types'

import {
  DatabaseService,
} from '../../database/database.service'

type BlushRow =
  Prisma.CharacterBlushOfLifeExemptionOperationGetPayload<{}>

function prismaKey(
  key: CharacterRulesBloodDyscrasiaKey,
): PrismaCharacterBloodDyscrasiaKey {
  const enumName =
    key.replace(
      /([a-z0-9])([A-Z])/g,
      '$1_$2',
    ).toUpperCase()

  if (
    !Object.values(
      PrismaCharacterBloodDyscrasiaKey,
    ).includes(
      enumName as
        PrismaCharacterBloodDyscrasiaKey,
    )
  ) {
    throw new Error(
      `Unsupported Dyscrasia key: ${key}`,
    )
  }

  return enumName as
    PrismaCharacterBloodDyscrasiaKey
}

function domainKey(
  value:
    PrismaCharacterBloodDyscrasiaKey,
): CharacterRulesBloodDyscrasiaKey {
  const definition =
    characterBloodDyscrasiaCatalog
      .definitions
      .find(
        ({ key }) =>
          prismaKey(key) === value,
      )

  if (definition === undefined) {
    throw new Error(
      `Unsupported Prisma Dyscrasia: ${value}`,
    )
  }

  return definition.key
}

function toDomain(
  row: BlushRow,
): PersistedCharacterBlushOfLifeExemptionOperation {
  return {
    characterId:
      row.characterId,
    operationId:
      row.operationId,
    actorId:
      row.actorId,
    dyscrasiaKey:
      domainKey(row.dyscrasiaKey),
    sourceBloodOperationId:
      row.sourceBloodOperationId,
    hungerBefore:
      row.hungerBefore,
    hungerAfter:
      row.hungerAfter,
    characterRevision:
      row.characterRevision,
    createdAt:
      new Date(row.createdAt),
  }
}

@Injectable()
export class PrismaCharacterBlushOfLifeRepository
  implements CharacterBlushOfLifeRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async findExemptionOperation(
    characterId: string,
    operationId: string,
  ): Promise<
    PersistedCharacterBlushOfLifeExemptionOperation | null
  > {
    const row =
      await this.database
        .characterBlushOfLifeExemptionOperation
        .findUnique({
          where: {
            characterId_operationId: {
              characterId,
              operationId,
            },
          },
        })

    return row === null
      ? null
      : toDomain(row)
  }

  async findActiveDyscrasia(
    characterId: string,
  ): Promise<
    CharacterBlushOfLifeActiveDyscrasia | null
  > {
    const row =
      await this.database
        .characterBloodState
        .findUnique({
          where: {
            characterId,
          },
          select: {
            dyscrasiaKey: true,
            dyscrasiaSourceOperationId:
              true,
          },
        })

    if (
      row === null ||
      row.dyscrasiaKey === null ||
      row.dyscrasiaSourceOperationId ===
        null
    ) {
      return null
    }

    return {
      sourceBloodOperationId:
        row.dyscrasiaSourceOperationId,
      dyscrasiaKey:
        domainKey(
          row.dyscrasiaKey,
        ),
    }
  }

  async persistExemption(
    data:
      PersistCharacterBlushOfLifeExemptionData,
  ): Promise<
    PersistedCharacterBlushOfLifeExemptionOperation
  > {
    const execute = async () =>
      this.database.$transaction(
        async (transaction) => {
          const existing =
            await transaction
              .characterBlushOfLifeExemptionOperation
              .findUnique({
                where: {
                  characterId_operationId: {
                    characterId:
                      data.characterId,
                    operationId:
                      data.operationId,
                  },
                },
              })

          if (existing !== null) {
            const persisted =
              toDomain(existing)

            if (
              !isSameCharacterBlushOfLifeExemptionOperation(
                persisted,
                data,
              )
            ) {
              throw new CharacterBlushOfLifeOperationConflictError(
                data.characterId,
                data.operationId,
              )
            }

            return persisted
          }

          const current =
            await transaction.character
              .findUnique({
                where: {
                  id:
                    data.characterId,
                },
                select: {
                  revision: true,
                  status: true,
                  nature: true,
                  blood: {
                    select: {
                      hunger: true,
                      dyscrasiaKey: true,
                      dyscrasiaSourceOperationId:
                        true,
                    },
                  },
                },
              })

          const expectedKey =
            prismaKey(
              data.dyscrasiaKey,
            )

          if (
            current === null ||
            current.revision !==
              data.expectedRevision ||
            current.status ===
              PrismaCharacterStatus.ARCHIVED ||
            current.nature !==
              PrismaCharacterNature.VAMPIRE ||
            current.blood === null ||
            current.blood.hunger !==
              data.hungerBefore ||
            current.blood.dyscrasiaKey !==
              expectedKey ||
            current.blood
              .dyscrasiaSourceOperationId !==
                data.sourceBloodOperationId
          ) {
            throw new CharacterBlushOfLifeWriteConflictError(
              data.characterId,
            )
          }

          const claimed =
            await transaction.character
              .updateMany({
                where: {
                  id:
                    data.characterId,
                  revision:
                    data.expectedRevision,
                  status: {
                    in: [
                      PrismaCharacterStatus.DRAFT,
                      PrismaCharacterStatus.ACTIVE,
                    ],
                  },
                  nature:
                    PrismaCharacterNature.VAMPIRE,
                },
                data: {
                  revision: {
                    increment: 1,
                  },
                },
              })

          if (
            claimed.count !== 1
          ) {
            throw new CharacterBlushOfLifeWriteConflictError(
              data.characterId,
            )
          }

          const row =
            await transaction
              .characterBlushOfLifeExemptionOperation
              .create({
                data: {
                  characterId:
                    data.characterId,
                  operationId:
                    data.operationId,
                  actorId:
                    data.actorId,
                  dyscrasiaKey:
                    expectedKey,
                  sourceBloodOperationId:
                    data.sourceBloodOperationId,
                  hungerBefore:
                    data.hungerBefore,
                  hungerAfter:
                    data.hungerBefore,
                  characterRevision:
                    data.expectedRevision + 1,
                },
              })

          return toDomain(row)
        },
      )

    try {
      return await execute()
    } catch (error: unknown) {
      const existing =
        await this.findExemptionOperation(
          data.characterId,
          data.operationId,
        )

      if (
        existing !== null &&
        isSameCharacterBlushOfLifeExemptionOperation(
          existing,
          data,
        )
      ) {
        return existing
      }

      throw error
    }
  }
}
