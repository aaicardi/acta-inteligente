# Plan de implementación: Acta Inteligente (Piloto)
Fecha: 26 de julio de 2026
Basado en: `spec.md`

> Este plan traduce el spec en decisiones técnicas y tareas concretas. Está escrito para que **cualquier IA de desarrollo (Claude Code u otra) o cualquier desarrollador** pueda construir el piloto sin necesidad de más contexto. Donde haya una decisión de arquitectura, se explica el porqué para que el ejecutor pueda cambiarla con criterio si tiene una razón mejor.

---

## 1. Resumen técnico

Se construye una **Progressive Web App (PWA) mobile-first** que corre en el navegador del celular, funciona parcialmente offline, captura fotos, las envía a un **backend liviano** que llama a un **modelo de visión (Claude vía API de Anthropic)** para extraer la información de cada producto, y genera el acta final rellenando la **plantilla oficial de Excel** sin alterar su formato.

Principios que guían el plan:
- **Mobile-first y una sola mano:** botones grandes, flujo lineal, cámara nativa del teléfono.
- **Offline-resiliente:** nunca se pierde una captura por falta de señal. Lo local es la fuente de verdad durante la inspección.
- **La plantilla oficial es sagrada:** el Excel se genera rellenando el `.xlsx` existente, no recreándolo.
- **La IA propone, el humano dispone:** revisión por excepción, nunca datos inventados.
- **Piloto mínimo:** sin login, sin multiempresa, sin nube permanente. Lo más simple que valide la hipótesis.

---

## 2. Arquitectura

```
┌─────────────────────────────┐
│  CELULAR (navegador)        │
│  PWA mobile-first           │
│  - Cámara / captura fotos   │
│  - Formulario encabezado    │
│  - Lista de ítems + estados │
│  - Almacenamiento local     │◄── IndexedDB (fotos, ítems, encabezado, cola)
│  - Cola de análisis offline │
└──────────────┬──────────────┘
               │ HTTPS (cuando hay señal)
               ▼
┌─────────────────────────────┐
│  BACKEND (API liviana)      │
│  - POST /analizar-producto  │──► llama a Claude (visión) y devuelve JSON estructurado
│  - POST /generar-acta       │──► rellena la plantilla .xlsx y devuelve el archivo
│  - POST /procesar-zip       │──► descomprime, agrupa por carpeta, encola análisis
└──────────────┬──────────────┘
               │
               ▼
     API de Anthropic (Claude, visión)
```

**Por qué backend y no todo en el celular:** la clave (API key) de Anthropic no puede vivir en el celular (sería pública). El backend la protege y centraliza el prompt de extracción y la generación del Excel. El backend es *stateless* en el piloto: no guarda actas; solo procesa y responde.

---

## 3. Stack recomendado

| Capa | Elección recomendada | Por qué |
|---|---|---|
| Frontend | **React + Vite**, configurado como **PWA** (vite-plugin-pwa) | Mobile-first, instalable, funciona offline. Ecosistema maduro. |
| UI | Tailwind CSS + componentes propios grandes | Rápido de estilar mobile-first, botones grandes. |
| Almacenamiento local | **IndexedDB** (vía `idb` o `Dexie.js`) | Guarda fotos (blobs) y datos aunque no haya señal; sobrevive a recargas. |
| Backend | **Node.js + Express** (o Fastify) | Liviano, mismo lenguaje que el front, fácil de desplegar. |
| IA / visión | **API de Anthropic — Claude (modelo con visión)** | Lee etiquetas en varios idiomas y devuelve JSON estructurado. |
| Generación Excel | **ExcelJS** (Node) rellenando la plantilla `ACTA_compras_.xlsx` | Preserva formato, estilos, código y firmas del formato oficial. |
| Manejo de ZIP | **adm-zip** o **yauzl** (Node) | Descomprime y recorre carpetas del registro fotográfico. |
| Hosting front | Vercel / Netlify / cualquier estático | Simple y gratis para el piloto. |
| Hosting backend | Render / Railway / Fly.io / VPS pequeño | Necesita proceso Node siempre activo. |

