# Sistema de diseño de la interfaz

## Estado

Este documento materializa el bloque **SPEC-010.A — Fundamentos y adopción inicial**.
No declara cerrada la totalidad de SPEC-010.

La fuente oficial de tokens reside en:

```text
apps/web/src/styles/design-system.css
```

## Principios

1. Claridad.
2. Consistencia.
3. Accesibilidad.
4. Diseño responsive.
5. Prioridad al contenido.
6. Ambientación de Vampiro V5 sin reducir la usabilidad.

## Tokens oficiales

Los estilos nuevos deben utilizar nombres semánticos para:

- canvas y superficies;
- texto principal, secundario y atenuado;
- bordes y acento;
- foco, éxito, aviso y error;
- tipografía y tamaños;
- espaciado, radios y sombras.

Los valores literales existentes se migrarán de forma incremental, únicamente
cuando la SPEC activa autorice la vista afectada.

## Adopción inicial

SPEC-010.A aplica los tokens a la base global, la cabecera de aplicación y la
cabecera de ficha sin cambiar su composición ni su comportamiento.

No introduce componentes React, reglas de dominio, tablas, diálogos ni una
biblioteca genérica de controles. La arquitectura de componentes reutilizables
pertenece a SPEC-014.

## Responsive

Los layouts existentes conservan sus breakpoints actuales. SPEC-010.A no los
reescribe ni declara completa la validación responsive de toda la aplicación.
Cada vista modificada deberá revisarse en escritorio, tablet y móvil.

## Accesibilidad

La base común mantiene:

- foco visible mediante teclado;
- estado `disabled` perceptible;
- respeto por `prefers-reduced-motion`;
- soporte de foco en colores forzados;
- etiquetas y atributos ARIA en los componentes consumidores.

Los errores deben comunicarse mediante texto y no solamente mediante color.

## Iconografía

No se añade una biblioteca externa ni iconografía ornamental. Una estrategia
única de iconos solo se incorporará cuando exista una necesidad funcional y la
SPEC correspondiente lo autorice.

## Validación

```bash
./scripts/check-ui-design-system.sh
```

La validación automática debe completarse con una revisión visual manual de las
vistas afectadas. Hasta realizarla, SPEC-010.A no debe considerarse cerrada.

## Adopción incremental: SPEC-010.C.1

Autenticación y crónicas son los primeros módulos completos migrados al
lenguaje visual oficial. Conservan su estructura, comportamiento y media
queries, pero consumen la paleta, espaciado, radios y sombras comunes.

Este bloque no crea componentes genéricos ni adelanta SPEC-014.

## Adopción incremental: SPEC-010.C.2A

El shell del creador y el paso Identidad adoptan los tokens oficiales de
color, tipografía, forma, transición y espaciado. Se conservan la estructura,
los selectores y los breakpoints existentes.

El alcance termina antes de Atributos. Los pasos Atributos, Habilidades,
Sangre, Disciplinas, Ventajas y Sangre Débil permanecen sin cambios para poder
validar la migración del creador en bloques pequeños y reversibles.

## Adopción incremental: SPEC-010.C.2B

El paso **Atributos** adopta los tokens visuales oficiales para paneles,
grupos, filas, controles, indicadores y estados de validación.

La migración conserva los componentes, selectores, estructura, distribución
y breakpoints existentes. No modifica la validación de navegación ni los
pasos Habilidades, Sangre, Disciplinas, Ventajas o Humanidad.

Los tokens incorporados son reutilizables por editores posteriores y no
crean componentes genéricos ni adelantan SPEC-014.

## Adopción incremental: SPEC-010.C.2C

La **Validación de Navegación** adopta tokens semánticos oficiales para
los estados bloqueados y el panel accesible de errores del creador.

La migración conserva los selectores, estados, estructura y semántica
existentes. No modifica los componentes React, la lógica de validación,
la navegación entre pasos ni el bloque Habilidades o fases posteriores.

Los nuevos tokens de peligro son reutilizables y no crean componentes
genéricos ni adelantan SPEC-014.

## Adopción incremental: SPEC-010.C.2D

El paso **Habilidades** adopta los tokens visuales oficiales para los
métodos de reparto, la barra de estado, las categorías, los controles
de puntuación y los paneles de validación.

La migración conserva los selectores, estados, distribución responsive
y comportamiento existentes. No modifica componentes React, reglas de
Habilidades, especialidades, `CharacterDraft`, catálogos, persistencia,
API ni Prisma.

**Especialidades** y todas las fases posteriores permanecen fuera del
alcance y protegidas por contrato. Los tokens nuevos son semánticos y
reutilizables; no crean componentes genéricos ni adelantan SPEC-014.

## Adopción incremental: SPEC-010.C.2E

El bloque **Especialidades** adopta los tokens visuales oficiales para
su cabecera, formulario, estado vacío, listado, elementos seleccionados
y mensajes de error.

La migración conserva los selectores, estructura, comportamiento
responsive y controles existentes. No modifica componentes React,
reglas de Especialidades, presupuestos de creación, `CharacterDraft`,
catálogos, persistencia, API ni Prisma.

