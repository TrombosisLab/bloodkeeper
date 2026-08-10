import {
  Module,
} from '@nestjs/common'

import {
  UsersModule,
} from '../users/users.module'

import {
  CHRONICLE_REPOSITORY,
} from './application/chronicle.repository'

import type {
  ChronicleRepository,
} from './application/chronicle.repository'

import {
  CreateChronicleUseCase,
} from './application/create-chronicle.use-case'

import {
  ListChroniclesUseCase,
} from './application/list-chronicles.use-case'

import {
  LoadChronicleUseCase,
} from './application/load-chronicle.use-case'

import {
  TransitionChronicleLifecycleUseCase,
} from './application/transition-chronicle-lifecycle.use-case'

import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
} from './application/chronicle-participant.repository'

import {
  AddChronicleParticipantUseCase,
} from './application/add-chronicle-participant.use-case'

import {
  ListChronicleParticipantsUseCase,
} from './application/list-chronicle-participants.use-case'

import {
  RetireChronicleParticipantUseCase,
} from './application/retire-chronicle-participant.use-case'

import {
  CHRONICLE_PARTICIPANT_RELATIONS,
} from './application/chronicle-participant-relations'

import type {
  ChronicleParticipantRelations,
} from './application/chronicle-participant-relations'

import {
  PrismaChronicleParticipantRelations,
} from './infrastructure/prisma-chronicle-participant-relations'

import {
  CHRONICLE_USER_DIRECTORY,
} from './application/chronicle-user-directory'

import {
  ListChronicleParticipantCandidatesUseCase,
} from './application/list-chronicle-participant-candidates.use-case'

import {
  ListUsersChronicleUserDirectory,
} from './infrastructure/list-users-chronicle-user-directory'

import {
  PrismaChronicleParticipantRepository,
} from './infrastructure/prisma-chronicle-participant.repository'

import {
  PrismaChronicleRepository,
} from './infrastructure/prisma-chronicle.repository'

import {
  CHRONICLE_NPC_REPOSITORY,
} from './application/chronicle-npc.repository'

import {
  ListChronicleNpcsUseCase,
} from './application/list-chronicle-npcs.use-case'

import {
  LoadChronicleNpcUseCase,
} from './application/load-chronicle-npc.use-case'

import {
  CreateChronicleNpcUseCase,
} from './application/create-chronicle-npc.use-case'

import {
  UpdateChronicleNpcUseCase,
} from './application/update-chronicle-npc.use-case'

import {
  ArchiveChronicleNpcUseCase,
} from './application/archive-chronicle-npc.use-case'

import {
  PrismaChronicleNpcRepository,
} from './infrastructure/prisma-chronicle-npc.repository'

import {
  ChronicleNpcController,
} from './presentation/chronicle-npc.controller'

import {
  CHRONICLE_LOCATION_REPOSITORY,
} from './application/chronicle-location.repository'

import {
  ArchiveChronicleLocationUseCase,
} from './application/archive-chronicle-location.use-case'

import {
  CreateChronicleLocationUseCase,
} from './application/create-chronicle-location.use-case'

import {
  ListChronicleLocationsUseCase,
} from './application/list-chronicle-locations.use-case'

import {
  LoadChronicleLocationUseCase,
} from './application/load-chronicle-location.use-case'

import {
  UpdateChronicleLocationUseCase,
} from './application/update-chronicle-location.use-case'

import {
  PrismaChronicleLocationRepository,
} from './infrastructure/prisma-chronicle-location.repository'

import {
  ChronicleLocationController,
} from './presentation/chronicle-location.controller'

import {
  ChronicleController,
} from './presentation/chronicle.controller'

