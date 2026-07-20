import type {
  CharacterSkillCategory,
} from '../types/character-skills.types'

export const demoSkills: CharacterSkillCategory[] = [
  {
    key: 'physical',
    label: 'Físicas',
    skills: [
      { key: 'athletics', label: 'Atletismo', value: 2 },
      { key: 'brawl', label: 'Pelea', value: 3 },
      { key: 'craft', label: 'Artesanía', value: 1 },
      { key: 'drive', label: 'Conducir', value: 2 },
      { key: 'firearms', label: 'Armas de Fuego', value: 1 },
      { key: 'larceny', label: 'Latrocinio', value: 2 },
      { key: 'melee', label: 'Armas Cuerpo a Cuerpo', value: 2 },
      { key: 'stealth', label: 'Sigilo', value: 3 },
      { key: 'survival', label: 'Supervivencia', value: 1 }
    ]
  },
  {
    key: 'social',
    label: 'Sociales',
    skills: [
      { key: 'animal-ken', label: 'Trato con Animales', value: 1 },
      { key: 'etiquette', label: 'Etiqueta', value: 2 },
      { key: 'insight', label: 'Perspicacia', value: 3 },
      { key: 'intimidation', label: 'Intimidación', value: 3 },
      { key: 'leadership', label: 'Liderazgo', value: 2 },
      { key: 'performance', label: 'Interpretación', value: 1 },
      { key: 'persuasion', label: 'Persuasión', value: 3 },
      { key: 'streetwise', label: 'Callejeo', value: 2 },
      { key: 'subterfuge', label: 'Subterfugio', value: 2 }
    ]
  },
  {
    key: 'mental',
    label: 'Mentales',
    skills: [
      { key: 'academics', label: 'Academicismo', value: 2 },
      { key: 'awareness', label: 'Consciencia', value: 3 },
      { key: 'finance', label: 'Finanzas', value: 1 },
      { key: 'investigation', label: 'Investigación', value: 2 },
      { key: 'medicine', label: 'Medicina', value: 1 },
      { key: 'occult', label: 'Ocultismo', value: 2 },
      { key: 'politics', label: 'Política', value: 3 },
      { key: 'science', label: 'Ciencia', value: 1 },
      { key: 'technology', label: 'Tecnología', value: 2 }
    ]
  }
]
