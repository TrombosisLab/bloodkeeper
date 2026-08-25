# SPEC-025 — Adendas A1–A11: mecánicas de Disciplinas

## Información

| Campo | Valor |
|---|---|
| Código | SPEC-025.A1–A11 |
| Documento base | SPEC-025_CHARACTER_DISCIPLINES_AND_POWERS_v1.0.md |
| Proyecto | BloodKeeper / Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Implementado y auditado |

## Propósito

Consolidar la ampliación incremental de SPEC-025 que mecaniza los Poderes,
centraliza su contrato y permite presentarlos en ficha sin exponer claves
internas ni duplicar reglas entre Web y API.

## Contrato común

Los Poderes activos usan el catálogo compartido de character-rules. Cada
definición mantiene una clave estable, Disciplina, nivel, fuente y mecánicas
estructuradas cuando corresponden.

El contrato representa, entre otros elementos:

- costes de Control de Enardecimiento fijos, variables, heredados o ausentes;
- reservas activas, oposiciones, dificultades y pruebas condicionales;
- duraciones estructuradas y condiciones de finalización;
- prerrequisitos, Amalgamas, modificadores y límites de uso;
- información presentable sin mostrar claves técnicas.

El campo antiguo diceCheck no forma parte del catálogo operativo.

## Cobertura por adenda

| Adenda | Alcance principal | Poderes |
|---|---|---:|
| A1 | Contrato mecánico común y Ofuscación | 9 |
| A2 | Potencia y ampliaciones de duración | 9 |
| A3 | Presencia y duraciones específicas | 9 |
| A4 | Celeridad | 9 |
| A5 | Animalismo | 9 |
| A6 | Auspex | 9 |
| A7 | Dominación | 9 |
| A8 | Fortaleza | 9 |
| A9 | Protean y costes variables | 8 |
| A10 | Hechicería de Sangre | 8 |
| A11 | Olvido y cierre mecánico global | 18 |

## Catálogo auditado

El cierre operativo confirmado contiene:

- 11 Disciplinas con Poderes regulares;
- 106 Poderes activos;
- 106 Poderes con mechanics;
- 0 Poderes con diceCheck antiguo;
- 5 Rituales de Hechicería de Sangre;
- 9 Ceremonias de Olvido;
- 36 Fórmulas de Alquimia de Sangre Débil.

Alquimia de Sangre Débil permanece en el catálogo de Disciplinas por sus
reglas propias, pero sus Fórmulas se adquieren mediante el flujo específico de
Fórmula y no como Poderes regulares.

## Presentación y evolución

La ficha presenta descripción funcional, coste, duración, pruebas y referencia
bibliográfica disponibles. La evolución consulta el catálogo compartido y
previsualiza en backend coste, elegibilidad y revisión antes de confirmar.

El selector de compra de Poderes solo ofrecerá Disciplinas que tengan Poderes
regulares activos. Rituales, Ceremonias y Fórmulas conservan flujos separados.

## Validación y compatibilidad

Las reglas del catálogo se validan de forma centralizada. La interfaz no es la
autoridad final: la API vuelve a comprobar nivel, requisitos, estado,
experiencia disponible y concurrencia.

Las claves estables y las definiciones inactivas preservan la lectura histórica
sin ofrecer contenido retirado para nuevas adquisiciones.

## Evidencia

Las pruebas contractuales y de catálogo identifican expresamente A1–A11.
Cubren inventario, distribución por nivel, fuentes, prerrequisitos, mecánicas,
presentación y ausencia del contrato antiguo.

## Criterios de cierre

- Catálogo global 106/106 mecanizado.
- Ningún Poder operativo usa diceCheck.
- Todas las adendas A1–A11 tienen trazabilidad automatizada.
- Web y API consumen el catálogo compartido.
- Alquimia, Rituales y Ceremonias mantienen sus flujos especializados.
- La documentación operativa refleja el estado realmente implementado.