@Module({
  imports: [
    UsersModule,
  ],
  controllers: [
    ChronicleController,
    ChronicleNpcController,
    ChronicleLocationController,
  ],
  providers: [
    PrismaChronicleRepository,
    {
      provide: CHRONICLE_REPOSITORY,
      useExisting:
        PrismaChronicleRepository,
    },
    {
      provide: CreateChronicleUseCase,
      inject: [CHRONICLE_REPOSITORY],
      useFactory: (
        repository: ChronicleRepository,
      ) =>
        new CreateChronicleUseCase(
          repository,
        ),
    },
    {
      provide: ListChroniclesUseCase,
      inject: [CHRONICLE_REPOSITORY],
      useFactory: (
        repository: ChronicleRepository,
      ) =>
        new ListChroniclesUseCase(
          repository,
        ),
    },
    {
      provide: LoadChronicleUseCase,
      inject: [CHRONICLE_REPOSITORY],
      useFactory: (
        repository: ChronicleRepository,
      ) =>
        new LoadChronicleUseCase(
          repository,
        ),
    },
    {
      provide:
        TransitionChronicleLifecycleUseCase,
      inject: [CHRONICLE_REPOSITORY],
      useFactory: (
        repository: ChronicleRepository,
      ) =>
        new TransitionChronicleLifecycleUseCase(
          repository,
        ),
    },
    PrismaChronicleParticipantRepository,
    {
      provide:
        CHRONICLE_PARTICIPANT_REPOSITORY,
      useExisting:
        PrismaChronicleParticipantRepository,
    },
    PrismaChronicleNpcRepository,
    {
      provide:
        CHRONICLE_NPC_REPOSITORY,
      useExisting:
        PrismaChronicleNpcRepository,
    },
    ListChronicleNpcsUseCase,
    LoadChronicleNpcUseCase,
    CreateChronicleNpcUseCase,
    UpdateChronicleNpcUseCase,
    ArchiveChronicleNpcUseCase,
    PrismaChronicleLocationRepository,
    {
      provide:
        CHRONICLE_LOCATION_REPOSITORY,
      useExisting:
        PrismaChronicleLocationRepository,
    },
    ListChronicleLocationsUseCase,
    LoadChronicleLocationUseCase,
    CreateChronicleLocationUseCase,
    UpdateChronicleLocationUseCase,
    ArchiveChronicleLocationUseCase,
    PrismaChronicleParticipantRelations,
    {
      provide:
        CHRONICLE_PARTICIPANT_RELATIONS,
      useExisting:
        PrismaChronicleParticipantRelations,
    },
    ListChronicleParticipantsUseCase,
    AddChronicleParticipantUseCase,
    {
      provide:
        RetireChronicleParticipantUseCase,
      inject: [
        CHRONICLE_PARTICIPANT_REPOSITORY,
        CHRONICLE_PARTICIPANT_RELATIONS,
      ],
      useFactory: (
        participants:
          import('./application/chronicle-participant.repository').ChronicleParticipantRepository,
        relations:
          ChronicleParticipantRelations,
      ) =>
        new RetireChronicleParticipantUseCase(
          participants,
          relations,
        ),
    },
    ListUsersChronicleUserDirectory,
    {
      provide: CHRONICLE_USER_DIRECTORY,
      useExisting:
        ListUsersChronicleUserDirectory,
    },
    {
      provide:
        ListChronicleParticipantCandidatesUseCase,
      inject: [
        CHRONICLE_PARTICIPANT_REPOSITORY,
        CHRONICLE_USER_DIRECTORY,
      ],
      useFactory: (
        participants:
          import('./application/chronicle-participant.repository').ChronicleParticipantRepository,
        users:
          import('./application/chronicle-user-directory').ChronicleUserDirectory,
      ) =>
        new ListChronicleParticipantCandidatesUseCase(
          participants,
          users,
        ),
    },
  ],
  exports: [
    CHRONICLE_PARTICIPANT_REPOSITORY,
    CreateChronicleUseCase,
    ListChroniclesUseCase,
    LoadChronicleUseCase,
    TransitionChronicleLifecycleUseCase,
    ListChronicleParticipantsUseCase,
    AddChronicleParticipantUseCase,
    RetireChronicleParticipantUseCase,
  ],
})
export class ChroniclesModule {}
