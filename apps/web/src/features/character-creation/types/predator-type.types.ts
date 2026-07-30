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

export type PredatorTypeChoiceGrant =
  | PredatorTypeSpecialtyGrant
  | PredatorTypeDisciplineGrant

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
  category: 'merit' | 'flaw';
  rating: number;
}

export interface PredatorTypeDefinition {
  key: string;
  name: string;

  restrictions?: PredatorTypeRestriction;

  fixedGrants?: {
    advantages?: PredatorTypeGrant[];
  };

  choices?: PredatorTypeChoice[];

  pendingReferences?: PendingReference[];

  tags?: string[];
}
