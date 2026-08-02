import { Injectable } from '@nestjs/common'

import {
  CharacterCreationStep as PrismaCharacterCreationStep,
  CharacterStatus as PrismaCharacterStatus,
  DisciplineOrigin as PrismaDisciplineOrigin,
  Prisma,
  SkillDistributionMethod as PrismaSkillDistributionMethod,
  SkillSpecialtyOrigin as PrismaSkillSpecialtyOrigin,
  ThinBloodAlchemyMethod as PrismaThinBloodAlchemyMethod,
} from '@prisma/client'

import {
  CharacterDraftWriteConflictError,
} from '../application/character-draft.repository'

import type {
  CharacterDraftRepository,
} from '../application/character-draft.repository'

import type {
  CharacterCreationStep,
  CharacterDisciplineKey,
  CharacterDisciplineOrigin,
  CharacterLifecycleStatus,
  CharacterSkillKey,
  CreateCharacterDraftData,
  PersistedCharacterDraft,
  PersistedCharacterIdentity,
  PersistedCharacterSkills,
  SkillDistributionMethod,
  SkillSpecialtyOrigin,
  ThinBloodAlchemyMethod,
  UpdateCharacterDraftData,
} from '../domain/persisted-character.types'

import {
  CHARACTER_DISCIPLINE_KEYS,
  CHARACTER_SKILL_KEYS,
} from '../domain/persisted-character.types'

import { DatabaseService } from '../../database/database.service'

const stepToPrisma: Record<
  CharacterCreationStep,
  PrismaCharacterCreationStep
> = {
  identity: PrismaCharacterCreationStep.IDENTITY,
  attributes: PrismaCharacterCreationStep.ATTRIBUTES,
  skills: PrismaCharacterCreationStep.SKILLS,
  blood: PrismaCharacterCreationStep.BLOOD,
  disciplines: PrismaCharacterCreationStep.DISCIPLINES,
  advantages: PrismaCharacterCreationStep.ADVANTAGES,
  humanity: PrismaCharacterCreationStep.HUMANITY,
  review: PrismaCharacterCreationStep.REVIEW,
}

const stepFromPrisma: Record<
  PrismaCharacterCreationStep,
  CharacterCreationStep
> = {
  IDENTITY: 'identity',
  ATTRIBUTES: 'attributes',
  SKILLS: 'skills',
  BLOOD: 'blood',
  DISCIPLINES: 'disciplines',
  ADVANTAGES: 'advantages',
  HUMANITY: 'humanity',
  REVIEW: 'review',
}

const methodToPrisma: Record<
  SkillDistributionMethod,
  PrismaSkillDistributionMethod
> = {
  generalist: PrismaSkillDistributionMethod.GENERALIST,
  balanced: PrismaSkillDistributionMethod.BALANCED,
  specialist: PrismaSkillDistributionMethod.SPECIALIST,
}

const methodFromPrisma: Record<
  PrismaSkillDistributionMethod,
  SkillDistributionMethod
> = {
  GENERALIST: 'generalist',
  BALANCED: 'balanced',
  SPECIALIST: 'specialist',
}

const statusFromPrisma: Record<
  PrismaCharacterStatus,
  CharacterLifecycleStatus
> = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
}

const specialtyOriginToPrisma: Record<
  SkillSpecialtyOrigin,
  PrismaSkillSpecialtyOrigin
> = {
  creation: PrismaSkillSpecialtyOrigin.CREATION,
  predatorType:
    PrismaSkillSpecialtyOrigin.PREDATOR_TYPE,
}

const specialtyOriginFromPrisma: Record<
  PrismaSkillSpecialtyOrigin,
  SkillSpecialtyOrigin
> = {
  CREATION: 'creation',
  PREDATOR_TYPE: 'predatorType',
}

const disciplineOriginToPrisma: Record<
  CharacterDisciplineOrigin,
  PrismaDisciplineOrigin
> = {
  creation: PrismaDisciplineOrigin.CREATION,
  predatorType:
    PrismaDisciplineOrigin.PREDATOR_TYPE,
  thinBlood: PrismaDisciplineOrigin.THIN_BLOOD,
}

