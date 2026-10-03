const ExcelJS = require('exceljs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'templates', 'ACTA_compras_.xlsx');
const PLANTILLA_BASE_PATH = path.join(__dirname, '..', '..', 'templates', 'PLANTILLA_BASE.xlsx');
const SHEET_NAME = 'Acta';

// Ver plantilla.md para la explicación completa de estos números de fila.
// Toda plantilla (la default o una subida por una empresa, ver 3.5 del spec)
// DEBE respetar este esqueleto: encabezado en las filas 1-12 (posicion fija),
// tabla de items desde la fila 13 y pie de pagina (espaciador, 2 de
// observaciones, 2 de firmas) justo despues. Solo el numero de filas de items
// es libre (ver detectarLayout). Puede cambiar textos, logo y colores.
const HEADER_ROW = 12;
const FIRST_ITEM_ROW = 13;
const ERROR_ESTRUCTURA = 'La plantilla debe conservar la misma estructura de filas (encabezado, tabla de ítems y pie de página) que la plantilla original.';

// La cantidad de filas de ítems NO es fija: la plantilla original trae 21
// (pie en la fila 34) pero una plantilla subida por una empresa puede traer
// menos o más. Se detecta buscando la fila "OBSERVACIONES" del pie de página:
// la fila anterior es el espaciador y la anterior a esa es la última fila de
// ítems, que se usa como fila plana para clonar estilo.
function detectarLayout(worksheet) {
  let obs1Row = null;
  for (let n = FIRST_ITEM_ROW; n <= worksheet.rowCount; n++) {
    const valor = worksheet.getCell(`A${n}`).value;
    if (typeof valor === 'string' && valor.trim().toUpperCase().startsWith('OBSERVACIONES')) {
      obs1Row = n;
      break;
    }
  }
  if (!obs1Row) return null;

  const footerStartRow = obs1Row - 1;
  const originalItemRows = footerStartRow - FIRST_ITEM_ROW;
  if (originalItemRows < 1) return null;
  // Observaciones (2) + firmas (2) deben existir debajo del espaciador.
  if (worksheet.rowCount < footerStartRow + 4) return null;

  return { footerStartRow, originalItemRows, styleTemplateRow: footerStartRow - 1 };
}

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
// generacion no escriba en celdas equivocadas: la hoja 'Acta' y un pie de
// pagina reconocible (detectarLayout) con al menos una fila de items antes.
// La ultima fila de items NO necesita contenido: es la fila "plana" que el
// motor clona para dar estilo a items nuevos.
// No valida el CONTENIDO de las celdas del encabezado (B6, D6, etc.) — el
// admin puede vaciarlas o poner otro texto ahi, es lo que se sobreescribe.
function validarPlantilla(workbook) {
  const worksheet = workbook.getWorksheet(SHEET_NAME);
  if (!worksheet) {
    return `La plantilla debe tener una hoja llamada "${SHEET_NAME}".`;
  }

  if (!detectarLayout(worksheet)) return ERROR_ESTRUCTURA;

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
  const { footerStartRow, originalItemRows, styleTemplateRow } = detectarLayout(worksheet) || {};
  if (!footerStartRow) throw new Error(ERROR_ESTRUCTURA);

  // 1. Capturar estilos del pie de página ANTES de tocar la tabla de ítems.
  const spacerTpl = captureRow(worksheet, footerStartRow);
  const obs1Tpl = captureRow(worksheet, footerStartRow + 1);
  const obs2Tpl = captureRow(worksheet, footerStartRow + 2);
  const firmas1Tpl = captureRow(worksheet, footerStartRow + 3);
  const firmas2Tpl = captureRow(worksheet, footerStartRow + 4);
  const itemStyleTpl = captureRow(worksheet, styleTemplateRow);

  // 2. Desmergear todo lo que esté en la zona de pie de página original (fila >= footerStartRow).
  const mergesAEliminar = worksheet.model.merges.filter((merge) => {
    const startRow = parseInt(merge.split(':')[0].match(/\d+/)[0], 10);
    return startRow >= footerStartRow;
  });
  mergesAEliminar.forEach((merge) => worksheet.unMergeCells(merge));

  const n = items.length;

  // 3. Redimensionar la región de ítems (13..33, 21 filas) a n filas.
  if (n < originalItemRows) {
    worksheet.spliceRows(FIRST_ITEM_ROW + n, originalItemRows - n);
  } else if (n > originalItemRows) {
    worksheet.duplicateRow(styleTemplateRow, n - originalItemRows, true);
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

module.exports = { generarActa, validarPlantillaBuffer, TEMPLATE_PATH, PLANTILLA_BASE_PATH };
