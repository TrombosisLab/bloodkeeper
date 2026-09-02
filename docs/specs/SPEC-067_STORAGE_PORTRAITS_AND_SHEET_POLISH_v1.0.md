# SPEC-067 — Almacenamiento, retratos y cierre visual de ficha

## Estado

Implementación propuesta. El sistema de tiradas Atributo + Habilidad queda expresamente aplazado para una especificación posterior.

## Objetivos

1. Mostrar en Administración el espacio persistente gestionado por BloodKeeper, expresado en MB.
2. Permitir que el propietario suba, sustituya y elimine el retrato de su personaje.
3. Usar el emblema del clan como representación predeterminada cuando no exista retrato.
4. Situar la Validación global al final absoluto de la ficha persistida.
5. Mantener toda la solución portable, contenida en Docker y cubierta por la copia PostgreSQL existente.

## Almacenamiento

El panel administrativo informa de:

- tamaño completo de PostgreSQL;
- tamaño y cantidad de retratos (subconjunto de PostgreSQL);
- tamaño y cantidad de archivos de copia;
- total persistente, calculado como PostgreSQL más copias, sin sumar dos veces los retratos.

No se incluyen imágenes Docker, capas de contenedores, código fuente ni logs del host, porque no son datos funcionales portables de BloodKeeper.

## Retratos

- Formatos: JPEG, PNG y WebP.
- Tamaño máximo: 2 MiB por personaje.
- Una imagen por personaje; una nueva subida sustituye la anterior.
- Validación por cabecera binaria, no sólo por extensión o MIME declarado.
- Sólo el propietario autenticado puede consultar, subir o eliminar el retrato desde la ficha.
- Persistencia en PostgreSQL para quedar incluida en las copias portables existentes.

## Ficha

El retrato aparece en Identidad. Si no existe o no puede cargarse, se presenta el emblema canónico del clan. La Validación global se renderiza después de todas las secciones operativas y del ciclo de vida.

## Pendiente deliberado

El constructor de tiradas mediante Atributo + Habilidad se mantiene en espera. Antes de implementarlo deben definirse selección, especialidades, disciplinas, reservas derivadas, Hambre, modificadores, dificultad y visibilidad sin duplicar el constructor manual.