const disciplineOriginFromPrisma: Record<
  PrismaDisciplineOrigin,
  CharacterDisciplineOrigin
> = {
  CREATION: 'creation',
  PREDATOR_TYPE: 'predatorType',
  THIN_BLOOD: 'thinBlood',
}

const alchemyMethodToPrisma: Record<
  ThinBloodAlchemyMethod,
  PrismaThinBloodAlchemyMethod
> = {
  athanorCorporis:
    PrismaThinBloodAlchemyMethod.ATHANOR_CORPORIS,
  calcinatio: PrismaThinBloodAlchemyMethod.CALCINATIO,
  fixatio: PrismaThinBloodAlchemyMethod.FIXATIO,
}

const alchemyMethodFromPrisma: Record<
  PrismaThinBloodAlchemyMethod,
  ThinBloodAlchemyMethod
> = {
  ATHANOR_CORPORIS: 'athanorCorporis',
  CALCINATIO: 'calcinatio',
  FIXATIO: 'fixatio',
}

const characterRelations = {
  identity: true,
  creationState: true,
  attributes: true,
  blood: true,
  skills: {
    include: {
      specialties: {
        orderBy: { id: 'asc' },
      },
    },
    orderBy: { skillKey: 'asc' },
  },
  disciplines: {
    include: {
      powers: {
        orderBy: { powerKey: 'asc' },
      },
    },
    orderBy: { disciplineKey: 'asc' },
  },
  bloodSorceryRituals: {
    orderBy: { ritualKey: 'asc' },
  },
  oblivionCeremonies: {
    orderBy: { ceremonyKey: 'asc' },
  },
  thinBloodAlchemy: true,
  thinBloodFormulas: {
    orderBy: { formulaKey: 'asc' },
  },
  thinBloodTraits: {
    orderBy: { definitionKey: 'asc' },
  },
  humanity: true,
  convictions: {
    orderBy: { convictionId: 'asc' },
  },
  touchstones: {
    orderBy: { touchstoneId: 'asc' },
  },
} satisfies Prisma.CharacterInclude

type CharacterWithRelations =
  Prisma.CharacterGetPayload<{
    include: typeof characterRelations
  }>

function toIdentityCreate(
  identity: Partial<PersistedCharacterIdentity>,
): Prisma.CharacterIdentityUncheckedCreateWithoutCharacterInput {
  return {
    name: identity.name ?? '',
    concept: identity.concept ?? null,
    predatorTypeKey:
      identity.predatorTypeKey ?? null,
    ambition: identity.ambition ?? null,
    clanKey: identity.clanKey ?? null,
    sire: identity.sire ?? null,
    desire: identity.desire ?? null,
    generation: identity.generation ?? null,
  }
}

const characterSkillKeySet = new Set<string>(
  CHARACTER_SKILL_KEYS,
)

function isCharacterSkillKey(
  value: string,
): value is CharacterSkillKey {
  return characterSkillKeySet.has(value)
}

const characterDisciplineKeySet = new Set<string>(
  CHARACTER_DISCIPLINE_KEYS,
)

function isCharacterDisciplineKey(
  value: string,
): value is CharacterDisciplineKey {
  return characterDisciplineKeySet.has(value)
}

