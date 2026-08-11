import { Module } from '@nestjs/common'

import {
  CharactersModule,
} from '../characters/characters.module'

import {
  LoadCharacterAttributeSkillRatingsUseCase,
} from '../characters/application/load-character-attribute-skill-ratings.use-case'

import {
  LoadCharacterHungerUseCase,
} from '../characters/application/load-character-hunger.use-case'

import {
  DICE_RANDOM_SOURCE,
} from './application/dice-random-source'

import type {
  DiceRandomSource,
} from './application/dice-random-source'

import {
  ExecuteCharacterDiceRollUseCase,
} from './application/execute-character-dice-roll.use-case'

import {
  ExecuteManualDiceRollUseCase,
} from './application/execute-manual-dice-roll.use-case'

import {
  MathRandomDiceSource,
} from './infrastructure/math-random-dice-source'

import {
  DiceController,
} from './presentation/dice.controller'

@Module({
  imports: [CharactersModule],
  controllers: [DiceController],
  providers: [
    MathRandomDiceSource,
    {
      provide: DICE_RANDOM_SOURCE,
      useExisting: MathRandomDiceSource,
    },
    {
      provide: ExecuteManualDiceRollUseCase,
      inject: [DICE_RANDOM_SOURCE],
      useFactory: (random: DiceRandomSource) =>
        new ExecuteManualDiceRollUseCase(random),
    },
    {
      provide: ExecuteCharacterDiceRollUseCase,
      inject: [
        LoadCharacterAttributeSkillRatingsUseCase,
        LoadCharacterHungerUseCase,
        DICE_RANDOM_SOURCE,
      ],
      useFactory: (
        ratings:
          LoadCharacterAttributeSkillRatingsUseCase,
        hunger: LoadCharacterHungerUseCase,
        random: DiceRandomSource,
      ) => new ExecuteCharacterDiceRollUseCase(
        ratings,
        hunger,
        random,
      ),
    },
  ],
})
export class DiceModule {}
