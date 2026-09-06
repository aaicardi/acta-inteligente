# Actualizar las imágenes de Docker con los cambios

Guía para redesplegar Acta Inteligente después de modificar el código.
Todos los comandos se ejecutan desde la raíz del proyecto (`c:\snap`), que es
donde vive `docker-compose.yml`.

---

## El comando corto (el que usarás casi siempre)

```bash
docker compose up -d --build
```

Eso hace todo de una vez: reconstruye las imágenes con tu código actual,
recrea los contenedores y los deja corriendo. Con caché tarda ~8 segundos.

Luego abre **http://localhost:5173** y refresca con `Ctrl + Shift + R`
(recarga forzada, para saltarte la caché del navegador y el service worker
del PWA).

---

## Paso a paso completo

### 1. Libera los puertos si estabas en modo desarrollo

Los contenedores usan los puertos **3001** y **5173**. Si tienes corriendo
`npm run dev`, esos puertos están ocupados y el `up` falla.

Cierra las terminales de `npm run dev`, o revisa quién los tiene:

```bash
netstat -ano | grep LISTENING | grep -E ":(3001|5173) "
```

Si aparece algo, toma el PID (última columna) y ciérralo:

```bash
powershell -NoProfile -Command "Stop-Process -Id <PID> -Force"
```

> Si los puertos ya los tienen los propios contenedores, no hay nada que
> hacer: `docker compose up` los reemplaza solo.

### 2. (Opcional) Verifica que el código compila

Más rápido descubrir un error aquí que dentro del build de Docker:

```bash
cd snap-frontend && npm run build && npm run lint && cd ..
```

### 3. Reconstruye y levanta

```bash
docker compose up -d --build
```

- `--build` reconstruye las imágenes antes de arrancar. **Sin esta bandera
  Docker reutiliza la imagen vieja y no verás tus cambios.**
- `-d` lo deja corriendo en segundo plano.

Para reconstruir un solo servicio y no ambos:

```bash
docker compose up -d --build frontend    # solo el frontend
docker compose up -d --build backend     # solo el backend
```

### 4. Verifica que quedó arriba

```bash
docker compose ps
```

Los tres (`frontend`, `backend`, `mysql`) deben decir `Up`.

Prueba rápida de que responden:

```bash
curl -s -o /dev/null -w "frontend %{http_code}\n" http://localhost:5173/
curl -s -o /dev/null -w "backend  %{http_code}\n" http://localhost:3001/actas
```

Ambos deben dar `200`.

### 5. Revisa en el navegador

Abre **http://localhost:5173** y refresca con `Ctrl + Shift + R`.

---

## Qué reconstruir según lo que tocaste

| Cambiaste | Comando |
|---|---|
| Algo en `snap-frontend/src/` | `docker compose up -d --build frontend` |
| Algo en `snap-backend/src/` | `docker compose up -d --build backend` |
| Ambos, o no estás seguro | `docker compose up -d --build` |
| `snap-backend/.env` | `docker compose up -d backend` (**sin** `--build`) |
| `docker-compose.yml` | `docker compose up -d` |
| SQL en `snap-backend/db/init/` | Ver "Reiniciar la base" abajo |

### Por qué `.env` no lleva `--build`

El `.env` está en el `.dockerignore`, así que **no entra en la imagen**.
Compose lo inyecta al arrancar el contenedor (`env_file` en el compose).
Reconstruir no sirve de nada: lo que hace falta es recrear el contenedor.

---

## Volver a modo desarrollo

Para trabajar con recarga en caliente necesitas liberar los puertos:

```bash
docker compose stop frontend backend
```

Deja MySQL corriendo (es la misma base que usan los dos modos). Luego:

```bash
cd snap-backend  && npm run dev    # en una terminal
cd snap-frontend && npm run dev    # en otra
```

Para volver a Docker: `docker compose up -d`.

---

## Cuando algo sale mal

**Los cambios no aparecen en el navegador**

Casi siempre es caché del navegador o el service worker del PWA, no Docker.
Refresca con `Ctrl + Shift + R`. Si sigue igual, confirma que el bundle
desplegado sí tiene tu cambio (busca algún texto nuevo que hayas escrito):

```bash
js=$(curl -s http://localhost:5173/ | grep -o '/assets/index-[^"]*\.js')
curl -s "http://localhost:5173$js" | grep -c "algún texto nuevo tuyo"
```

Si da `1`, el despliegue está bien y el problema es la caché.
Si da `0`, la imagen quedó vieja: repite el `--build`.

**Un contenedor no arranca**

```bash
docker compose logs backend --tail 50
docker compose logs frontend --tail 50
```

**Error de puerto ocupado** (`port is already allocated`)

Vuelve al paso 1.

**Forzar una reconstrucción total, ignorando la caché**

