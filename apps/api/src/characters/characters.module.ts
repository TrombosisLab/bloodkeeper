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
  TransitionCharacterLifecycleUseCase,
} from './application/transition-character-lifecycle.use-case'

import {
  ValidateCharacterUseCase,
} from './application/validate-character.use-case'

import {
  characterCoreValidationContributor,
} from './domain/character-core-validation.contributor'

import {
  createCharacterAdvantageValidationContributor,
} from './domain/character-advantage-validation.contributor'

import {
  createCharacterDisciplineValidationContributor,
} from './domain/character-discipline-validation.contributor'

import {
  characterDependencyValidationContributor,
} from './domain/character-dependency-validation.contributor'

import {
  CHARACTER_RULES_CATALOG,
  characterRulesCatalog,
} from './domain/character-rules-catalog'

import type {
  CharacterRulesCatalog,
} from './domain/character-rules-catalog'

import {
  CharacterValidator,
} from './domain/character-validator'

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
  CharacterLifecycleController,
} from './presentation/character-lifecycle.controller'

import {
  CharacterSecondaryController,
} from './presentation/character-secondary.controller'

import {
  CharacterValidationController,
} from './presentation/character-validation.controller'

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
  {
    provide: ValidateCharacterUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CharacterValidator,
    ],
    useFactory: (
      repository: PrismaCharacterDraftRepository,
      validator: CharacterValidator,
    ) =>
      new ValidateCharacterUseCase(
        repository,
        validator,
      ),
  },
  {
    provide: TransitionCharacterLifecycleUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CharacterValidator,
    ],
    useFactory: (
      repository: PrismaCharacterDraftRepository,
      validator: CharacterValidator,
    ) =>
      new TransitionCharacterLifecycleUseCase(
        repository,
        validator,
      ),
  },
]

@Module({
  controllers: [
    CharacterDraftController,
    CharacterLifecycleController,
    CharacterSecondaryController,
    CharacterValidationController,
  ],
  providers: [
    PrismaCharacterDraftRepository,
    PrismaCharacterSecondaryRepository,
    {
      provide: CHARACTER_RULES_CATALOG,
      useValue: characterRulesCatalog,
    },
    {
      provide: CharacterValidator,
      inject: [CHARACTER_RULES_CATALOG],
      useFactory: (
        rulesCatalog: CharacterRulesCatalog,
      ) =>
        new CharacterValidator([
          characterCoreValidationContributor,
          createCharacterDisciplineValidationContributor(
            rulesCatalog,
          ),
          createCharacterAdvantageValidationContributor(
            rulesCatalog,
          ),
          characterDependencyValidationContributor,
        ]),
    },
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
    ValidateCharacterUseCase,
    TransitionCharacterLifecycleUseCase,
  ],
})
export class CharactersModule {}
