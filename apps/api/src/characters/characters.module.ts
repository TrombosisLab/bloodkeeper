import { Module } from '@nestjs/common'

import {
  ChroniclesModule,
} from '../chronicles/chronicles.module'

import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
} from '../chronicles/application/chronicle-participant.repository'

import type {
  ChronicleParticipantRepository,
} from '../chronicles/application/chronicle-participant.repository'

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
  EmbraceCharacterUseCase,
} from './application/embrace-character.use-case'

import {
  ApplyCharacterBloodResonanceUseCase,
} from './application/apply-character-blood-resonance.use-case'

import {
  ExecuteCharacterRouseCheckUseCase,
} from './application/execute-character-rouse-check.use-case'

import {
  UseCharacterBlushOfLifeUseCase,
} from './application/use-character-blush-of-life.use-case'

import {
  CHARACTER_BLUSH_OF_LIFE_REPOSITORY,
} from './application/character-blush-of-life.repository'

import type {
  CharacterBlushOfLifeRepository,
} from './application/character-blush-of-life.repository'

import {
  CHARACTER_ROUSE_CHECK_REPOSITORY,
} from './application/character-rouse-check.repository'

import type {
  CharacterRouseCheckRepository,
} from './application/character-rouse-check.repository'

import {
  ResolveInitialVampireStateUseCase,
} from './application/resolve-initial-vampire-state.use-case'

import {
  LoadCharacterDraftUseCase,
} from './application/load-character-draft.use-case'

import {
  ListCharacterDraftsUseCase,
} from './application/list-character-drafts.use-case'

import {
  ListChronicleCharactersUseCase,
} from './application/list-chronicle-characters.use-case'

import {
  LoadCharacterAttributeSkillRatingsUseCase,
} from './application/load-character-attribute-skill-ratings.use-case'

import {
  LoadCharacterHungerUseCase,
} from './application/load-character-hunger.use-case'

import {
  LoadCharacterProfilePhaseUseCase,
} from './application/load-character-profile-phase.use-case'

import {
  LoadCharacterSecondaryUseCase,
} from './application/load-character-secondary.use-case'

import {
  UpdateCharacterDraftUseCase,
} from './application/update-character-draft.use-case'

import {
  UpdateCharacterChronicleAssociationUseCase,
} from './application/update-character-chronicle-association.use-case'

import {
  UpdateCharacterStateUseCase,
} from './application/update-character-state.use-case'

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
  createCharacterDependencyValidationContributor,
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
  PrismaCharacterRouseCheckRepository,
} from './infrastructure/prisma-character-rouse-check.repository'

import {
  PrismaCharacterBlushOfLifeRepository,
} from './infrastructure/prisma-character-blush-of-life.repository'

import {
  PrismaCharacterSecondaryRepository,
} from './infrastructure/prisma-character-secondary.repository'

import {
  CharacterDraftController,
} from './presentation/character-draft.controller'

import {
  CharacterEmbraceController,
} from './presentation/character-embrace.controller'

import {
  CharacterBloodResonanceController,
} from './presentation/character-blood-resonance.controller'

import {
  CharacterRouseCheckController,
} from './presentation/character-rouse-check.controller'

import {
  CharacterBlushOfLifeController,
} from './presentation/character-blush-of-life.controller'

import {
  CharacterInitialVampireController,
} from './presentation/character-initial-vampire.controller'

import {
  CharacterProfilePhaseController,
} from './presentation/character-profile-phase.controller'

import {
  ChronicleCharacterController,
} from './presentation/chronicle-character.controller'

import {
  CharacterLifecycleController,
} from './presentation/character-lifecycle.controller'

import {
  CharacterStateController,
} from './presentation/character-state.controller'

import {
  CharacterSecondaryController,
} from './presentation/character-secondary.controller'

import {
  CharacterValidationController,
} from './presentation/character-validation.controller'

import {
  CHARACTER_EXPERIENCE_REPOSITORY,
} from './application/character-experience.repository'