> El ejecutor puede sustituir piezas equivalentes (p. ej. Next.js en vez de React+Express) si lo prefiere, siempre que respete: PWA offline, almacenamiento local, API key protegida en backend, y relleno de la plantilla oficial.

---

## 4. Contrato de datos (modelo de un ítem)

Cada producto/ítem que se maneja en el frontend y viaja al backend:

```json
{
  "id": "uuid",
  "orden": 1,
  "referenciaCarpeta": "07",          // nombre de carpeta si viene de ZIP; null si es en vivo
  "fotos": ["blob/base64", "..."],    // una o varias caras del mismo producto
  "cantidad": 12,                      // SIEMPRE la ingresa el inspector; nunca la IA
  "referencia": "H2019001234",         // extraído por IA; "no dice" si no aparece
  "paisOrigen": "China",               // extraído por IA
  "descripcion": "Licuadora portátil recargable USB, 380 ml, 7.4V", // IA: español + specs
  "marca": "Ecoco",                    // extraído por IA
  "estado": "listo | revisar | en_cola",
  "confianza": 0.0,                    // 0..1 devuelto por el backend; < umbral => "revisar"
  "motivoRevision": "foto borrosa | sin referencia | texto ilegible | null"
}
```

Encabezado del acta (se captura una vez, se recuerdan los últimos valores):

```json
{
  "doNo": "ACE251336",
  "cliente": "ECONOMIZADORES",
  "documentoTransporte": "GGZ2617859",
  "deposito": "bodeinter",
  "ciudad": "RIONEGRO",
  "fecha": "2025-10-02",
  "horaInicio": "2:25AM",
  "horaFin": "3:45AM",
  "bultos": 4,
  "peso": "",
  "observaciones": "mercancia en buen estado"
}
```

---

## 5. Endpoints del backend

### `POST /analizar-producto`
- **Entrada:** lista de imágenes (base64) de un mismo producto.
- **Proceso:** envía las imágenes a Claude con un prompt que pide **un único JSON** con `referencia`, `paisOrigen`, `descripcion`, `marca`, `confianza` y `motivoRevision`. El prompt debe instruir explícitamente:
  - Describir en **español** *qué es* el producto + specs técnicas visibles relevantes (voltaje, capacidad, modelo, material).
  - **No inventar**: si un dato no se lee, devolverlo vacío y bajar la confianza.
  - Referencia ausente → `"no dice"` (no es error).
  - Combinar la información de **todas** las fotos como un solo producto (una foto trae la referencia, otra el fabricante, etc.).
  - Devolver **solo JSON**, sin texto adicional.
- **Salida:** el JSON del ítem (campos extraídos + confianza + motivo).

### `POST /procesar-zip`
- **Entrada:** archivo `.zip`.
- **Proceso:** descomprime, recorre carpetas (cada carpeta = un ítem, en orden), ignora no-imágenes (`Thumbs.db`, etc.), y para cada carpeta llama al mismo motor de análisis. Reporta carpetas vacías.
- **Salida:** lista de ítems (sin cantidad, que la pone el inspector después).

### `POST /generar-acta`
- **Entrada:** encabezado + lista de ítems (revisados o no; la cantidad puede venir vacía).
- **Proceso:** abre la plantilla `ACTA_compras_.xlsx` con ExcelJS, rellena las celdas del encabezado, e **inserta una fila por ítem** entre la fila de títulos de la tabla (fila 12: `ITEM No | REFERENCIA | PAIS DE ORIGEN | DESCRIPCION | MARCA | CANTIDAD`) y la sección de observaciones/firmas, numerando `ITEM No`. Preserva estilos, bordes, código de formato (GO.PD.02-F.02, versión 002) y firmas.
- **Salida:** archivo `.xlsx` para descargar.

> **La cantidad nunca bloquea la generación** (corregido tras feedback real de uso — ver spec.md §Errores y seguridad). Si viene vacía, la celda `CANTIDAD` queda en blanco y el inspector la completa después, incluso directamente en el Excel.

---

## 6. Fases y tareas

