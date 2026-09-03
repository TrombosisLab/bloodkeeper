import {
  Module,
} from '@nestjs/common'
import { ChronicleResourceController } from './presentation/chronicle-resource.controller'
import {
  CHARACTER_EXPERIENCE_REPOSITORY,
} from '../characters/application/character-experience.repository'
import {
  PrismaCharacterExperienceRepository,
} from '../characters/infrastructure/prisma-character-experience.repository'

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
  CHRONICLE_EVENT_REPOSITORY,
} from './application/chronicle-event.repository'

import {
  ArchiveChronicleEventUseCase,
} from './application/archive-chronicle-event.use-case'

import {
  CreateChronicleEventUseCase,
} from './application/create-chronicle-event.use-case'

import {
  ListChronicleEventsUseCase,
} from './application/list-chronicle-events.use-case'

import {
  LoadChronicleEventUseCase,
} from './application/load-chronicle-event.use-case'

import {
  ReorderChronicleEventsUseCase,
} from './application/reorder-chronicle-events.use-case'

import {
  UpdateChronicleEventUseCase,
} from './application/update-chronicle-event.use-case'

import {
  PrismaChronicleEventRepository,
} from './infrastructure/prisma-chronicle-event.repository'

import {
  ChronicleEventController,
} from './presentation/chronicle-event.controller'
import { ManageChronicleParticipantNotesUseCase } from './application/manage-chronicle-participant-notes.use-case'
import { ChronicleParticipantNotesController } from './presentation/chronicle-participant-notes.controller'
import { ManageChronicleEventRelationsUseCase } from './application/manage-chronicle-event-relations.use-case'
import { ChronicleEventRelationsController } from './presentation/chronicle-event-relations.controller'

import {
  CHRONICLE_SESSION_REPOSITORY,
} from './application/chronicle-session.repository'

import {
  ArchiveChronicleSessionUseCase,
} from './application/archive-chronicle-session.use-case'

import {
  CompleteChronicleSessionUseCase,
} from './application/complete-chronicle-session.use-case'

import {
  CreateChronicleSessionUseCase,
} from './application/create-chronicle-session.use-case'

import {
  ListChronicleSessionsUseCase,
} from './application/list-chronicle-sessions.use-case'

import {
  LoadChronicleSessionUseCase,
} from './application/load-chronicle-session.use-case'

import {
  UpdateChronicleSessionUseCase,
} from './application/update-chronicle-session.use-case'

import {
  PrismaChronicleSessionRepository,
} from './infrastructure/prisma-chronicle-session.repository'

import {
  ChronicleSessionController,
} from './presentation/chronicle-session.controller'

import {
  CHRONICLE_SESSION_ATTENDANCE_REPOSITORY,
} from './application/chronicle-session-attendance.repository'

import {
  AddChronicleSessionAttendanceUseCase,
  ListChronicleSessionAttendancesUseCase,
  RemoveChronicleSessionAttendanceUseCase,
} from './application/chronicle-session-attendance.use-cases'

import {
  PrismaChronicleSessionAttendanceRepository,
} from './infrastructure/prisma-chronicle-session-attendance.repository'

import {
  ChronicleSessionAttendanceController,
} from './presentation/chronicle-session-attendance.controller'

import {
  CHRONICLE_SESSION_CONTEXT_REPOSITORY,
} from './application/chronicle-session-context.repository'

import {
  LoadChronicleSessionContextUseCase,
} from './application/load-chronicle-session-context.use-case'

import {
  ReplaceChronicleSessionContextUseCase,
} from './application/replace-chronicle-session-context.use-case'

import {
  PrismaChronicleSessionContextRepository,
} from './infrastructure/prisma-chronicle-session-context.repository'

import {
  ChronicleSessionContextController,
} from './presentation/chronicle-session-context.controller'

import {
  ChronicleController,
} from './presentation/chronicle.controller'

import {
  CHRONICLE_STORY_REPOSITORY,
} from './application/chronicle-story.repository'

import {
  ActivateChronicleStoryUseCase,
  ArchiveChronicleStoryUseCase,
  CreateChronicleStoryReminderUseCase,
  CreateChronicleStoryUseCase,
  ListChronicleStoriesUseCase,
  ListSharedChronicleStoriesUseCase,
  LoadChronicleStoryUseCase,
  RemoveChronicleStoryReminderUseCase,
  ReplaceChronicleStoryContextUseCase,
  UpdateChronicleStorySessionProgressUseCase,
  CompleteChronicleStoryUseCase,
  UpdateChronicleStoryMilestoneUseCase,
  UpdateChronicleStoryReminderUseCase,
  UpdateChronicleStoryUseCase,
} from './application/chronicle-story.use-cases'

