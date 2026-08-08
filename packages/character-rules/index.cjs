'use strict'

const manifest = require('./catalog-manifest.json')
const disciplines = require('./catalogs/disciplines.json')
const powers = require('./catalogs/discipline-powers.json')
const bloodSorceryRituals = require('./catalogs/blood-sorcery-rituals.json')
const oblivionCeremonies = require('./catalogs/oblivion-ceremonies.json')
const thinBloodAlchemyFormulas = require('./catalogs/thin-blood-alchemy-formulas.json')
const advantageDefinitions = require('./catalogs/advantages.json')
const predatorTypes = require('./catalogs/predator-types.json')
const skills = require('./catalogs/skills.json')

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

const characterRulesCatalogManifest =
  deepFreeze(clone(manifest))

const characterDisciplineCatalog =
  deepFreeze({
    disciplines: clone(disciplines),
    powers: clone(powers),
    bloodSorceryRituals:
      clone(bloodSorceryRituals),
    oblivionCeremonies:
      clone(oblivionCeremonies),
    thinBloodAlchemyFormulas:
      clone(thinBloodAlchemyFormulas),
  })

const characterAdvantageCatalog =
  deepFreeze({
    definitions: clone(advantageDefinitions),
  })

const characterDependencyCatalog =
  deepFreeze({
    predatorTypes: clone(predatorTypes),
  })

const characterSkillCatalog =
  deepFreeze({
    definitions: clone(skills),
  })

module.exports = {
  characterRulesCatalogManifest,
  characterDisciplineCatalog,
  characterAdvantageCatalog,
  characterDependencyCatalog,
  characterSkillCatalog,
}
