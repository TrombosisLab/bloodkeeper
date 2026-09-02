export type V5VisualAsset = {
  readonly key: string
  readonly label: string
  readonly aliases: readonly string[]
  readonly symbol?: string
  readonly logo?: string
  readonly icon?: string
}

const clans: readonly V5VisualAsset[] = [
  ['banuHaqim', 'Banu Haqim', ['banu haqim', 'banu_haqim']],
  ['brujah', 'Brujah', []],
  ['caitiff', 'Caitiff', []],
  ['gangrel', 'Gangrel', []],
  ['hecata', 'Hecata', []],
  ['lasombra', 'Lasombra', []],
  ['malkavian', 'Malkavian', ['malkaviano']],
  ['ministry', 'Ministry', ['ministerio', 'the ministry']],
  ['nosferatu', 'Nosferatu', []],
  ['ravnos', 'Ravnos', []],
  ['salubri', 'Salubri', []],
  ['thinBlood', 'Sangre Débil', ['thin blood', 'thinblood', 'sangre debil', 'sangre débil']],
  ['toreador', 'Toreador', []],
  ['tremere', 'Tremere', []],
  ['tzimisce', 'Tzimisce', []],
  ['ventrue', 'Ventrue', []],
].map(([key, label, aliases]) => ({
  key: key as string,
  label: label as string,
  aliases: aliases as readonly string[],
  symbol: `/assets/v5/clans/symbols/${key}.png`,
  logo: `/assets/v5/clans/logos/${key}.png`,
}))

const disciplines: readonly V5VisualAsset[] = [
  ['thinBloodAlchemy', 'Alquimia de Sangre Débil', ['alchemy', 'alquimia', 'thin blood alchemy']],
  ['animalism', 'Animalismo', ['animalism']],
  ['auspex', 'Auspex', []],
  ['bloodSorcery', 'Hechicería de Sangre', ['blood sorcery', 'blood_sorcery', 'hechiceria de sangre', 'hechicería de sangre']],
  ['celerity', 'Celeridad', ['celerity']],
  ['dominate', 'Dominación', ['dominate', 'dominacion', 'dominación']],
  ['fortitude', 'Fortaleza', ['fortitude']],
  ['obfuscate', 'Ofuscación', ['obfuscate', 'ofuscacion', 'ofuscación']],
  ['oblivion', 'Olvido', ['oblivion']],
  ['potence', 'Potencia', ['potence']],
  ['presence', 'Presencia', ['presence']],
  ['protean', 'Protean', ['proteanismo']],
].map(([key, label, aliases]) => ({
  key: key as string,
  label: label as string,
  aliases: aliases as readonly string[],
  icon: `/assets/v5/disciplines/${key}.png`,
}))

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '').toLowerCase()
}

function resolve(items: readonly V5VisualAsset[], value: string | null | undefined) {
  if (!value?.trim()) return null
  const candidate = normalize(value)
  return items.find((item) => [item.key, item.label, ...item.aliases].some((alias) => normalize(alias) === candidate)) ?? null
}

export const clanVisuals = clans
export const disciplineVisuals = disciplines
export const resolveClanVisual = (value: string | null | undefined) => resolve(clans, value)
export const resolveDisciplineVisual = (value: string | null | undefined) => resolve(disciplines, value)
