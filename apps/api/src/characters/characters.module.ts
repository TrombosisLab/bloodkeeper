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
  UpdateCharacterDraftUseCase,
} from './application/update-character-draft.use-case'

import {
  PrismaCharacterDraftRepository,
} from './infrastructure/prisma-character-draft.repository'

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
    provide: UpdateCharacterDraftUseCase,
    inject: [CHARACTER_DRAFT_REPOSITORY],
    useFactory: (
      repository: PrismaCharacterDraftRepository,
    ) => new UpdateCharacterDraftUseCase(repository),
  },
]

@Module({
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
    LoadCharacterDraftUseCase,
    UpdateCharacterDraftUseCase,
  ],
})
export class CharactersModule {}
