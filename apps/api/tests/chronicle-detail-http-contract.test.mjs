import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const controller =
  await readFile(
    new URL(
      '../src/chronicles/presentation/chronicle.controller.ts',
      import.meta.url,
    ),
    'utf8',
  )

const moduleSource =
  await readFile(
    new URL(
      '../src/chronicles/chronicles.module.ts',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '030-D publica GET /chronicles/:chronicleId',
  () => {
    assert.match(
      controller,
      /@Get\(':chronicleId'\)/,
    )
    assert.match(
      controller,
      /async detail\(/,
    )
    assert.match(
      controller,
      /parseChronicleIdParam/,
    )
    assert.match(
      controller,
      /this\.loadChronicle\.execute/,
    )
  },
)

test(
  '030-D conserva autorización de Narrador y oculta crónicas ajenas',
  () => {
    assert.match(
      controller,
      /roles\.includes\('narrator'\)/,
    )
    assert.match(
      controller,
      /CHRONICLE_NOT_FOUND/,
    )
  },
)

test(
  '030-D registra LoadChronicleUseCase en el módulo',
  () => {
    assert.match(
      moduleSource,
      /LoadChronicleUseCase/,
    )
    assert.match(
      moduleSource,
      /new LoadChronicleUseCase/,
    )
  },
)
