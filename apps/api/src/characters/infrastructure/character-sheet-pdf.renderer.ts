import {
  readFile,
} from 'node:fs/promises'

import {
  join,
} from 'node:path'

import {
  characterAdvantageCatalog,
  characterBloodResonanceCatalog,
  characterDisciplineCatalog,
  characterSkillCatalog,
} from '@v5r/character-rules'

import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFTextField,
  StandardFonts,
} from 'pdf-lib'

import type {
  PDFField,
  PDFFont,
  PDFForm,
} from 'pdf-lib'

import type {
  CharacterSheetPdfFormat,
  CharacterSheetPdfRenderer,
  CharacterSheetPdfSnapshot,
} from '../application/character-sheet-pdf.types'

import type {
  PersistedCharacterAdvantageDetails,
  PersistedCharacterAdvantageSelection,
  PersistedCharacterDiscipline,
} from '../domain/persisted-character.types'

const templatePath = join(
  process.cwd(),
  'assets',
  'character-sheet',
  'Basica_V5_ByN_Editable.pdf',
)

function normalized(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
}

function humanize(value: string | null): string {
  if (value === null) return ''

  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/^./, (first) =>
      first.toLocaleUpperCase('es'),
    )
}

class TemplateFields {
  private readonly byName =
    new Map<string, PDFField>()

  constructor(
    private readonly form: PDFForm,
  ) {
    for (const field of form.getFields()) {
      this.byName.set(
        normalized(field.getName()),
        field,
      )
    }
  }

  private find(
    ...names: string[]
  ): PDFField | null {
    for (const name of names) {
      const field = this.byName.get(
        normalized(name),
      )

      if (field !== undefined) {
        return field
      }
    }

    return null
  }

  text(
    names: string | readonly string[],
    value: string | number | null,
  ): void {
    const candidates =
      typeof names === 'string'
        ? [names]
        : [...names]

    const field = this.find(...candidates)

    if (!(field instanceof PDFTextField)) {
      return
    }

    field.setText(
      value === null ? '' : String(value),
    )
  }

  choice(
    names: string | readonly string[],
    value: string | null,
  ): void {
    if (value === null || value === '') return

    const candidates =
      typeof names === 'string'
        ? [names]
        : [...names]

    const field = this.find(...candidates)

    if (
      !(field instanceof PDFDropdown) &&
      !(field instanceof PDFOptionList)
    ) {
      return
    }

    if (!field.getOptions().includes(value)) {
      field.addOptions(value)
    }

    field.select(value)
  }

  check(name: string): void {
    const field = this.find(name)

    if (field instanceof PDFCheckBox) {
      field.check()
    }
  }

  rating(
    fieldNames: readonly string[],
    value: number,
  ): void {
    const bounded = Math.max(
      0,
      Math.min(fieldNames.length, value),
    )

    fieldNames
      .slice(0, bounded)
      .forEach((name) => this.check(name))
  }
}

function five(
  first: number,
  alternate = false,
): readonly string[] {
  const suffix = alternate ? 'qb' : 'b'

  return [
    `dot${first}${suffix}`,
    `dot${first + 1}${suffix}`,
    `dot${first + 2}${suffix}`,
    `dot${first + 3}${suffix}`,
    alternate
      ? `dot${first + 3}qab`
      : `dot${first + 3}ab`,
  ]
}

function backgroundFive(
  first: number,
): readonly string[] {
  const last = first + 2
  return [
    `dot${first}`,
    `dot${first + 1}`,
    `dot${last}`,
    `dot${last}a`,
    `dot${last}az`,
  ]
}

const attributeFields = {
  strength: five(5),
  dexterity: five(13),
  stamina: five(21),
  charisma: five(29),
  manipulation: five(37),
  composure: five(45),
  intelligence: five(53),
  wits: five(61),
  resolve: five(69),
} as const

