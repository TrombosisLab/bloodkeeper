import {
  buildCharacterBloodDyscrasiaConsumptionHistoryEntry,
} from '../domain/character-blood-history.rules'

import {
  Injectable,
} from '@nestjs/common'
import {
  offsetPageFromRows,
} from '../../common/offset-pagination'
import type {
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import {
  AdvantageCategory as PrismaAdvantageCategory,
  CharacterBloodDyscrasiaKey as PrismaCharacterBloodDyscrasiaKey,
  AdvantageSelectionOrigin as PrismaAdvantageSelectionOrigin,
  CharacterExperienceComponent as PrismaCharacterExperienceComponent,
  CharacterExperienceMovementType as PrismaCharacterExperienceMovementType,
  CharacterStatus as PrismaCharacterStatus,
  ChronicleSessionStatus as PrismaChronicleSessionStatus,
  DisciplineOrigin as PrismaDisciplineOrigin,
  SkillSpecialtyOrigin as PrismaSkillSpecialtyOrigin,
  Prisma,
} from '@prisma/client'
import type {
  CharacterExperienceMovement as PrismaCharacterExperienceMovementRecord,
} from '@prisma/client'
import {
  DatabaseService,
} from '../../database/database.service'
import {
  CharacterAdvancementArchivedError,
  CharacterAdvancementRevisionConflictError,
  CharacterExperienceDuplicateError,
  CharacterExperienceInsufficientError,
  CharacterExperienceMovementNotFoundError,
  CharacterExperienceSessionInvalidError,
  CharacterExperienceWriteConflictError,
} from '../application/character-experience.repository'
import type {
  CharacterExperienceRepository,
} from '../application/character-experience.repository'
import {
  projectCharacterExperienceCorrection,
} from '../domain/character-experience.rules'
import type {
  CharacterAdvancementDyscrasiaExperienceBenefit,
  PurchaseCharacterAdvancementData,
} from '../domain/character-advancement.types'
import {
  isCharacterBloodDyscrasiaExperienceBenefit,
} from '../domain/character-blood-dyscrasia-experience.rules'
import {
  toAdvantageDetailsCreate,
} from './prisma-character-draft.repository'
import type {
  AppendCharacterExperienceCorrectionData,
  AppendCharacterExperienceGrantData,
  CharacterExperienceCharacter,
  CharacterExperienceComponent,
  CharacterExperienceLedger,
  CharacterExperienceLedgerPage,
  CharacterExperienceMovement,
  CharacterExperienceMovementType,
  CharacterExperienceSession,
} from '../domain/character-experience.types'

const movementTypeFromPrisma = {
  [PrismaCharacterExperienceMovementType.GRANT]:
    'grant',
  [PrismaCharacterExperienceMovementType.SPEND]:
    'spend',
  [PrismaCharacterExperienceMovementType.CORRECTION]:
    'correction',
} as const satisfies Record<
  PrismaCharacterExperienceMovementType,
  CharacterExperienceMovementType
>

const componentFromPrisma = {
  [PrismaCharacterExperienceComponent.EARNED]:
    'earned',
  [PrismaCharacterExperienceComponent.SPENT]:
    'spent',
} as const satisfies Record<
  PrismaCharacterExperienceComponent,
  CharacterExperienceComponent
>

const characterStatusFromPrisma = {
  [PrismaCharacterStatus.DRAFT]: 'draft',
  [PrismaCharacterStatus.ACTIVE]: 'active',
  [PrismaCharacterStatus.ARCHIVED]: 'archived',
} as const satisfies Record<
  PrismaCharacterStatus,
  CharacterExperienceCharacter['status']
>

function restrictedDyscrasiaKeyFromPrisma(
  value:
    PrismaCharacterBloodDyscrasiaKey,
): CharacterAdvancementDyscrasiaExperienceBenefit['dyscrasiaKey'] | null {
  switch (value) {
    case PrismaCharacterBloodDyscrasiaKey.ENERGETIC:
      return 'energetic'
    case PrismaCharacterBloodDyscrasiaKey.EVOCATIVE:
      return 'evocative'
    case PrismaCharacterBloodDyscrasiaKey.REFLECTION:
      return 'reflection'
    case PrismaCharacterBloodDyscrasiaKey.EXCITED:
      return 'excited'
    default:
      return null
  }
}

function toMovement(
  row: PrismaCharacterExperienceMovementRecord,
): CharacterExperienceMovement {
  return {
    id: row.id,
    characterId: row.characterId,
    actorId: row.actorId,
    sessionId: row.sessionId,
    type: movementTypeFromPrisma[row.type],
    component: componentFromPrisma[
      row.component
    ],
    amount: row.amount,
    reason: row.reason,
    acquisitionType: row.acquisitionType,
    acquisitionKey: row.acquisitionKey,
    correctsMovementId:
      row.correctsMovementId,
    createdAt: new Date(row.createdAt),
  }
}

function toLedger(
  characterId: string,
  rows:
    readonly PrismaCharacterExperienceMovementRecord[],
): CharacterExperienceLedger {
  const movements = rows.map(toMovement)
  const total = movements
    .filter(
      (movement) =>
        movement.component === 'earned',
    )
    .reduce(
      (sum, movement) =>
        sum + movement.amount,
      0,
    )
  const spent = movements
    .filter(
      (movement) =>
        movement.component === 'spent',
    )
    .reduce(
      (sum, movement) =>
        sum + movement.amount,
      0,
    )

  return {
    characterId,
    total,
    spent,
    available: total - spent,
    movements,
  }
}

function duplicateError(
  error: unknown,
  characterId: string,
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new CharacterExperienceDuplicateError(
      characterId,
    )
  }

  throw error
}

