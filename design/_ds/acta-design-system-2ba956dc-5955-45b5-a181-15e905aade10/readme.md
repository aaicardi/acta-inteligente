# Acta Inteligente — sistema de diseño

Inspección previa de mercancías en depósito aduanero, Rionegro (Antioquia, Colombia).
Un inspector, una mano libre, bodega con brillo, señal intermitente. **La salida del
producto es un formato oficial —`GO.PD.02-F.02`— no una pantalla**: la app existe para
que revisar 40 ítems no tome 40 minutos, y el archivo existe para ser leído por una
autoridad. Son dos artefactos con trabajos distintos y no deben parecerse.

Stack del producto: React + Vite + Tailwind, PWA offline-first, sin login.
Pantalla objetivo: 375–390px.

## Fuentes de este sistema
- `uploads/sistema-diseno-acta-v2.html` — **única fuente**: el documento "Sistema de
  diseño v0.2 · revisado con contexto" entregado por el usuario. Contiene la tabla de
  migración de tokens, el modelo de tres capas de estado, las maquetas mobile del
  ItemCard, el EncabezadoForm, el cierre con sello y la guía de voz.
- No se recibió repositorio, enlace de Figma, logo, imágenes ni binarios de fuente.
  Todo valor numérico de este sistema está copiado literal del documento; nada se
  redondeó ni se ajustó a una rejilla de 4/8px.

## Producto
Un solo producto: **PWA Acta Inteligente** (`ui_kits/acta-pwa/`). El documento de
especificación en sí mismo es el segundo artefacto de marca (tipografía display,
eyebrow mono, tarjetas con franja) y sus estilos también están tokenizados.

## Contenido · fundamentos

**Idioma y persona.** Español de Colombia, tuteo con el inspector (`Acércate a la
etiqueta`, `Toma la primera foto`, `Escribe la cantidad`). Nunca "usted", nunca
"por favor". La app da instrucciones, no pide permiso.

**Sentence case en todo.** Mayúsculas solo en labels mono cortos (`D.O. NO`,
`BULTOS`, `LISTO`). Los títulos de pantalla van en sentence case: "Acta en curso",
"Cierre del acta", "Faltan 2 cantidades".

**Regla de voz que sostiene todo: la IA propone, el inspector dispone.** Ningún dato
entra al formato sin que una persona lo haya podido ver. La interfaz nunca finge
certeza que no tiene ni esconde que un dato lo propuso una máquina.

**Los mensajes dicen qué hacer, no qué falló.** El error nombra la causa concreta y
la acción siguiente:

| No | Sí |
|---|---|
| Error al analizar la imagen | La referencia no se alcanza a leer. Acércate a la etiqueta y vuelve a tomar la foto. |
| Confianza: 0.72 · revisar | Falta país de origen. No aparece en ninguna de las 3 fotos. |
| Sin conexión. Error de sincronización. | 2 en cola. Se analizan solas cuando vuelva la señal. |
| Complete todos los campos requeridos | Generar acta · faltan 2 |
| No hay ítems en esta acta | Acta vacía. Toma la primera foto del producto. |

- **Nunca se expone la confianza del modelo como número.** Se traduce a la razón:
  `Falta país de origen`, `REF ilegible`, `Marca ilegible en las 3 fotos`.
- **Los botones deshabilitados dicen qué falta**: `Generar acta · faltan 2`, no
  "Complete los campos".
- **Cifras**: decimal con coma, miles con punto (`312,50 kg`, `1.480`). Unidades en
  mono mayúsculas (`UN`, `KG`). Códigos oficiales siempre literales y en mono:
  `GO.PD.02-F.02`, `D.O. 2026-04471`, `REF 90412-B · CN`.
- **Separador `·`** para encadenar metadatos en una línea. Flecha `→` para continuidad.
- **Sin emoji en producto.** (El documento de especificación usa 🟢🟡 una vez para
  describir el problema heredado; el producto no.)
- **Vibe**: seco, operativo, respetuoso del oficio. Suena a alguien que ha estado en
  la bodega, no a una app de productividad.

## Fundamentos visuales

**Idea central.** El producto se ve como el documento que produce: papel bond, tinta,
azul de bolígrafo, verde de sello de "recibido", ámbar de copia al carbón. Los defaults
de Tailwind (indigo-600, emerald-600, amber-500, slate) fueron reemplazados uno a uno
por valores anclados a ese mundo — mismo rol, mismo contraste, otra identidad.

**Color.** Tres bloques con reglas duras:
- *Base*: `tinta #12181B`, `tinta-70 #38454E`, `grafito #6A767E`, `bond #F5F6F4`,
  `bond-2 #E9EBE7`, `linea #D3D7D1`.
