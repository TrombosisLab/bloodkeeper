import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(
  new URL(
    '../src/features/chronicles/components/' +
      'ChronicleListCreate.tsx',
    import.meta.url,
  ),
  'utf8',
)

const main = await readFile(
  new URL(
    '../src/main.tsx',
    import.meta.url,
  ),
  'utf8',
)

const navigationTypes = await readFile(
  new URL(
    '../src/features/navigation/types/' +
      'app-navigation.types.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '031-D conserva creación condicionada y listado que abre el panel real',
  () => {
    assert.match(
      component,
      /gateway\.create/,
    )
    assert.match(
      component,
      /gateway\.listPage/,
    )
    assert.match(
      component,
      /Nueva crónica/,
    )
    assert.match(
      component,
      /Tus crónicas/,
    )
    assert.doesNotMatch(
      component,
      /Participantes|PNJ|Localizaciones|Eventos|Línea temporal|Sesiones/,
    )
  },
)

test(
  '030-B integra una navegación separada de Personajes',
  () => {
    assert.match(
      navigationTypes,
      /\| 'chronicles'/,
    )
    assert.match(
      main,
      /<ChronicleListCreate/,
    )
    assert.match(
      main,
      /aria-label="Secciones principales"/,
    )
  },
)

test(
  '030-B mantiene el formulario accesible y evita nombres vacíos',
  () => {
    assert.match(
      component,
      /aria-labelledby="chronicle-create-title"/,
    )
    assert.match(component, /required/)
    assert.match(
      component,
      /name\.trim\(\)\.length === 0/,
    )
    assert.match(
      component,
      /role="alert"/,
    )
  },
)
