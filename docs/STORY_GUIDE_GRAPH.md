# Mapa completo del guion

Desde el guion privado se abre una pestaña con `?story-graph=1&chronicleId=…&storyId=…#/story-graph`.
La ruta vive dentro de AuthenticationGate, separada del editor y de la normalización de rutas de App.

## Seguridad y alcance

- Solo lectura. No hay POST, PATCH, PUT ni DELETE; no requiere migraciones ni cambios de API.
- Se verifica narrador contextual y pertenencia activa mediante crónica y notebook; el endpoint privado stories valida de nuevo el permiso en el servidor.
- No se utilizan endpoints compartidos como alternativa ni se envían secretos por URL.
- Las consultas usan cookies, no-store, AbortController y paginación estricta; 200 historias y 8 MiB, con error explícito en vez de truncar.
- No se conserva información privada en localStorage, sessionStorage ni window.opener.
- Al ocultar la pestaña se vacía el estado; al regresar se consultan permisos y datos otra vez.
- Los borradores pendientes permanecen en el editor. El mapa solo utiliza versiones guardadas.

## Representación

Una tarjeta por id de historia y tarjeta; las apariciones en páginas no se duplican.
Las conexiones internas y storyLinks conservan dirección, identidad y significado.
Un enlace sin cardId apunta a una entrada virtual de historia (claramente marcada), no a una tarjeta inferida.
Los destinos no disponibles se señalan; no se reconstruyen.
Los ciclos se condensan solo para calcular rangos de presentación, nunca para reducir las flechas reales.
Las historias se colocan alrededor del arco elegido siguiendo sus conexiones, con burbujas sin solapamiento.
Las rutas utilizan el motor de presentación ya probado del guion, sin modificarlo.
No se alteran x/y persistidos, guiones, recursos, estados o bloqueos de sesiones.

## Comprobaciones

Ejecutar pruebas de story-guide-graph, story-guide-routing, story-guide-links y recursos, además del build web.
En .84: probar narrador, jugador participante, usuario ajeno y apertura directa de URL; comprobar que no se reciben guiones en cuentas no autorizadas.
Verificar bifurcaciones, ciclos, historias aisladas, varios arcos principales, enlaces al inicio y a tarjeta, referencias rotas, borrador sin guardar, clic en fondo, zoom y móvil.