- *Marca*: `boli #1F3BB3` (+ `fuerte`, `claro`, `bg`). **Solo acciones, nunca estados.**
- *Estados*: `sello #166B43` (listo), `copia #8A6100/#C08A1A` (revisar),
  `falta #B32946` (falta cantidad). **Nunca para marca.**
Máximo dos fondos: bond para la app, tinta para el header del documento. El blanco es
para superficies, no fondo de pantalla.

**Tipografía.** Archivo para UI (400/500/600/700, 800 solo en el h1 del documento);
IBM Plex Mono para todo dato que se compara carácter por carácter — D.O., referencia,
código de formato, cantidades, peso, bultos, labels en mayúsculas. En mono un 0 no se
confunde con una O y las cifras se alinean en columna. Base **17px, no 16**: el brillo
de la bodega y el brazo extendido se comen un punto. `tabular-nums` global.
Tracking: display -.035em, h2 -.02em, mono en mayúsculas +.16em / +.12em / +.1em según
tamaño.

**Espaciado y tacto.** Escala 4·8·12·16·24·32·48·64. Alturas mínimas de toque
pensadas para guante y una sola mano: 44px el campo de cantidad dentro de la tarjeta,
52px campos y botones, 56px acción principal, 64px el cierre. Grid de captura: 2
columnas en mobile ≈ 165px por tarjeta.

**Fondos e imágenes.** Sin gradientes decorativos, sin texturas, sin ilustración. Las
únicas imágenes del producto son las fotos que toma el inspector: crudas, con flash de
bodega, recortadas en cuadrado (`aspect-ratio: 1`) sobre `bond-2`. Placeholder
`FOTO` en mono cuando no hay imagen. El único gradiente del sistema es funcional: el
barrido del skeleton.

**Bordes, radios, sombras.** Radio 4px por defecto (tarjeta, botón, campo), 3px chips
y badges, 2px el número de orden, 18px el marco del dispositivo. Bordes: 1px por
defecto (`linea`), 1.5px cuando el borde **comunica estado** (tarjeta en revisión, en
falta, campos de dato), 2px el subrayado de sección, 2.5px el sello, 4px la franja
izquierda de énfasis. **No hay sistema de sombras: `box-shadow` no se usa.** La
jerarquía es papel sobre papel — blanco sobre bond y un borde de 1px.

**Tarjetas.** Blanco, borde 1px `linea`, radio 4px, padding 16px (8px en la tarjeta de
ítem, que es apretada por diseño), label mono en mayúsculas arriba, sin sombra. La
franja izquierda de 4px es el único énfasis disponible y se reserva para notas de
diseño (`boli`) o estados de cierre.

**Transparencia y blur.** Un solo uso: el velo `rgba(245,246,244,.82)` sobre la foto
de un ítem en cola o analizándose. Sin `backdrop-filter` en ninguna parte. El overlay
del modal es tinta al 55%, sin blur.

**Animación.** Tres, y ninguna decorativa:
1. `acta-brillo` — barrido del skeleton, 1.4s lineal infinito, mientras la IA lee.
2. `acta-giro` — spinner de 18px (12px en chip), 0.8s lineal infinito, borde 2px con
   pista `boli-bg`.
3. `acta-sellar` — 300ms `cubic-bezier(.2,1.4,.4,1)`: escala 1.6→1 con rotación
   -4.5° y opacidad 0→.9. **El único rebote de todo el producto**, y solo al generar
   el acta.
Todo respeta `prefers-reduced-motion`. No hay transiciones de página, ni fades, ni
parallax, ni entradas escalonadas.

**Estados de interacción.** Press: se oscurece el color (`boli` → `boli-fuerte`),
nunca se encoge ni se levanta. Hover no es una superficie de diseño — el producto es
táctil; en el documento de escritorio los enlaces solo oscurecen. Foco: contorno de
3px `boli-claro` con offset 2px, siempre visible (se opera con guante, el foco es
navegación real). Deshabilitado: fondo `bond-2`, texto `#A9B0AB`, cursor
`not-allowed`, y el texto explica qué falta.

**Modelo de estados — la contribución del spec.** Cinco señales competían en una
tarjeta de 165px. Se separan en tres capas con dueño distinto:
- **Capa 1 · del ítem** (dueño: el modelo, cambia una vez) → *badge*: Listo, Revisar.
  "Revisar" **siempre** lleva la razón en texto debajo.
- **Capa 2 · del sistema** (dueño: la red, es temporal) → *tratamiento de tarjeta*:
  skeleton con pulso al analizar, velo sobre la foto en cola; más un contador global
  en el header (`2 en cola`). Nunca un badge.
