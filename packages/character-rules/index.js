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
  })
