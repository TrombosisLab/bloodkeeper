# SPEC-026 – CHARACTER_ADVANTAGES_BACKGROUNDS_FLAWS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-026 |
| Documento | CHARACTER_ADVANTAGES_BACKGROUNDS_FLAWS.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.1 |
| Estado | Aprobado |

---

# Propósito

Definir el tratamiento funcional, visual y de datos de Ventajas, Trasfondos, Méritos y Defectos asociados a los personajes.

---

# Objetivos

- Representar estos elementos de forma extensible y validable.
- Evitar estructuras rígidas específicas para cada opción.
- Aplicar reglas de creación y evolución desde una fuente central.
- Facilitar su consulta en la ficha.
- Permitir futuras ampliaciones sin generar código espagueti.

---

# Modelo conceptual

Las definiciones de catálogo y las selecciones de cada personaje deberán mantenerse separadas.

Una definición podrá incluir:

- Identificador estable.
- Nombre visible.
- Categoría.
- Tipo.
- Puntuaciones o niveles permitidos cuando corresponda.
- Requisitos estructurados.
- Incompatibilidades.
- Estado activo.
- Referencia de fuente cuando proceda.

Cada personaje almacenará únicamente selecciones que referencien dichas definiciones.

---

# Naturaleza funcional de las definiciones

Aunque todas las opciones pertenecen al mismo catálogo, funcionalmente pueden representar comportamientos distintos.

Las definiciones podrán corresponder a:

- Valores escalares.
- Entidades con identidad propia.
- Localizaciones.
- Colecciones.
- Elementos dependientes de otra selección.

Esta clasificación permite que la interfaz utilice el editor adecuado sin modificar el modelo del catálogo.

---

# Selecciones del personaje

Cada selección podrá almacenar:

- Referencia a la definición.
- Puntuación o nivel.
- Datos específicos mínimos necesarios.
- Nombre personalizado cuando las reglas lo permitan.
- Notas del personaje cuando aporten contexto.
- Estado de completitud cuando proceda.

---

# Relaciones entre selecciones

Algunas selecciones podrán depender funcionalmente de otra selección.

Ejemplo conceptual:

Refugio
└── Embrujado

Estas dependencias deberán implementarse mediante referencias explícitas entre selecciones y nunca mediante relaciones implícitas basadas únicamente en el tipo de definición.

---

# Categorías

La interfaz distinguirá claramente entre:

- Ventajas.
- Trasfondos.
- Méritos.
- Defectos.

La clasificación deberá proceder de datos controlados y no de textos repetidos en componentes.

---

# Creación de personaje

Durante la creación:

- Se mostrarán recursos disponibles y utilizados.
- Se impedirán selecciones incompatibles.
- Se validarán mínimos, máximos y requisitos.
- Los errores explicarán qué debe corregirse.
- Los cambios en decisiones previas provocarán revalidación cuando sea necesario.

La creación de personaje únicamente gestionará elementos pertenecientes al propio personaje.

Los elementos compartidos de Coterie se implementarán en su módulo específico.

---

# Evolución posterior

Las reglas de adquisición, mejora o eliminación posteriores a la creación se mantendrán separadas de las reglas iniciales.

La información narrativa podrá completarse posteriormente durante la evolución del personaje sin invalidar una creación reglamentariamente correcta.

---

# Elementos con datos específicos

Algunas opciones podrán requerir información adicional, por ejemplo:

- Nombre.
- Relación.
- Especialización.
- Descripción breve.

La arquitectura deberá soportar estos datos sin crear campos permanentes innecesarios en la entidad principal Personaje.

No se utilizarán estructuras genéricas sin validación para resolver cualquier caso.

---

# Presentación en ficha

La ficha mostrará:

- Nombre.
- Puntuación cuando corresponda.
- Categoría de forma comprensible.
- Información personalizada relevante.

Los detalles secundarios podrán expandirse sin abandonar innecesariamente la ficha.

La interfaz podrá utilizar editores especializados según la naturaleza funcional de la definición.

---

# Catálogo y contenido

El catálogo deberá permitir:

- Añadir definiciones autorizadas.
- Activar o desactivar opciones.
- Mantener identificadores estables.
- Asociar referencias bibliográficas.
- Extender contenido sin modificar múltiples componentes de código.

No se reproducirán extensos textos protegidos de manuales oficiales.

---

# Validación

Se distinguen dos niveles.

## Validación reglamentaria

Impide completar el paso correspondiente.

Incluye:

- Puntuaciones fuera de rango.
- Recursos insuficientes.
- Requisitos incumplidos.
- Incompatibilidades.
- Duplicados no permitidos.
- Dependencias obligatorias.

## Validación narrativa

No impide completar la creación.

Incluye información pendiente que podrá completarse posteriormente durante la evolución del personaje.

---

# Integración con otros módulos

Las relaciones con:

- Crónicas.
- PNJ.
- Localizaciones.
- Recursos narrativos.

se implementarán mediante referencias explícitas cuando exista una necesidad funcional real.

No se crearán dependencias prematuras.

---

# Persistencia

Se separarán claramente:

- Catálogo de definiciones.
- Selecciones del personaje.
- Datos personalizados asociados.

La eliminación de una definición utilizada deberá estar protegida para preservar la integridad histórica.

---

# Pruebas

Se incluirán pruebas para:

- Selecciones válidas.
- Límites.
- Requisitos.
- Incompatibilidades.
- Recursos de creación.
- Datos específicos.
- Relaciones entre selecciones.
- Evolución posterior.

---

# Criterios de aceptación

- Estructura extensible.
- Validación centralizada.
- Presentación clara.
- Sin campos rígidos innecesarios en Personaje.
- Catálogo separado de selecciones.
- Preparado para creación y evolución futura.
- Soporte para relaciones explícitas entre selecciones.
- Compatible con futuros módulos de Coteries sin modificar el modelo del personaje.
