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

const dto =
  await readFile(
    new URL(
      '../src/chronicles/presentation/chronicle.dto.ts',
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
  '030-C publica PATCH explícito de lifecycle',
  () => {
    assert.match(
      controller,
      /@Patch\(':chronicleId\/lifecycle'\)/,
    )
    assert.match(
      controller,
      /parseChronicleIdParam/,
    )
    assert.match(
      controller,
      /parseChronicleLifecycleRequest/,
    )
    assert.match(
      controller,
      /TransitionChronicleLifecycleUseCase/,
    )
  },
)

test(
  '030-C limita el destino HTTP a active o archived',
  () => {
    assert.match(
      dto,
      /nextStatus !== 'active'/,
    )
    assert.match(
      dto,
      /nextStatus !== 'archived'/,
    )
    assert.doesNotMatch(
      dto,
      /nextStatus !== 'preparation'/,
    )
  },
)

test(
  '030-C conserva autenticación Narrador y traduce rechazos/conflictos',
  () => {
    assert.match(
      controller,
      /roles\.includes\('narrator'\)/,
    )
    assert.match(
      controller,
      /CHRONICLE_LIFECYCLE_TRANSITION_REJECTED/,
    )
    assert.match(
      controller,
      /CHRONICLE_LIFECYCLE_WRITE_CONFLICT/,
    )
  },
)

test(
  '030-C registra el caso de uso en ChroniclesModule',
  () => {
    assert.match(
      moduleSource,
      /TransitionChronicleLifecycleUseCase/,
    )
    assert.match(
      moduleSource,
      /new TransitionChronicleLifecycleUseCase/,
    )
  },
)