import {
  PrismaChronicleStoryRepository,
} from './infrastructure/prisma-chronicle-story.repository'

import {
  ChronicleStoryController,
} from './presentation/chronicle-story.controller'
import { LoadChronicleSessionWorkspaceUseCase } from './application/load-chronicle-session-workspace.use-case'
import { ManageChronicleSessionWorkspaceUseCase } from './application/manage-chronicle-session-workspace.use-case'
import { ChronicleSessionWorkspaceController } from './presentation/chronicle-session-workspace.controller'
import { ChronicleSessionParticipantNotesController } from './presentation/chronicle-session-participant-notes.controller'
import { ChronicleCoverController } from './presentation/chronicle-cover.controller'

@Module({
  imports: [
    UsersModule,
  ],
  controllers: [
    ChronicleResourceController,
    ChronicleParticipantNotesController,
    ChronicleController,
    ChronicleNpcController,
    ChronicleLocationController,
    ChronicleEventController,
    ChronicleEventRelationsController,
    ChronicleSessionController,
    ChronicleSessionAttendanceController,
    ChronicleSessionContextController,
    ChronicleStoryController,
    ChronicleSessionWorkspaceController,
    ChronicleSessionParticipantNotesController,
    ChronicleCoverController,
  ],
  providers: [
    ManageChronicleParticipantNotesUseCase,
    ManageChronicleEventRelationsUseCase,
    LoadChronicleSessionWorkspaceUseCase,
    ManageChronicleSessionWorkspaceUseCase,
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
    PrismaChronicleEventRepository,
    {
      provide:
        CHRONICLE_EVENT_REPOSITORY,
      useExisting:
        PrismaChronicleEventRepository,
    },
    ListChronicleEventsUseCase,
    LoadChronicleEventUseCase,
    CreateChronicleEventUseCase,
    UpdateChronicleEventUseCase,
    ReorderChronicleEventsUseCase,
    ArchiveChronicleEventUseCase,
    PrismaChronicleSessionRepository,
    PrismaChronicleStoryRepository,
    {
      provide:
        CHRONICLE_STORY_REPOSITORY,
      useExisting:
        PrismaChronicleStoryRepository,
    },
    ListChronicleStoriesUseCase,
    ListSharedChronicleStoriesUseCase,
    LoadChronicleStoryUseCase,
    CreateChronicleStoryUseCase,
    UpdateChronicleStoryUseCase,
    ActivateChronicleStoryUseCase,
    ArchiveChronicleStoryUseCase,
    UpdateChronicleStoryMilestoneUseCase,
    CreateChronicleStoryReminderUseCase,
    UpdateChronicleStoryReminderUseCase,
    RemoveChronicleStoryReminderUseCase,
    ReplaceChronicleStoryContextUseCase,
    UpdateChronicleStorySessionProgressUseCase,
    CompleteChronicleStoryUseCase,
    {
      provide:
        CHRONICLE_SESSION_REPOSITORY,
      useExisting:
        PrismaChronicleSessionRepository,
    },
    PrismaChronicleSessionAttendanceRepository,
    {
      provide:
        CHRONICLE_SESSION_ATTENDANCE_REPOSITORY,
      useExisting:
        PrismaChronicleSessionAttendanceRepository,
    },
    PrismaCharacterExperienceRepository,
    {
      provide:
        CHARACTER_EXPERIENCE_REPOSITORY,
      useExisting:
        PrismaCharacterExperienceRepository,
    },
    PrismaChronicleSessionContextRepository,
    {
      provide:
        CHRONICLE_SESSION_CONTEXT_REPOSITORY,
      useExisting:
        PrismaChronicleSessionContextRepository,
    },
    LoadChronicleSessionContextUseCase,
    ReplaceChronicleSessionContextUseCase,
    ListChronicleSessionAttendancesUseCase,
    AddChronicleSessionAttendanceUseCase,
    RemoveChronicleSessionAttendanceUseCase,
    ListChronicleSessionsUseCase,
    LoadChronicleSessionUseCase,
    CreateChronicleSessionUseCase,
    UpdateChronicleSessionUseCase,
    CompleteChronicleSessionUseCase,
    ArchiveChronicleSessionUseCase,
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
    CHRONICLE_STORY_REPOSITORY,
    CHRONICLE_SESSION_REPOSITORY,
    CHRONICLE_SESSION_ATTENDANCE_REPOSITORY,
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
