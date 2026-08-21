import { Injectable } from '@nestjs/common'

import {
  CharacterNature as PrismaCharacterNature,
  CharacterStatus as PrismaCharacterStatus,
  DiceRollSource as PrismaDiceRollSource,
  DiceRollVisibility as PrismaDiceRollVisibility,
  Prisma,
} from '@prisma/client'

import {
  CharacterRouseCheckOperationConflictError,
  CharacterRouseCheckWriteConflictError,
} from '../application/character-rouse-check.repository'

import type {
  CharacterRouseCheckRepository,
} from '../application/character-rouse-check.repository'

import {
  isSameCharacterRouseCheckOperation,
} from '../domain/character-rouse-check-operation.types'

import type {
  PersistCharacterRouseCheckData,
  PersistedCharacterRouseCheckOperation,
} from '../domain/character-rouse-check-operation.types'

import type {
  CharacterRouseCheckConsequence,
  CharacterRouseCheckReason,
} from '../domain/character-rouse-check.rules'

import {
  DatabaseService,
} from '../../database/database.service'

type RouseRow =
  Prisma.CharacterRouseCheckOperationGetPayload<{}>

function json(
  value: unknown,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value),
  ) as Prisma.InputJsonValue
}

function toDomain(
  row: RouseRow,
): PersistedCharacterRouseCheckOperation {
  return {
    characterId: row.characterId,
    operationId: row.operationId,
    actorId: row.actorId,
    reason:
      row.reason as CharacterRouseCheckReason,
    forced: row.forced,
    bloodPotency: row.bloodPotency,
    disciplinePowerLevel:
      row.disciplinePowerLevel,
    rolls: Object.freeze([
      ...(
        row.rolls as unknown as number[]
      ),
    ]),
    selectedResult:
      row.selectedResult,
    success: row.success,
    hungerBefore: row.hungerBefore,
    hungerAfter: row.hungerAfter,
    consequence:
      row.consequence as
        CharacterRouseCheckConsequence,
    consequenceDifficulty:
      row.consequenceDifficulty,
    rollHistoryId: row.rollHistoryId,
    characterRevision:
      row.characterRevision,
    createdAt: new Date(row.createdAt),
  }
}

function reasonLabel(
  reason: CharacterRouseCheckReason,
): string {
  const labels:
    Record<CharacterRouseCheckReason, string> = {
      awakening: 'Despertar',
      blushOfLife: 'Rubor de la Vida',
      bloodSurge: 'Arrebato de Sangre',
      healing: 'Curación',
      disciplinePower:
        'Poder de Disciplina',
      ritualOrCeremony:
        'Ritual o Ceremonia',
      other: 'Otro',
    }

  return labels[reason]
}

function historyPoolSnapshot(
  data: PersistCharacterRouseCheckData,
) {
  const diceCount = data.rolls.length

  return {
    kind: 'rouseCheck',
    components: [],
    modifiers: [],
    basePool: diceCount,
    modifier: 0,
    finalPool: diceCount,
    normalDice: diceCount,
    hungerDice: 0,
    difficulty: null,
    context: {
      source: 'action',
      description:
        `Control de Enardecimiento · ${reasonLabel(data.reason)}`,
    },
    rouse: {
      reason: data.reason,
      forced: data.forced ?? false,
      bloodPotency: data.bloodPotency,
      disciplinePowerLevel:
        data.disciplinePowerLevel,
    },
  }
}

function historyRollSnapshot(
  data: PersistCharacterRouseCheckData,
) {
  const successes =
    data.success ? 1 : 0

  return {
    kind: 'rouseCheck',
    dice: data.rolls.map(
      (value) => ({
        value,
        type: 'normal',
        isSuccess: value >= 6,
        isCriticalTen: false,
        isBestialFailureDie: false,
      }),
    ),
    difficulty: null,
    regularSuccesses: successes,
    criticalPairs: 0,
    criticalBonusSuccesses: 0,
    totalSuccesses: successes,
    isSuccessful: data.success,
    specialResult: 'none',
    specialEvidence: {
      criticalTenIndices: [],
      hungerCriticalTenIndices: [],
      criticalPairs: [],
      bestialFailureDieIndices: [],
    },
    outcome:
      data.success
        ? 'success'
        : 'failure',
    meetsDifficulty: null,
    rouse: {
      reason: data.reason,
      rolls: [...data.rolls],
      selectedResult:
        data.selectedResult,
      success: data.success,
      hungerBefore:
        data.hungerBefore,
      hungerAfter:
        data.hungerAfter,
      consequence:
        data.consequence,
      consequenceDifficulty:
        data.consequenceDifficulty,
    },
  }
}