@Injectable()
export class PrismaCharacterExperienceRepository
  implements CharacterExperienceRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async findCharacter(
    characterId: string,
  ): Promise<CharacterExperienceCharacter | null> {
    const row =
      await this.database.character.findUnique({
        where: { id: characterId },
        select: {
          id: true,
          ownerId: true,
          chronicleId: true,
          status: true,
        },
      })

    return row === null
      ? null
      : {
          id: row.id,
          ownerId: row.ownerId,
          chronicleId: row.chronicleId,
          status:
            characterStatusFromPrisma[
              row.status
            ],
        }
  }

  async findSession(
    sessionId: string,
  ): Promise<CharacterExperienceSession | null> {
    const row =
      await this.database.chronicleSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          chronicleId: true,
          status: true,
        },
      })

    if (row === null) {
      return null
    }

    return {
      id: row.id,
      chronicleId: row.chronicleId,
      status:
        row.status ===
          PrismaChronicleSessionStatus.PREPARATION
          ? 'preparation'
          : row.status ===
              PrismaChronicleSessionStatus.COMPLETED
            ? 'completed'
            : 'archived',
    }
  }

  async findMovement(
    characterId: string,
    movementId: string,
  ): Promise<CharacterExperienceMovement | null> {
    const row =
      await this.database.characterExperienceMovement.findFirst({
        where: {
          id: movementId,
          characterId,
        },
      })

    return row === null
      ? null
      : toMovement(row)
  }

  async loadLedger(
    characterId: string,
  ): Promise<CharacterExperienceLedger> {
    const rows =
      await this.database.characterExperienceMovement.findMany({
        where: { characterId },
        orderBy: [
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
      })

    return toLedger(characterId, rows)
  }

  async loadLedgerPage(
    characterId: string,
    query: OffsetPaginationQuery,
  ): Promise<CharacterExperienceLedgerPage> {
    const [
      rows,
      totalsByComponent,
    ] = await Promise.all([
      this.database.characterExperienceMovement.findMany({
        where: {
          characterId,
        },
        orderBy: [
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
        skip: query.offset,
        take: query.limit + 1,
      }),
      this.database.characterExperienceMovement.groupBy({
        by: ['component'],
        where: {
          characterId,
        },
        _sum: {
          amount: true,
        },
      }),
    ])

    let total = 0
    let spent = 0

    for (
      const componentTotal
      of totalsByComponent
    ) {
      const amount =
        componentTotal._sum.amount ?? 0

      if (
        componentTotal.component ===
        PrismaCharacterExperienceComponent.EARNED
      ) {
        total = amount
      } else if (
        componentTotal.component ===
        PrismaCharacterExperienceComponent.SPENT
      ) {
        spent = amount
      }
    }

    const movementPage =
      offsetPageFromRows(
        rows.map(toMovement),
        query,
      )

    return {
      characterId,
      total,
      spent,
      available:
        total - spent,
      movements:
        movementPage.items,
      nextOffset:
        movementPage.nextOffset,
    }
  }

  private async lockCharacter(
    transaction: Prisma.TransactionClient,
    characterId: string,
    chronicleId: string,
  ): Promise<void> {
    const locked =
      await transaction.$queryRaw<
        readonly { readonly id: string }[]
      >`
        SELECT "id"
        FROM "characters"
        WHERE "id" = ${characterId}::uuid
        FOR UPDATE
      `

    if (locked.length !== 1) {
      throw new CharacterExperienceWriteConflictError(
        characterId,
      )
    }

    const current =
      await transaction.character.findUnique({
        where: { id: characterId },
        select: { chronicleId: true },
      })

    if (
      current === null ||
      current.chronicleId !== chronicleId
    ) {
      throw new CharacterExperienceWriteConflictError(
        characterId,
      )
    }
  }

  private async transactionLedger(
    transaction: Prisma.TransactionClient,
    characterId: string,
  ): Promise<CharacterExperienceLedger> {
    const rows =
      await transaction.characterExperienceMovement.findMany({
        where: { characterId },
        orderBy: [
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
      })

    return toLedger(characterId, rows)
  }

  async appendGrant(
    data: AppendCharacterExperienceGrantData,
  ): Promise<CharacterExperienceLedger> {
    try {
      return await this.database.$transaction(
        async (transaction) => {
          await this.lockCharacter(
            transaction,
            data.characterId,
            data.chronicleId,
          )

          if (data.sessionId !== null) {
            const sessionCount =
              await transaction.chronicleSession.count({
                where: {
                  id: data.sessionId,
                  chronicleId: data.chronicleId,
                  status: {
                    in: [
                      PrismaChronicleSessionStatus.COMPLETED,
                      PrismaChronicleSessionStatus.ARCHIVED,
                    ],
                  },
                },
              })

            if (sessionCount !== 1) {
              throw new CharacterExperienceSessionInvalidError()
            }
          }

          await transaction.characterExperienceMovement.create({
            data: {
              characterId: data.characterId,
              actorId: data.actorId,
              sessionId: data.sessionId,
              type:
                PrismaCharacterExperienceMovementType.GRANT,
              component:
                PrismaCharacterExperienceComponent.EARNED,
              amount: data.amount,
              reason: data.reason,
              deduplicationKey:
                data.deduplicationKey,
            },
          })

          return this.transactionLedger(
            transaction,
            data.characterId,
          )
        },
      )
    } catch (error: unknown) {
      duplicateError(error, data.characterId)
    }
  }

  async appendCorrection(
    data: AppendCharacterExperienceCorrectionData,
  ): Promise<CharacterExperienceLedger> {
    try {
      return await this.database.$transaction(
        async (transaction) => {
          await this.lockCharacter(
            transaction,
            data.characterId,
            data.chronicleId,
          )

          const target =
            await transaction.characterExperienceMovement.findFirst({
              where: {
                id: data.targetMovementId,
                characterId: data.characterId,
              },
            })

          if (target === null) {
            throw new CharacterExperienceMovementNotFoundError(
              data.targetMovementId,
            )
          }

          const ledger =
            await this.transactionLedger(
              transaction,
              data.characterId,
            )

          projectCharacterExperienceCorrection(
            ledger,
            componentFromPrisma[
              target.component
            ],
            data.amount,
          )

          await transaction.characterExperienceMovement.create({
            data: {
              characterId: data.characterId,
              actorId: data.actorId,
              sessionId: target.sessionId,
              type:
                PrismaCharacterExperienceMovementType.CORRECTION,
              component: target.component,
              amount: data.amount,
              reason: data.reason,
              deduplicationKey:
                data.deduplicationKey,
              correctsMovementId: target.id,
            },
          })

          return this.transactionLedger(
            transaction,
            data.characterId,
          )
        },
      )
    } catch (error: unknown) {
      duplicateError(error, data.characterId)
    }
  }

  private async applyAdvancementMutation(
    transaction: Prisma.TransactionClient,
    data: PurchaseCharacterAdvancementData,
  ): Promise<void> {
    const mutation = data.mutation

    if (mutation.kind === 'attribute') {
      await transaction.characterAttributes.update({
        where: { characterId: data.characterId },
        data: {
          [mutation.key]: { increment: 1 },
        } as Prisma.CharacterAttributesUpdateInput,
      })
      return
    }

    if (mutation.kind === 'skill') {
      await transaction.characterSkill.upsert({
        where: {
          characterId_skillKey: {
            characterId: data.characterId,
            skillKey: mutation.key,
          },
        },
        create: {
          characterId: data.characterId,
          skillKey: mutation.key,
          rating: 1,
        },
        update: { rating: { increment: 1 } },
      })
      return
    }

    if (mutation.kind === 'specialty') {
      await transaction.characterSkillSpecialty.create({
        data: {
          id: data.operationId,
          characterId: data.characterId,
          skillKey: mutation.skillKey,
          name: mutation.name,
          origin: PrismaSkillSpecialtyOrigin.EVOLUTION,
        },
      })
      return
    }

    if (mutation.kind === 'discipline') {
      await transaction.characterDiscipline.upsert({
        where: {
          characterId_disciplineKey_contributionKey: {
            characterId: data.characterId,
            disciplineKey: mutation.disciplineKey,
            contributionKey: 'evolution',
          },
        },
        create: {
          characterId: data.characterId,
          disciplineKey: mutation.disciplineKey,
          contributionKey: 'evolution',
          rating: 1,
          origin: PrismaDisciplineOrigin.EVOLUTION,
          powers: { create: [{ powerKey: mutation.powerKey }] },
        },
        update: {
          rating: { increment: 1 },
          powers: { create: [{ powerKey: mutation.powerKey }] },
        },
      })
      return
    }

    if (mutation.kind === 'ritual') {
      await transaction.characterBloodSorceryRitual.create({
        data: { characterId: data.characterId, ritualKey: mutation.key },
      })
      return
    }

    if (mutation.kind === 'formula') {
      await transaction.characterThinBloodAlchemyFormula.create({
        data: { characterId: data.characterId, formulaKey: mutation.key },
      })
      return
    }

    if (mutation.kind === 'ceremony') {
      await transaction.characterOblivionCeremony.create({
        data: { characterId: data.characterId, ceremonyKey: mutation.key },
      })
      return
    }

    if (mutation.kind === 'advantage') {
      const category = mutation.category === 'merit'
        ? PrismaAdvantageCategory.MERIT
        : mutation.category === 'background'
          ? PrismaAdvantageCategory.BACKGROUND
          : PrismaAdvantageCategory.FLAW

      if (mutation.create) {
        await transaction.characterAdvantageSelection.create({
          data: {
            characterId: data.characterId,
            selectionId: mutation.selectionId,
            definitionKey: mutation.definitionKey,
            category,
            rating: mutation.targetRating,
            origin: PrismaAdvantageSelectionOrigin.EVOLUTION,
            parentSelectionId: mutation.parentSelectionId,
          },
        })
      } else {
        const updated = await transaction.characterAdvantageSelection.updateMany({
          where: {
            characterId: data.characterId,
            selectionId: mutation.selectionId,
            definitionKey: mutation.definitionKey,
          },
          data: {
            rating: mutation.targetRating,
            parentSelectionId: mutation.parentSelectionId,
          },
        })
        if (updated.count !== 1) {
          throw new CharacterAdvancementRevisionConflictError(data.characterId)
        }
        await transaction.characterAdvantageDetails.deleteMany({
          where: { characterId: data.characterId, selectionId: mutation.selectionId },
        })
      }

      if (mutation.details !== null) {
        await transaction.characterAdvantageDetails.create({
          data: toAdvantageDetailsCreate(
            data.characterId,
            mutation.selectionId,
            mutation.details,
          ),
        })
      }
      return
    }

    await transaction.characterBloodState.update({
      where: { characterId: data.characterId },
      data: { bloodPotency: { increment: 1 } },
    })
  }

  async purchase(
    data: PurchaseCharacterAdvancementData,
  ): Promise<CharacterExperienceLedger> {
    try {
      return await this.database.$transaction(
        async (transaction) => {
          const locked =
            await transaction.$queryRaw<
              readonly {
                readonly id: string
                readonly ownerId: string
                readonly revision: number
                readonly status: string
                readonly nature: string
              }[]
            >`
              SELECT
                "id",
                "ownerId",
                "revision",
                "status"::text AS "status",
                "nature"::text AS "nature"
              FROM "characters"
              WHERE "id" = ${data.characterId}::uuid
              FOR UPDATE
            `

          const character = locked[0]

          if (
            character === undefined ||
            character.ownerId !==
              data.actorId
          ) {
            throw new CharacterAdvancementRevisionConflictError(
              data.characterId,
            )
          }

          const duplicate =
            await transaction
              .characterExperienceMovement
              .count({
                where: {
                  characterId:
                    data.characterId,
                  deduplicationKey:
                    `spend:operation:${data.operationId}`,
                },
              })

          if (duplicate !== 0) {
            throw new CharacterExperienceDuplicateError(
              data.characterId,
            )
          }

          if (
            character.revision !== data.expectedRevision
          ) {
            throw new CharacterAdvancementRevisionConflictError(
              data.characterId,
            )
          }

          if (
            character.status ===
              'ARCHIVED'
          ) {
            throw new CharacterAdvancementArchivedError()
          }

          const benefit =
            data.dyscrasiaExperienceBenefit

          let dyscrasiaSourceOperationId:
            string | null = null

          let dyscrasiaPrismaKey:
            PrismaCharacterBloodDyscrasiaKey | null =
              null

          if (benefit !== null) {
            if (
              character.nature !==
                'VAMPIRE' ||
              data.mutation.kind !==
                'discipline' ||
              data.mutation
                .disciplineKey !==
                benefit.disciplineKey ||
              !isCharacterBloodDyscrasiaExperienceBenefit(
                benefit,
              )
            ) {
              throw new CharacterAdvancementRevisionConflictError(
                data.characterId,
              )
            }

            const blood =
              await transaction
                .characterBloodState
                .findUnique({
                  where: {
                    characterId:
                      data.characterId,
                  },
                  select: {
                    dyscrasiaKey: true,
                    dyscrasiaSourceOperationId:
                      true,
                  },
                })

            if (
              blood === null ||
              blood.dyscrasiaKey ===
                null ||
              blood
                .dyscrasiaSourceOperationId ===
                null ||
              restrictedDyscrasiaKeyFromPrisma(
                blood.dyscrasiaKey,
              ) !== benefit.dyscrasiaKey
            ) {
              throw new CharacterAdvancementRevisionConflictError(
                data.characterId,
              )
            }

            const existingOperation =
              await transaction
                .characterBloodDyscrasiaConsumptionOperation
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

            if (
              existingOperation !== null
            ) {
              throw new CharacterExperienceDuplicateError(
                data.characterId,
              )
            }

            const existingSource =
              await transaction
                .characterBloodDyscrasiaConsumptionOperation
                .findUnique({
                  where: {
                    characterId_sourceBloodOperationId: {
                      characterId:
                        data.characterId,
                      sourceBloodOperationId:
                        blood
                          .dyscrasiaSourceOperationId,
                    },
                  },
                })

            if (
              existingSource !== null
            ) {
              throw new CharacterAdvancementRevisionConflictError(
                data.characterId,
              )
            }

            dyscrasiaSourceOperationId =
              blood
                .dyscrasiaSourceOperationId
            dyscrasiaPrismaKey =
              blood.dyscrasiaKey
          }

          const ledger =
            await this.transactionLedger(
              transaction,
              data.characterId,
            )

          if (
            ledger.available < data.cost
          ) {
            throw new CharacterExperienceInsufficientError()
          }

          await this.applyAdvancementMutation(
            transaction,
            data,
          )

          if (benefit !== null) {
            if (
              dyscrasiaSourceOperationId ===
                null ||
              dyscrasiaPrismaKey === null
            ) {
              throw new CharacterAdvancementRevisionConflictError(
                data.characterId,
              )
            }

            const cleared =
              await transaction
                .characterBloodState
                .updateMany({
                  where: {
                    characterId:
                      data.characterId,
                    dyscrasiaKey:
                      dyscrasiaPrismaKey,
                    dyscrasiaSourceOperationId,
                  },
                  data: {
                    dyscrasiaKey: null,
                    dyscrasiaAcquisitionMode:
                      null,
                    dyscrasiaSourceOperationId:
                      null,
                  },
                })

            if (cleared.count !== 1) {
              throw new CharacterAdvancementRevisionConflictError(
                data.characterId,
              )
            }

            await transaction
              .characterBloodDyscrasiaConsumptionOperation
              .create({
                data: {
                  characterId:
                    data.characterId,
                  operationId:
                    data.operationId,
                  sourceBloodOperationId:
                    dyscrasiaSourceOperationId,
                  dyscrasiaKey:
                    dyscrasiaPrismaKey,
                },
              })

            const history =
              buildCharacterBloodDyscrasiaConsumptionHistoryEntry({
                dyscrasiaKey:
                  benefit.dyscrasiaKey,
                disciplineKey:
                  benefit.disciplineKey,
              })

            await transaction
              .characterHistoryEntry
              .create({
                data: {
                  id:
                    data.operationId,
                  characterId:
                    data.characterId,
                  title:
                    history.title,
                  description:
                    history.description,
                },
              })
          }

          await transaction.character.update({
            where: {
              id: data.characterId,
            },
            data: {
              revision: { increment: 1 },
            },
          })

          await transaction
            .characterExperienceMovement
            .create({
              data: {
                characterId:
                  data.characterId,
                actorId:
                  data.actorId,
                type:
                  PrismaCharacterExperienceMovementType.SPEND,
                component:
                  PrismaCharacterExperienceComponent.SPENT,
                amount:
                  data.cost,
                reason:
                  benefit === null
                    ? 'advancement_purchase'
                    : 'advancement_purchase_dyscrasia',
                deduplicationKey:
                  `spend:operation:${data.operationId}`,
                acquisitionType:
                  data.acquisitionType,
                acquisitionKey:
                  data.acquisitionKey,
              },
            })

          return this.transactionLedger(
            transaction,
            data.characterId,
          )
        },
      )
    } catch (error: unknown) {
      duplicateError(
        error,
        data.characterId,
      )
    }
  }

}
