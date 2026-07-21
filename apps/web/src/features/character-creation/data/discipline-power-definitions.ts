import {
  animalismPowerDefinitions,
} from './discipline-powers/animalism.ts'

import {
  auspexPowerDefinitions,
} from './discipline-powers/auspex.ts'

import {
  bloodSorceryPowerDefinitions,
} from './discipline-powers/blood-sorcery.ts'

import {
  celerityPowerDefinitions,
} from './discipline-powers/celerity.ts'

import {
  dominatePowerDefinitions,
} from './discipline-powers/dominate.ts'

import {
  fortitudePowerDefinitions,
} from './discipline-powers/fortitude.ts'

import {
  obfuscatePowerDefinitions,
} from './discipline-powers/obfuscate.ts'

import {
  oblivionPowerDefinitions,
} from './discipline-powers/oblivion.ts'

import {
  potencePowerDefinitions,
} from './discipline-powers/potence.ts'

import {
  presencePowerDefinitions,
} from './discipline-powers/presence.ts'

import {
  proteanPowerDefinitions,
} from './discipline-powers/protean.ts'

import type {
  DisciplinePowerDefinition,
} from '../types/discipline-power.types'

/*
 * Fachada pública del catálogo de Poderes.
 *
 * Los catálogos se mantienen separados por
 * Disciplina para evitar un archivo monolítico.
 *
 * Los consumidores deben seguir importando
 * disciplinePowerDefinitions desde este módulo.
 */

export const disciplinePowerDefinitions:
  DisciplinePowerDefinition[] = [
    ...bloodSorceryPowerDefinitions,
    ...celerityPowerDefinitions,
    ...auspexPowerDefinitions,
    ...animalismPowerDefinitions,
    ...dominatePowerDefinitions,
    ...potencePowerDefinitions,
    ...presencePowerDefinitions,
    ...fortitudePowerDefinitions,
    ...proteanPowerDefinitions,
    ...obfuscatePowerDefinitions,
    ...oblivionPowerDefinitions,
  ]