- **Capa 3 · de la persona** (dueño: el inspector, al final del flujo) → *falta
  cantidad*, que **no existe** hasta pulsar "Generar acta".
Regla: una tarjeta muestra **como máximo una señal a la vez**, con precedencia fija
**sistema → persona → ítem**. Sin precedencia explícita, tres capas vuelven a ser
cinco colores.

**Reglas de layout.** Header blanco fijo con borde inferior; barra de excepción fija
justo debajo, y solo existe si hay ítems ámbar (no ocupa espacio diciendo "todo bien");
contenido con scroll; footer de acciones fijo, blanco, borde superior, padding
`10px 12px 12px`. Medida de lectura máxima 66ch en notas, 58ch en párrafos de
documento.

## Iconografía

**El spec no usa librería de iconos, y este sistema no introduce ninguna.** El
vocabulario es tipográfico:

| Glifo | Uso |
|---|---|
| `◌` | en cola / sin analizar |
| `●` | sincronizado (en verde `sello`) |
| `↺` | valor heredado del acta anterior |
| `→` | continuidad: "Revisar →", "Confirmar y siguiente →" |
| `·` | separador de metadatos |
| `—` | valor vacío (placeholder de cantidad) |
| `--:--` | hora sin diligenciar |
| `✕` | cerrar modal |

Los dos "iconos" animados están dibujados en CSS, no son SVG: el spinner (borde
circular con `border-top-color`) y el punto de 6px de los badges
(`background: currentColor`). El sello usa una máscara SVG de `feTurbulence`
inline como textura de tinta — es el único SVG del sistema y va embebido en el
componente `Sello`, no en `assets/`.

Sin emoji en producto. Sin sprite, sin icon font, sin PNG.

> **Pendiente**: si el producto necesita iconos reales (cámara, ZIP, adjuntar foto,
> flash), hay que decidir el set. Recomendación: Lucide con trazo de 2px, que es el
> peso visual más cercano a los bordes de 1.5–2px del sistema. **No lo añadí** porque
> no aparece en la fuente.

## Assets

`assets/` está vacío a propósito:
- **No hay logo.** El spec no incluye marca gráfica, así que donde iría un logo se
  compone el nombre en Archivo 800 con tracking -.035em (ver `guidelines/brand-wordmark.html`).
  No se dibujó ninguna marca.
- **No hay imágenes ni ilustraciones** en la fuente; las fotos del producto las toma
  el inspector en campo.
- **No hay binarios de fuente**: Archivo e IBM Plex Mono se cargan desde Google Fonts
  en `tokens/fuentes.css` (son exactamente las familias que pide el spec, no
  sustituciones). Si tienen los `.woff2` licenciados, mándenlos y los empaqueto con
  `@font-face` local.

## Índice del repositorio

```
styles.css                  único punto de entrada CSS (solo @imports)
tokens/                     fuentes · colores · tipografia · espacio · forma · movimiento
base/reset.css              reset, defaults de body, keyframes, reduced-motion
guidelines/                 18 cards de fundamentos (Colors · Type · Spacing · Brand)
components/<grupo>/         primitivas React + .d.ts + .prompt.md + card
ui_kits/acta-pwa/           recreación interactiva de la PWA (ver su README.md)
thumbnail.html              tile del sistema
SKILL.md                    empaquetado como Agent Skill
```

### Componentes
Inventario tomado literalmente del spec; no se inventó ninguna primitiva.

| Grupo | Componentes |
|---|---|
| `components/acciones/` | **Boton** |
| `components/estado/` | **EstadoBadge**, **ColaChip**, **Velo**, **Skeleton**, **Sello** |
| `components/captura/` | **ItemCard**, **CampoCantidad** |
| `components/formulario/` | **Campo**, **EncabezadoForm** |
| `components/estructura/` | **Tarjeta**, **AppHeader**, **BarraExcepcion**, **ResumenActa** |

**Adiciones intencionales** (no son familias nuevas, son partes que el spec dibuja
pero no nombra):
- **Velo** y **Skeleton** — el spec los define como tratamiento de tarjeta para la capa
  2; se extrajeron para poder aplicarlos sin duplicar CSS.
- **Tarjeta**, **AppHeader**, **ResumenActa** — contenedores presentes en las maquetas
  (`.card`, `.mob-h`, la fila de cierre) que necesitaban nombre para ser reutilizables.

### UI kits
- `ui_kits/acta-pwa/` — Encabezado → captura → revisión por excepción → cierre sellado.

No hay plantilla de slides en la fuente, así que no se crearon slides de ejemplo.