const skillRows = [
  ['firearms', 77, 'abilities1b'],
  ['craft', 85, 'abilities2b'],
  ['athletics', 93, 'abilities3b'],
  ['drive', 101, 'abilities4b'],
  ['larceny', 109, 'abilities5b'],
  ['brawl', 117, 'abilities6b'],
  ['melee', 125, 'abilities7b'],
  ['stealth', 133, 'abilities8b'],
  ['survival', 141, 'abilities9b'],
  ['streetwise', 157, 'abilities11b'],
  ['etiquette', 165, 'abilities12b'],
  ['performance', 173, 'abilities13b'],
  ['intimidation', 181, 'abilities14b'],
  ['leadership', 189, 'abilities15b'],
  ['insight', 197, 'abilities16b'],
  ['persuasion', 205, 'abilities17b'],
  ['subterfuge', 213, 'abilities18b'],
  ['animalKen', 221, 'abilities19b'],
  ['academics', 237, 'abilities21b'],
  ['science', 245, 'abilities22b'],
  ['awareness', 253, 'abilities23b'],
  ['finance', 261, 'abilities24b'],
  ['investigation', 269, 'abilities25b'],
  ['medicine', 277, 'abilities26b'],
  ['occult', 285, 'abilities27b'],
  ['politics', 293, 'abilities28b'],
  ['technology', 301, 'abilities29b'],
] as const

const disciplineRows = [
  {
    field: '1',
    rating: five(149),
    powerPrefix: '1',
  },
  {
    field: '2',
    rating: five(229),
    powerPrefix: '2',
  },
  {
    field: '3',
    rating: five(149, true),
    powerPrefix: '3',
  },
  {
    field: '4',
    rating: five(229, true),
    powerPrefix: '4',
  },
  {
    field: '5',
    rating: five(309),
    powerPrefix: '5',
  },
  {
    field: '6',
    rating: five(309, true),
    powerPrefix: '6',
  },
] as const

const backgroundRatingFields = [
  backgroundFive(62),
  backgroundFive(70),
  backgroundFive(78),
  backgroundFive(86),
  backgroundFive(94),
  backgroundFive(102),
  backgroundFive(110),
  backgroundFive(118),
  backgroundFive(126),
  backgroundFive(134),
] as const

function labelFromCatalog(
  key: string,
  definitions: readonly {
    readonly key: string
    readonly name: string
  }[],
): string {
  return (
    definitions.find(
      (definition) => definition.key === key,
    )?.name ?? humanize(key)
  )
}

function detailsText(
  details: PersistedCharacterAdvantageDetails | null,
): string {
  if (details === null) return ''

  return Object.entries(details)
    .filter(([key]) => key !== 'kind')
    .flatMap(([, value]) =>
      Array.isArray(value)
        ? value.map(String)
        : typeof value === 'string' ||
            typeof value === 'number'
          ? [String(value)]
          : [],
    )
    .filter((value) => value.trim() !== '')
    .join(', ')
}

function aggregateDisciplines(
  values: readonly PersistedCharacterDiscipline[],
): readonly PersistedCharacterDiscipline[] {
  const aggregate =
    new Map<string, PersistedCharacterDiscipline>()

  for (const value of values) {
    const current = aggregate.get(
      value.disciplineKey,
    )

    if (current === undefined) {
      aggregate.set(value.disciplineKey, {
        ...value,
        powerKeys: [...value.powerKeys],
      })
      continue
    }

    aggregate.set(value.disciplineKey, {
      ...current,
      rating: current.rating + value.rating,
      powerKeys: Array.from(
        new Set([
          ...current.powerKeys,
          ...value.powerKeys,
        ]),
      ),
    })
  }

  return Array.from(aggregate.values())
}

function fillIdentity(
  fields: TemplateFields,
  snapshot: CharacterSheetPdfSnapshot,
): void {
  const { character } = snapshot

  fields.text('name', character.identity.name)
  fields.choice(
    ['Concepto', 'concept'],
    character.identity.concept,
  )
  fields.text('chronicle', '')
  fields.text('ambition', character.identity.ambition)
  fields.text('desire', character.identity.desire)
  fields.choice(
    ['Depredador', 'predator'],
    humanize(character.identity.predatorTypeKey),
  )
  fields.choice(
    ['Clan', 'clan'],
    humanize(character.identity.clanKey),
  )
  fields.choice(
    ['Generación', 'generation'],
    character.identity.generation === null
      ? null
      : String(character.identity.generation),
  )
  fields.text('sire', character.identity.sire)
}

