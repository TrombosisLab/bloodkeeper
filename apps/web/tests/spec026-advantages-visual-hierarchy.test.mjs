import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const advantagesStep = await readFile(
  new URL(
    '../src/features/character-creation/components/AdvantagesStep.tsx',
    import.meta.url,
  ),
  'utf8',
)

const loresheetSelector = await readFile(
  new URL(
    '../src/features/character-creation/components/advantages/LoresheetSelector.tsx',
    import.meta.url,
  ),
  'utf8',
)

const styles = await readFile(
  new URL(
    '../src/styles/character-creation.css',
    import.meta.url,
  ),
  'utf8',
)

test(
  'SPEC-026 UI oculta del catálogo general elementos ligados a un Trasfondo',
  () => {
    assert.match(
      advantagesStep,
      /!definition\.allowedParentDefinitionKeys[\s\S]*?\.length/,
    )

    assert.match(
      advantagesStep,
      /allowedParentDefinitionKeys\?\.\s*includes\([\s\S]*?parentDefinitionKey/,
    )
  },
)

test(
  'SPEC-026 UI mantiene Méritos y Defectos de Refugio detrás de una selección de Refugio',
  () => {
    assert.match(
      advantagesStep,
      /selection\.definitionKey === 'haven'[\s\S]*?Mejoras de Refugio/,
    )

    assert.match(
      advantagesStep,
      /selection\.definitionKey === 'haven'[\s\S]*?Defectos de Refugio/,
    )

    assert.match(
      advantagesStep,
      /getChildAdvantageDefinitionsByCategory\([\s\S]*?'haven'[\s\S]*?'flaw'/,
    )
  },
)

test(
  'SPEC-026 UI separa visualmente Trasfondos Loresheets Méritos y Defectos',
  () => {
    assert.match(
      advantagesStep,
      /advantages-category advantages-category--\$\{category\}/,
    )

    assert.match(
      loresheetSelector,
      /advantages-category--loresheet/,
    )

    for (const selector of [
      '.advantages-category--background',
      '.advantages-category--haven-merits',
      '.advantages-category--haven-flaws',
      '.advantages-category--loresheet',
      '.advantages-category--merit',
      '.advantages-category--flaw',
    ]) {
      assert.equal(
        styles.includes(selector),
        true,
        `Falta ${selector}`,
      )
    }
  },
)

test(
  'SPEC-026 UI mantiene el catálogo compacto y configura Trasfondos fuera de la cuadrícula',
  () => {
    assert.match(
      advantagesStep,
      /category !== 'background'[\s\S]*?!simple[\s\S]*?selections\.map/,
    )

    assert.match(
      advantagesStep,
      /advantages-background-configurations/,
    )

    assert.match(
      advantagesStep,
      /<details[\s\S]*?advantages-background-configuration[\s\S]*?open/,
    )

    assert.match(
      advantagesStep,
      /Configuración de Trasfondos/,
    )

    assert.match(
      styles,
      /\.advantages-background-configurations__grid[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/,
    )

    assert.match(
      styles,
      /\.advantages-step > \.advantages-background-configurations[\s\S]*?order:\s*11/,
    )
  },
)

test(
  'SPEC-026 UI permite contraer conjuntamente la configuración adicional de Refugio',
  () => {
    assert.match(
      advantagesStep,
      /havenConfigurationOpen/,
    )

    assert.match(
      advantagesStep,
      /setHavenConfigurationOpen/,
    )

    assert.match(
      advantagesStep,
      /aria-expanded=\{[\s\S]*?havenConfigurationOpen/,
    )

    assert.match(
      advantagesStep,
      /havenConfigurationOpen[\s\S]*?Contraer[\s\S]*?Desplegar/,
    )

    const gatedSections =
      advantagesStep.match(
        /\.length > 0 &&\s*havenConfigurationOpen && \(/g,
      ) ?? []

    assert.equal(
      gatedSections.length,
      2,
    )

    assert.match(
      styles,
      /\.advantages-step > \.advantages-haven-configuration-toggle[\s\S]*?order:\s*12/,
    )
  },
)

test(
  'SPEC-026 UI integra botón de Refugio y selector Loresheet con el lenguaje visual del creador',
  () => {
    assert.match(
      advantagesStep,
      /advantages-haven-configuration-toggle__button/,
    )

    assert.match(
      loresheetSelector,
      /loresheet-selector-menu__trigger/,
    )

    const authStyles = readFileSync(
      new URL(
        '../src/features/authentication/components/authentication-gate.css',
        import.meta.url,
      ),
      'utf8',
    )

    const logoutRule =
      authStyles.match(
        /\.authentication-session button\s*\{([^}]*)\}/,
      )?.[1]

    const havenRule =
      styles.match(
        /\.advantages-haven-configuration-toggle__button\s*\{([^}]*)\}/,
      )?.[1]

    assert.ok(logoutRule)
    assert.ok(havenRule)

    assert.equal(
      havenRule.replace(/\s+/g, ' ').trim(),
      logoutRule.replace(/\s+/g, ' ').trim(),
    )

    assert.match(
      styles,
      /\.loresheet-selector-menu__trigger[\s\S]*?color-surface-input-soft/,
    )

    assert.match(
      styles,
      /\.loresheet-selector-menu__option[\s\S]*?color-surface-option/,
    )
  },
)

test(
  'SPEC-026 UI no depende del popup nativo para Ficha de Conocimientos',
  () => {
    assert.doesNotMatch(
      loresheetSelector,
      /<select\b/,
    )

    assert.match(
      loresheetSelector,
      /<details[\s\S]*?loresheet-selector-menu/,
    )

    assert.match(
      loresheetSelector,
      /role="listbox"/,
    )

    assert.match(
      loresheetSelector,
      /role="option"/,
    )

    assert.match(
      styles,
      /\.loresheet-selector-menu__options[\s\S]*?color-surface-option/,
    )

    assert.match(
      styles,
      /\.loresheet-selector-menu__option[\s\S]*?color-surface-option/,
    )

    assert.match(
      styles,
      /\.loresheet-selector-menu__option:hover[\s\S]*?color-surface-control-emphasis/,
    )
  },
)

test(
  'SPEC-026 UI adopta una superficie continua y responsive sin colores literales nuevos',
  () => {
    const marker =
      'SPEC-026 — Jerarquía visual de Ventajas y Trasfondos'

    const start = styles.indexOf(marker)

    assert.notEqual(start, -1)

    const block = styles.slice(start)

    assert.match(
      block,
      /gap:\s*0/,
    )

    assert.match(
      block,
      /color-option-border/,
    )

    assert.match(
      block,
      /@media \(max-width: 900px\)/,
    )

    assert.match(
      block,
      /@media \(max-width: 640px\)/,
    )

    assert.doesNotMatch(
      block,
      /#[0-9a-f]{3,8}\b/i,
    )

    assert.doesNotMatch(
      block,
      /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
    )
  },
)

test(
  'SPEC-026 UI unifica los botones de acción de Trasfondos y Refugio',
  () => {
    const actionButtons =
      advantagesStep.match(
        /className="advantage-action-button"/g,
      ) ?? []

    assert.equal(actionButtons.length, 10)

    for (const label of [
      'Configurar',
      'Añadir Rebaño',
      'Añadir Recursos',
      'Añadir Estatus',
    ]) {
      assert.match(
        advantagesStep,
        new RegExp(
          'className="advantage-action-button"[\\s\\S]*?'
          + label,
        ),
      )
    }

    const authStyles = readFileSync(
      new URL(
        '../src/features/authentication/components/authentication-gate.css',
        import.meta.url,
      ),
      'utf8',
    )

    const logoutRule =
      authStyles.match(
        /\.authentication-card button,\s*\.authentication-session button\s*\{([^}]*)\}/,
      )?.[1]

    const logoutDisabledRule =
      authStyles.match(
        /\.authentication-card button:disabled,\s*\.authentication-session button:disabled\s*\{([^}]*)\}/,
      )?.[1]

    const actionRule =
      styles.match(
        /\.advantages-step \.advantage-action-button\s*\{([^}]*)\}/,
      )?.[1]

    const actionDisabledRule =
      styles.match(
        /\.advantages-step \.advantage-action-button:disabled\s*\{([^}]*)\}/,
      )?.[1]

    assert.ok(logoutRule)
    assert.ok(logoutDisabledRule)
    assert.ok(actionRule)
    assert.ok(actionDisabledRule)

    const normalize = (value) =>
      value.replace(/\s+/g, ' ').trim()

    for (const sharedVisualDeclaration of [
      'border: 1px solid var(--color-border-accent);',
      'border-radius: var(--radius-control);',
      'background: var(--color-surface-emphasis);',
      'color: var(--color-text-primary);',
      'font-weight: 700;',
      'cursor: pointer;',
    ]) {
      assert.match(logoutRule, new RegExp(
        sharedVisualDeclaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      ))
      assert.match(actionRule, new RegExp(
        sharedVisualDeclaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      ))
    }

    assert.match(actionRule, /min-height:\s*2rem;/)
    assert.match(actionRule, /padding:\s*0\.35rem 0\.65rem;/)
    assert.match(actionRule, /font-size:\s*0\.78rem;/)

    assert.equal(
      normalize(actionDisabledRule),
      normalize(logoutDisabledRule),
    )
  },
)

