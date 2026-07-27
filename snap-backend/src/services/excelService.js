const ExcelJS = require('exceljs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'templates', 'ACTA_compras_.xlsx');
const SHEET_NAME = 'Acta';

// Ver plantilla.md para la explicación completa de estos números de fila.
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

// La cantidad es opcional: nunca bloquea la generación del acta. El
// inspector la completa cuando quiere (incluso después, directamente en el
// Excel) — ver spec.md, corregido tras feedback real de uso.
async function generarActa({ encabezado, items }) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);
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

module.exports = { generarActa, TEMPLATE_PATH };
