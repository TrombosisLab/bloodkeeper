'use strict'

const manifest = require('./catalog-manifest.json')

const characterRulesCatalogManifest = Object.freeze({
  schemaVersion: manifest.schemaVersion,
  catalogVersion: manifest.catalogVersion,
  domains: Object.freeze({
    ...manifest.domains,
  }),
})

module.exports = {
  characterRulesCatalogManifest,
}
