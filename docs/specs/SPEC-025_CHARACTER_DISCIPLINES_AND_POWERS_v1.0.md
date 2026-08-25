# SPEC-025 – CHARACTER_DISCIPLINES_AND_POWERS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-025 |
| Documento | CHARACTER_DISCIPLINES_AND_POWERS.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito

Definir el tratamiento funcional, visual y de datos de las Disciplinas y sus Poderes dentro del módulo de personajes.

## Objetivos

- Representar Disciplinas de forma extensible.
- Gestionar puntuaciones y Poderes adquiridos sin estructuras rígidas.
- Validar requisitos mediante reglas centralizadas.
- Facilitar la consulta durante una partida.
- Preparar integración futura con tiradas y otros sistemas.

## Disciplinas

Cada Disciplina deberá disponer, como mínimo, de:

- Identificador estable.
- Nombre visible.
- Estado activo.
- Metadatos mínimos necesarios para reglas y presentación.

Los personajes mantendrán una relación explícita con las Disciplinas que posean y su puntuación correspondiente.

## Puntuación

La puntuación se mostrará mediante el componente visual reutilizable de puntos o círculos definido para la ficha.

Los límites y condiciones de adquisición deberán validarse en la capa de reglas.

## Poderes

Los Poderes se modelarán como entidades o definiciones relacionadas con una Disciplina.

Cada definición podrá incluir únicamente la información necesaria para funcionamiento y referencia, como:

- Identificador.
- Nombre.
- Disciplina.
- Nivel o requisito.
- Datos estructurados necesarios para reglas.
- Referencia bibliográfica cuando proceda.

No se reproducirán extensos textos protegidos de manuales oficiales.

## Poderes adquiridos

El personaje mantendrá una relación explícita con los Poderes que haya adquirido.

El sistema deberá poder determinar:

- Qué Poderes posee.
- A qué Disciplina pertenecen.
- Qué requisitos son aplicables.
- Si una selección es válida en un contexto determinado.

## Creación de personaje

Durante la creación:

- Solo se ofrecerán opciones válidas según las reglas implementadas.
- Las decisiones anteriores podrán filtrar opciones.
- Se mostrarán claramente requisitos incumplidos.
- No se permitirá finalizar con una selección inválida.

## Evolución posterior

La adquisición posterior a la creación se tratará como un contexto distinto.

Las reglas de experiencia, costes u otros requisitos no deberán mezclarse con las reglas de creación inicial.

## Clan y afinidades

Las relaciones entre Clan y Disciplinas deberán definirse mediante datos o reglas centralizadas.

No se implementarán mediante condicionales dispersos en la interfaz.

## Presentación en ficha

Cada Disciplina mostrará de forma compacta:

- Nombre.
- Puntuación.
- Poderes adquiridos.

Los Poderes podrán expandirse para consultar información útil sin abandonar innecesariamente la ficha.

## Información mostrada

La aplicación podrá mostrar:

- Nombre.
- Datos mecánicos estructurados autorizados.
- Coste o activación cuando sea necesario para la funcionalidad.
- Referencia al libro o fuente.

El proyecto evitará convertirse en una reproducción digital completa de textos protegidos.

## Integración con dados

Cuando un Poder requiera una tirada:

- El módulo de Disciplina proporcionará los datos necesarios.
- El módulo de dados ejecutará la tirada.
- La lógica no se duplicará entre ambos módulos.

## Catálogo

Las definiciones de Disciplinas y Poderes deberán tener una fuente de datos controlada.

La arquitectura permitirá:

- Añadir contenido autorizado.
- Desactivar opciones.
- Mantener referencias estables.
- Evitar cambios de código por cada nueva definición cuando sea razonable.

## Validación

Se contemplarán:

- Puntuaciones fuera de rango.
- Poderes sin requisitos.
- Selecciones incompatibles.
- Dependencias.
- Cambios que invaliden selecciones existentes.

## Persistencia

Se separarán:

- Definiciones del catálogo.
- Estado del personaje.
- Relaciones de adquisición.

No se duplicarán textos o definiciones completas dentro de cada personaje.

## Pruebas

Se incluirán pruebas para:

- Asignación de Disciplinas.
- Límites de puntuación.
- Selección de Poderes.
- Requisitos.
- Contexto de creación.
- Evolución posterior.
- Integración de lectura con dados.

## Criterios de aceptación

- Disciplinas y Poderes modelados de forma extensible.
- Selecciones validadas centralmente.
- Presentación clara en ficha.
- Sin lógica duplicada.
- Preparado para creación, evolución y dados.
- Respeto a las restricciones de contenido protegido.

## Adendas implementadas

Las ampliaciones mecánicas A1–A11 se consolidan en
[SPEC-025 — Adendas A1–A11: mecánicas de Disciplinas](SPEC-025_ADDENDA_A1_A11_DISCIPLINE_MECHANICS_v1.0.md).
El documento enlazado registra el cierre 106/106 y su trazabilidad automatizada.
