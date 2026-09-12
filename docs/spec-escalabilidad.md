# Spec — Escalar Acta Inteligente a producto multi-empresa

Estado: propuesta · Autor: Jhoel Aicardi · Fecha: 2026-09-09

---

## 1. Contexto y objetivo

Acta Inteligente digitaliza el levantamiento de actas de inspección previa de
mercancías. Hoy el proceso es manual; la propuesta de valor es que la IA extrae
de las fotos los datos del producto (referencia, modelo, serial, país de origen,
descripción) y el inspector solo verifica y corrige.

El piloto funciona y está desplegado (Vercel + Render + MySQL en Aiven +
Cloudinary). El objetivo ahora es **poder vender el producto a agencias de
aduanas** y operarlo para varias empresas a la vez.

### El supuesto que hay que romper

Todo el código actual asume **un solo usuario, una sola empresa, un inspector a
la vez**. No es un detalle de implementación: está en el esquema, en las
queries y en las rutas. El ejemplo más claro:

```sql
-- src/db/actas.js:53 — obtenerEnCurso()
SELECT id FROM actas WHERE estado = 'en_curso' ORDER BY creada_en DESC LIMIT 1
```

Existe **una sola acta en curso en todo el sistema**. Dos inspectores
trabajando al mismo tiempo se roban el acta entre ellos. Esto no escala ni a
dos usuarios de la misma empresa.

### Criterio de éxito

1. Dos agencias distintas usan el sistema sin poder ver datos de la otra, nunca.
2. Varios inspectores de la misma agencia trabajan en paralelo sin interferirse.
3. Las fotos de inventario no son accesibles por quien no está autenticado.
4. Se puede medir cuánto cuesta en IA cada empresa, para poder tarifar.

---

## 2. Decisiones de producto tomadas

| Decisión | Elección | Implicación |
|---|---|---|
| Modelo de acceso | Email + contraseña, usuarios creados por un admin de la empresa | Sin auto-registro público: evita abuso del saldo de OpenAI y simplifica el alcance |
| Visibilidad de actas | Todos los inspectores de una empresa ven todas las actas de esa empresa | El histórico es compartido por empresa; el aislamiento es a nivel de empresa, no de usuario |
| Motor de base de datos | Se mantiene **MySQL** | Ver §3 |

---

## 3. Decisión de arquitectura: MySQL vs PostgreSQL

**Se mantiene MySQL.**

PostgreSQL ofrecería dos ventajas reales para este producto: *Row-Level
Security* (el motor impide leer filas de otro tenant aunque el desarrollador
olvide el `WHERE empresa_id`) y mejor búsqueda de texto y `jsonb`.

Aun así no se migra ahora porque:

- El riesgo de un SaaS multi-tenant no está en el motor, está en que se escape
  un filtro. Se mitiga con la regla de §5.2 y con tests — que hacen falta de
  todos modos.
- Migrar obliga a reescribir `pool.js`, las tres capas `db/*.js`, el esquema, el
  manejo de errores (`ER_DUP_ENTRY` no existe en Postgres), el compose y el
  despliegue. Días de trabajo sin valor para el cliente.
- La carga es simple y transaccional. MySQL 8.4 la maneja sin problema.
- Lo ya resuelto tiene valor: TLS contra Aiven con CA propia, Docker local,
  esquema desplegado.

**Cuándo reconsiderar:** búsqueda avanzada sobre descripciones, analítica pesada
sobre los datos extraídos por IA, o exigencia normativa de aislamiento por base.
Con clientes pagando, no antes.

> ⚠️ Independiente del motor: hoy la base está en el **plan free de Aiven**, sin
> backups automáticos ni garantía de disponibilidad. Debe subirse de plan antes
> de cargar datos de un cliente real. Perder actas de inventario de una agencia
> aduanera es más grave que cualquier diferencia MySQL/Postgres.

---

## 4. Hallazgos del escaneo

Ordenados por impacto. Los tres primeros bloquean la venta.

