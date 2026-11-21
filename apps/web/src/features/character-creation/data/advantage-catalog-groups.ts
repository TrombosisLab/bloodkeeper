import type {
  CharacterAdvantageCategory,
} from '../types/character-advantages-draft.types'

interface AdvantageCatalogItem {
  key: string
  name: string
  category: CharacterAdvantageCategory
}

export interface AdvantageCatalogGroup<T extends AdvantageCatalogItem = AdvantageCatalogItem> {
  key: string
  label: string
  definitions: T[]
}

const groupByCategoryAndKey: Record<
  CharacterAdvantageCategory,
  Record<string, string>
> = {
  background: {
    allies: 'Aliados',
    contacts: 'Contactos',
    fame: 'Fama',
    influence: 'Influencia',
    haven: 'Refugio',
    herd: 'Rebaño',
    mask: 'Máscara',
    mawla: 'Mawla',
    resources: 'Recursos',
    retainers: 'Criados',
    status: 'Estatus',
  },
  merit: {
    linguistics: 'Lingüística',
    beautiful: 'Apariencia', stunning: 'Apariencia', 'methuselah-visage': 'Apariencia', 'famous-face': 'Apariencia', 'innocent-face': 'Apariencia', 'distinctive-feature': 'Apariencia', 'awake-all-night': 'Apariencia', 'child-of-the-scene': 'Apariencia',
    'functional-addict': 'Consumo de sustancias',
    'custodian-of-history': 'Defectos arcaicos',
    'bond-resistance': 'Vínculo', 'short-bond': 'Vínculo', unbondable: 'Vínculo', 'long-lasting-bond': 'Vínculo', 'loyalty-bonds': 'Vínculo',
    bloodhound: 'Alimentación', 'iron-stomach': 'Alimentación', 'vessel-recognition': 'Alimentación', 'self-service': 'Alimentación',
    'eat-food': 'Mítico', 'hunger-cold-dead': 'Mítico', 'pack-diablerie': 'Mítico', 'demon-luck': 'Mítico', 'night-mode': 'Mítico', 'power-object': 'Mítico', 'persistent-blush': 'Mítico', 'ley-line-power': 'Mítico',
    'unholy-will': 'Psicológicos', zealotry: 'Psicológicos', penitence: 'Psicológicos', 'soothed-beast': 'Psicológicos', 'false-love': 'Psicológicos',
    'consanguineous-sense': 'Lazos de Sangre', 'consanguineous-influence': 'Lazos de Sangre', 'sins-of-the-father': 'Lazos de Sangre',
    'check-the-trunk': 'Otros', 'side-hustler': 'Otros', 'tempered-will': 'Otros', untouchable: 'Otros', 'mystic-of-the-void': 'Otros',
    'fame-influencer': 'Fama', 'lasting-fame': 'Fama',
    'erased-identity': 'Máscara', 'mask-maker': 'Máscara',
    'sacred-ground': 'Otros', 'haven-sanctuary': 'Otros',
    'commercial-establishment': 'Refugio', furcus: 'Refugio', 'mechanic-workshop': 'Refugio', 'haven-mobile': 'Refugio', 'haven-armored': 'Refugio', 'smuggler-cache': 'Refugio', 'spare-plates': 'Refugio',
    'caitiff-favored-blood': 'Caitiff', 'caitiff-mark-of-caine': 'Caitiff', 'caitiff-mimic': 'Caitiff', 'caitiff-marked-by-sun': 'Caitiff', 'caitiff-uncle-fangs': 'Caitiff',
  },
  flaw: {
    'dark-secret': 'Fama',
    'haven-compromised': 'Refugio', 'haven-creepy': 'Refugio', 'haven-haunted': 'Refugio', 'haven-no-safehouse': 'Refugio', 'haven-shared': 'Refugio', 'haven-railbound': 'Refugio', 'haven-temperamental': 'Refugio',
    illiterate: 'Lingüística',
    ugly: 'Apariencia', repulsive: 'Apariencia', stench: 'Apariencia', transparent: 'Apariencia', 'imperishable-face': 'Apariencia', 'immutable-countenance': 'Apariencia',
    enemy: 'Aliados', stalker: 'Criados', infamy: 'Fama', despised: 'Influencia', hatred: 'Influencia', exiled: 'Estatus', suspect: 'Estatus', shunned: 'Estatus', 'mortal-pretender': 'Máscara',
    'hopeless-addiction': 'Consumo de sustancias', addiction: 'Consumo de sustancias',
    archaic: 'Defectos arcaicos', 'living-in-the-past': 'Defectos arcaicos', 'old-tricks': 'Defectos arcaicos',
    bondslave: 'Vínculo', 'bond-junkie': 'Vínculo', 'long-bond': 'Vínculo',
    vegan: 'Alimentación', organovore: 'Alimentación', 'methuselah-thirst': 'Alimentación', 'prey-exclusion': 'Alimentación', rancher: 'Alimentación', 'careless-predator': 'Alimentación',
    'stake-bait': 'Mítico', 'folkloric-bane': 'Mítico', 'folkloric-block': 'Mítico', stigmata: 'Mítico', 'hungry-decay': 'Mítico', 'cursed-object': 'Mítico', 'twice-cursed': 'Mítico', 'blush-resistant': 'Mítico', 'trapped-on-land': 'Mítico', 'corpse-meat': 'Mítico',
    'duel-phobia': 'Psicológicos', 'blasphemy-beacon': 'Psicológicos', 'crisis-of-faith': 'Psicológicos', 'penitence-scars': 'Psicológicos', 'servile-worm': 'Psicológicos', daring: 'Psicológicos', timid: 'Psicológicos',
    'disease-vector': 'Contagio', 'plague-carrier': 'Contagio',
    'diabolist-evident': 'Diablerie', 'inherited-bane': 'Diablerie',
    'vein-extractor': 'Otros', 'obsolete-preference': 'Otros', 'resonance-sensitivity': 'Otros', 'resonance-mimicry': 'Otros', 'two-masters': 'Otros', 'knowledge-hunger': 'Otros', 'boon-debts': 'Otros', 'obvious-predator': 'Otros',
    'known-corpse': 'Máscara', 'known-neutral-body': 'Máscara',
    'adversary-mawla': 'Mawla', 'secret-master': 'Mawla',
    'enemy-embraced-touchstone': 'Mawla', indigent: 'Recursos',
    'caitiff-contaminated-vitae': 'Caitiff', 'caitiff-clan-curse': 'Caitiff', 'caitiff-debt-servant': 'Caitiff', 'caitiff-liquidator': 'Caitiff', 'caitiff-pregnant-blood': 'Caitiff', 'caitiff-walking-omen': 'Caitiff', 'caitiff-marked-by-word': 'Caitiff',
  },
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
}

export function getAdvantageCatalogGroupLabel(
  definition: AdvantageCatalogItem,
): string {
  return groupByCategoryAndKey[definition.category][definition.key] ?? 'Otros'
}

export function filterAdvantageCatalogDefinitions<T extends AdvantageCatalogItem>(
  definitions: readonly T[],
  query: string,
): T[] {
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) return [...definitions]

  return definitions.filter((definition) =>
    [definition.name, definition.key, getAdvantageCatalogGroupLabel(definition)]
      .some((value) => normalize(value).includes(normalizedQuery)),
  )
}

export function groupAdvantageCatalogDefinitions<T extends AdvantageCatalogItem>(
  definitions: readonly T[],
): AdvantageCatalogGroup<T>[] {
  const groups = new Map<string, AdvantageCatalogGroup<T>>()

  for (const definition of definitions) {
    const label = getAdvantageCatalogGroupLabel(definition)
    const key = normalize(label)
    const group = groups.get(key) ?? { key, label, definitions: [] }
    group.definitions.push(definition)
    groups.set(key, group)
  }

  return [...groups.values()]
}
