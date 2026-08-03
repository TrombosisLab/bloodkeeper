import manifest from './catalog-manifest.json' with {
  type: 'json',
}

function freezeManifest(value) {
  return Object.freeze({
    schemaVersion: value.schemaVersion,
    catalogVersion: value.catalogVersion,
    domains: Object.freeze({
      ...value.domains,
    }),
  })
}

export const characterRulesCatalogManifest =
  freezeManifest(manifest)