import type {
  CharacterExperienceRepository,
} from './application/character-experience.repository'

import {
  CorrectCharacterExperienceUseCase,
  GrantCharacterExperienceUseCase,
  LoadCharacterExperienceUseCase,
} from './application/character-experience.use-cases'

import {
  PrismaCharacterExperienceRepository,
} from './infrastructure/prisma-character-experience.repository'

import {
  CharacterExperienceController,
} from './presentation/character-experience.controller'

import {
  PreviewCharacterAdvancementUseCase,
} from './application/preview-character-advancement.use-case'
import {
  PurchaseCharacterAdvancementUseCase,
} from './application/purchase-character-advancement.use-case'

import {
  CharacterAdvancementController,
} from './presentation/character-advancement.controller'

import {
  CHARACTER_SHEET_PDF_RENDERER,
} from './application/character-sheet-pdf.types'

import type {
  CharacterSheetPdfRenderer,
} from './application/character-sheet-pdf.types'

import {
  ExportCharacterSheetPdfUseCase,
} from './application/export-character-sheet-pdf.use-case'

import {
  PdfLibCharacterSheetPdfRenderer,
} from './infrastructure/character-sheet-pdf.renderer'

import {
  CharacterSheetPdfController,
} from './presentation/character-sheet-pdf.controller'

const characterSheetPdfProviders = [
  {
    provide: ExportCharacterSheetPdfUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CHARACTER_SECONDARY_REPOSITORY,
      CHARACTER_EXPERIENCE_REPOSITORY,
      CHARACTER_SHEET_PDF_RENDERER,
    ],
    useFactory: (
      characters: PrismaCharacterDraftRepository,
      secondary: CharacterSecondaryRepository,
      experience: CharacterExperienceRepository,
      renderer: CharacterSheetPdfRenderer,
    ) => new ExportCharacterSheetPdfUseCase(
      characters,
      secondary,
      experience,
      renderer,
    ),
  },
]

const advancementUseCaseProviders = [
  {
    provide: PreviewCharacterAdvancementUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CHARACTER_EXPERIENCE_REPOSITORY,
      CHARACTER_RULES_CATALOG,
      CharacterValidator,
    ],
    useFactory: (
      drafts: PrismaCharacterDraftRepository,
      experience: CharacterExperienceRepository,
      catalog: CharacterRulesCatalog,
      validator: CharacterValidator,
    ) => new PreviewCharacterAdvancementUseCase(
      drafts,
      experience,
      catalog,
      validator,
    ),
  },
  {
    provide: PurchaseCharacterAdvancementUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CHARACTER_EXPERIENCE_REPOSITORY,
      CHARACTER_RULES_CATALOG,
      CharacterValidator,
    ],
    useFactory: (
      drafts: PrismaCharacterDraftRepository,
      experience: CharacterExperienceRepository,
      catalog: CharacterRulesCatalog,
      validator: CharacterValidator,
    ) => new PurchaseCharacterAdvancementUseCase(
      drafts,
      experience,
      catalog,
      validator,
    ),
  },
]

const experienceUseCaseProviders = [
  {
    provide: LoadCharacterExperienceUseCase,
    inject: [
      CHARACTER_EXPERIENCE_REPOSITORY,
      CHRONICLE_PARTICIPANT_REPOSITORY,
    ],
    useFactory: (
      experience: CharacterExperienceRepository,
      participants: ChronicleParticipantRepository,
    ) =>
      new LoadCharacterExperienceUseCase(
        experience,
        participants,
      ),
  },
  {
    provide: GrantCharacterExperienceUseCase,
    inject: [
      CHARACTER_EXPERIENCE_REPOSITORY,
      CHRONICLE_PARTICIPANT_REPOSITORY,
    ],
    useFactory: (
      experience: CharacterExperienceRepository,
      participants: ChronicleParticipantRepository,
    ) =>
      new GrantCharacterExperienceUseCase(
        experience,
        participants,
      ),
  },
  {
    provide: CorrectCharacterExperienceUseCase,
    inject: [
      CHARACTER_EXPERIENCE_REPOSITORY,
      CHRONICLE_PARTICIPANT_REPOSITORY,
    ],
    useFactory: (
      experience: CharacterExperienceRepository,
      participants: ChronicleParticipantRepository,
    ) =>
      new CorrectCharacterExperienceUseCase(
        experience,
        participants,
      ),
  },
]

