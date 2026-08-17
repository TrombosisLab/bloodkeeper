import manifest from './catalog-manifest.json' with {
  type: 'json',
}
import disciplines from './catalogs/disciplines.json' with {
  type: 'json',
}
import powers from './catalogs/discipline-powers.json' with {
  type: 'json',
}
import bloodSorceryRituals from './catalogs/blood-sorcery-rituals.json' with {
  type: 'json',
}
import oblivionCeremonies from './catalogs/oblivion-ceremonies.json' with {
  type: 'json',
}
import thinBloodAlchemyFormulas from './catalogs/thin-blood-alchemy-formulas.json' with {
  type: 'json',
}
import clanDisciplineAffinities from './catalogs/clan-discipline-affinities.json' with {
  type: 'json',
}
import advantageDefinitions from './catalogs/advantages.json' with {
  type: 'json',
}
import loresheets from './catalogs/loresheets.json' with {
  type: 'json',
}
import predatorTypes from './catalogs/predator-types.json' with {
  type: 'json',
}
import thinBloodTraits from './catalogs/thin-blood-traits.json' with {
  type: 'json',
}
import mortalAdvantageExclusions from './catalogs/mortal-advantage-exclusions.json' with {
  type: 'json',
}
import skills from './catalogs/skills.json' with {
  type: 'json',
}

function deepFreeze(value) {
  if (value === null || typeof value !== 'object') {
    return value
  }

  for (const child of Object.values(value)) {
    deepFreeze(child)
  }

  return Object.freeze(value)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function deriveCharacterHealthCapacity(
  attributes,
) {
  return attributes.stamina + 3
}

export function deriveCharacterWillpowerCapacity(
  attributes,
) {
  return attributes.composure + attributes.resolve
}

export const characterRulesCatalogManifest =
  deepFreeze(clone(manifest))

export const characterDisciplineCatalog =
  deepFreeze({
    disciplines: clone(disciplines),
    powers: clone(powers),
    bloodSorceryRituals:
      clone(bloodSorceryRituals),
    oblivionCeremonies:
      clone(oblivionCeremonies),
    thinBloodAlchemyFormulas:
      clone(thinBloodAlchemyFormulas),
    clanAffinities:
      clone(clanDisciplineAffinities),
  })

export const characterAdvantageCatalog =
  deepFreeze({
    definitions: clone(advantageDefinitions),
    loresheets: clone(loresheets),
  })

export const characterDependencyCatalog =
  deepFreeze({
    predatorTypes: clone(predatorTypes),
    thinBloodTraits: clone(thinBloodTraits),
  })

export const characterMortalAdvantageExclusionCatalog =
  deepFreeze(
    clone(mortalAdvantageExclusions),
  )

export const characterSkillCatalog =
  deepFreeze({
    definitions: clone(skills),
  })
