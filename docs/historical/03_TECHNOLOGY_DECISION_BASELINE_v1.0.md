# 03 – TECHNOLOGY DECISION BASELINE

## Propósito
Fijar una base tecnológica inicial suficientemente concreta para evitar decisiones repetidas, manteniendo posibilidad de ajuste si el entorno real lo exige.

## Base recomendada

### Repositorio
Monorepo con pnpm workspaces.

No incorporar Nx u otro orquestador adicional en el arranque salvo que el repositorio existente ya lo utilice de forma válida o exista una necesidad demostrada.

### Frontend
- React.
- TypeScript.
- Vite.

### Backend
- Node.js LTS.
- TypeScript.
- NestJS.

### Base de datos
- PostgreSQL.

### ORM
- Prisma, manteniendo una única versión coherente entre CLI y cliente.

### Contenedores
- Docker.
- Docker Compose.

### Pruebas
Utilizar herramientas compatibles con el stack elegido, evitando duplicar frameworks de pruebas sin necesidad.

## Principios
- Versiones estables y mantenidas.
- Bloqueo de versiones mediante lockfile.
- Imágenes Docker reproducibles.
- Dependencias mínimas.
- TypeScript estricto cuando sea razonable.

## UI
No seleccionar una librería de componentes pesada antes de validar la primera ficha.

El sistema de diseño se construirá progresivamente.

## Autenticación
No incorporar proveedores externos en el esqueleto inicial.

## Cambios
Si el repositorio ya contiene una base técnica funcional distinta, Gemini deberá evaluar primero el estado real antes de reemplazarla.

No reconstruir por costumbre lo que ya funciona.