function toPersistedDraft(
  row: CharacterWithRelations,
): PersistedCharacterDraft {
  if (
    row.identity === null ||
    row.creationState === null ||
    row.attributes === null ||
    row.blood === null ||
    row.thinBloodAlchemy === null ||
    row.humanity === null
  ) {
    throw new Error(
      `Character ${row.id} has incomplete persistence relations`,
    )
  }

  const skills = Object.fromEntries(
    CHARACTER_SKILL_KEYS.map(
      (skillKey) => [skillKey, 0],
    ),
  ) as PersistedCharacterSkills

  for (const skill of row.skills) {
    if (!isCharacterSkillKey(skill.skillKey)) {
      throw new Error(
        `Character ${row.id} has unknown skill ${skill.skillKey}`,
      )
    }

    skills[skill.skillKey] = skill.rating
  }

  return {
    characterId: row.id,
    ownerId: row.ownerId,
    chronicleId: row.chronicleId,
    status: statusFromPrisma[row.status],
    revision: row.revision,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    identity: {
      name: row.identity.name,
      concept: row.identity.concept,
      predatorTypeKey:
        row.identity.predatorTypeKey,
      ambition: row.identity.ambition,
      clanKey: row.identity.clanKey,
      sire: row.identity.sire,
      desire: row.identity.desire,
      generation: row.identity.generation,
    },
    creation: {
      schemaVersion:
        row.creationState.schemaVersion,
      currentStep:
        stepFromPrisma[
          row.creationState.currentStep
        ],
      skillDistributionMethod:
        methodFromPrisma[
          row.creationState
            .skillDistributionMethod
        ],
      updatedAt: row.creationState.updatedAt,
    },
    attributes: {
      strength: row.attributes.strength,
      dexterity: row.attributes.dexterity,
      stamina: row.attributes.stamina,
      charisma: row.attributes.charisma,
      manipulation:
        row.attributes.manipulation,
      composure: row.attributes.composure,
      intelligence:
        row.attributes.intelligence,
      wits: row.attributes.wits,
      resolve: row.attributes.resolve,
    },
    blood: {
      bloodPotency: row.blood.bloodPotency,
      hunger: row.blood.hunger,
    },
    skills,
    skillSpecialties: row.skills.flatMap(
      (skill) => {
        const skillKey = skill.skillKey

        if (!isCharacterSkillKey(skillKey)) {
          return []
        }

        return skill.specialties.map(
          (specialty) => ({
            id: specialty.id,
            skillKey,
            name: specialty.name,
            origin:
              specialty.origin === null
                ? null
                : specialtyOriginFromPrisma[
                    specialty.origin
                  ],
          }),
        )
      },
    ),
    disciplines: row.disciplines.map(
      (discipline) => {
        if (
          !isCharacterDisciplineKey(
            discipline.disciplineKey,
          )
        ) {
          throw new Error(
            `Character ${row.id} has unknown discipline ${discipline.disciplineKey}`,
          )
        }

        return {
          disciplineKey: discipline.disciplineKey,
          rating: discipline.rating,
          powerKeys: discipline.powers.map(
            (power) => power.powerKey,
          ),
          origin:
            discipline.origin === null
              ? null
              : disciplineOriginFromPrisma[
                  discipline.origin
                ],
        }
      },
    ),
    bloodSorceryRituals: {
      ritualKeys: row.bloodSorceryRituals.map(
        (ritual) => ritual.ritualKey,
      ),
    },
    oblivionCeremonies: {
      ceremonyKeys: row.oblivionCeremonies.map(
        (ceremony) => ceremony.ceremonyKey,
      ),
    },
    thinBloodAlchemy: {
      rating: row.thinBloodAlchemy.rating,
      method:
        row.thinBloodAlchemy.method === null
          ? null
          : alchemyMethodFromPrisma[
              row.thinBloodAlchemy.method
            ],
      formulaKeys: row.thinBloodFormulas.map(
        (formula) => formula.formulaKey,
      ),
    },
    thinBloodTraits: row.thinBloodTraits.map(
      (trait) => {
        const disciplineKey =
          trait.disciplineAffinityDisciplineKey

        if (
          disciplineKey !== null &&
          !isCharacterDisciplineKey(disciplineKey)
        ) {
          throw new Error(
            `Character ${row.id} has unknown affinity discipline ${disciplineKey}`,
          )
        }

        return {
          definitionKey: trait.definitionKey,
          clanCurseDetails:
            trait.clanCurseClanKey === null
              ? null
              : {
                  clanKey: trait.clanCurseClanKey,
                },
          disciplineAffinityDetails:
            disciplineKey === null ||
            trait.disciplineAffinityPowerKey === null
              ? null
              : {
                  disciplineKey,
                  powerKey:
                    trait.disciplineAffinityPowerKey,
                },
        }
      },
    ),
    humanity: {
      value: row.humanity.value,
      convictions: row.convictions.map(
        (conviction) => ({
          convictionId: conviction.convictionId,
          text: conviction.text,
          touchstoneId: conviction.touchstoneId,
        }),
      ),
      touchstones: row.touchstones.map(
        (touchstone) => ({
          touchstoneId: touchstone.touchstoneId,
          name: touchstone.name,
          relationship: touchstone.relationship,
        }),
      ),
    },
  }
}

