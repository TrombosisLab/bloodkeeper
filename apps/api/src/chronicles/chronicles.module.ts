import {
  Module,
} from '@nestjs/common'

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
  PrismaChronicleRepository,
} from './infrastructure/prisma-chronicle.repository'

import {
  ChronicleController,
} from './presentation/chronicle.controller'

@Module({
  controllers: [
    ChronicleController,
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
  ],
  exports: [
    CreateChronicleUseCase,
    ListChroniclesUseCase,
    LoadChronicleUseCase,
    TransitionChronicleLifecycleUseCase,
  ],
})
export class ChroniclesModule {}
