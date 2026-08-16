# Instalación portátil de BloodKeeper

## Contrato oficial

BloodKeeper se distribuye como contenedores y no depende de Ubuntu, de
una máquina virtual, de una ruta personal ni de una dirección IP fija.
El destino sólo necesita:

- Git para clonar el repositorio público;
- Docker Engine o Docker Desktop; en Ubuntu 24.04 `install.sh` puede
  instalar Docker Engine desde el repositorio oficial después de pedir
  autorización;
- Docker Compose integrado (`docker compose`);
- acceso a Internet para descargar imágenes base y dependencias públicas.

La instalación nueva crea volúmenes Docker vacíos. El repositorio no
contiene usuarios, crónicas, personajes, copias de seguridad ni una base
de datos preexistente.

## Instalación en una línea

```bash
git clone https://github.com/TrombosisLab/bloodkeeper.git && cd bloodkeeper && ./install.sh
```

No requiere GitHub CLI, token, invitación ni inicio de sesión en un
registro privado. El instalador construye localmente las imágenes release
de API, web y worker a partir del checkout descargado.

El instalador solicita la primera cuenta administradora únicamente en
una configuración nueva. Esa cuenta se crea en la base local del destino
y nunca forma parte del repositorio ni de las imágenes.

## Qué realiza `install.sh`

1. comprueba Docker y Docker Compose y, si faltan en Ubuntu 24.04,
   ofrece preparar el host reutilizando el adaptador oficial del
   repositorio;
2. crea `.env` con credenciales PostgreSQL aleatorias si no existe;
3. valida el Compose y los Dockerfiles release incluidos en el checkout;
4. construye localmente las imágenes release de API, web y worker de copias;
5. crea volúmenes Docker con nombres pertenecientes a la instalación;
6. aplica las migraciones Prisma;
7. arranca PostgreSQL, API, web y el worker portátil;
8. espera todos los health checks;
9. valida la comunicación web → API → PostgreSQL;
10. permite crear el administrador inicial.

La ejecución es idempotente: conserva `.env` y los volúmenes existentes.
No ejecuta `down --volumes` ni borra datos.

## Preparación de Docker

La preparación automática sólo modifica el host cuando Docker falta y
la persona confirma la operación. En instalaciones no interactivas debe
autorizarse expresamente:

```bash
BLOODKEEPER_AUTO_INSTALL_DOCKER=1 \
BLOODKEEPER_NONINTERACTIVE=1 \
./install.sh
```

En otros sistemas, `install.sh` conserva el contrato portable y solicita
que Docker con Compose esté disponible. No intenta instalar Docker
Desktop ni aplicar órdenes propias de una distribución distinta.

Antes de construir, el instalador muestra el espacio disponible del
almacenamiento Docker. El umbral de aviso, que nunca bloquea por sí
mismo, puede ajustarse con `BLOODKEEPER_WARN_FREE_MB`. La construcción
necesita temporalmente más memoria y espacio que la mera ejecución.

Los fallos de construcción distinguen falta de espacio, memoria
insuficiente y problemas de red al descargar imágenes base o dependencias.
No se solicitan credenciales de ningún registro privado.

## Acceso

En la máquina donde se ejecuta Docker:

```text
http://localhost:5173
```

Desde otro dispositivo se utiliza el nombre o la dirección vigente de
la máquina Docker. BloodKeeper no guarda esa dirección en el código. El
puerto puede cambiarse antes de instalar:

```bash
BLOODKEEPER_WEB_PORT=8080 ./install.sh
```

La API sólo se publica en la interfaz local del host; los clientes
acceden a ella mediante el proxy `/api` de la web.

## Instalación no interactiva

Para automatización controlada, las tres variables administrativas son
obligatorias en conjunto:

```bash
BLOODKEEPER_NONINTERACTIVE=1 \
BLOODKEEPER_ADMIN_USERNAME=admin \
BLOODKEEPER_ADMIN_DISPLAY_NAME='Administrador' \
BLOODKEEPER_ADMIN_PASSWORD='CONTRASEÑA_LOCAL_SEGURA' \
./install.sh
```

No se deben guardar esas variables en Git, en scripts compartidos ni en
el historial del terminal. En automatización real deben proceder del
gestor de secretos del entorno.

## Persistencia y copias

Los datos se guardan en volúmenes Docker del proyecto. El worker de
copias usa también volúmenes con nombre y no monta rutas personales del
host ni el socket Docker. Para extraer copias fuera de la máquina debe
seguirse el procedimiento de recuperación y exportación documentado.

## Adaptador heredado de Ubuntu

`scripts/bootstrap-server.sh` se conserva temporalmente como adaptador
para preparar Ubuntu Server 24.04. `install.sh` lo reutiliza únicamente
cuando Docker falta y se autoriza la modificación del host. El punto de
entrada recomendado continúa siendo `install.sh`.
