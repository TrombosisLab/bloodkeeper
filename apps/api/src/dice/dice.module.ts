import { Module } from '@nestjs/common'

import { CharactersModule } from '../characters/characters.module'
import { ChroniclesModule } from '../chronicles/chronicles.module'

import {
  LoadCharacterAttributeSkillRatingsUseCase,
} from '../characters/application/load-character-attribute-skill-ratings.use-case'
import {
  LoadCharacterDraftUseCase,
} from '../characters/application/load-character-draft.use-case'

import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
} from '../chronicles/application/chronicle-participant.repository'
import type {
  ChronicleParticipantRepository,
} from '../chronicles/application/chronicle-participant.repository'
import {
  CHRONICLE_SESSION_REPOSITORY,
} from '../chronicles/application/chronicle-session.repository'
import type {
  ChronicleSessionRepository,
} from '../chronicles/application/chronicle-session.repository'

import { DICE_RANDOM_SOURCE } from './application/dice-random-source'
import type { DiceRandomSource } from './application/dice-random-source'
import {
  CharacterDiceHungerAdapter,
} from './application/character-dice-hunger.adapter'
import {
  CharacterDiceResonanceAdapter,
} from './application/character-dice-resonance.adapter'
import {
  ExecuteCharacterDiceRollUseCase,
} from './application/execute-character-dice-roll.use-case'
import {
  ExecuteManualDiceRollUseCase,
} from './application/execute-manual-dice-roll.use-case'
import {
  DICE_ROLL_REPOSITORY,
} from './application/dice-roll.repository'
import type {
  DiceRollRepository,
} from './application/dice-roll.repository'
import {
  DiceRollContextValidator,
} from './application/dice-roll-context'
import {
  RecordManualDiceRollUseCase,
} from './application/record-manual-dice-roll.use-case'
import {
  RecordCharacterDiceRollUseCase,
} from './application/record-character-dice-roll.use-case'
import {
  ListDiceRollHistoryUseCase,
  LoadDiceRollHistoryUseCase,
} from './application/dice-history.use-cases'

import { MathRandomDiceSource } from './infrastructure/math-random-dice-source'
import { PrismaDiceRollRepository } from './infrastructure/prisma-dice-roll.repository'
import { DiceController } from './presentation/dice.controller'

@Module({
  imports: [CharactersModule, ChroniclesModule],
  controllers: [DiceController],
  providers: [
    MathRandomDiceSource,
    PrismaDiceRollRepository,
    {
      provide: DICE_RANDOM_SOURCE,
      useExisting: MathRandomDiceSource,
    },
    {
      provide: DICE_ROLL_REPOSITORY,
      useExisting: PrismaDiceRollRepository,
    },
    {
      provide: DiceRollContextValidator,
      inject: [
        DICE_ROLL_REPOSITORY,
        CHRONICLE_PARTICIPANT_REPOSITORY,
        CHRONICLE_SESSION_REPOSITORY,
      ],
      useFactory: (
        records: DiceRollRepository,
        participants: ChronicleParticipantRepository,
        sessions: ChronicleSessionRepository,
      ) => new DiceRollContextValidator(
        records,
        participants,
        sessions,
      ),
    },
    {
      provide: ExecuteManualDiceRollUseCase,
      inject: [DICE_RANDOM_SOURCE],
      useFactory: (random: DiceRandomSource) =>
        new ExecuteManualDiceRollUseCase(random),
    },
    {
      provide: CharacterDiceHungerAdapter,
      inject: [LoadCharacterDraftUseCase],
      useFactory: (
        characters: LoadCharacterDraftUseCase,
      ) => new CharacterDiceHungerAdapter(
        characters,
      ),
    },
    {
      provide: CharacterDiceResonanceAdapter,
      inject: [LoadCharacterDraftUseCase],
      useFactory: (
        characters: LoadCharacterDraftUseCase,
      ) => new CharacterDiceResonanceAdapter(
        characters,
      ),
    },
    {
      provide: ExecuteCharacterDiceRollUseCase,
      inject: [
        LoadCharacterAttributeSkillRatingsUseCase,
        CharacterDiceHungerAdapter,
        CharacterDiceResonanceAdapter,
        DICE_RANDOM_SOURCE,
      ],
      useFactory: (
        ratings: LoadCharacterAttributeSkillRatingsUseCase,
        hunger: CharacterDiceHungerAdapter,
        resonance: CharacterDiceResonanceAdapter,
        random: DiceRandomSource,
      ) => new ExecuteCharacterDiceRollUseCase(
        ratings,
        hunger,
        resonance,
        random,
      ),
    },
    {
      provide: RecordManualDiceRollUseCase,
      inject: [
        ExecuteManualDiceRollUseCase,
        DiceRollContextValidator,
        DICE_ROLL_REPOSITORY,
      ],
      useFactory: (
        executor: ExecuteManualDiceRollUseCase,
        contexts: DiceRollContextValidator,
        records: DiceRollRepository,
      ) => new RecordManualDiceRollUseCase(
        executor,
        contexts,
        records,
      ),
    },
    {
      provide: RecordCharacterDiceRollUseCase,
      inject: [
        ExecuteCharacterDiceRollUseCase,
        LoadCharacterDraftUseCase,
        DiceRollContextValidator,
        DICE_ROLL_REPOSITORY,
      ],
      useFactory: (
        executor: ExecuteCharacterDiceRollUseCase,
        characters: LoadCharacterDraftUseCase,
        contexts: DiceRollContextValidator,
        records: DiceRollRepository,
      ) => new RecordCharacterDiceRollUseCase(
        executor,
        characters,
        contexts,
        records,
      ),
    },
    {
      provide: ListDiceRollHistoryUseCase,
      inject: [
        DICE_ROLL_REPOSITORY,
        CHRONICLE_PARTICIPANT_REPOSITORY,
        CHRONICLE_SESSION_REPOSITORY,
      ],
      useFactory: (
        records: DiceRollRepository,
        participants: ChronicleParticipantRepository,
        sessions: ChronicleSessionRepository,
      ) => new ListDiceRollHistoryUseCase(
        records,
        participants,
        sessions,
      ),
    },
    {
      provide: LoadDiceRollHistoryUseCase,
      inject: [
        DICE_ROLL_REPOSITORY,
        CHRONICLE_PARTICIPANT_REPOSITORY,
      ],
      useFactory: (
        records: DiceRollRepository,
        participants: ChronicleParticipantRepository,
      ) => new LoadDiceRollHistoryUseCase(
        records,
        participants,
      ),
    },
  ],
})
export class DiceModule {}
