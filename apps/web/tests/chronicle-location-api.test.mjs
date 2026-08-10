import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const api = await readFile(
  new URL(
    '../src/features/chronicles/infrastructure/chronicle.api.ts',
    import.meta.url,
  ),
  'utf8',
)

const types = await readFile(
  new URL(
    '../src/features/chronicles/types/chronicle-api.types.ts',
    import.meta.url,
  ),
  'utf8',
)

const locationTypesStart =
  types.indexOf(
    'export type ChronicleLocationApiStatus',
  )
const locationTypesEnd =
  types.indexOf(
    'export type ChronicleEventApiStatus',
    locationTypesStart,
  )
const locationTypes =
  types.slice(
    locationTypesStart,
    locationTypesEnd,
  )

test(
  '033-C Web modela Localización con jerarquía y privacidad narrativa',
  () => {
    for (const token of [
      'ChronicleLocationApiSnapshot',
      'parentLocationId',
      'narratorNotes',
      'active',
      'archived',
    ]) {
      assert.match(
        types,
        new RegExp(token),
      )
    }
  },
)

test(
  '033-C gateway implementa listar consultar crear editar y archivar',
  () => {
    for (const method of [
      'locations(',
      'location(',
      'createLocation(',
      'updateLocation(',
      'archiveLocation(',
    ]) {
      assert.match(
        api,
        new RegExp(
          method.replace(
            '(',
            '\\(',
          ),
        ),
      )
    }

    assert.match(
      api,
      /\/api\/chronicles\/\$\{chronicleId\}\/locations/,
    )
    assert.match(
      api,
      /\/locations\/\$\{locationId\}\/archive/,
    )
  },
)

test(
  '033-C parser valida respuesta exacta sin recursos futuros',
  () => {
    assert.match(
      api,
      /parseChronicleLocationResponse/,
    )

    for (const field of [
      'parentLocationId',
      'category',
      'description',
      'narratorNotes',
      'createdAt',
      'updatedAt',
    ]) {
      assert.match(
        api,
        new RegExp(field),
      )
    }

    assert.doesNotMatch(
      locationTypes,
      /npcId|characterId|eventId|sessionId|latitude|longitude|geometry|geography/,
    )
  },
)
