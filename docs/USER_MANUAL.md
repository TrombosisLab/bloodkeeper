# Manual de usuario

## Alcance

Este manual describe únicamente funciones que ya existen en la interfaz
actual de BloodKeeper / Vampiro V5 Revolution.

La disponibilidad de cada área depende de la sesión, los roles globales y,
cuando corresponda, del rol del usuario dentro de una Crónica.

No se documentan como disponibles áreas o acciones futuras.

## Acceso

La aplicación requiere una sesión autenticada.

Desde la pantalla inicial se puede:

- iniciar sesión con una cuenta existente;
- usar **Crear cuenta** para registrar una cuenta de jugador;
- volver al formulario de acceso después del registro.

El autorregistro crea una cuenta de jugador. No permite concederse permisos
administrativos ni elegir otros roles.

Una vez dentro, **Cerrar sesión** termina la sesión actual.

## Navegación principal

La interfaz actual puede mostrar, según permisos:

- **Inicio**;
- **Personajes**;
- **Crónicas**;
- **Administración**, sólo para cuentas con rol administrativo.

No se debe asumir que una entrada esté visible si la sesión actual no dispone
del permiso necesario.

## Inicio

Inicio resume el acceso a las funciones ya disponibles para la sesión.

Desde esta vista puede accederse a **Personajes** y, cuando corresponda,
consultarse información relacionada con Crónicas.

## Personajes

### Listado

La sección **Personajes** muestra los personajes persistidos accesibles al
usuario y distingue sus estados:

- Borrador;
- Activo;
- Archivado.

También existe una ficha de demostración separada de los personajes
persistidos.

### Crear personaje

**Crear personaje** abre el creador guiado.

El creador divide la configuración del personaje en fases y aplica las reglas
y validaciones que correspondan a cada decisión.

Cuando un borrador ya está guardado, puede retomarse desde el listado mediante
**Continuar creación**.

La revisión final indica si el personaje cumple las condiciones necesarias
para continuar con su ciclo de vida.

### Ficha persistida

Al abrir un personaje persistido se muestra su ficha.

Según el estado y los permisos del usuario, la ficha puede permitir editar
datos ya materializados, entre ellos:

- Salud;
- Fuerza de Voluntad;
- Humanidad;
- Manchas;
- Hambre.

Las operaciones persistidas utilizan control de revisión. Si otra operación ha
modificado el personaje, la interfaz puede exigir recargar o repetir la
acción.

### Inventario, Notas e Historial

La ficha incluye una sección **Inventario, Notas e Historial**.

Cuando el personaje y los permisos lo permiten, se pueden mantener los datos
persistidos de esas áreas. Las acciones destructivas que lo requieren piden
confirmación.

### Ciclo de vida

Los personajes persistidos pueden pasar por los estados definidos por la
aplicación.

La activación o reactivación se valida antes de aplicarse. El archivado
requiere confirmación visible y un personaje archivado mantiene restricciones
de edición.

### Experiencia y evolución

Cuando el personaje dispone del sistema de Experiencia y la sesión tiene
permiso, la ficha muestra:

- Experiencia disponible;
- Experiencia gastada;
- historial de movimientos.

La acción **Evolucionar personaje** abre las compras permitidas por el sistema.

La interfaz solicita al backend una previsualización del coste y de la validez
antes de confirmar la compra. El usuario no introduce manualmente el coste.

Las operaciones disponibles dependen de los permisos sobre el personaje y de
su estado.

## Crónicas

La información de una Crónica sólo se muestra a usuarios con acceso a ella.

Dentro de una Crónica pueden existir dos responsabilidades contextuales:

- Narrador;
- Jugador.

El acceso a lectura y las acciones de gestión dependen de ese rol contextual.

### Participantes y personajes

La vista de una Crónica puede mostrar:

- Narradores;
- Jugadores;
- Personajes asociados.

Las acciones de administración contextual se reservan al Narrador cuando así
lo exige el sistema.

### Funciones del Narrador

Un Narrador contextual activo puede gestionar las funciones actualmente
implementadas de la Crónica:

- participantes;
- personajes asociados;
- PNJ;
- Localizaciones;
- Eventos / Línea temporal;
- Sesiones.

Estas áreas contienen información que puede ser privada del Narrador.

#### PNJ

El panel de PNJ permite, dentro del alcance actual:

- crear un PNJ simple;
- listar;
- consultar;
- editar;
- archivar.

#### Localizaciones

El panel de Localizaciones permite:

- crear;
- listar;
- consultar;
- editar;
- archivar;
- usar una jerarquía simple cuando corresponda.

Puede incluir notas privadas del Narrador.

#### Eventos / Línea temporal

El panel de Eventos permite:

- crear;
- listar;
- consultar;
- editar eventos activos;
- archivar;
- reordenar los eventos activos.

Puede incluir referencia temporal narrativa, fecha real opcional y notas
privadas.

#### Sesiones

El panel de Sesiones permite gestionar las Sesiones de la Crónica según el
estado y permisos definidos por el sistema.

Puede incluir preparación y notas privadas del Narrador.

## Dados V5

La interfaz incorpora paneles de **Dados V5** en los contextos donde el
producto ya los expone.

Se admiten:

- tiradas manuales;
- tiradas vinculadas a un personaje;
- preparación previa de la reserva;
- Hambre;
- dificultad cuando corresponda;
- visualización de los dados individuales;
- resultado estructurado;
- historial de tiradas.

Los resultados especiales materializados incluyen, cuando proceda:

- crítico;
- crítico conflictivo;
- fallo bestial.

La interfaz identifica los Dados de Hambre y la evidencia relevante sin
depender únicamente del color.

El historial conserva información como contexto, reserva, resultado y momento
de la tirada. El acceso a tiradas contextuales depende de permisos y
participación.

## Permisos

Los roles globales existentes son:

- Administrador;
- Narrador;
- Jugador.

Además, una Crónica mantiene roles contextuales propios de Narrador y Jugador.

El rol técnico de Administrador no sustituye automáticamente al Narrador de una
Crónica. Las operaciones narrativas siguen sus permisos contextuales.

## Funciones no documentadas como disponibles

Este manual no presenta como terminadas funciones que la interfaz actual no
haya materializado.

En particular, no debe interpretarse la palabra **Configuración** usada dentro
de formularios como una sección global de Configuración de la aplicación.

Tampoco se documenta una sección global de **Ayuda** mientras no exista una
interfaz real para ella.

## Problemas de acceso

Si una acción no aparece o devuelve un rechazo:

1. comprobar que la sesión continúa activa;
2. comprobar que se está usando el personaje o Crónica correctos;
3. comprobar el rol global de la cuenta;
4. en Crónicas, comprobar también el rol contextual;
5. recargar la vista cuando exista un conflicto de revisión.

Los errores de permisos no deben resolverse asignando privilegios adicionales
sin una necesidad real.