### 🔴 Bloqueantes

**H1 — No existe autenticación.**
Ninguna ruta de `src/routes/actas.js` valida quién llama. El backend está
público en Render: cualquiera con la URL puede listar, descargar, modificar o
borrar las actas de todos los clientes. `src/server.js:12` ya lo reconoce en un
comentario. CORS no protege: solo restringe navegadores, no un `curl`.

**H2 — No hay multi-tenant.**
El esquema no tiene noción de empresa. Además de `obtenerEnCurso()` (arriba),
`crear()` prellena ciudad/depósito con la última acta generada *de cualquiera*.

**H3 — Las fotos de Cloudinary son públicas.**
`cloudinaryService.js` sube con `secure_url` pública en
`acta-inteligente/{actaId}/{itemId}`. URLs sin firmar: quien tenga o adivine el
enlace ve la mercancía del cliente. Riesgo comercial y legal en aduanas.

### 🟡 Escalabilidad

**H4 — Queries N+1.** `src/db/items.js:55-62` hace una query de fotos por cada
ítem, en serie. Un acta de 80 ítems son 81 queries secuenciales. Con
`connectionLimit: 10` y Aiven free, se degrada con poca concurrencia.

**H5 — Fotos en base64 por el body.** `express.json({ limit: '50mb' })`: el
móvil sube hasta 20MB, Node los retiene en memoria, los reenvía a Cloudinary y
además a OpenAI. En Render free (512MB RAM) pocos análisis simultáneos tumban el
proceso. Base64 infla el tráfico 33% para un inspector que suele estar en bodega
con mala señal.

**H6 — Análisis de IA síncrono.** La petición HTTP espera a que OpenAI termine,
más reintentos de rate limit. Si el móvil pierde señal a mitad, se pierde el
trabajo.

**H7 — Sin control de costos de IA.** Cada análisis cuesta dinero real y no hay
límite, cuota ni registro por cliente. No se puede tarifar lo que no se mide.
Tampoco hay caché: reanalizar el mismo ítem vuelve a pagar.

**H8 — Cero tests.** El CI solo corre `node --check`, que verifica que el
archivo parsea. Ninguna prueba de lógica de negocio.

### 🟢 Menores

- **H9** — `OPENAI_VISION_MODEL` se lee sin default en `openaiProvider.js:4`,
  pero `.env.example` promete "por defecto gpt-4o-mini si se deja vacío". Con la
  variable vacía se llama a OpenAI con `model: undefined`.
- **H10** — Sin validación de entrada. `PATCH /actas/:id` acepta cualquier valor;
  un `cliente` de 10.000 caracteres revienta contra `VARCHAR(255)` con un 500 en
  vez de un 400 claro.
- **H11** — Sin rate limiting: nada impide llamar `/analizar` en bucle y quemar
  el saldo de OpenAI.
- **H12** — Sin migraciones. Solo existe `001_schema.sql` de init; evolucionar el
  esquema en producción es manual y arriesgado — justo lo que exige el
  multi-tenant.
- **H13** — `App.jsx` con 640 líneas y ~18 `useState`; el estado de servidor se
  maneja a mano con loading/error duplicados.
- **H14** — Sin observabilidad más allá de `console.error`.
- **H15** — Clave `DEEPSEEK_API_KEY` real commiteada en `.env.example` (ya
  limpiada del archivo; **queda pendiente revocarla en el panel de DeepSeek**).

---

## 5. Diseño propuesto

### 5.1 Modelo de datos

Dos tablas nuevas y una columna en `actas`. El resto del esquema no cambia: el
aislamiento cuelga de `actas`, e `items` y `fotos` heredan por FK.

