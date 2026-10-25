# BloodKeeper instalable, siempre conectado

## Comportamiento

El manifiesto declara BloodKeeper, sus iconos, una identidad estable por origen y apertura independiente (`standalone`). La dirección de inicio lleva a Inicio sin incluir identificadores de crónicas, tokens ni datos de usuario. En el menú de secciones hay un botón «Instalar aplicación». Si Chrome/Edge ofrece una instalación nativa, el botón abre su confirmación; si no, se muestran instrucciones. Un rechazo no se interpreta como éxito. El botón no instala nada automáticamente.

No se registra ningún service worker, caché de respuestas privadas, almacenamiento offline ni cola de escrituras. Los datos y operaciones siguen pasando por las API actuales y sus permisos. El navegador puede conservar recursos estáticos en su caché HTTP normal: esto no equivale a un modo offline ni a una garantía de borrado de sus cachés preexistentes. Los permisos y sesiones siguen en el servidor. La pérdida de conectividad se maneja con los errores existentes; no se incorpora un sistema nuevo de sincronización.

No hace falta instalar certificados en el dispositivo cuando se accede mediante el dominio HTTPS de Cloudflare. Un acceso por IP privada con HTTP no es equivalente. No se cambia el túnel ni se expone ningún entorno con este parche. La instalación de .84 y la de .118 tienen orígenes y sesiones distintos.

## Requisitos y despliegue

- Para una instalación reconocida por Chrome Android, utilizar HTTPS válido y servir `/api/application/manifest.webmanifest`, `/api/application/icons/*` y `/icons/*` correctamente. El manifiesto dinámico usa el icono configurado en Administración → Identidad o los iconos predeterminados. `/manifest.webmanifest` permanece como referencia estática. La validación de instalación real debe hacerse sobre la versión desplegada, no sobre una versión antigua del túnel.
- Si Vite rechaza el dominio del túnel, revisar su lista explícita de hosts autorizados; no desactivar la protección globalmente ni usar `allowedHosts: true`.
- El proxy debe mantener `/api` en el mismo origen y la autenticación existente. No cachear endpoints privados en Cloudflare ni añadir reglas de caché indiscriminadas.
- El manifiesto puede ser accesible sin iniciar sesión: contiene exclusivamente identidad e iconos públicos, no concede acceso a los datos.
- No fijar una orientación: funciona en vertical y apaisado.
- El navegador controla cuándo ofrece instalar. Según plataforma y políticas del dispositivo puede ofrecer un acceso directo en lugar de una instalación gestionada. No basta con que el botón de ayuda esté visible para declarar la instalación verificada.

## Comprobación

Desde `apps/web`: `node --test tests/install-application.test.mjs`, comprobación TypeScript y compilación Vite. Los tests verifican manifiesto, dimensiones PNG, alcance, estados de instalación y ausencia de nuevas rutas de caché o autenticación.

En .84 por IP HTTP: el botón debe explicar el requisito de HTTPS sin errores de consola. En el dominio HTTPS de pruebas: comprobar descarga del manifiesto, iconos y opción nativa de Chrome Android; cancelar no debe instalar, aceptar debe permitir abrir el icono en ventana independiente e iniciar sesión normalmente. Cerrar y abrir debe conservar la identidad de la aplicación, no crear otra por cada crónica. Sin servidor disponible no se podrán consultar datos nuevos ni completar operaciones de API. Comprobar también cerrar sesión y que una segunda cuenta mantenga los permisos habituales.

La instalación real en Android y las cabeceras del dominio Cloudflare deben validarse tras desplegar. Este documento no afirma que esa validación ya haya pasado.

Referencia: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable — el manifiesto y el contexto seguro son necesarios para promover la instalación; el service worker no es obligatorio para esta modalidad conectada.
