import { Module } from '@nestjs/common'

import {
  CHARACTER_DRAFT_REPOSITORY,
} from './application/character-draft.repository'

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
  UpdateCharacterDraftUseCase,
} from './application/update-character-draft.use-case'

import {
  PrismaCharacterDraftRepository,
} from './infrastructure/prisma-character-draft.repository'

import {
  CharacterDraftController,
} from './presentation/character-draft.controller'

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
]

@Module({
  controllers: [CharacterDraftController],
  providers: [
    PrismaCharacterDraftRepository,
    {
      provide: CHARACTER_DRAFT_REPOSITORY,
      useExisting: PrismaCharacterDraftRepository,
    },
    ...useCaseProviders,
  ],
  exports: [
    CreateCharacterDraftUseCase,
    LoadCharacterAttributeSkillRatingsUseCase,
    LoadCharacterHungerUseCase,
    LoadCharacterDraftUseCase,
    UpdateCharacterDraftUseCase,
  ],
})
export class CharactersModule {}
