// Genera el acta real contra la plantilla .xlsx y relee el buffer resultante
// con ExcelJS: cubre justo lo que mas riesgo tiene en excelService.js (mover
// filas, fusionar celdas, redimensionar la tabla de items) sin necesitar
// base de datos ni red.
const test = require('node:test');
const assert = require('node:assert');
const ExcelJS = require('exceljs');

const { generarActa } = require('../src/services/excelService');

function encabezado(overrides = {}) {
  return {
    doNo: '12345',
    cliente: 'Cliente de prueba',
    documentoTransporte: 'DT-1',
    deposito: 'Depósito 1',
    ciudad: 'Bogotá',
    fecha: '2026-09-11',
    horaInicio: '8:00AM',
    horaFin: '10:00AM',
    bultos: '3',
    peso: '150',
    observaciones: 'Sin novedad',
    ...overrides,
  };
}

function item(overrides = {}) {
  return {
    referencia: 'REF-1',
    paisOrigen: 'China',
    descripcion: 'Licuadora portátil',
    marca: 'Acme',
    cantidad: 2,
    ...overrides,
  };
}

async function leerHoja(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook.getWorksheet('Acta');
}

test('el encabezado del despacho queda en las celdas fijas', async () => {
  const buffer = await generarActa({ encabezado: encabezado(), items: [item()] });
  const hoja = await leerHoja(buffer);

  assert.equal(hoja.getCell('B6').value, '12345');
  assert.equal(hoja.getCell('D6').value, 'Bogotá');
  assert.equal(hoja.getCell('D7').value, 'Cliente de prueba');
  assert.equal(hoja.getCell('D8').value, 'DT-1');
  assert.equal(hoja.getCell('D10').value, 'Depósito 1');
  assert.equal(hoja.getCell('F9').value, '3');
  assert.equal(hoja.getCell('F10').value, '150');
});

test('cada item aparece en su fila con numero consecutivo', async () => {
  const items = [item({ referencia: 'A1' }), item({ referencia: 'A2' }), item({ referencia: 'A3' })];
  const buffer = await generarActa({ encabezado: encabezado(), items });
  const hoja = await leerHoja(buffer);

  // Las filas de items empiezan en la 13 (ver excelService.js FIRST_ITEM_ROW).
  assert.equal(hoja.getRow(13).getCell(1).value, 1);
  assert.equal(hoja.getRow(13).getCell(2).value, 'A1');
  assert.equal(hoja.getRow(14).getCell(1).value, 2);
  assert.equal(hoja.getRow(14).getCell(2).value, 'A2');
  assert.equal(hoja.getRow(15).getCell(1).value, 3);
  assert.equal(hoja.getRow(15).getCell(2).value, 'A3');
});

test('sin referencia se escribe "no dice", nunca vacio o undefined', async () => {
  const buffer = await generarActa({ encabezado: encabezado(), items: [item({ referencia: '' })] });
  const hoja = await leerHoja(buffer);
  assert.equal(hoja.getRow(13).getCell(2).value, 'no dice');
});

test('la cantidad es opcional: un item sin cantidad no rompe la generacion', async () => {
  const buffer = await generarActa({ encabezado: encabezado(), items: [item({ cantidad: null })] });
  const hoja = await leerHoja(buffer);
  assert.equal(hoja.getRow(13).getCell(6).value, null);
});

test('menos items que la plantilla original (21) no deja filas fantasma', async () => {
  const items = [item(), item()];
  const buffer = await generarActa({ encabezado: encabezado(), items });
  const hoja = await leerHoja(buffer);

  // Con 2 items, el pie de pagina (observaciones) debe estar inmediatamente
  // despues de la fila 14, no 21 filas mas abajo dejando huecos en blanco.
  const filaObservaciones = 13 + items.length + 1;
  const texto = String(hoja.getCell(`A${filaObservaciones}`).value || '');
  assert.match(texto, /^OBSERVACIONES:/);
});

test('mas items que la plantilla original (21) expande la tabla sin perder el pie de pagina', async () => {
  const items = Array.from({ length: 25 }, (_, i) => item({ referencia: `REF-${i + 1}` }));
  const buffer = await generarActa({ encabezado: encabezado(), items });
  const hoja = await leerHoja(buffer);

  assert.equal(hoja.getRow(13).getCell(2).value, 'REF-1');
  assert.equal(hoja.getRow(13 + 24).getCell(2).value, 'REF-25');

  const filaObservaciones = 13 + items.length + 1;
  const texto = String(hoja.getCell(`A${filaObservaciones}`).value || '');
  assert.match(texto, /^OBSERVACIONES:/);
});

test('las observaciones del encabezado quedan en el pie de pagina', async () => {
  const buffer = await generarActa({
    encabezado: encabezado({ observaciones: 'Mercancía en buen estado' }),
    items: [item()],
  });
  const hoja = await leerHoja(buffer);

  const filaObservaciones = 13 + 1 + 1;
  const texto = String(hoja.getCell(`A${filaObservaciones}`).value || '');
  assert.match(texto, /Mercancía en buen estado/);
});