function fillRatings(
  fields: TemplateFields,
  snapshot: CharacterSheetPdfSnapshot,
): void {
  const { character } = snapshot

  for (const [key, names] of Object.entries(
    attributeFields,
  )) {
    fields.rating(
      names,
      character.attributes[
        key as keyof typeof character.attributes
      ],
    )
  }

  const specialties = new Map<string, string[]>()

  for (const specialty of character.skillSpecialties) {
    const current =
      specialties.get(specialty.skillKey) ?? []
    current.push(specialty.name)
    specialties.set(specialty.skillKey, current)
  }

  for (
    const [key, first, specialtyField]
    of skillRows
  ) {
    fields.rating(
      five(first),
      character.skills[key],
    )
    fields.text(
      specialtyField,
      (specialties.get(key) ?? []).join(', '),
    )
  }
}

function fillNarrative(
  fields: TemplateFields,
  snapshot: CharacterSheetPdfSnapshot,
): void {
  const { character } = snapshot
  const narrative = [
    ...character.humanity.convictions.map(
      (value) => value.text,
    ),
    ...character.humanity.touchstones.map(
      (value) =>
        `${value.name}: ${value.relationship}`,
    ),
  ]

  narrative.slice(0, 6).forEach((value, index) => {
    fields.text(`TC${index + 1}`, value)
  })
}

function fillDisciplines(
  fields: TemplateFields,
  snapshot: CharacterSheetPdfSnapshot,
): void {
  const values = aggregateDisciplines(
    snapshot.character.disciplines,
  )

  values.slice(0, disciplineRows.length)
    .forEach((value, index) => {
      const row = disciplineRows[index]
      const label = labelFromCatalog(
        value.disciplineKey,
        characterDisciplineCatalog.disciplines,
      )

      fields.choice(
        [`Disciplina.${row.field}`, row.field],
        label,
      )
      fields.rating(row.rating, value.rating)

      value.powerKeys.slice(0, 5)
        .forEach((powerKey, powerIndex) => {
          const letter =
            String.fromCharCode(65 + powerIndex)
          fields.choice(
            [
              `Nivel.${row.powerPrefix}${letter}`,
              `${row.powerPrefix}${letter}`,
            ],
            labelFromCatalog(
              powerKey,
              characterDisciplineCatalog.powers,
            ),
          )
        })
    })

  snapshot.character.bloodSorceryRituals
    .ritualKeys.slice(0, 10)
    .forEach((key, index) => {
      const definition =
        characterDisciplineCatalog
          .bloodSorceryRituals.find(
            (value) => value.key === key,
          )
      const row = index + 1
      fields.choice(
        [`riutals${row}`, `rituals${row}`],
        definition?.name ?? humanize(key),
      )
      fields.choice(
        [`RitNivel.${row}`, `RitNivel${row}`],
        definition === undefined
          ? null
          : String(definition.level),
      )
    })
}

function fillTracks(
  fields: TemplateFields,
  snapshot: CharacterSheetPdfSnapshot,
): void {
  const { character } = snapshot
  const healthDamage =
    character.damage.health.superficial +
    character.damage.health.aggravated
  const willpowerDamage =
    character.damage.willpower.superficial +
    character.damage.willpower.aggravated

  fields.rating(
    Array.from(
      { length: 15 },
      (_, index) => `check${index + 1}`,
    ),
    healthDamage,
  )
  fields.rating(
    Array.from(
      { length: 15 },
      (_, index) => `check${index + 16}`,
    ),
    willpowerDamage,
  )
  fields.rating(
    Array.from(
      { length: 10 },
      (_, index) => `check${index + 31}`,
    ),
    character.humanity.value,
  )
  fields.rating(
    Array.from(
      { length: 5 },
      (_, index) => `check${index + 41}`,
    ),
    character.blood?.hunger ?? 0,
  )
  fields.rating(
    Array.from(
      { length: 10 },
      (_, index) => `hdot${index + 1}`,
    ),
    character.blood?.bloodPotency ?? 0,
  )

  const resonanceKey =
    character.blood?.resonance?.resonanceKey ?? null
  const resonance = resonanceKey === null
    ? null
    : labelFromCatalog(
        resonanceKey,
        characterBloodResonanceCatalog.resonances,
      )

  fields.choice('resonance', resonance)
  fields.choice(
    'ReservaCaza',
    humanize(character.identity.predatorTypeKey),
  )
}

