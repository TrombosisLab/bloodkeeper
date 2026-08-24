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

Al iniciar una creación nueva puede elegirse entre la creación vampírica
estándar y **Sesión 0**. La ruta de Sesión 0 permite crear primero un personaje
humano sin completar campos vampíricos ficticios.

El creador humano reutiliza el asistente existente para Identidad, Atributos,
Habilidades, Ventajas, Humanidad, Convicciones, Piedras de Toque y Revisión.
No solicita Clan, Generación, Hambre, Disciplinas ni Tipo de Depredador mientras
el personaje continúa siendo humano.

Cuando un borrador ya está guardado, puede retomarse desde el listado mediante
**Continuar creación**.

La revisión final indica si el personaje cumple las condiciones necesarias
para continuar con su ciclo de vida. Un personaje de Sesión 0 puede activarse
como humano cuando su perfil mortal es válido.

### Ficha persistida

Al abrir un personaje persistido se muestra su ficha.

La ficha se adapta a la naturaleza y al estado real del personaje. Un humano
activo puede abrir su ficha sin que la interfaz invente Hambre, Potencia de
Sangre, Clan o Disciplinas. Después del Abrazo, un vampiro de Sesión 0 puede
continuar activo mientras resuelve progresivamente las decisiones vampíricas
que todavía estén pendientes.

Según el estado y los permisos del usuario, la ficha puede permitir editar
datos ya materializados, entre ellos:

- Salud;
- Fuerza de Voluntad;
- Humanidad;
- Manchas;
- Hambre, únicamente cuando existe estado vampírico compatible.

Las operaciones persistidas utilizan control de revisión. Si otra operación ha
modificado el personaje, la interfaz puede exigir recargar o repetir la
acción.

### Resonancia y Discrasia

Cuando un vampiro dispone de estado de Sangre compatible, la ficha puede
mostrar el estado real de la sangre consumida:

- Resonancia activa, cuando existe;
- Afinidad especial, cuando la fuente no corresponde a una Resonancia humoral;
- Temperamento;
- Discrasia activa, cuando existe.

La aplicación no presenta sangre animal ni sangre libre de Resonancia como una
quinta Resonancia. Un personaje humano no recibe este bloque vampírico.

Las alimentaciones y consumos mecánicos que generan historial se conservan como
eventos del personaje. La ficha muestra el estado vigente; el historial permite
conservar la trazabilidad de cambios anteriores.

### Control de Enardecimiento y Rubor de la Vida

En una ficha persistida de un vampiro con estado de Sangre disponible aparecen
acciones mecánicas específicas para el Control de Enardecimiento.

**Control de Enardecimiento** resuelve un Control normal desde la ficha. La
aplicación realiza la tirada específica de Rouse en backend y muestra el
resultado. Un éxito no aumenta Hambre; un fallo incrementa Hambre en un punto,
sin superar Hambre 5. Esta acción no utiliza las reglas de una tirada V5
ordinaria con Dados de Hambre, críticos conflictivos o fallos bestiales.

Cuando el personaje está en Hambre 5, un Control voluntario normal no puede
iniciarse desde esta acción.

**Rubor de la Vida** dispone de su propia acción contextual. El backend decide
si requiere Control de Enardecimiento o si existe una exención activa. Si el
personaje dispone de la Discrasia compatible **Entusiasmado por la vida**, la
interfaz puede mostrar **Control omitido por Discrasia**:

- no se lanza un dado ficticio;
- Hambre no cambia;
- la Discrasia no se consume por usar Rubor;
- la exención puede seguir utilizándose mientras esa Discrasia permanezca
  activa por sus reglas de duración.

Rubor permanece disponible visualmente incluso en Hambre 5 porque la
comprobación de una posible exención corresponde al backend. Si no existe una
exención válida, el backend rechaza el Control voluntario en Hambre 5.

Tras una resolución válida, la ficha vuelve a cargar el estado canónico del
personaje. Si existe un conflicto por cambios concurrentes, la interfaz permite
recargar la ficha antes de repetir la acción.

### Abrazo y transición vampírica

Un personaje humano de Sesión 0 puede recibir el **Abrazo** mediante la acción
explícita disponible cuando corresponda.

El Abrazo transforma el mismo personaje: conserva su identidad, propietario,
Crónica asociada, Atributos, Habilidades, Especialidades, Humanidad, Inventario,
Notas e Historial. No crea una segunda ficha ni reduce Humanidad
automáticamente.

Dentro de una Crónica, el Abrazo y las decisiones narrativas posteriores
requieren el permiso contextual establecido para el Narrador. Cuando el
personaje no pertenece a una Crónica, la aplicación puede permitir la operación
al propietario según las reglas de autorización vigentes.

Tras el Abrazo, la ficha muestra las decisiones vampíricas pendientes y permite
resolverlas mediante las operaciones específicas disponibles. Clan, Sangre,
Disciplinas, Poderes, Ventajas, Tipo de Depredador y Sangre Débil reutilizan
las reglas ya existentes; estas dotaciones iniciales no consumen Experiencia.
Cuando el perfil cumple la validación vampírica completa, deja de mostrarse como
vampiro en transición.

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

Al completar una sesión, cada personaje registrado en su asistencia recibe
automáticamente 1 punto de Experiencia. Registrar o modificar la asistencia no
lo concede por sí solo, y repetir la finalización no duplica el movimiento.

La interfaz solicita al backend una previsualización del coste y de la validez
antes de confirmar la compra. El usuario no introduce manualmente el coste.

En una compra de Disciplina compatible, si existe una Discrasia activa capaz de
aportar el beneficio de Experiencia previsto por las reglas, la interfaz puede
ofrecer **Usar Discrasia activa**. Es opcional. La previsualización y la compra
usan la misma elección y el backend calcula el coste efectivo. Cuando el
beneficio se aplica al confirmar la adquisición, esa Discrasia queda consumida
para ese uso y no puede reutilizarse como si siguiera activa.

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

El Narrador contextual puede registrar la asistencia de personajes activos
asociados a la Crónica, tanto humanos como vampiros, mientras la Sesión sea
editable. La asistencia histórica se conserva y su registro no concede
Experiencia automáticamente.

Puede incluir preparación y notas privadas del Narrador.

## Dados V5

La interfaz incorpora paneles de **Dados V5** en los contextos donde el
producto ya los expone.

Se admiten:

- tiradas manuales;
- tiradas vinculadas a un personaje;
- preparación previa de la reserva;
- Hambre cuando el personaje dispone de estado vampírico compatible;
- dificultad cuando corresponda;
- visualización de los dados individuales;
- resultado estructurado;
- historial de tiradas.

Las tiradas vinculadas a un personaje humano utilizan únicamente dados
normales: no generan ni sustituyen Dados de Hambre ficticios.

Cuando una tirada vampírica usa una Disciplina asociada a la Resonancia activa,
el constructor de reserva puede aplicar el modificador correspondiente al
Temperamento. El backend deriva este modificador desde el estado real del
personaje y la explicación de la reserva lo refleja; la interfaz no se concede
el bonus por sí sola.

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
