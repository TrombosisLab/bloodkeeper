# Revisión de consola web — .84 — 22/10/2026

Contexto: comprobación tras actualizar los contenedores a Node.js 22.23.4. Navegación con la cuenta de pruebas de administrador/narrador, sin guardar, publicar, borrar ni modificar datos de las crónicas. La .118 no se ha modificado.

## Alcance recorrido

- Inicio y Administración (consulta).
- Personajes: ficha existente e Identidad, Habilidades, Disciplinas, Ventajas, Historia, Inventario y Estado.
- Jugar: listado de crónicas.
- Crónicas: listado y las ocho pestañas de una crónica de prueba; guion privado, grafo completo en pestaña temporal y apertura de los diálogos de exportación compartida/privada sin descargar ni enviar datos.
- Recursos: PNJ, Localizaciones, Organizaciones, Artefactos y Documentos.
- Historia: categorías y apertura de la vista de archivo de crónicas.
- Mapa: consulta de marcador y apertura/cierre de su recurso vinculado.
- Investigación: Pizarra, Relaciones privadas y compartidas, Cronología y Archivo.
- Manual: Administrador, Narrador y Jugador (vistas de documentación, no cambio de identidad).

Se registraron 52 puntos de comprobación; son puntos de navegación, no 52 flujos completos. Los mensajes se compararon por fecha y contenido para no atribuir errores antiguos a una nueva pantalla.

## Error reproducido y corrección

React avisaba repetidamente de dos hijos con la misma clave, cuyo valor era el identificador de la crónica. La causa está en `ChronicleSummaryWorkspace.tsx`: `ChronicleContextExport` y `ChronicleNarratorExport`, hermanos en la misma zona del resumen, usaban ambos `key={chronicle.id}`. El resumen permanece montado al cambiar de pestaña, por eso el aviso aparecía también al visitar otras vistas.

La corrección utiliza `context-export:${chronicle.id}` y `narrator-export:${chronicle.id}`. Se mantiene el reinicio de cada componente al cambiar de crónica, así como `active`, las propiedades originales y el control `canManage` del exportador privado. No se cambian identificadores de datos ni permisos, no se ocultan avisos ni se desactiva la consola.

En el recorrido de consulta no aparecieron otros tipos de mensajes de error o advertencia nuevos. Esto no garantiza ausencia de errores en todas las operaciones, cuentas o combinaciones de datos.

## Verificación local

46 pruebas correctas: identidades de exportadores, contratos del resumen, exportación compartida y privada y sus exclusiones de privacidad. TypeScript y compilación de producción correctos. Vite mantiene una advertencia de tamaño de paquete, que no es un error de consola del navegador ni se resuelve con este cambio de identidad.

## Pendiente tras instalar

Recargar .84, abrir la crónica como narrador y recorrer las pestañas. Abrir/cerrar ambos diálogos de exportación y verificar que el aviso de clave duplicada no reaparece. Esta comprobación en vivo del cambio aún no se ha efectuado: durante el recorrido descrito se ejecutaba la versión anterior.

## Límites

No se probaron todas las escrituras (creación, edición, borrado, tiradas, cierre de sesiones, cambios de permisos), todos los formularios ni todos los roles reales. No es una auditoría de seguridad ni una prueba de ausencia de fallos en la base de datos. Las sesiones cerradas y la información privada permanecen intactas. El grafo temporal se cerró y los diálogos de exportación quedaron cerrados.