test(
  'SPEC-026 UI iguala Guardar cambios y Ver ficha a Cerrar sesión',
  () => {
    const wizard = readFileSync(
      new URL(
        '../src/features/character-creation/components/CharacterCreationWizard.tsx',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      wizard,
      /className="[^"]*creation-session-style-button[^"]*"[\s\S]*?Guardar cambios/,
    )

    assert.match(
      wizard,
      /className="[^"]*creation-session-style-button[^"]*"[\s\S]*?Ver ficha/,
    )

    const authStyles = readFileSync(
      new URL(
        '../src/features/authentication/components/authentication-gate.css',
        import.meta.url,
      ),
      'utf8',
    )

    const logoutRule =
      authStyles.match(
        /\.authentication-card button,\s*\.authentication-session button\s*\{([^}]*)\}/,
      )?.[1]

    const footerRule =
      styles.match(
        /\.creation-session-style-button\s*\{([^}]*)\}/,
      )?.[1]

    assert.ok(logoutRule)
    assert.ok(footerRule)

    for (const declaration of [
      'border: 1px solid var(--color-border-accent);',
      'border-radius: var(--radius-control);',
      'background: var(--color-surface-emphasis);',
      'color: var(--color-text-primary);',
      'font-weight: 700;',
      'cursor: pointer;',
    ]) {
      assert.ok(logoutRule.includes(declaration))
      assert.ok(footerRule.includes(declaration))
    }

    assert.match(
      footerRule,
      /min-width:\s*auto;/,
    )
  },
)