@Injectable()
export class PrismaCharacterDraftRepository
  implements CharacterDraftRepository {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async create(
    data: CreateCharacterDraftData,
  ): Promise<PersistedCharacterDraft> {
    return this.database.$transaction(
      async (transaction) => {
        const character =
          await transaction.character.create({
            data: {
              ownerId: data.ownerId,
              chronicleId: data.chronicleId,
              status: PrismaCharacterStatus.DRAFT,
              identity: {
                create: toIdentityCreate(
                  data.identity,
                ),
              },
              creationState: {
                create: {
                  schemaVersion: 1,
                  currentStep:
                    stepToPrisma[
                      data.creation.currentStep
                    ],
                  skillDistributionMethod:
                    methodToPrisma[
                      data.creation
                        .skillDistributionMethod
                    ],
                },
              },
              attributes: {
                create: data.attributes,
              },
              blood: {
                create: data.blood,
              },
              skills: {
                create: CHARACTER_SKILL_KEYS.map(
                  (skillKey) => ({
                    skillKey,
                    rating: data.skills[skillKey],
                    specialties: {
                      create: data.skillSpecialties
                        .filter(
                          (specialty) =>
                            specialty.skillKey ===
                            skillKey,
                        )
                        .map((specialty) => ({
                          id: specialty.id,
                          name: specialty.name,
                          origin:
                            specialty.origin === null
                              ? null
                              : specialtyOriginToPrisma[
                                  specialty.origin
                                ],
                        })),
                    },
                  }),
                ),
              },
              disciplines: {
                create: data.disciplines.map(
                  (discipline) => ({
                    disciplineKey:
                      discipline.disciplineKey,
                    rating: discipline.rating,
                    origin:
                      discipline.origin === null
                        ? null
                        : disciplineOriginToPrisma[
                            discipline.origin
                          ],
                    powers: {
                      create: discipline.powerKeys.map(
                        (powerKey) => ({ powerKey }),
                      ),
                    },
                  })),
              },
              bloodSorceryRituals: {
                create:
                  data.bloodSorceryRituals.ritualKeys
                    .map((ritualKey) => ({
                      ritualKey,
                    })),
              },
              oblivionCeremonies: {
                create:
                  data.oblivionCeremonies.ceremonyKeys
                    .map((ceremonyKey) => ({
                      ceremonyKey,
                    })),
              },
              thinBloodAlchemy: {
                create: {
                  rating: data.thinBloodAlchemy.rating,
                  method:
                    data.thinBloodAlchemy.method === null
                      ? null
                      : alchemyMethodToPrisma[
                          data.thinBloodAlchemy.method
                        ],
                },
              },
              thinBloodFormulas: {
                create:
                  data.thinBloodAlchemy.formulaKeys
                    .map((formulaKey) => ({
                      formulaKey,
                    })),
              },
              thinBloodTraits: {
                create: data.thinBloodTraits.map(
                  (trait) => ({
                    definitionKey: trait.definitionKey,
                    clanCurseClanKey:
                      trait.clanCurseDetails?.clanKey ??
                      null,
                    disciplineAffinityDisciplineKey:
                      trait.disciplineAffinityDetails
                        ?.disciplineKey ?? null,
                    disciplineAffinityPowerKey:
                      trait.disciplineAffinityDetails
                        ?.powerKey ?? null,
                  })),
              },
              humanity: {
                create: {
                  value: data.humanity.value,
                },
              },
              touchstones: {
                create: data.humanity.touchstones,
              },
            },
          })

        if (data.humanity.convictions.length > 0) {
          await transaction.characterConviction
            .createMany({
              data: data.humanity.convictions.map(
                (conviction) => ({
                  characterId: character.id,
                  ...conviction,
                }),
              ),
            })
        }

        const row =
          await transaction.character
            .findUniqueOrThrow({
              where: { id: character.id },
              include: characterRelations,
            })

        return toPersistedDraft(row)
      },
    )
  }

  async findById(
    characterId: string,
  ): Promise<PersistedCharacterDraft | null> {
    const row =
      await this.database.character.findUnique({
        where: { id: characterId },
        include: characterRelations,
      })

    return row === null
      ? null
      : toPersistedDraft(row)
  }

  async update(
    data: UpdateCharacterDraftData,
  ): Promise<PersistedCharacterDraft> {
    return this.database.$transaction(
      async (transaction) => {
        const characterData:
          Prisma.CharacterUpdateManyMutationInput = {
            revision: { increment: 1 },
          }

        if ('chronicleId' in data) {
          characterData.chronicleId =
            data.chronicleId
        }

        const claimed =
          await transaction.character.updateMany({
            where: {
              id: data.characterId,
              revision: data.expectedRevision,
              status: PrismaCharacterStatus.DRAFT,
            },
            data: characterData,
          })

        if (claimed.count !== 1) {
          throw new CharacterDraftWriteConflictError(
            data.characterId,
          )
        }

        if (data.identity !== undefined) {
          await transaction.characterIdentity.upsert({
            where: {
              characterId: data.characterId,
            },
            create: {
              characterId: data.characterId,
              ...toIdentityCreate(data.identity),
            },
            update: data.identity,
          })
        }

        if (data.creation !== undefined) {
          const creationUpdate:
            Prisma.CharacterCreationStateUpdateInput = {}

          if (
            data.creation.currentStep !== undefined
          ) {
            creationUpdate.currentStep =
              stepToPrisma[
                data.creation.currentStep
              ]
          }

          if (
            data.creation
              .skillDistributionMethod !== undefined
          ) {
            creationUpdate.skillDistributionMethod =
              methodToPrisma[
                data.creation
                  .skillDistributionMethod
              ]
          }

          await transaction
            .characterCreationState.update({
              where: {
                characterId: data.characterId,
              },
              data: creationUpdate,
            })
        }

        if (data.attributes !== undefined) {
          await transaction.characterAttributes.update({
            where: {
              characterId: data.characterId,
            },
            data: data.attributes,
          })
        }

        if (data.blood !== undefined) {
          await transaction.characterBloodState.update({
            where: {
              characterId: data.characterId,
            },
            data: data.blood,
          })
        }

        if (data.skills !== undefined) {
          await Promise.all(
            Object.entries(data.skills).map(
              ([skillKey, rating]) =>
                transaction.characterSkill.upsert({
                  where: {
                    characterId_skillKey: {
                      characterId: data.characterId,
                      skillKey,
                    },
                  },
                  create: {
                    characterId: data.characterId,
                    skillKey,
                    rating,
                  },
                  update: { rating },
                }),
            ),
          )
        }

        if (
          data.skillSpecialties !== undefined
        ) {
          await transaction
            .characterSkillSpecialty.deleteMany({
              where: {
                characterId: data.characterId,
              },
            })

          if (data.skillSpecialties.length > 0) {
            await transaction
              .characterSkillSpecialty.createMany({
                data: data.skillSpecialties.map(
                  (specialty) => ({
                    id: specialty.id,
                    characterId: data.characterId,
                    skillKey: specialty.skillKey,
                    name: specialty.name,
                    origin:
                      specialty.origin === null
                        ? null
                        : specialtyOriginToPrisma[
                            specialty.origin
                          ],
                  }),
                ),
              })
          }
        }

        if (data.disciplines !== undefined) {
          await transaction.characterDiscipline
            .deleteMany({
              where: {
                characterId: data.characterId,
              },
            })

          await Promise.all(
            data.disciplines.map(
              (discipline) =>
                transaction.characterDiscipline
                  .create({
                    data: {
                      characterId: data.characterId,
                      disciplineKey:
                        discipline.disciplineKey,
                      rating: discipline.rating,
                      origin:
                        discipline.origin === null
                          ? null
                          : disciplineOriginToPrisma[
                              discipline.origin
                            ],
                      powers: {
                        create:
                          discipline.powerKeys.map(
                            (powerKey) => ({
                              powerKey,
                            }),
                          ),
                      },
                    },
                  }),
            ),
          )
        }

        if (
          data.bloodSorceryRituals !== undefined
        ) {
          await transaction
            .characterBloodSorceryRitual
            .deleteMany({
              where: {
                characterId: data.characterId,
              },
            })

          if (
            data.bloodSorceryRituals.ritualKeys
              .length > 0
          ) {
            await transaction
              .characterBloodSorceryRitual
              .createMany({
                data:
                  data.bloodSorceryRituals
                    .ritualKeys.map(
                      (ritualKey) => ({
                        characterId:
                          data.characterId,
                        ritualKey,
                      }),
                    ),
              })
          }
        }

        if (
          data.oblivionCeremonies !== undefined
        ) {
          await transaction
            .characterOblivionCeremony
            .deleteMany({
              where: {
                characterId: data.characterId,
              },
            })

          if (
            data.oblivionCeremonies.ceremonyKeys
              .length > 0
          ) {
            await transaction
              .characterOblivionCeremony
              .createMany({
                data:
                  data.oblivionCeremonies
                    .ceremonyKeys.map(
                      (ceremonyKey) => ({
                        characterId:
                          data.characterId,
                        ceremonyKey,
                      }),
                    ),
              })
          }
        }

        if (data.thinBloodAlchemy !== undefined) {
          await transaction
            .characterThinBloodAlchemyState
            .update({
              where: {
                characterId: data.characterId,
              },
              data: {
                rating: data.thinBloodAlchemy.rating,
                method:
                  data.thinBloodAlchemy.method === null
                    ? null
                    : alchemyMethodToPrisma[
                        data.thinBloodAlchemy.method
                      ],
              },
            })

          await transaction
            .characterThinBloodAlchemyFormula
            .deleteMany({
              where: {
                characterId: data.characterId,
              },
            })

          if (
            data.thinBloodAlchemy.formulaKeys.length >
            0
          ) {
            await transaction
              .characterThinBloodAlchemyFormula
              .createMany({
                data: data.thinBloodAlchemy.formulaKeys
                  .map((formulaKey) => ({
                    characterId: data.characterId,
                    formulaKey,
                  })),
              })
          }
        }

        if (data.thinBloodTraits !== undefined) {
          await transaction.characterThinBloodTrait
            .deleteMany({
              where: {
                characterId: data.characterId,
              },
            })

          if (data.thinBloodTraits.length > 0) {
            await transaction.characterThinBloodTrait
              .createMany({
                data: data.thinBloodTraits.map(
                  (trait) => ({
                    characterId: data.characterId,
                    definitionKey: trait.definitionKey,
                    clanCurseClanKey:
                      trait.clanCurseDetails?.clanKey ??
                      null,
                    disciplineAffinityDisciplineKey:
                      trait.disciplineAffinityDetails
                        ?.disciplineKey ?? null,
                    disciplineAffinityPowerKey:
                      trait.disciplineAffinityDetails
                        ?.powerKey ?? null,
                  }),
                ),
              })
          }
        }

        if (data.humanityValue !== undefined) {
          await transaction.characterHumanityState
            .update({
              where: {
                characterId: data.characterId,
              },
              data: { value: data.humanityValue },
            })
        }

        if (data.humanityNarrative !== undefined) {
          await transaction.characterConviction
            .deleteMany({
              where: {
                characterId: data.characterId,
              },
            })

          await transaction.characterTouchstone
            .deleteMany({
              where: {
                characterId: data.characterId,
              },
            })

          if (
            data.humanityNarrative.touchstones
              .length > 0
          ) {
            await transaction.characterTouchstone
              .createMany({
                data: data.humanityNarrative
                  .touchstones.map(
                    (touchstone) => ({
                      characterId: data.characterId,
                      ...touchstone,
                    }),
                  ),
              })
          }

          if (
            data.humanityNarrative.convictions
              .length > 0
          ) {
            await transaction.characterConviction
              .createMany({
                data: data.humanityNarrative
                  .convictions.map(
                    (conviction) => ({
                      characterId: data.characterId,
                      ...conviction,
                    }),
                  ),
              })
          }
        }

        const row =
          await transaction.character.findUniqueOrThrow({
            where: { id: data.characterId },
            include: characterRelations,
          })

        return toPersistedDraft(row)
      },
    )
  }
}