function fillAdvantages(
  fields: TemplateFields,
  selections:
    readonly PersistedCharacterAdvantageSelection[],
): void {
  const byCategory = (
    category: PersistedCharacterAdvantageSelection['category'],
  ) => selections.filter(
    (value) => value.category === category,
  )

  const definitions =
    characterAdvantageCatalog.definitions

  const merits = byCategory('merit').slice(0, 15)
  const flaws = byCategory('flaw').slice(0, 15)
  const backgrounds =
    byCategory('background').slice(0, 10)

  merits.forEach((value, index) => {
    fields.choice(
      [`Méritos.${index}`, `Meritos.${index}`],
      labelFromCatalog(value.definitionKey, definitions),
    )
    for (let rating = 1; rating <= value.rating; rating += 1) {
      fields.check(`p.Mer.${rating}.${index}`)
    }
  })

  flaws.forEach((value, index) => {
    fields.choice(
      `Defectos.${index}`,
      labelFromCatalog(value.definitionKey, definitions),
    )
    for (let rating = 1; rating <= value.rating; rating += 1) {
      fields.check(`p.Def.${rating}.${index}`)
    }
  })

  backgrounds.forEach((value, index) => {
    fields.choice(
      `backgrounds${index + 1}`,
      labelFromCatalog(value.definitionKey, definitions),
    )
    fields.rating(
      backgroundRatingFields[index],
      value.rating,
    )
    fields.text(
      `BGtext${1 + index * 8}`,
      detailsText(value.details),
    )
  })
}

function fillSecondary(
  fields: TemplateFields,
  snapshot: CharacterSheetPdfSnapshot,
): void {
  const secondary = snapshot.secondary

  if (secondary === null) return

  secondary.inventory
    .filter((item) => item.status === 'active')
    .slice(0, 24)
    .forEach((item, index) => {
      fields.text(
        `possessions${index + 1}`,
        item.quantity > 1
          ? `${item.name} x${item.quantity}`
          : item.name,
      )
    })

  secondary.history.slice(0, 15)
    .forEach((entry, index) => {
      fields.text(`history${index + 1}`, entry.title)
      fields.text(
        `description${index + 1}`,
        entry.description,
      )
    })

  secondary.notes.slice(0, 7)
    .forEach((note, index) => {
      fields.text(
        `description${index + 16}`,
        note.content,
      )
    })
}

function fillExperience(
  fields: TemplateFields,
  snapshot: CharacterSheetPdfSnapshot,
): void {
  fields.text('exp1', snapshot.experience.total)
  fields.text('exp2', snapshot.experience.spent)
}

function updateAppearances(
  form: PDFForm,
  font: PDFFont,
): void {
  for (const field of form.getFields()) {
    if (
      field instanceof PDFTextField ||
      field instanceof PDFDropdown ||
      field instanceof PDFOptionList
    ) {
      try {
        field.updateAppearances(font)
      } catch {
        // Some legacy parent fields do not expose a terminal widget.
      }
    }
  }
}

export class PdfLibCharacterSheetPdfRenderer
  implements CharacterSheetPdfRenderer {
  async render(
    snapshot: CharacterSheetPdfSnapshot,
    format: CharacterSheetPdfFormat,
  ): Promise<Uint8Array> {
    const source = await readFile(templatePath)
    const document = await PDFDocument.load(
      source,
      { updateMetadata: false },
    )
    const form = document.getForm()

    if (form.getFields().length < 850) {
      throw new Error(
        'CHARACTER_SHEET_PDF_TEMPLATE_INVALID',
      )
    }

    const fields = new TemplateFields(form)

    fillIdentity(fields, snapshot)
    fillRatings(fields, snapshot)
    fillNarrative(fields, snapshot)
    fillDisciplines(fields, snapshot)
    fillTracks(fields, snapshot)
    fillAdvantages(
      fields,
      snapshot.character.advantages.selections,
    )
    fillSecondary(fields, snapshot)
    fillExperience(fields, snapshot)

    document.setTitle(
      `${snapshot.character.identity.name} - Vampiro V5`,
    )
    document.setSubject(
      'Ficha de personaje exportada por BloodKeeper',
    )
    document.setProducer('BloodKeeper')
    document.setCreator('BloodKeeper')
    document.setModificationDate(new Date())

    const font = await document.embedFont(
      StandardFonts.Helvetica,
    )
    updateAppearances(form, font)

    if (format === 'print') {
      form.flatten()
    }

    return document.save({
      addDefaultPage: false,
      updateFieldAppearances: false,
      useObjectStreams: false,
    })
  }
}