**Sangre** y todas las fases posteriores permanecen fuera del alcance
y protegidas por contrato. Los tokens nuevos son semánticos y
reutilizables; no crean componentes genéricos ni adelantan SPEC-014.

## Adopción incremental: SPEC-010.C.2F

El bloque **Sangre** adopta los tokens visuales oficiales para sus
paneles, resumen de Generación, control de Potencia de Sangre, editor
de Hambre, rasgos derivados y estados de validación.

La migración conserva selectores, estructura, estados deshabilitados,
círculos de Hambre, comportamiento responsive y consumidores
existentes de los estilos de validación. No modifica componentes React,
reglas de Sangre, Generación, Potencia, Hambre, Salud o Fuerza de
Voluntad, `CharacterDraft`, catálogos, persistencia, API ni Prisma.

**Disciplinas** y todas las fases posteriores permanecen fuera del
alcance y protegidas por contrato. Los tokens nuevos son semánticos y
reutilizables; no crean componentes genéricos ni adelantan SPEC-014.

## Adopción incremental: SPEC-010.C.2G

El bloque **Disciplinas** adopta los tokens visuales oficiales para la
cabecera de clan, explicación reglamentaria, tarjetas de Disciplina,
controles de puntuación, círculos, casos especiales y estados de
validación.

La migración conserva selectores, estructura, estados seleccionados y
deshabilitados, comportamiento responsive y consumidores existentes.
No modifica componentes React, reglas de Disciplinas, concesiones del
Tipo de Depredador, Poderes, Rituales, Ceremonias, Sangre Débil,
Alquimia, `CharacterDraft`, catálogos, persistencia, API ni Prisma.

**Poderes** y todo el contenido posterior permanecen fuera del alcance
y protegidos por contrato. Los tokens nuevos son semánticos y
reutilizables; no crean componentes genéricos ni adelantan SPEC-014.

## Adopción incremental: SPEC-010.C.2H

El bloque **Poderes** adopta los tokens visuales oficiales para sus
contenedores, cabeceras, textos de ayuda, opciones, niveles, estados
seleccionados y deshabilitados y mensajes de validación.

La migración conserva selectores, estructura, interacción, estados,
comportamiento responsive y consumidores existentes. No modifica
componentes React, reglas de adquisición, prerrequisitos, Amalgamas,
catálogos, `CharacterDraft`, persistencia, API ni Prisma.

El bloque de **Ritual inicial de Hechicería** y todo el contenido
posterior permanecen fuera del alcance y protegidos por contrato. Los
tokens nuevos son semánticos y reutilizables; no crean componentes
genéricos ni adelantan SPEC-014.

## Adopción incremental: SPEC-010.C.2I

El bloque **Ritual inicial de Hechicería** adopta los tokens visuales
oficiales para su contenedor, cabecera, texto introductorio, rejilla,
tarjetas, niveles, títulos, descripciones, referencias y estados
normal, `hover` y seleccionado.

La migración conserva selectores, estructura, interacción,
comportamiento responsive y consumidores existentes. No modifica
componentes React, catálogo de Rituales, requisitos de Hechicería de
Sangre, validación, `CharacterDraft`, persistencia, API ni Prisma.

El bloque de **Ceremonia inicial de Olvido** y todo el contenido
posterior permanecen fuera del alcance y protegidos por contrato. Los
tokens nuevos son semánticos y reutilizables; no crean componentes
genéricos ni adelantan SPEC-014.

## Adopción incremental: SPEC-010.C.2J

El bloque **Ceremonia inicial de Olvido** adopta los tokens visuales
oficiales para su contenedor, cabecera, texto introductorio, rejilla,
tarjetas, niveles, títulos, descripciones, referencias y estados
normal, `hover` y seleccionado.

La migración conserva selectores, estructura, interacción,
comportamiento responsive y consumidores existentes. No modifica
componentes React, catálogo de Ceremonias, requisitos de Olvido,
validación, `CharacterDraft`, persistencia, API ni Prisma.

El bloque de **Ventajas** y todo el contenido posterior permanecen
fuera del alcance y protegidos por contrato. Los tokens nuevos son
semánticos y reutilizables; no crean componentes genéricos ni adelantan
SPEC-014.

## Adopción incremental: SPEC-010.C.2K

El bloque **Ventajas** adopta los tokens visuales oficiales para el
presupuesto, categorías, rejilla, tarjetas, controles de puntuación,
editores de instancia, avisos narrativos, selecciones y estados de
validación.

La migración conserva selectores, estructura, interacción, controles
habilitados y deshabilitados, estados válido e inválido y
comportamiento responsive. No modifica componentes React, catálogo,
reglas de presupuesto 7/2, requisitos, dependencias, `CharacterDraft`,
persistencia, API ni Prisma.

El bloque de **Sangre Débil** y todo el contenido posterior permanecen
fuera del alcance y protegidos por contrato. Los tokens nuevos son
semánticos y reutilizables; no crean componentes genéricos ni adelantan
SPEC-014.
