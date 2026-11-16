import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const types = await readFile(
  new URL(
    '../src/features/chronicles/types/chronicle-api.types.ts',
    import.meta.url,
  ),
  'utf8',
)

const gateway = await readFile(
  new URL(
    '../src/features/chronicles/infrastructure/chronicle.api.ts',
    import.meta.url,
  ),
  'utf8',
)

const sessionPanel = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleSessionPanel.tsx',
    import.meta.url,
  ),
  'utf8',
)

const preparationWorkspace = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleSessionPreparationWorkspace.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  '035-C modela snapshot y requests exactos de Sesion',
  () => {
    const sessionTypes =
      types.slice(
        types.indexOf(
          'export type ChronicleSessionApiStatus',
        ),
      )

    for (const field of [
      'sessionNumber',
      'title',
      'realDate',
      'status',
      'summary',
      'narratorNotes',
      'objective',
      'plannedSummary',
      'createdAt',
      'updatedAt',
    ]) {
      assert.match(
        sessionTypes,
        new RegExp(`\\b${field}\\b`),
      )
    }

    assert.doesNotMatch(
      sessionTypes,
      /eventId|npcId|locationId|characterId|dice|activeSession|shared/i,
    )
  },
)

test(
  'objetivo, preparacion, resumen real y notas privadas conservan campos independientes',
  () => {
    for (const field of [
      'objective',
      'plannedSummary',
      'summary',
      'narratorNotes',
    ]) {
      assert.ok(sessionPanel.includes(`form.${field}`))
      assert.ok(sessionPanel.includes(`session.${field}`))
    }

    assert.ok(sessionPanel.includes('objective: optionalText(form.objective)'))
    assert.ok(sessionPanel.includes('plannedSummary: optionalText(form.plannedSummary)'))
    assert.match(gateway, /!isStringOrNull\(value\.objective\)/)
    assert.match(gateway, /!isStringOrNull\(value\.plannedSummary\)/)
    assert.match(preparationWorkspace, /OBJETIVO DE LA SESIÓN[\s\S]*session\.objective/)
    assert.match(preparationWorkspace, /RESUMEN PREVISTO · SOLO NARRADOR[\s\S]*session\.plannedSummary/)
    assert.doesNotMatch(preparationWorkspace, /session\.summary|session\.narratorNotes/)
  },
)

test(
  'la edición deja claras las diferencias entre preparacion y relato jugado',
  () => {
    for (const label of [
      'Objetivo de la sesión',
      'Resumen previsto · preparación privada',
      'Resumen de lo sucedido',
      'Notas privadas del Narrador · secretos y recordatorios',
    ]) {
      assert.ok(sessionPanel.includes(label), `falta etiqueta: ${label}`)
    }
  },
)

test(
  '035-C parser valida numero fecha opcional y tres estados',
  () => {
    assert.match(
      gateway,
      /parseChronicleSessionResponse/,
    )
    assert.match(
      gateway,
      /value\.sessionNumber === null[\s\S]*Number\.isInteger\(value\.sessionNumber\)[\s\S]*value\.sessionNumber >= 0/,
    )
    assert.match(
      gateway,
      /value\.realDate === null[\s\S]*validTimestamp\(value\.realDate\)/,
    )
    assert.match(
      gateway,
      /value\.status === 'preparation'[\s\S]*value\.status === 'completed'[\s\S]*value\.status === 'archived'/,
    )
  },
)

test(
  '035-C gateway expone list detail create update complete archive',
  () => {
    for (const method of [
      'sessions(',
      'session(',
      'createSession(',
      'updateSession(',
      'completeSession(',
      'archiveSession(',
    ]) {
      assert.match(
        gateway,
        new RegExp(
          method.replace('(', '\\('),
        ),
      )
    }
  },
)

test(
  '035-C gateway usa endpoints backend exactos',
  () => {
    assert.match(
      gateway,
      /\/sessions\?limit=\$\{limit\}&offset=\$\{offset\}`/,
    )
    assert.match(
      gateway,
      /\/sessions\/\$\{sessionId\}`/,
    )
    assert.match(
      gateway,
      /\/sessions\/\$\{sessionId\}\/complete`/,
    )
    assert.match(
      gateway,
      /\/sessions\/\$\{sessionId\}\/archive`/,
    )
  },
)

test(
  '035-C escrituras usan POST PATCH y JSON sin DELETE',
  () => {
    assert.match(
      gateway,
      /async createSession[\s\S]*method: 'POST'/,
    )
    for (const method of [
      'updateSession',
      'completeSession',
      'archiveSession',
    ]) {
      assert.match(
        gateway,
        new RegExp(
          `async ${method}[\\s\\S]*method: 'PATCH'`,
        ),
      )
    }
    assert.doesNotMatch(
      gateway,
      /async deleteSession|method: 'DELETE'[\s\S]*sessions/,
    )
  },
)