```sql
CREATE TABLE empresas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(255) NOT NULL,
  nit         VARCHAR(64)  NOT NULL DEFAULT '',
  estado      ENUM('activa','suspendida') NOT NULL DEFAULT 'activa',
  creada_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id    INT UNSIGNED NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre        VARCHAR(255) NOT NULL DEFAULT '',
  rol           ENUM('admin','inspector') NOT NULL DEFAULT 'inspector',
  estado        ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  UNIQUE KEY uq_usuarios_email (email),
  INDEX idx_usuarios_empresa (empresa_id)
) ENGINE=InnoDB;

ALTER TABLE actas
  ADD COLUMN empresa_id INT UNSIGNED NOT NULL AFTER id,
  ADD COLUMN creada_por INT UNSIGNED NULL AFTER empresa_id,
  ADD CONSTRAINT fk_actas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  ADD CONSTRAINT fk_actas_usuario FOREIGN KEY (creada_por) REFERENCES usuarios(id),
  ADD INDEX idx_actas_empresa (empresa_id),
  ADD INDEX idx_actas_empresa_estado (empresa_id, estado);
```

`creada_por` permite que "acta en curso" sea **por usuario** (H2) y sirve de
base para la auditoría de Fase 3. Es `NULL` para tolerar el backfill de los
datos existentes.

**Nota de migración:** ya hay actas en producción sin `empresa_id`. La migración
crea una empresa por defecto, asigna las actas existentes a ella y solo entonces
aplica el `NOT NULL`.

### 5.2 Regla de aislamiento (la más importante del spec)

> **Ninguna función de `src/db/*.js` acepta un ID sin recibir también el
> `empresaId`, y toda query lleva `empresa_id` en el `WHERE`.**

El filtro **no** se aplica en la capa de rutas. Vive en la capa de datos, en un
solo lugar, para que sea auditable de un vistazo y testeable. Esto es lo que
sustituye al RLS que daría Postgres (§3).

```js
// Antes
async function obtenerPorId(id) {
  const [filas] = await pool.query('SELECT * FROM actas WHERE id = ?', [id]);

// Después
async function obtenerPorId(id, empresaId) {
  const [filas] = await pool.query(
    'SELECT * FROM actas WHERE id = ? AND empresa_id = ?', [id, empresaId]);
```

Un acta de otra empresa devuelve `null` → la ruta responde 404. Nunca 403: no se
confirma la existencia de recursos ajenos.

Para `items` y `fotos`, que no tienen `empresa_id` propio, el filtro va por JOIN
contra `actas`.

### 5.3 Autenticación

- `POST /auth/login` → valida credenciales, devuelve JWT.
- JWT con `{ userId, empresaId, rol }`, firmado con `JWT_SECRET`, expiración 12h
  (una jornada de inspección).
- Contraseñas con **bcrypt** (coste 12).
- Middleware `requireAuth` monta `req.auth` y se aplica a **todo** `/actas/*`.
- Middleware `requireAdmin` para la gestión de usuarios.
- El frontend guarda el token y lo envía en `Authorization: Bearer`. En 401,
  limpia sesión y vuelve al login.

Rutas nuevas de administración (solo `rol = admin`):
`POST /usuarios`, `GET /usuarios`, `PATCH /usuarios/:id`.

El alta de **empresas** no se expone por API en esta fase: se hace con un script
de operador (`scripts/crear-empresa.js`). Menos superficie de ataque y no hay
todavía un caso de uso real de auto-servicio.

### 5.4 Fotos privadas

Cloudinary pasa a `type: 'authenticated'` y las URLs se firman con expiración
corta. La carpeta incluye la empresa:

```
acta-inteligente/{empresaId}/{actaId}/{itemId}
```

El backend firma la URL al momento de servir el acta; el frontend recibe una URL
ya firmada con TTL. Las fotos existentes se migran con un script.

### 5.5 Análisis asíncrono (Fase 2)

`POST /actas/:id/items/:itemId/analizar` deja de bloquear:

1. Valida, encola el trabajo y responde `202 { estado: 'analizando' }`.
2. Un worker consume la cola, llama a la IA y actualiza el ítem.
3. El frontend consulta `GET /actas/:id` (polling ligero) hasta que el estado
   deje de ser `analizando`.

