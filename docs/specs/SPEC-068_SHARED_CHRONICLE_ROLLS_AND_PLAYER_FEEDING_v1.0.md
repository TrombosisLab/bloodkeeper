# SPEC-068 — Tiradas compartidas de crónica y alimentación del jugador

## Objetivo

Cerrar dos discontinuidades del espacio **Jugar**: compartir las tiradas con la mesa y permitir que el propietario gestione la alimentación de su personaje.

## Visibilidad de tiradas

- Toda tirada contextual de una crónica es visible por defecto para sus participantes activos.
- El selector permite elegir **Solo tú y el Narrador**.
- El Narrador puede consultar todas las tiradas de la crónica, incluidas las privadas.
- El historial de **Jugar** muestra la memoria completa de la crónica y no oculta acciones rápidas que carezcan de sesión histórica.
- Las tiradas sin crónica conservan su privacidad por actor.

## Alimentación

- El propietario puede alimentar a su personaje activo aunque esté asociado a una crónica.
- Un Narrador activo de esa crónica mantiene permiso contextual.
- Otros participantes y terceros no pueden modificar la Sangre del personaje.
- La regla se aplica igual desde **Jugar** y desde la ficha canónica.

## Verificación

- Pruebas API de propietario, Narrador y tercero.
- Pruebas web de visibilidad predeterminada, selector privado e historial compartido.
- Typecheck, pruebas y builds dentro de Docker.