Cuando sospechas que la caché de capas quedó rara (por ejemplo tras cambiar
dependencias en `package.json`):

```bash
docker compose build --no-cache
docker compose up -d
```

Tarda varios minutos porque reinstala todas las dependencias.

---

## Reiniciar la base de datos

> ⚠️ **Esto borra todas las actas, ítems y fotos registradas.**
> Las fotos que ya subieron a Cloudinary quedan allá huérfanas.

Los scripts de `snap-backend/db/init/` solo corren cuando el volumen de
MySQL está vacío. Para aplicar cambios de esquema desde cero:

```bash
docker compose down -v      # -v borra el volumen mysql_data
docker compose up -d --build
```

Sin `-v`, `down` conserva los datos y es seguro.

---

## Publicar en la nube (Vercel + Render + Aiven)

El piloto en la nube usa tres servicios: **Aiven** (MySQL gestionado),
**Render** (backend Node) y **Vercel** (frontend estatico).

### 1. Base de datos — Aiven

Ya esta creada, con el esquema de `snap-backend/db/init/001_schema.sql`
aplicado. Del panel del servicio necesitas dos cosas:

- La contrasena de `avnadmin` (*Connection information*).
- El **CA certificate** (`ca.pem`) del mismo panel. Aiven firma con su propia
  CA, que no esta en el almacen del sistema: sin ese archivo la conexion TLS
  no valida y el backend se niega a arrancar.

Para desarrollo local guardalo en `snap-backend/certs/aiven-ca.pem`
(la carpeta `certs/` esta en `.gitignore`) y en el `.env`:

```
DB_SSL=true
DB_SSL_CA_PATH=./certs/aiven-ca.pem
```

### 2. Backend — Render

`render.yaml` en la raiz ya declara el servicio. Las variables marcadas
`sync: false` **no viajan en el repo**: hay que cargarlas a mano en el
dashboard (*Environment*):

| Variable | De donde sale |
|---|---|
| `OPENAI_API_KEY` | Panel de OpenAI |
| `DB_PASSWORD` | Aiven, usuario `avnadmin` |
| `DB_SSL_CA` | Contenido **completo** del `ca.pem`, pegado tal cual (con las lineas `-----BEGIN/END CERTIFICATE-----`) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Panel de Cloudinary |
| `CORS_ORIGINS` | La URL de Vercel, p. ej. `https://acta-inteligente.vercel.app` |

> En Render se pega el **contenido** del certificado, no una ruta: el plan
> free no permite subir archivos al contenedor.

El health check apunta a `/health`. Si el deploy queda "unhealthy", casi
siempre es la base: revisa logs con el filtro `DB_SSL`.

### 3. Frontend — Vercel

`snap-frontend/vercel.json` fija el framework, el `dist/` y el rewrite a
`index.html` (necesario para que el PWA no de 404 al recargar).

Al importar el proyecto en Vercel: **Root Directory = `snap-frontend`**.

Y antes del primer deploy, en *Settings > Environment Variables*:

```
VITE_API_URL = https://<tu-servicio>.onrender.com
```

> Vite incrusta esa variable **en build-time**, no la lee en runtime.
> Cambiarla obliga a redesplegar; no basta con editarla en el panel.

### 4. Orden de publicacion

Hay una dependencia circular entre los dominios: el backend necesita saber la
URL de Vercel para el CORS, y el frontend necesita la de Render para el API.
Se resuelve en dos pasadas:

1. Deploy del backend en Render (sin `CORS_ORIGINS` todavia). Anota su URL.
2. Deploy del frontend en Vercel con `VITE_API_URL` = esa URL. Anota el dominio.
3. Vuelve a Render, define `CORS_ORIGINS` con el dominio de Vercel y redespliega.

### 5. Comprobar que quedo bien

```bash
curl -s https://<servicio>.onrender.com/health
curl -s -i -H "Origin: https://<app>.vercel.app"   https://<servicio>.onrender.com/health | grep -i access-control-allow-origin
```

El primero devuelve `{"ok":true}`. El segundo **debe** mostrar la cabecera
`Access-Control-Allow-Origin`; si no aparece, `CORS_ORIGINS` no coincide con el
dominio real y el navegador bloqueara todas las llamadas.

> El plan free de Render duerme el servicio tras ~15 min de inactividad: la
> primera peticion despues de una pausa puede tardar ~30 s. No es un error.

---

## Referencia de comandos

| Comando | Qué hace |
|---|---|
| `docker compose up -d --build` | Reconstruye y levanta todo |
| `docker compose ps` | Estado de los contenedores |
| `docker compose logs -f backend` | Logs en vivo |
| `docker compose restart backend` | Reinicia sin reconstruir |
| `docker compose stop` | Detiene, conserva contenedores y datos |
| `docker compose down` | Elimina contenedores, conserva datos |
| `docker compose down -v` | Elimina contenedores **y borra la base** |