El estado `analizando` ya existe en el esquema, así que el modelo de datos casi
lo permite hoy. La cola arranca **in-process** (una cola simple en memoria con
concurrencia limitada) para no añadir infraestructura; si el volumen lo exige, se
migra a Redis/BullMQ sin cambiar el contrato de la API.

### 5.6 Subida directa de fotos (Fase 2)

Invierte el flujo de H5:

1. `POST /uploads/firma` → el backend devuelve una firma de Cloudinary.
2. El navegador sube **directo** a Cloudinary (sin pasar por Render).
3. El frontend manda solo las URLs al backend.

Elimina el pico de RAM en Render, quita el 33% de sobrecarga de base64 y acelera
la captura en bodega.

### 5.7 Medición de costo de IA (Fase 3)

```sql
CREATE TABLE consumo_ia (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id    INT UNSIGNED NOT NULL,
  acta_id       INT UNSIGNED NULL,
  item_id       INT UNSIGNED NULL,
  proveedor     VARCHAR(32)  NOT NULL,
  modelo        VARCHAR(64)  NOT NULL,
  tokens_in     INT UNSIGNED NOT NULL DEFAULT 0,
  tokens_out    INT UNSIGNED NOT NULL DEFAULT 0,
  num_fotos     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  exito         BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_consumo_empresa_fecha (empresa_id, creado_en)
) ENGINE=InnoDB;
```

Los proveedores de visión ya devuelven `usage` en la respuesta; hoy se descarta.
Basta con propagarlo y registrarlo. Habilita cuotas por empresa y tarifación real.

### 5.8 Plantillas de acta por empresa (Fase 3)

Hoy el Excel de `excelService.js` es fijo. Cada agencia tiene su propio formato,
y esto es lo que de verdad permite escalar a varias empresas: plantilla
`.xlsx` por empresa + mapa de campos a celdas, en vez de una plantilla en código.

---

## 6. Plan por fases

### Fase 1 — Habilitar el primer cliente 🔴
*Sin esto no se puede vender. Es lo que no se puede añadir cómodamente después:
cada línea escrita sobre el supuesto de un solo tenant encarece la migración.*

| # | Tarea | Archivos | Depende de |
|---|---|---|---|
| 1.1 | Herramienta de migraciones + convertir el esquema actual en la migración inicial | `db/migrations/`, `package.json` | — |
| 1.2 | Migración: tablas `empresas` y `usuarios` | `db/migrations/002_*.sql` | 1.1 |
| 1.3 | Migración: `empresa_id` + `creada_por` en `actas`, con backfill de datos existentes | `db/migrations/003_*.sql` | 1.2 |
| 1.4 | Capa de datos `db/empresas.js` y `db/usuarios.js` (bcrypt) | nuevos | 1.2 |
| 1.5 | `POST /auth/login` + emisión de JWT | `routes/auth.js`, `services/authService.js` | 1.4 |
| 1.6 | Middlewares `requireAuth` / `requireAdmin` | `middleware/auth.js` | 1.5 |
| 1.7 | **Propagar `empresaId` a toda la capa de datos** (regla §5.2) | `db/actas.js`, `db/items.js`, `db/fotos.js` | 1.3 |
| 1.8 | Aplicar `requireAuth` a todas las rutas de actas y pasar `req.auth.empresaId` | `routes/actas.js` | 1.6, 1.7 |
| 1.9 | `obtenerEnCurso` y `crear` pasan a ser por usuario, no globales | `db/actas.js` | 1.7 |
| 1.10 | CRUD de usuarios para el admin de la empresa | `routes/usuarios.js` | 1.6 |
| 1.11 | Script de operador para dar de alta empresas | `scripts/crear-empresa.js` | 1.4 |
| 1.12 | Fotos privadas en Cloudinary + URLs firmadas + carpeta por empresa | `services/cloudinaryService.js` | 1.8 |
| 1.13 | Script de migración de fotos existentes a `authenticated` | `scripts/migrar-fotos.js` | 1.12 |
| 1.14 | Validación de entrada con Zod en todas las rutas (H10) | `routes/*`, `schemas/` | 1.8 |
| 1.15 | Rate limiting, estricto en `/analizar` y `/auth/login` (H11) | `server.js` | 1.8 |
| 1.16 | Login + manejo de sesión y 401 en el frontend | `lib/api.js`, `App.jsx`, `components/Login.jsx` | 1.5 |
| 1.17 | Fix `OPENAI_VISION_MODEL` sin default (H9) | `vision/openaiProvider.js` | — |
| 1.18 | Tests de aislamiento entre tenants — **no negociable** | `tests/` | 1.8 |
| 1.19 | Variables nuevas (`JWT_SECRET`) en `.env.example`, `render.yaml` y compose | config | 1.5 |
| 1.20 | Subir Aiven de plan free a uno con backups | infra | — |
| 1.21 | Revocar la `DEEPSEEK_API_KEY` filtrada (H15) | externo | — |

