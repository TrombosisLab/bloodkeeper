# SPEC-063 — PLAYER GAMEPLAY WORKSPACE

## Estado

Propuesta aprobada para implementación integrada. No hacer commit ni push desde esta especificación.

## Propósito

Crear un espacio **Jugar** para que el jugador participe durante una sesión sin navegar por las áreas administrativas de la crónica.

## Estructura visual aprobada

- Barra izquierda: crónica activa, sesión actual e historial de sesiones.
- Zona central: escena actual, sistema completo de tiradas, estado vampírico y notas.
- Zona derecha: resumen de la ficha del personaje del jugador.
- No mostrar participantes ni controles exclusivos del narrador.

## Zona central

### Escena actual

Debe mostrar sesión, estado, nombre de la escena, descripción pública y objetivo de escena.

### Tirada de dados

Será el módulo principal y reutilizará el motor canónico existente. Debe permitir:

- Reserva de dados a partir de atributo, habilidad o disciplina.
- Dados de Hambre.
- Modificadores y origen del modificador.
- Dificultad.
- Dados individuales y animación o presentación progresiva del resultado.
- Éxitos, críticos, crítico sucio, fallo bestial y fallo normal.
- Reroll de Fuerza de Voluntad cuando las reglas y el personaje lo permitan.
- Registro inmutable asociado a usuario, personaje, crónica, sesión y escena.

El botón principal será **Lanzar tirada**. No se debe implementar un segundo motor paralelo ni recalcular tiradas históricas.

### Estado vampírico

Tres controles separados:

- **Rubor de la vida**: consultar estado, realizar su comprobación de enardecimiento y registrar duración o resultado.
- **Control de enardecimiento**: realizar la comprobación, mostrar si aumenta Hambre y registrar el motivo.
- **Alimentación**: abrir un formulario para registrar tipo de presa, contexto, Hambre antes y después, riesgo para la Mascarada y notas. Los cambios sensibles deberán respetar permisos y validación del narrador.

### Notas

Dos espacios independientes:

- **Notas privadas**: solo visibles para el jugador y usuarios autorizados.
- **Notas públicas**: visibles para los participantes con permiso de contenido compartido.

Las notas no sustituyen eventos, resultados de tiradas ni registros de sesión.

## Zona derecha: resumen del personaje

Mostrar únicamente el personaje asociado del jugador:

- Nombre, clan, generación, concepto y estado.
- Hambre.
- Salud.
- Fuerza de voluntad.
- Humanidad.
- Disciplinas.
- Atributos destacados.
- Convicciones.
- Condiciones.

No mostrar notas privadas del narrador, PNJ secretos ni participantes presentes.

## Permisos y privacidad

- El jugador solo verá sesiones, escenas, pistas, resultados y notas que tenga autorizados.
- Los datos privados deben protegerse en backend; ocultarlos en CSS no es suficiente.
- El narrador podrá usar la misma superficie con controles adicionales, sin romper la vista del jugador.

## Compatibilidad técnica

- Reutilizar las APIs canónicas de crónicas, sesiones, personajes y dados.
- Mantener el despliegue íntegramente en Docker.
- No añadir dependencias del host ni instalar programas nuevos.
- Mantener la navegación y los estilos compartidos de Resumen, Participantes, Historias, Sesiones, Cronología y Recursos.
- La implementación debe ser responsive y no generar overflow horizontal.

## Criterios de aceptación

1. El jugador ve una pestaña **Jugar** dentro de la crónica.
2. Puede abrir la sesión activa y consultar la escena pública.
3. Puede preparar y lanzar una tirada V5 completa usando el motor existente.
4. El resultado queda contextualizado e inmutable.
5. Puede realizar las operaciones permitidas de Rubor, enardecimiento y alimentación.
6. Puede guardar notas privadas y públicas con permisos correctos.
7. Ve el resumen de su personaje sin participantes ni secretos del narrador.
8. La superficie conserva la línea visual aprobada y funciona dentro de Docker.
9. Las pruebas existentes siguen pasando y no se hace commit ni push automáticamente.