test(
  'SPEC-026 UI iguala los tres Repartos aleatorios y la navegación a Cerrar sesión',
  () => {
    const attributes = readFileSync(
      new URL(
        '../src/features/character-creation/components/AttributesStep.tsx',
        import.meta.url,
      ),
      'utf8',
    )

    const skills = readFileSync(
      new URL(
        '../src/features/character-creation/components/SkillsStep.tsx',
        import.meta.url,
      ),
      'utf8',
    )

    const disciplines = readFileSync(
      new URL(
        '../src/features/character-creation/components/DisciplinesStep.tsx',
        import.meta.url,
      ),
      'utf8',
    )

    const wizard = readFileSync(
      new URL(
        '../src/features/character-creation/components/CharacterCreationWizard.tsx',
        import.meta.url,
      ),
      'utf8',
    )

    for (const source of [
      attributes,
      skills,
      disciplines,
    ]) {
      assert.match(
        source,
        /className="[^"]*creation-session-style-button[^"]*"[\s\S]*?Reparto aleatorio válido/,
      )
    }

    assert.match(
      wizard,
      /className="[^"]*creation-session-style-button[^"]*"[\s\S]*?Anterior/,
    )

    assert.match(
      wizard,
      /className="[^"]*creation-session-style-button[^"]*"[\s\S]*?Siguiente/,
    )

    const sharedRule =
      styles.match(
        /\.creation-session-style-button\s*\{([^}]*)\}/,
      )?.[1]

    assert.ok(sharedRule)

    for (const declaration of [
      'border: 1px solid var(--color-border-accent);',
      'border-radius: var(--radius-control);',
      'background: var(--color-surface-emphasis);',
      'color: var(--color-text-primary);',
      'font-weight: 700;',
    ]) {
      assert.ok(sharedRule.includes(declaration))
    }
  },
)
