import { Module } from '@nestjs/common'

import {
  CHARACTER_DRAFT_REPOSITORY,
} from './application/character-draft.repository'

import {
  CHARACTER_SECONDARY_REPOSITORY,
} from './application/character-secondary.repository'

import type {
  CharacterSecondaryRepository,
} from './application/character-secondary.repository'

import {
  CreateCharacterDraftUseCase,
} from './application/create-character-draft.use-case'

import {
  LoadCharacterDraftUseCase,
} from './application/load-character-draft.use-case'

import {
  LoadCharacterAttributeSkillRatingsUseCase,
} from './application/load-character-attribute-skill-ratings.use-case'

import {
  LoadCharacterHungerUseCase,
} from './application/load-character-hunger.use-case'

import {
  LoadCharacterSecondaryUseCase,
} from './application/load-character-secondary.use-case'

import {
  UpdateCharacterDraftUseCase,
} from './application/update-character-draft.use-case'

import {
  UpdateCharacterSecondaryUseCase,
} from './application/update-character-secondary.use-case'

import {
  PrismaCharacterDraftRepository,
} from './infrastructure/prisma-character-draft.repository'

import {
  PrismaCharacterSecondaryRepository,
} from './infrastructure/prisma-character-secondary.repository'

import {
  CharacterDraftController,
} from './presentation/character-draft.controller'

import {
  CharacterSecondaryController,
} from './presentation/character-secondary.controller'

const useCaseProviders = [
  {
    provide: CreateCharacterDraftUseCase,
    inject: [CHARACTER_DRAFT_REPOSITORY],
    useFactory: (
      repository: PrismaCharacterDraftRepository,
    ) => new CreateCharacterDraftUseCase(repository),
  },
  {
    provide: LoadCharacterDraftUseCase,
    inject: [CHARACTER_DRAFT_REPOSITORY],
    useFactory: (
      repository: PrismaCharacterDraftRepository,
    ) => new LoadCharacterDraftUseCase(repository),
  },
  {
    provide:
      LoadCharacterAttributeSkillRatingsUseCase,
    inject: [CHARACTER_DRAFT_REPOSITORY],
    useFactory: (
      repository: PrismaCharacterDraftRepository,
    ) =>
      new LoadCharacterAttributeSkillRatingsUseCase(
        repository,
      ),
  },
  {
    provide: LoadCharacterHungerUseCase,
    inject: [CHARACTER_DRAFT_REPOSITORY],
    useFactory: (
      repository: PrismaCharacterDraftRepository,
    ) =>
      new LoadCharacterHungerUseCase(
        repository,
      ),
  },
  {
    provide: UpdateCharacterDraftUseCase,
    inject: [CHARACTER_DRAFT_REPOSITORY],
    useFactory: (
      repository: PrismaCharacterDraftRepository,
    ) => new UpdateCharacterDraftUseCase(repository),
  },
  {
    provide: LoadCharacterSecondaryUseCase,
    inject: [CHARACTER_SECONDARY_REPOSITORY],
    useFactory: (
      repository: CharacterSecondaryRepository,
    ) =>
      new LoadCharacterSecondaryUseCase(
        repository,
      ),
  },
  {
    provide: UpdateCharacterSecondaryUseCase,
    inject: [CHARACTER_SECONDARY_REPOSITORY],
    useFactory: (
      repository: CharacterSecondaryRepository,
    ) =>
      new UpdateCharacterSecondaryUseCase(
        repository,
      ),
  },
]

@Module({
  controllers: [
    CharacterDraftController,
    CharacterSecondaryController,
  ],
  providers: [
    PrismaCharacterDraftRepository,
    PrismaCharacterSecondaryRepository,
    {
      provide: CHARACTER_DRAFT_REPOSITORY,
      useExisting: PrismaCharacterDraftRepository,
    },
    {
      provide: CHARACTER_SECONDARY_REPOSITORY,
      useExisting:
        PrismaCharacterSecondaryRepository,
    },
    ...useCaseProviders,
  ],
  exports: [
    CHARACTER_SECONDARY_REPOSITORY,
    CreateCharacterDraftUseCase,
    LoadCharacterAttributeSkillRatingsUseCase,
    LoadCharacterHungerUseCase,
    LoadCharacterDraftUseCase,
    LoadCharacterSecondaryUseCase,
    UpdateCharacterDraftUseCase,
    UpdateCharacterSecondaryUseCase,
  ],
})
export class CharactersModule {}
