const ExcelJS = require('exceljs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'templates', 'ACTA_compras_.xlsx');
const SHEET_NAME = 'Acta';

// Ver plantilla.md para la explicación completa de estos números de fila.
// Toda plantilla (la default o una subida por una empresa, ver 3.5 del spec)
// DEBE respetar este mismo esqueleto de filas: el motor que redimensiona la
// tabla de items, clona estilos y reconstruye merges depende de que estas
// filas existan en esta posicion exacta. Una plantilla personalizada solo
// puede cambiar textos fijos, logo, colores — nunca mover estas filas.
const HEADER_ROW = 12;
const FIRST_ITEM_ROW = 13;
const ORIGINAL_ITEM_ROWS = 21; // filas 13-33 en la plantilla original
const STYLE_TEMPLATE_ROW = 33; // fila plana (sin datos) usada para clonar estilo de ítems nuevos
const FOOTER_START_ROW = FIRST_ITEM_ROW + ORIGINAL_ITEM_ROWS; // 34 en la plantilla original

function captureRow(worksheet, rowNumber) {
  const row = worksheet.getRow(rowNumber);
  const cells = [];
  for (let col = 1; col <= 6; col++) {
    const cell = row.getCell(col);
    cells.push({ style: JSON.parse(JSON.stringify(cell.style)), value: cell.value });
  }
  return { height: row.height, cells };
}

function applyRow(worksheet, rowNumber, captured, overrideValues) {
  const row = worksheet.getRow(rowNumber);
  if (captured.height) row.height = captured.height;
  for (let col = 1; col <= 6; col++) {
    const cell = row.getCell(col);
    cell.style = captured.cells[col - 1].style;
    const override = overrideValues && overrideValues[col];
    cell.value = override !== undefined ? override : captured.cells[col - 1].value;
  }
}

// Reglas minimas que cualquier plantilla debe cumplir para que el motor de
// generacion no escriba en celdas equivocadas: la hoja 'Acta', suficientes
// filas para contener el esqueleto completo, y al menos una fila de ejemplo
// con contenido en la zona de items y en la de pie de pagina (una plantilla
// sin esas filas rellenas sugiere que no tiene esa estructura). La fila
// STYLE_TEMPLATE_ROW (33) NO se valida con contenido: por diseño es la fila
// "plana" vacia que el motor clona para dar estilo a items nuevos.
// No valida el CONTENIDO de las celdas del encabezado (B6, D6, etc.) — el
// admin puede vaciarlas o poner otro texto ahi, es lo que se sobreescribe.
function validarPlantilla(workbook) {
  const worksheet = workbook.getWorksheet(SHEET_NAME);
  if (!worksheet) {
    return `La plantilla debe tener una hoja llamada "${SHEET_NAME}".`;
  }

  if (worksheet.rowCount < FOOTER_START_ROW + 4) {
    return 'La plantilla debe conservar la misma estructura de filas (encabezado, tabla de ítems y pie de página) que la plantilla original.';
  }

  const filaVacia = (n) => worksheet.getRow(n).values.length === 0;
  if (filaVacia(FIRST_ITEM_ROW) || filaVacia(FOOTER_START_ROW + 1)) {
    return 'La plantilla debe conservar la misma estructura de filas (encabezado, tabla de ítems y pie de página) que la plantilla original.';
  }

  return null;
}

// Buffer|string opcional: por defecto lee la plantilla del proyecto
// (TEMPLATE_PATH). Una empresa con plantilla propia pasa su buffer, ya
// descargado de Cloudinary por quien la sirve (routes/empresa.js).
async function generarActa({ encabezado, items }, fuentePlantilla = TEMPLATE_PATH) {
  const workbook = new ExcelJS.Workbook();
  if (Buffer.isBuffer(fuentePlantilla)) {
    await workbook.xlsx.load(fuentePlantilla);
  } else {
    await workbook.xlsx.readFile(fuentePlantilla);
  }
  const worksheet = workbook.getWorksheet(SHEET_NAME);

  // 1. Capturar estilos del pie de página ANTES de tocar la tabla de ítems.
  const spacerTpl = captureRow(worksheet, FOOTER_START_ROW);
  const obs1Tpl = captureRow(worksheet, FOOTER_START_ROW + 1);
  const obs2Tpl = captureRow(worksheet, FOOTER_START_ROW + 2);
  const firmas1Tpl = captureRow(worksheet, FOOTER_START_ROW + 3);
  const firmas2Tpl = captureRow(worksheet, FOOTER_START_ROW + 4);
  const itemStyleTpl = captureRow(worksheet, STYLE_TEMPLATE_ROW);

  // 2. Desmergear todo lo que esté en la zona de pie de página original (fila >= FOOTER_START_ROW).
  const mergesAEliminar = worksheet.model.merges.filter((merge) => {
    const startRow = parseInt(merge.split(':')[0].match(/\d+/)[0], 10);
    return startRow >= FOOTER_START_ROW;
  });
  mergesAEliminar.forEach((merge) => worksheet.unMergeCells(merge));

  const n = items.length;

  // 3. Redimensionar la región de ítems (13..33, 21 filas) a n filas.
  if (n < ORIGINAL_ITEM_ROWS) {
    worksheet.spliceRows(FIRST_ITEM_ROW + n, ORIGINAL_ITEM_ROWS - n);
  } else if (n > ORIGINAL_ITEM_ROWS) {
    worksheet.duplicateRow(STYLE_TEMPLATE_ROW, n - ORIGINAL_ITEM_ROWS, true);
  }

  // 4. Rellenar filas de ítems.
  items.forEach((item, i) => {
    const rowNumber = FIRST_ITEM_ROW + i;
    applyRow(worksheet, rowNumber, itemStyleTpl, {
      1: i + 1,
      2: item.referencia || 'no dice',
      3: item.paisOrigen || '',
      4: item.descripcion || '',
      5: item.marca || '',
      6: item.cantidad,
    });
  });

  // 5. Reconstruir el pie de página en su nueva posición.
  const spacerRow = FIRST_ITEM_ROW + n;
  const obs1Row = spacerRow + 1;
  const obs2Row = spacerRow + 2;
  const firmas1Row = spacerRow + 3;
  const firmas2Row = spacerRow + 4;

  applyRow(worksheet, spacerRow, spacerTpl);
  applyRow(worksheet, obs1Row, obs1Tpl, { 1: `OBSERVACIONES: ${encabezado.observaciones || ''}` });
  applyRow(worksheet, obs2Row, obs2Tpl, { 1: null });
  applyRow(worksheet, firmas1Row, firmas1Tpl);
  applyRow(worksheet, firmas2Row, firmas2Tpl);

  worksheet.mergeCells(`A${obs1Row}:F${obs2Row}`);
  worksheet.mergeCells(`A${firmas1Row}:A${firmas2Row}`);
  worksheet.mergeCells(`B${firmas1Row}:E${firmas1Row}`);

  // 6. Rellenar encabezado del despacho (filas 6-10, ver plantilla.md).
  worksheet.getCell('B6').value = encabezado.doNo || '';
  worksheet.getCell('D6').value = encabezado.ciudad || '';
  worksheet.getCell('F6').value = encabezado.fecha || '';
  worksheet.getCell('D7').value = encabezado.cliente || '';
  worksheet.getCell('F7').value = encabezado.horaInicio || '';
  worksheet.getCell('D8').value = encabezado.documentoTransporte || '';
  worksheet.getCell('F8').value = encabezado.horaFin || '';
  worksheet.getCell('F9').value = encabezado.bultos ?? '';
  worksheet.getCell('D10').value = encabezado.deposito || '';
  worksheet.getCell('F10').value = encabezado.peso ?? '';

  return workbook.xlsx.writeBuffer();
}

// Se llama al subir una plantilla nueva (routes/empresa.js), antes de
// guardarla: si no es valida, se rechaza sin gastar una subida a Cloudinary.
// Devuelve un mensaje de error, o null si la plantilla es valida.
async function validarPlantillaBuffer(buffer) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    return validarPlantilla(workbook);
  } catch {
    return 'El archivo no es un .xlsx válido.';
  }
}

module.exports = { generarActa, validarPlantillaBuffer, TEMPLATE_PATH };