const useCaseProviders = [
  {
    provide:
      UseCharacterBlushOfLifeUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CHARACTER_BLUSH_OF_LIFE_REPOSITORY,
      CHARACTER_ROUSE_CHECK_REPOSITORY,
      CHRONICLE_PARTICIPANT_REPOSITORY,
      ExecuteCharacterRouseCheckUseCase,
    ],
    useFactory: (
      characters:
        PrismaCharacterDraftRepository,
      blush:
        CharacterBlushOfLifeRepository,
      rouseChecks:
        CharacterRouseCheckRepository,
      participants:
        ChronicleParticipantRepository,
      executeRouse:
        ExecuteCharacterRouseCheckUseCase,
    ) =>
      new UseCharacterBlushOfLifeUseCase(
        characters,
        blush,
        rouseChecks,
        participants,
        executeRouse,
      ),
  },
  {
    provide:
      ExecuteCharacterRouseCheckUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CHARACTER_ROUSE_CHECK_REPOSITORY,
      CHRONICLE_PARTICIPANT_REPOSITORY,
    ],
    useFactory: (
      characters:
        PrismaCharacterDraftRepository,
      rouseChecks:
        CharacterRouseCheckRepository,
      participants:
        ChronicleParticipantRepository,
    ) =>
      new ExecuteCharacterRouseCheckUseCase(
        characters,
        rouseChecks,
        participants,
      ),
  },
  {
    provide:
      ApplyCharacterBloodResonanceUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CHRONICLE_PARTICIPANT_REPOSITORY,
    ],
    useFactory: (
      repository:
        PrismaCharacterDraftRepository,
      participants:
        ChronicleParticipantRepository,
    ) =>
      new ApplyCharacterBloodResonanceUseCase(
        repository,
        participants,
      ),
  },
  {
    provide:
      LoadCharacterProfilePhaseUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CharacterValidator,
    ],
    useFactory: (
      repository:
        PrismaCharacterDraftRepository,
      validator:
        CharacterValidator,
    ) =>
      new LoadCharacterProfilePhaseUseCase(
        repository,
        validator,
      ),
  },
  {
    provide:
      ResolveInitialVampireStateUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CHRONICLE_PARTICIPANT_REPOSITORY,
      CHARACTER_RULES_CATALOG,
      CharacterValidator,
    ],
    useFactory: (
      repository:
        PrismaCharacterDraftRepository,
      participants:
        ChronicleParticipantRepository,
      rulesCatalog:
        CharacterRulesCatalog,
      validator:
        CharacterValidator,
    ) =>
      new ResolveInitialVampireStateUseCase(
        repository,
        participants,
        rulesCatalog,
        validator,
      ),
  },
  {
    provide: EmbraceCharacterUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CHRONICLE_PARTICIPANT_REPOSITORY,
      CharacterValidator,
    ],
    useFactory: (
      repository:
        PrismaCharacterDraftRepository,
      participants:
        ChronicleParticipantRepository,
      validator:
        CharacterValidator,
    ) =>
      new EmbraceCharacterUseCase(
        repository,
        participants,
        validator,
      ),
  },
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
    provide: ListChronicleCharactersUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CHRONICLE_PARTICIPANT_REPOSITORY,
    ],
    useFactory: (
      repository:
        PrismaCharacterDraftRepository,
      participants:
        ChronicleParticipantRepository,
    ) =>
      new ListChronicleCharactersUseCase(
        repository,
        participants,
      ),
  },
  {
    provide: ListCharacterDraftsUseCase,
    inject: [CHARACTER_DRAFT_REPOSITORY],
    useFactory: (
      repository: PrismaCharacterDraftRepository,
    ) => new ListCharacterDraftsUseCase(repository),
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
    provide:
      UpdateCharacterChronicleAssociationUseCase,
    inject: [
      CHARACTER_DRAFT_REPOSITORY,
      CHRONICLE_PARTICIPANT_REPOSITORY,
    ],
    useFactory: (
      repository: PrismaCharacterDraftRepository,
      participantRepository:
        ChronicleParticipantRepository,
    ) =>
      new UpdateCharacterChronicleAssociationUseCase(
        repository,
        participantRepository,
      ),
  },
  {
    provide: UpdateCharacterStateUseCase,
    inject: [CHARACTER_DRAFT_REPOSITORY],
    useFactory: (
      repository: PrismaCharacterDraftRepository,
    ) => new UpdateCharacterStateUseCase(repository),
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
  imports: [
    ChroniclesModule,
  ],
  controllers: [
    CharacterDraftController,
    CharacterEmbraceController,
    CharacterBloodResonanceController,
    CharacterRouseCheckController,
    CharacterBlushOfLifeController,
    CharacterInitialVampireController,
    CharacterProfilePhaseController,
    ChronicleCharacterController,
    CharacterLifecycleController,
    CharacterStateController,
    CharacterSecondaryController,
    CharacterValidationController,
    CharacterExperienceController,
    CharacterAdvancementController,
    CharacterSheetPdfController,
  ],
  providers: [
    PrismaCharacterDraftRepository,
    PrismaCharacterRouseCheckRepository,
    PrismaCharacterBlushOfLifeRepository,
    PrismaCharacterSecondaryRepository,
    PrismaCharacterExperienceRepository,
    PdfLibCharacterSheetPdfRenderer,
    {
      provide: CHARACTER_SHEET_PDF_RENDERER,
      useExisting: PdfLibCharacterSheetPdfRenderer,
    },
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
          createCharacterDependencyValidationContributor(
            rulesCatalog,
          ),
        ]),
    },
    {
      provide: CHARACTER_DRAFT_REPOSITORY,
      useExisting: PrismaCharacterDraftRepository,
    },
    {
      provide: CHARACTER_ROUSE_CHECK_REPOSITORY,
      useExisting:
        PrismaCharacterRouseCheckRepository,
    },
    {
      provide:
        CHARACTER_BLUSH_OF_LIFE_REPOSITORY,
      useExisting:
        PrismaCharacterBlushOfLifeRepository,
    },
    {
      provide: CHARACTER_SECONDARY_REPOSITORY,
      useExisting:
        PrismaCharacterSecondaryRepository,
    },
    {
      provide: CHARACTER_EXPERIENCE_REPOSITORY,
      useExisting:
        PrismaCharacterExperienceRepository,
    },
    ...experienceUseCaseProviders,
    ...characterSheetPdfProviders,
    ...advancementUseCaseProviders,
    ...useCaseProviders,
  ],
  exports: [
    CHARACTER_SECONDARY_REPOSITORY,
    EmbraceCharacterUseCase,
    ApplyCharacterBloodResonanceUseCase,
    ExecuteCharacterRouseCheckUseCase,
    ResolveInitialVampireStateUseCase,
    CreateCharacterDraftUseCase,
    LoadCharacterAttributeSkillRatingsUseCase,
    LoadCharacterHungerUseCase,
    LoadCharacterDraftUseCase,
    ListCharacterDraftsUseCase,
    LoadCharacterSecondaryUseCase,
    UpdateCharacterDraftUseCase,
    UpdateCharacterChronicleAssociationUseCase,
    UpdateCharacterStateUseCase,
    UpdateCharacterSecondaryUseCase,
    ValidateCharacterUseCase,
    TransitionCharacterLifecycleUseCase,
  ],
})
export class CharactersModule {}
