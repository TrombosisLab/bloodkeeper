import type {
  DisciplineKey,
} from './discipline.types.ts'

import type {
  CharacterAdvantageFamily,
} from './character-advantage-definition.types.ts'

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
  minimumBloodPotency?: number;
  maximumBloodPotency?: number;
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
  | 'background'
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

export interface PredatorTypeBloodPotencyGrant {
  type: 'bloodPotency'
  modifier: number
}

interface PredatorTypePointDistributionOptionBase {
  category: PredatorTypeAdvantageCategory
  maximumRating?: number
}

/*
 * Una opción de reparto puede señalar:
 *
 * - una definición concreta;
 * - una familia funcional completa.
 *
 * Son alternativas excluyentes para evitar configuraciones
 * ambiguas dentro de una misma opción.
 */
export type PredatorTypePointDistributionOption =
  | (
      PredatorTypePointDistributionOptionBase & {
        definitionKey: string
        family?: never
      }
    )
  | (
      PredatorTypePointDistributionOptionBase & {
        definitionKey?: never
        family: CharacterAdvantageFamily
      }
    )

export interface PredatorTypePointDistributionGrant {
  type: 'pointDistribution'
  points: number
  options: PredatorTypePointDistributionOption[]
}

export interface PredatorTypePointDistributionAllocation {
  definitionKey: string
  rating: number
}


export type PredatorTypeChoiceGrant =
  | PredatorTypeSpecialtyGrant
  | PredatorTypeDisciplineGrant
  | PredatorTypeAdvantageGrant
  | PredatorTypeHumanityGrant
  | PredatorTypeBloodPotencyGrant
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
    bloodPotencyModifier?: number;
    pointDistributions?: PredatorTypePointDistributionGrant[];
  };

  choices?: PredatorTypeChoice[];

  pendingReferences?: PendingReference[];

  storyEffects?: string[];
  notes?: string[];

  tags?: string[];
}
