import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import {
  PDFDocument,
} from 'pdf-lib'

import {
  characterSkillCatalog,
} from '@v5r/character-rules'

import {
  CharacterSheetPdfNotFoundError,
  ExportCharacterSheetPdfUseCase,
} from '../dist/characters/application/export-character-sheet-pdf.use-case.js'

import {
  PdfLibCharacterSheetPdfRenderer,
} from '../dist/characters/infrastructure/character-sheet-pdf.renderer.js'

const controllerSource = fs.readFileSync(
  new URL(
    '../src/characters/presentation/character-sheet-pdf.controller.ts',
    import.meta.url,
  ),
  'utf8',
)

const moduleSource = fs.readFileSync(
  new URL(
    '../src/characters/characters.module.ts',
    import.meta.url,
  ),
  'utf8',
)

const template = new URL(
  '../assets/character-sheet/Basica_V5_ByN_Editable.pdf',
  import.meta.url,
)

function snapshot() {
  return {
    character: {
      characterId: '10000000-0000-4000-8000-000000000001',
      ownerId: '20000000-0000-4000-8000-000000000001',
      chronicleId: null,
      status: 'active',
      nature: 'vampire',
      revision: 7,
      createdAt: new Date('2026-09-01T10:00:00Z'),
      updatedAt: new Date('2026-09-01T11:00:00Z'),
      identity: {
        name: 'Nadia Rojas',
        concept: 'Mecánica y agitadora',
        predatorTypeKey: 'alleycat',
        ambition: 'Liberar el barrio',
        clanKey: 'brujah',
        sire: 'Desconocido',
        desire: 'Proteger a la coterie',
        generation: 12,
        ageCategory: 'neonate',
      },
      creation: {
        schemaVersion: 1,
        currentStep: 'review',
        creationMode: 'standard',
        skillDistributionMethod: 'balanced',
        predatorTypeChoices: {},
        updatedAt: new Date('2026-09-01T11:00:00Z'),
      },
      attributes: {
        strength: 3,
        dexterity: 2,
        stamina: 3,
        charisma: 2,
        manipulation: 1,
        composure: 3,
        intelligence: 2,
        wits: 3,
        resolve: 3,
      },
      blood: {
        bloodPotency: 1,
        hunger: 2,
        resonance: null,
        dyscrasia: null,
      },
      damage: {
        health: { superficial: 1, aggravated: 0 },
        willpower: { superficial: 1, aggravated: 0 },
      },
      skills: Object.fromEntries(
        characterSkillCatalog.definitions.map(
          ({ key }) => [key, key === 'athletics' ? 3 : 1],
        ),
      ),
      skillSpecialties: [
        {
          id: 'specialty-1',
          skillKey: 'craft',
          name: 'Motocicletas',
          origin: 'creation',
        },
      ],
      disciplines: [
        {
          disciplineKey: 'potence',
          rating: 2,
          powerKeys: [],
          origin: 'creation',
        },
      ],
      bloodSorceryRituals: { ritualKeys: [] },
      oblivionCeremonies: { ceremonyKeys: [] },
      thinBloodAlchemy: null,
      thinBloodTraits: [],
      advantages: {
        selections: [],
      },
      humanity: {
        value: 7,
        stains: 0,
        convictions: [
          {
            convictionId: 'conviction-1',
            text: 'Nunca abandones a los tuyos',
            touchstoneId: null,
          },
        ],
        touchstones: [],
      },
    },
    secondary: {
      characterId: '10000000-0000-4000-8000-000000000001',
      revision: 1,
      inventory: [
        {
          id: 'inventory-1',
          name: 'Juego de herramientas',
          quantity: 1,
          description: null,
          category: 'equipo',
          notes: null,
          status: 'active',
        },
      ],
      notes: [],
      history: [
        {
          id: 'history-1',
          title: 'El taller',
          description: 'Su refugio entre motores.',
        },
      ],
    },
    experience: {
      characterId: '10000000-0000-4000-8000-000000000001',
      total: 3,
      spent: 1,
      available: 2,
      movements: [],
    },
  }
}

test('SPEC-065 registra ruta, proveedor y plantilla', () => {
  assert.match(
    controllerSource,
    /@Get\(':characterId\/sheet\.pdf'\)/,
  )
  assert.match(controllerSource, /application\/pdf/)
  assert.match(controllerSource, /AUTHENTICATION_REQUIRED/)
  assert.match(controllerSource, /CHARACTER_DRAFT_NOT_FOUND/)
  assert.match(moduleSource, /CharacterSheetPdfController/)
  assert.match(moduleSource, /PdfLibCharacterSheetPdfRenderer/)
  assert.equal(fs.existsSync(template), true)
})

test('SPEC-065 verifica propiedad antes de consultar datos asociados', async () => {
  let secondaryReads = 0
  let experienceReads = 0

  const useCase = new ExportCharacterSheetPdfUseCase(
    { findById: async () => null },
    { findByCharacterId: async () => { secondaryReads += 1 } },
    { loadLedger: async () => { experienceReads += 1 } },
    { render: async () => new Uint8Array() },
  )

  await assert.rejects(
    useCase.execute('owner', 'character', 'editable'),
    CharacterSheetPdfNotFoundError,
  )
  assert.equal(secondaryReads, 0)
  assert.equal(experienceReads, 0)
})

test('SPEC-065 rellena la plantilla editable con datos canónicos', async () => {
  const renderer = new PdfLibCharacterSheetPdfRenderer()
  const bytes = await renderer.render(snapshot(), 'editable')
  const document = await PDFDocument.load(bytes)
  const form = document.getForm()

  assert.ok(form.getFields().length >= 850)
  assert.equal(form.getTextField('name').getText(), 'Nadia Rojas')
  assert.equal(form.getTextField('exp1').getText(), '3')
  assert.equal(form.getTextField('exp2').getText(), '1')
  assert.equal(
    form.getTextField('possessions1').getText(),
    'Juego de herramientas',
  )
})

test('SPEC-065 aplana la variante destinada a impresión', async () => {
  const renderer = new PdfLibCharacterSheetPdfRenderer()
  const bytes = await renderer.render(snapshot(), 'print')
  const document = await PDFDocument.load(bytes)

  assert.equal(document.getForm().getFields().length, 0)
})