### Fase 0 — Preparación (medio día)
- [ ] Crear repositorio y estructura (`/frontend`, `/backend`).
- [ ] Guardar la plantilla oficial `ACTA_compras_.xlsx` en el backend como archivo base intocable.
- [ ] Conseguir API key de Anthropic y configurarla como variable de entorno en el backend (nunca en el front).
- [ ] Mapear con precisión las celdas de la plantilla (encabezado y fila-modelo de ítem) — documentarlo en un `plantilla.md`.

### Fase 1 — Generación del Excel (núcleo de valor, primero)
- [ ] `POST /generar-acta`: rellenar encabezado en la plantilla.
- [ ] Insertar N filas de ítems preservando formato; numerar `ITEM No`.
- [ ] Manejar 200+ ítems sin romper encabezado ni firmas.
- [ ] Cantidad opcional: nunca bloquea la generación (corregido tras feedback real de uso).
- [ ] **Prueba de aceptación:** reproducir el acta de ejemplo (`D.O ACE251336`) y comparar visualmente con el original.

### Fase 2 — Extracción con IA
- [ ] Escribir y afinar el prompt de extracción (ver reglas en §5).
- [ ] `POST /analizar-producto` con una y con varias fotos del mismo producto.
- [ ] Definir umbral de confianza para marcar "revisar".
- [ ] **Prueba de aceptación:** correr contra carpetas reales del ZIP (`07`, `100`, `01`, `118`) y verificar descripción/marca/país coherentes; casos difíciles caen en "revisar", no en dato inventado.

### Fase 3 — Frontend en vivo (mobile-first)
- [ ] Pantalla "Nueva acta" + formulario de encabezado con pre-llenado de últimos valores.
- [ ] Flujo "Agregar producto": cámara → varias fotos → "Analizar" (sin pedir cantidad; se completa después, todos los ítems juntos, según la factura).
- [ ] Lista de ítems con estados visuales (verde/amarillo/gris) y edición.
- [ ] Botón "Generar acta" → descarga del Excel.
- [ ] **Prueba de aceptación:** diligenciar un acta de ~10 ítems de punta a punta desde un celular real.

### Fase 4 — Offline y cola
- [ ] Persistir fotos, cantidades, ítems y encabezado en IndexedDB.
- [ ] Cola de análisis: capturas sin señal quedan "en cola" y se procesan al reconectar.
- [ ] Reintentos y recuperación tras recargar la página o perder señal.
- [ ] **Prueba de aceptación:** capturar 5 productos en modo avión; al reconectar, todos se analizan solos.

### Fase 5 — Carga de ZIP (flujo secundario)
- [ ] `POST /procesar-zip`: descomprimir, recorrer carpetas en orden, ignorar no-imágenes.
- [ ] UI para cargar ZIP, ver ítems generados, completar cantidades y encabezado.
- [ ] **Prueba de aceptación:** procesar un subconjunto del `REGISTRO_FOTOGRAFICO.zip` real y generar su acta.

### Fase 6 — Validación del piloto con actas reales
- [ ] Usar la app en 2-3 despachos reales.
- [ ] Medir los 3 criterios de éxito del spec (tiempo a la mitad, exactitud alta, terminar el mismo día).
- [ ] Recoger errores recurrentes → corregir **el spec/prompt**, no solo el código.

---

## 7. Riesgos y mitigaciones
- **Costo por foto (API de visión):** medir costo promedio por acta en el piloto para dimensionar el precio del futuro servicio. Mitigación: enviar solo las fotos necesarias por producto; permitir reducir resolución antes de enviar.
- **Conexión mala en bodega:** cubierto por la cola offline (Fase 4). Es requisito, no un extra.
- **Etiquetas en chino / reflejos / borrosas:** cubierto por "revisar por excepción". La IA nunca inventa.
- **La plantilla oficial cambia de versión:** mantener la plantilla como archivo externo reemplazable, y el mapeo de celdas documentado en `plantilla.md`.
- **Pérdida del celular a mitad de inspección:** riesgo aceptado del piloto; se resuelve en V2 con respaldo en nube.

---

## 8. Regla de oro del flujo (del skill de specs)
Durante la construcción, **si un mismo error se repite, se corrige el `spec.md` (o el prompt), no solo el código.** El spec y este plan son documentos vivos: se actualizan cuando la realidad enseña algo nuevo.
