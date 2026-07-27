# Mapeo de la plantilla oficial — ACTA_compras_.xlsx

Archivo base (intocable): `templates/ACTA_compras_.xlsx`
Hoja de trabajo: `Acta` (hay una segunda hoja `Seriales`, fuera de alcance en el piloto — ver spec V2).

## 1. Bloque de título (filas 1-5, estático, nunca se toca)
- Fila 1-3: título, código `GO.PD.02-F.02`, versión `002`.
- Fila 5 (merge `A5:F5`): banner "Formato inspeccion previa Según lo establecido en el articulo 38 del decreto 0390 de 2016."

## 2. Encabezado del despacho (filas 6-10) — celdas de VALOR a rellenar

| Campo | Celda label | Celda valor | Notas |
|---|---|---|---|
| D.O No | A6 | **B6** | texto |
| Ciudad | C6 | **D6** | texto |
| Fecha | E6 | **F6** | date |
| Cliente | A7:C7 (merge) | **D7** | texto |
| Hora inicio | E7 | **F7** | texto libre ("2:25AM") |
| Documento de transporte | A8:C9 (merge) | **D8** (merge D8:D9, escribir solo en D8) | texto |
| Hora finalización | E8 | **F8** | texto libre |
| Bultos | E9 | **F9** | número |
| Depósito | A10:C10 (merge) | **D10** | texto |
| Peso (KG) | E10 | **F10** | número o vacío |

Fila 11 (merge `A11:F11`): banner de indicaciones especiales, estático.

## 3. Tabla de ítems

- Fila 12: encabezado de columnas (estático): `ITEM No | REFERENCIA | PAIS DE ORIGEN | DESCRIPCION: | MARCA | CANTIDAD`
- La plantilla **viene con 21 filas pre-estiladas** para ítems (filas 13 a 33: bordes, relleno en columnas C y E, fila 13 tiene datos de ejemplo).
- **Regla de generación:** la tabla se redimensiona dinámicamente a `N` filas (una por ítem), donde `N` = cantidad de ítems del acta:
  - Si `N < 21`: se eliminan las filas sobrantes (`worksheet.spliceRows`).
  - Si `N > 21`: se duplica el estilo de una fila plana de ítem (fila 33) e insertan las filas que falten (`worksheet.duplicateRow`).
  - Si `N === 21`: no se toca la región.
- Columnas por fila de ítem: `A`=ITEM No (1..N, autonumerado), `B`=REFERENCIA, `C`=PAIS DE ORIGEN, `D`=DESCRIPCION, `E`=MARCA, `F`=CANTIDAD.

## 4. Pie de página (dinámico, se recalcula según N)

Inmediatamente después de la última fila de ítems:
- **Fila espaciadora** (1 fila, solo `A=" "`).
- **Observaciones** (2 filas, merge `A:F` de ambas): texto = `"OBSERVACIONES: " + observaciones`.
- **Firmas** (2 filas): merge `A:A` vertical con texto `"FIRMAS"`, merge `B:E` de la primera fila con `"NOMBRE Y CC DEL REPRESENTANTE DEL DEPOSITO:"`.

En la plantilla original (21 filas de ítems) esto cae en las filas 34 (espaciador), 35-36 (observaciones), 37-38 (firmas). Con `N` ítems, el espaciador queda en la fila `13 + N`, observaciones en `13+N+1`/`13+N+2`, firmas en `13+N+3`/`13+N+4`.

## 5. ⚠️ Gotcha crítico de ExcelJS (probado empíricamente)

`worksheet.spliceRows()` y `worksheet.duplicateRow()` **NO reubican las celdas combinadas (`merges`) que quedan por debajo del punto de inserción/eliminación.** Si se insertan o eliminan filas en la tabla de ítems sin tocar los merges de Observaciones/Firmas, el archivo generado queda con las celdas combinadas apuntando a la posición **vieja**, mientras el contenido físico ya se movió — el Excel se ve roto (texto y bordes desalineados).

**Solución implementada** (`src/services/excelService.js`):
1. Antes de tocar la tabla de ítems, se capturan (deep clone) los estilos y el contenido de las filas de pie de página (espaciador, observaciones x2, firmas x2).
2. Se desmergean explícitamente todos los merges cuya fila de inicio sea `>= 34` (zona de pie de página original).
3. Se redimensiona la tabla de ítems (`spliceRows`/`duplicateRow`).
4. Se reconstruye el pie de página en las filas nuevas calculadas, reaplicando estilos capturados y **volviendo a mergear** con `worksheet.mergeCells()` en las coordenadas correctas.

Esto se validó generando actas de prueba con 5 y con 250 ítems: en ambos casos el encabezado, la tabla y el pie de página (observaciones + firmas) quedan correctamente alineados y mergeados.

## 6. Reemplazo de la plantilla en el futuro

Si la agencia cambia de versión de formato (`GO.PD.02-F.02` versión 003, etc.), reemplazar `templates/ACTA_compras_.xlsx` y volver a validar este mapeo — los números de fila/columna de este documento pueden cambiar si el nuevo formato mueve el encabezado o la tabla.