**Salida de fase:** dos empresas de prueba coexisten sin verse; dos inspectores
de la misma empresa trabajan en paralelo; las fotos no se abren sin sesión.

### Fase 2 — Aguantar uso real 🟡

| # | Tarea | Depende de |
|---|---|---|
| 2.1 | Eliminar N+1: cargar fotos de un acta con un solo `WHERE item_id IN (...)` (H4) | Fase 1 |
| 2.2 | Endpoint de firma para subida directa a Cloudinary (§5.6) | Fase 1 |
| 2.3 | Frontend sube directo a Cloudinary y envía solo URLs; bajar el límite de body de 50mb | 2.2 |
| 2.4 | Cola in-process y `202` en `/analizar` (§5.5) | Fase 1 |
| 2.5 | Polling de estado en el frontend, reemplazando la espera bloqueante | 2.4 |
| 2.6 | Tests de la lógica crítica: visión, generación de Excel, capa de datos (H8) | Fase 1 |
| 2.7 | CI real: correr tests, no solo `node --check` | 2.6 |
| 2.8 | Índices de apoyo según los planes de ejecución reales | 2.1 |

### Fase 3 — Producto vendible 🟢

| # | Tarea | Depende de |
|---|---|---|
| 3.1 | Tabla `consumo_ia` + registro de `usage` de los proveedores (§5.7) | Fase 2 |
| 3.2 | Cuotas y alertas de consumo por empresa | 3.1 |
| 3.3 | Observabilidad (Sentry o equivalente) y logs estructurados (H14) | Fase 2 |
| 3.4 | Auditoría de acciones — suele ser requisito en aduanas | Fase 2 |
| 3.5 | Plantillas de acta configurables por empresa (§5.8) | Fase 2 |
| 3.6 | Refactor de `App.jsx`: React Query para el estado de servidor (H13) | Fase 2 |
| 3.7 | Panel de administración de empresa (usuarios, consumo, plantilla) | 3.1, 3.5 |

---

## 7. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Se escapa un `WHERE empresa_id` y una empresa ve datos de otra | Crítico — pérdida del cliente y posible incidente legal | Regla §5.2 en una sola capa + tests 1.18 obligatorios + revisión específica de cada query |
| El backfill de `empresa_id` corrompe las actas existentes | Alto | Backup verificado antes de migrar; probar la migración completa en Docker local con copia de producción |
| Migrar fotos a `authenticated` rompe las URLs guardadas | Medio | Script idempotente y reejecutable; validar en local antes |
| Las fases se alargan y se empieza a vender sin Fase 1 | Crítico | Fase 1 es requisito de venta, no una mejora opcional |
| Aiven free sin backups durante la migración | Alto | Tarea 1.20 antes de tocar el esquema en producción |

---

## 8. Fuera de alcance

- Migración a PostgreSQL (§3).
- Auto-registro público de empresas.
- Facturación y pasarela de pago.
- App móvil nativa: la PWA actual cubre el caso de uso.
- Validar DeepSeek como proveedor de producción; sigue experimental.