@Injectable()
export class PrismaCharacterRouseCheckRepository
  implements CharacterRouseCheckRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async findOperation(
    characterId: string,
    operationId: string,
  ): Promise<
    PersistedCharacterRouseCheckOperation | null
  > {
    const row =
      await this.database
        .characterRouseCheckOperation
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

  async persist(
    data: PersistCharacterRouseCheckData,
  ): Promise<
    PersistedCharacterRouseCheckOperation
  > {
    const execute = async () =>
      this.database.$transaction(
        async (transaction) => {
          const existing =
            await transaction
              .characterRouseCheckOperation
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
              !isSameCharacterRouseCheckOperation(
                persisted,
                data,
              )
            ) {
              throw new CharacterRouseCheckOperationConflictError(
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
                  id: data.characterId,
                },
                select: {
                  revision: true,
                  status: true,
                  nature: true,
                  chronicleId: true,
                  blood: {
                    select: {
                      hunger: true,
                    },
                  },
                },
              })

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
              data.hungerBefore
          ) {
            throw new CharacterRouseCheckWriteConflictError(
              data.characterId,
            )
          }

          const claimed =
            await transaction.character
              .updateMany({
                where: {
                  id: data.characterId,
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

          if (claimed.count !== 1) {
            throw new CharacterRouseCheckWriteConflictError(
              data.characterId,
            )
          }

          await transaction
            .characterBloodState
            .update({
              where: {
                characterId:
                  data.characterId,
              },
              data:
                data.hungerAfter === 5
                  ? {
                      hunger:
                        data.hungerAfter,
                      resonanceSourceKind:
                        null,
                      resonanceKey: null,
                      resonanceTemperament:
                        null,
                      resonanceSpecialAffinityKey:
                        null,
                      dyscrasiaKey: null,
                      dyscrasiaAcquisitionMode:
                        null,
                      dyscrasiaSourceOperationId:
                        null,
                    }
                  : {
                      hunger:
                        data.hungerAfter,
                    },
            })

          const history =
            await transaction.diceRollRecord
              .create({
                data: {
                  actorId: data.actorId,
                  characterId:
                    data.characterId,
                  chronicleId:
                    current.chronicleId,
                  sessionId: null,
                  rerollParentId: null,
                  source:
                    PrismaDiceRollSource.ACTION,
                  visibility:
                    PrismaDiceRollVisibility.CONTEXTUAL,
                  description:
                    `Control de Enardecimiento · ${reasonLabel(data.reason)}`,
                  rulesVersion:
                    'SPEC-059-v1.0',
                  poolSnapshot:
                    json(
                      historyPoolSnapshot(
                        data,
                      ),
                    ),
                  rollSnapshot:
                    json(
                      historyRollSnapshot(
                        data,
                      ),
                    ),
                },
              })

          const row =
            await transaction
              .characterRouseCheckOperation
              .create({
                data: {
                  characterId:
                    data.characterId,
                  operationId:
                    data.operationId,
                  actorId:
                    data.actorId,
                  reason: data.reason,
                  forced:
                    data.forced ?? false,
                  bloodPotency:
                    data.bloodPotency,
                  disciplinePowerLevel:
                    data.disciplinePowerLevel,
                  rolls:
                    json(data.rolls),
                  selectedResult:
                    data.selectedResult,
                  success: data.success,
                  hungerBefore:
                    data.hungerBefore,
                  hungerAfter:
                    data.hungerAfter,
                  consequence:
                    data.consequence,
                  consequenceDifficulty:
                    data.consequenceDifficulty,
                  rollHistoryId:
                    history.id,
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
        await this.findOperation(
          data.characterId,
          data.operationId,
        )

      if (
        existing !== null &&
        isSameCharacterRouseCheckOperation(
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
