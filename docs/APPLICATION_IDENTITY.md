# Identidad pública de BloodKeeper

Administración → Identidad permite seleccionar, previsualizar y guardar un icono global, o restaurar el predeterminado con confirmación. La selección no se envía hasta pulsar Guardar. Solo el administrador autenticado puede escribir; narradores, jugadores y visitantes no pueden cambiarlo. No concede nuevos permisos a nadie.

El icono será público, también antes de iniciar sesión: no subir datos personales ni recursos privados. Los únicos datos expuestos son los PNG generados, su revisión y las propiedades públicas del manifiesto. No se publican usuarios, crónicas ni imágenes privadas. El original y sus metadatos no se conservan.

Formatos: PNG/JPEG/WebP estáticos, máximo 5 MiB y 16 millones de píxeles. El servidor decodifica y vuelve a codificar la imagen; rechaza SVG, animaciones, contenido inválido y exceso de tamaño. Genera 180, 192 y 512 px y una variante maskable de 512 px con margen seguro. Ajuste contain, sin recortes ni deformaciones, fondo #171013. Se recomienda una fuente cuadrada de al menos 512 px. El procesado usa [sharp](https://sharp.pixelplumbing.com/api-resize/).

## Persistencia y conflictos

Nueva tabla singleton application_identity, independiente de crónicas y cuentas. Incluida en las copias PostgreSQL existentes. Las escrituras requieren If-Match con la revisión consultada; las revisiones obsoletas devuelven 409, sin sobrescribir. Las modificaciones generan auditoría sin imágenes ni credenciales. Restaurar elimina solo el icono personalizado; no toca recursos ni retratos.

GET /api/application/identity y /api/application/manifest.webmanifest son públicos. El manifiesto mantiene id y scope / y la misma URL inicial, sin vincular la instalación a una crónica. Los iconos personalizados se sirven en /api/application/icons/:revision/:size. La URL versionada evita reutilizar el archivo de otra revisión. Los iconos anteriores dejan de estar disponibles al sustituirse. No se almacena un historial ilimitado.

El manifiesto dinámico debe poder consultarse bajo el mismo dominio que la web. Los endpoints no requieren sesión de BloodKeeper, pero pueden permanecer protegidos por Cloudflare Access: no es necesario abrirlos a Internet para probar esta modalidad. El enlace HTML usa crossorigin="use-credentials" y la consulta de identidad credentials: 'same-origin', para enviar la sesión existente solo al mismo origen. La consulta rechaza redirecciones; si Access exige renovar la sesión, el arranque continúa con los iconos predeterminados, sin navegar a otro dominio ni intentar saltarse la autenticación. No se añaden tokens ni se cambia Cloudflare, CORS, cookies o listas de correos autorizados.

Cloudflare no debe imponer una regla de caché permanente al manifiesto ni a identity. La descarga autenticada está documentada en https://web.dev/articles/add-manifest, pero no demuestra por sí sola que todo el proceso de instalación WebAPK de Chrome Android vaya a completarse detrás de Access: debe probarse en el móvil con una sesión autorizada vigente. Si falla, diagnosticar el error concreto sin crear excepciones de acceso. La actualización de iconos ya instalados depende del navegador: no se garantiza un cambio inmediato.

## HTTP y disponibilidad

No cambia puertos, túnel, cookies, certificados, CORS ni allowedHosts. HTTP por IP local continúa permitido y sin redirección a HTTPS. La falta de contexto seguro afecta solo a la oferta de instalación, nunca al uso normal. Si falla la consulta de identidad, el arranque continúa y mantiene los iconos predeterminados. Si falla el servidor no hay modo offline ni cola de operaciones; no se añade service worker.

El manifiesto estático /manifest.webmanifest se conserva como referencia y alternativa predeterminada. El HTML enlaza el dinámico. La web instalada sigue necesitando servidor.

## Validación y despliegue

Primero .84. Hacer copia PostgreSQL antes de aplicar la migración aditiva 20261024120000_add_application_identity. Construir API y web, ejecutar prisma migrate deploy con la imagen nueva antes de arrancarla. No usar down --volumes ni remove-orphans (el túnel puede ser externo al compose).

Pruebas automatizadas: permisos de lectura/escritura, archivos inválidos y límites, proporción sin recorte, tamaños reales PNG, rutas públicas versionadas, conflictos y restauración; comprobación HTTP de manifiesto e iconos sin autenticación y rechazo de escrituras anónimas. La persistencia se prueba con un repositorio simulado compartido entre instancias, no con un reinicio real de PostgreSQL.

Tras desplegar: abrir por HTTP/IP, navegar con normalidad; entrar en Administración → Identidad, guardar una imagen de prueba, recargar y comprobar favicon, manifiesto y restauración. Confirmar persistencia tras reiniciar API. Después probar instalación Android/Chrome desde HTTPS que sirva esta versión. La validación física Android y la inspección visual de .84 quedan pendientes hasta el despliegue. No modificar .118 hasta validar y subir a Git.
