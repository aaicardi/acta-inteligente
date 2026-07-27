# Spec: Acta Inteligente — Diligenciamiento de Actas de Inspección Previa con IA
Fecha: 26 de julio de 2026

## Overview
Acta Inteligente es una aplicación web para celular que ayuda a un inspector de una agencia de aduanas a diligenciar el **Acta de Inspección Previa de Mercancías** (formato oficial GO.PD.02-F.02). Hoy este trabajo es 100% manual: el inspector fotografía cada producto que llega, y luego transcribe a mano en una plantilla de Excel la referencia, país de origen, descripción, marca y cantidad de cada uno. Esto le toma casi todo el día. La app usa un modelo de visión (IA) para leer las etiquetas de las fotos y proponer automáticamente la información de cada producto, mientras el inspector solo confirma o corrige lo dudoso e ingresa la cantidad que cuenta físicamente. Al terminar, la app entrega el acta en Excel, idéntica al formato oficial y lista para entregar.

El objetivo de esta versión es un **piloto para un solo usuario**, enfocado en validar que la herramienta ahorra tiempo real. Si funciona, evolucionará a un servicio para varias agencias de aduanas (ver V2).

## Usuarios objetivo
- **Usuario principal (piloto):** un inspector de inspección previa de una agencia de aduanas en Rionegro/Colombia.
- **Problema actual:** por cada despacho debe fotografiar decenas o cientos de productos (a veces 250+ ítems distintos), y luego transcribir manualmente toda la información de cada foto al acta oficial en Excel, sumando cantidades. Es lento, repetitivo y le consume la jornada completa, a veces llevándose trabajo a casa.
- **Lo que usa hoy:** la cámara del celular (fotos que quedan tipo WhatsApp) y una plantilla de Excel (`ACTA_compras_.xlsx`) que llena a mano.
- **Contexto de trabajo:** se mueve caminando por la bodega, con el celular en la mano, y la conexión a internet **no siempre es buena**.

## Alcance

### La v1 (piloto) SÍ hace
1. **Inspección en vivo, producto por producto (flujo principal).** El inspector abre la cámara desde el celular, toma varias fotos de un mismo producto (cada foto puede mostrar una cara distinta: la referencia en una, el fabricante en otra, el voltaje en otra), e ingresa la cantidad de unidades que contó físicamente. La IA lee las fotos y propone referencia, país de origen, descripción y marca para ese ítem. El acta se va llenando fila por fila, en tiempo real.
2. **Extracción asistida con revisión por excepción.** La IA rellena automáticamente lo que logra leer. Cada ítem muestra un estado: **listo** (la IA quedó segura) o **revisar** (foto borrosa, texto ilegible, o no encontró un dato). El inspector solo revisa y corrige los ítems marcados como "revisar"; puede editar cualquiera si quiere.
3. **Procesamiento por lote desde un ZIP (flujo secundario).** El inspector puede cargar un archivo `.zip` con carpetas (una carpeta por producto, como su archivo actual `REGISTRO_FOTOGRAFICO.zip`) y el sistema procesa todas las fotos, generando un borrador del acta con todos los ítems para revisar.
4. **Generación del acta final en Excel oficial.** La app entrega el acta descargada como archivo Excel, **idéntica a la plantilla oficial** `ACTA_compras_.xlsx` (mismo código de formato, versión, encabezado, columnas y sección de firmas), con la tabla de ítems expandida a tantas filas como productos haya y el `ITEM No` numerado automáticamente.

### La v1 (piloto) NO hace
- **No** tiene login, cuentas de usuario, ni soporte multiempresa. Es para un solo inspector.
- **No** cobra ni gestiona pagos/facturación del servicio.
- **No** calcula ni adivina la cantidad de unidades a partir de las fotos. La cantidad siempre la ingresa el inspector manualmente — típicamente tomándola del total que indica la **factura** para esa referencia, no fotografiando cada unidad individual — y siempre en un paso separado y posterior a la captura/análisis de fotos, nunca como requisito para poder analizar un producto.
- **No** llena la hoja "Seriales" del Excel (queda fuera de alcance; se retoma en V2).
- **No** guarda las actas en un servidor en la nube de forma permanente ni permite consultarlas después desde otro dispositivo. El trabajo vive en el celular hasta que se descarga el Excel.
- **No** clasifica arancelariamente la mercancía (no asigna partidas/subpartidas).
- **No** es una app nativa de tienda (Play Store / App Store). Es una web app que se abre en el navegador del celular.

## Comportamiento esperado

### Flujo principal — Inspección en vivo
1. El inspector abre la app en el navegador del celular y toca **"Nueva acta"**.
2. **Encabezado del despacho.** Aparece un formulario corto con los datos de cabecera del acta (D.O No, cliente, documento de transporte, depósito, ciudad, fecha, hora inicio, hora finalización, bultos, peso, observaciones). Los campos que suelen repetirse (ciudad, depósito, datos fijos del formato) vienen **pre-llenados con los últimos valores usados**, de modo que el inspector solo cambia lo que varía ese día. Puede dejar horas/peso en blanco y completarlos al final.
3. **Captura de ítems (una referencia a la vez, sin detenerse en cantidades).** El inspector toca **"Agregar producto"**:
   - Se abre la cámara. Toma una o varias fotos del mismo producto (distintas caras/etiquetas).
   - Toca **"Analizar"** de inmediato — **no se le pide cantidad en este paso**. La IA lee las fotos y propone: referencia, país de origen, descripción (en español, explicando qué es el producto, más especificaciones técnicas visibles relevantes como voltaje/capacidad/modelo cuando existan) y marca.
   - El ítem aparece en la lista con estado **listo** o **revisar**, con la cantidad en blanco.
   - El inspector repite esto foto-a-foto por cada referencia distinta que va encontrando, sin fricción: el objetivo es que la cámara le saque toda la información del producto para no tener que digitarla él.
