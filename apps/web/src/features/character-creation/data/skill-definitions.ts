import type {
  SkillDefinition,
  SkillKey,
} from '../types/character-skills-draft.types'

export const skillDefinitions: SkillDefinition[] = [
  { key: 'athletics', label: 'Atletismo', category: 'physical' },
  { key: 'brawl', label: 'Pelea', category: 'physical' },
  { key: 'craft', label: 'Artesanía', category: 'physical' },
  { key: 'drive', label: 'Conducir', category: 'physical' },
  { key: 'firearms', label: 'Armas de Fuego', category: 'physical' },
  { key: 'larceny', label: 'Latrocinio', category: 'physical' },
  { key: 'melee', label: 'Armas Cuerpo a Cuerpo', category: 'physical' },
  { key: 'stealth', label: 'Sigilo', category: 'physical' },
  { key: 'survival', label: 'Supervivencia', category: 'physical' },

  { key: 'animalKen', label: 'Trato con Animales', category: 'social' },
  { key: 'etiquette', label: 'Etiqueta', category: 'social' },
  { key: 'insight', label: 'Perspicacia', category: 'social' },
  { key: 'intimidation', label: 'Intimidación', category: 'social' },
  { key: 'leadership', label: 'Liderazgo', category: 'social' },
  { key: 'performance', label: 'Interpretación', category: 'social' },
  { key: 'persuasion', label: 'Persuasión', category: 'social' },
  { key: 'streetwise', label: 'Callejeo', category: 'social' },
  { key: 'subterfuge', label: 'Subterfugio', category: 'social' },

  { key: 'academics', label: 'Academicismo', category: 'mental' },
  { key: 'awareness', label: 'Consciencia', category: 'mental' },
  { key: 'finance', label: 'Finanzas', category: 'mental' },
  { key: 'investigation', label: 'Investigación', category: 'mental' },
  { key: 'medicine', label: 'Medicina', category: 'mental' },
  { key: 'occult', label: 'Ocultismo', category: 'mental' },
  { key: 'politics', label: 'Política', category: 'mental' },
  { key: 'science', label: 'Ciencia', category: 'mental' },
  { key: 'technology', label: 'Tecnología', category: 'mental' },
]

export const skillKeys: SkillKey[] =
  skillDefinitions.map(
    (skill) => skill.key,
  )
