# Trasfondo y tramas

Pizarra libre, privada y propia de cada crónica. Solo el narrador propietario con
participación activa puede leerla, editarla o consultar sus referencias. Los
jugadores y usuarios ajenos reciben 403 en el servidor. No se publica ni se
incorpora a las exportaciones compartidas existentes.

## Uso

En la crónica, abre **Trasfondo y tramas**. Añade notas y agrupaciones, muévelas,
conecta dos notas indicando el significado de la relación y guarda la pizarra.
Las conexiones por decidir pueden marcarse discontinuas. Seleccionar una nota
atenúa las relaciones ajenas; pulsar el fondo recupera el conjunto.

Cada nota conserva texto libre, estado (confirmado, en desarrollo o posibilidad),
momento (pasado, en marcha o posible futuro), quién lo sabe en la ficción y
referencias a historias, tarjetas de guion y recursos propios. El conocimiento
ficticio no modifica permisos. Vincular no copia ni altera las fichas.

Asignar una nota a un grupo permite moverlas juntas. Quitar un grupo conserva
las notas. Quitar una nota retira únicamente sus conexiones. Esas operaciones
modifican el borrador: antes de guardar puedes recargar para recuperar la versión
previa. Tras guardar no hay historial de deshacer en esta primera versión.

El filtro por historia muestra las notas que tengan referencias explícitas a
esa historia o sus tarjetas; no inventa vínculos. La pizarra conserva las
posiciones elegidas por el narrador, sin reorganización automática.
Desde el guion puedes abrir Ver trasfondo relacionado. Cambiar entre apartados
de esa crónica mantiene la pizarra montada y conserva el borrador. Volver al
listado avisa si hay cambios; recargar o cerrar el navegador también avisa.
Antes de navegar a otra zona de la aplicación, guarda o descarga el borrador.

## Guardado y límites

Guardado explícito con revisión optimista. Una pestaña con revisión antigua
recibe 409 y conserva el borrador; no sobrescribe la versión nueva. Puedes
descargar un borrador JSON privado antes de recargar. Esa descarga no se importa
automáticamente ni genera un documento para jugadores.

Máximo 200 notas, 60 grupos, 400 relaciones, 20 referencias por nota y 80 kB de
contenido JSON UTF-8. Preferir vínculos sobre duplicar descripciones extensas.
No se usan servicios de IA ni se almacenan secretos en localStorage. La tabla
nueva no altera sesiones, guiones, mapas o recursos.

## Despliegue .84

Respaldar base de datos y configuración antes de migrar. Aplicar la migración
aditiva 20261014190000_add_chronicle_backdrop con el procedimiento habitual.
Reconstruir API y web, ejecutar sus compilaciones y los tests específicos antes
de recrear servicios. El paquete no contiene datos narrativos ni credenciales.

## Pruebas

- API: chronicle-backdrop.test.mjs (autenticación, propietario/rol activo, revisión
  conflictiva, validación de referencias y esquema).
- Web: chronicle-backdrop.test.mjs (movimientos, borrado, identificadores HTTP,
  referencias inequívocas y aislamiento de la interfaz).
- Verificar en .84 con narrador, jugador y usuario ajeno; probar recarga, notas,
  grupos, relaciones, persistencia y conflicto entre dos pestañas.
