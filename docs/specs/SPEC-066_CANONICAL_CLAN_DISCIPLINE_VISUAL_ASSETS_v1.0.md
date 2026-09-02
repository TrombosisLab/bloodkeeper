# SPEC-066 — Identidad visual canónica de clanes y disciplinas

## Objetivo
Integrar las 44 imágenes aportadas como catálogo visual único y reutilizable en creación de personaje, ficha, juego y recursos de crónica.

## Alcance
- 16 símbolos y 16 logotipos de clan.
- 12 iconos de disciplinas.
- Resolución por clave canónica, nombre español, nombre inglés y alias históricos.
- Uso de máscaras CSS para colorear los recursos negros sin modificar sus píxeles.
- Tamaños, accesibilidad y fallback homogéneos.
- Integración en selector de clan, editor y ficha de disciplinas, identidad de ficha, juego y dossier profundo de PNJ.

## Restricciones
- Los binarios originales no se reinterpretan ni redibujan.
- No se añaden dependencias ni instalaciones en el host.
- La compilación y pruebas se ejecutan dentro de Docker.
