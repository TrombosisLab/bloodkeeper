import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const moduleSource = await readFile(
  new URL(
    '../src/chronicles/chronicles.module.ts',
    import.meta.url,
  ),
  'utf8',
)

const appModule = await readFile(
  new URL(
    '../src/app.module.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '030-B registra repositorio, casos de uso y controlador',
  () => {
    assert.match(
      moduleSource,
      /ChronicleController/,
    )
    assert.match(
      moduleSource,
      /provide: CHRONICLE_REPOSITORY/,
    )
    assert.match(
      moduleSource,
      /useExisting:\s*PrismaChronicleRepository/,
    )
    assert.match(
      moduleSource,
      /CreateChronicleUseCase/,
    )
    assert.match(
      moduleSource,
      /ListChroniclesUseCase/,
    )
  },
)

test(
  '030-B conecta ChroniclesModule con la aplicación',
  () => {
    assert.match(
      appModule,
      /import \{ ChroniclesModule \}/,
    )
    assert.match(
      appModule,
      /imports:[\s\S]*ChroniclesModule/,
    )
  },
)
