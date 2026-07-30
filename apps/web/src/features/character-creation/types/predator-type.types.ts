import type {
  DisciplineKey,
} from './discipline.types.ts'

import type {
  SkillKey,
} from './character-skills-draft.types.ts'

export interface PredatorTypeRestriction {
  excludedClans?: string[];
  requiredClans?: string[];
  requiredMerits?: string[];
  forbiddenMerits?: string[];
  minimumHumanity?: number;
  maximumHumanity?: number;
  requiresStorytellerApproval?: boolean;
}

export interface PendingReference {
  definitionKey: string;
}

export interface PredatorTypeChoiceCondition {
  clan?: string
}

export interface PredatorTypeSpecialtyGrant {
  type: 'specialty'
  skillKey: SkillKey
  name: string
}

export interface PredatorTypeDisciplineGrant {
  type: 'discipline'
  disciplineKey: DisciplineKey
  dots: number
}

export type PredatorTypeAdvantageCategory =
  | 'merit'
  | 'flaw'

export interface PredatorTypeAdvantageGrant {
  type: 'advantage'
  definitionKey: string
  category: PredatorTypeAdvantageCategory
  rating: number
}

export interface PredatorTypeHumanityGrant {
  type: 'humanity'
  modifier: number
}

export interface PredatorTypePointDistributionOption {
  definitionKey: string
  category: PredatorTypeAdvantageCategory
  maximumRating?: number
}

export interface PredatorTypePointDistributionGrant {
  type: 'pointDistribution'
  points: number
  options: PredatorTypePointDistributionOption[]
}

export type PredatorTypeChoiceGrant =
  | PredatorTypeSpecialtyGrant
  | PredatorTypeDisciplineGrant
  | PredatorTypeAdvantageGrant
  | PredatorTypeHumanityGrant
  | PredatorTypePointDistributionGrant

export interface PredatorTypeChoiceOption {
  when?: PredatorTypeChoiceCondition
  grant: PredatorTypeChoiceGrant
}

export interface PredatorTypeChoice {
  id: string;
  minimumSelections: number;
  maximumSelections: number;
  options: PredatorTypeChoiceOption[];
}

export interface PredatorTypeGrant {
  definitionKey: string;
  category: PredatorTypeAdvantageCategory;
  rating: number;
}

export interface PredatorTypeDefinition {
  key: string;
  name: string;

  restrictions?: PredatorTypeRestriction;

  fixedGrants?: {
    advantages?: PredatorTypeGrant[];
    humanityModifier?: number;
    pointDistributions?: PredatorTypePointDistributionGrant[];
  };

  choices?: PredatorTypeChoice[];

  pendingReferences?: PendingReference[];

  storyEffects?: string[];
  notes?: string[];

  tags?: string[];
}