4. **Trabajo sin señal.** Si en ese momento no hay internet, las fotos quedan **guardadas localmente en el celular** y el análisis con IA queda **en cola**; se procesa automáticamente cuando vuelve la conexión. El inspector puede seguir agregando productos sin interrupción.
5. **Revisión por excepción.** El inspector recorre solo los ítems marcados como **"revisar"**, mira la foto y corrige el campo dudoso. Los ítems "listo" no requieren su atención (aunque puede editarlos).
6. **Cantidades, al final, referencia por referencia, según la factura.** Cuando ya fotografió y tiene todas las referencias del despacho en la lista, el inspector recorre la lista y llena la **cantidad** de cada ítem con el total que indica la **factura** para esa referencia (no es un conteo físico unidad por unidad durante la captura; es el total facturado por referencia). Esto es deliberadamente un paso separado y posterior a la captura — mezclarlo con la foto le rompe el flujo rápido que busca.
7. **Cierre.** Al terminar, completa lo que falte del encabezado (horas, peso, observaciones) y toca **"Generar acta"**. La app produce y descarga el archivo Excel oficial totalmente diligenciado.

### Flujo secundario — Carga de ZIP
1. El inspector toca **"Cargar ZIP"** y selecciona un archivo comprimido con carpetas (una carpeta = un producto; el nombre de la carpeta es la referencia interna del ítem, por ejemplo `07` o `85 Y 86`).
2. El sistema recorre cada carpeta, envía sus fotos a la IA y genera un borrador con un ítem por carpeta, respetando el orden de las carpetas.
3. Para cada ítem, la app pide/permite ingresar la **cantidad** (no sale de las fotos) y marca con **"revisar"** los ítems donde la IA no quedó segura.
4. El inspector revisa, completa cantidades y encabezado, y genera el Excel final igual que en el flujo en vivo.

### Estados visibles de un ítem
- **Listo (verde):** la IA extrajo la información con seguridad.
- **Revisar (amarillo):** falta un dato, la foto es de baja calidad, o la IA no quedó segura. Requiere confirmación del inspector.
- **En cola (gris):** capturado sin conexión; pendiente de análisis cuando vuelva internet.

## Errores y seguridad
- **Sin conexión a internet:** la captura de fotos nunca se bloquea. Todo se guarda localmente en el celular y el análisis con IA se encola y reintenta al recuperar señal. El inspector siempre puede seguir trabajando.
- **Foto ilegible / borrosa / con reflejos:** el ítem se marca como "revisar" y se le pide al inspector confirmar o reescribir manualmente. La IA nunca inventa un dato que no puede leer; ante la duda, deja el campo vacío y marca el ítem.
- **Falta la referencia en la etiqueta:** es un caso normal y esperado. El campo referencia queda como "no dice" (igual que se hace hoy), sin marcar error, mientras la descripción esté presente.
- **Cantidad no ingresada:** **nunca bloquea nada.** La app resalta visualmente el ítem sin cantidad (borde rojo) solo como recordatorio, pero el inspector puede generar el acta en Excel de todas formas y completar las cantidades faltantes después — incluso directamente en el archivo Excel ya generado, sin tener que volver a la app.
- **ZIP con carpetas vacías o archivos que no son fotos:** el sistema los ignora (por ejemplo archivos `Thumbs.db`) y avisa qué carpetas no tenían fotos válidas.
- **Muchos ítems (200+):** el acta debe soportar cientos de ítems, insertando todas las filas necesarias en la misma hoja, sin romper el encabezado ni la sección de firmas.
- **Pérdida del dispositivo:** en el piloto, si el celular se pierde o se borra antes de descargar el Excel, se pierde el acta en progreso. Es un riesgo aceptado para el piloto (se resuelve en V2 con respaldo en la nube).
- **Privacidad:** las fotos pueden contener información comercial del cliente (facturas, packing lists visibles en el fondo). En el piloto no se almacenan permanentemente en la nube; se usan solo para el análisis y viven en el celular del inspector.

## Éxito
El piloto se considera exitoso si, en actas reales, se cumplen **las tres cosas a la vez**:
1. **Reduce el tiempo** de diligenciamiento del acta a la mitad o menos frente al proceso manual actual.
2. **La información extraída es correcta la mayoría de las veces**, de modo que el inspector solo corrige unos pocos ítems en vez de reescribir todo.
3. **Permite terminar el acta el mismo día**, sin llevar trabajo a casa.

## V2 (futuro)
Todo lo recortado del piloto vive aquí:
- **Servicio multiempresa:** login, cuentas, varias agencias de aduanas usando la herramienta.
- **Cobro por uso:** modelo de negocio como servicio (por acta, por foto analizada, o suscripción).
- **Almacenamiento en la nube:** respaldo permanente de actas y fotos, historial consultable desde cualquier dispositivo, sin riesgo de pérdida por daño del celular.
- **Hoja "Seriales":** captura y listado aparte de seriales/VIN para productos que lo requieran (vehículos, electrónica).
- **Detección automática de cantidad** cuando la etiqueta o la factura visible lo permita, como sugerencia para el inspector.
- **Agrupación automática de fotos** por producto en el modo ZIP cuando las carpetas no vengan bien organizadas.
- **Clasificación arancelaria asistida** (sugerencia de partida/subpartida).
- **Exportación a PDF** firmado además del Excel oficial.
- **Plantillas configurables** para soportar otros formatos de acta de otras agencias.
