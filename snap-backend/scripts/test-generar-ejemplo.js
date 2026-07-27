// Prueba de aceptación (Fase 1): reproduce el acta de ejemplo D.O ACE251336
// con los mismos datos que trae la plantilla original, y varios tamaños de
// tabla de ítems, para validar visualmente contra el original.
const fs = require('fs');
const path = require('path');
const { generarActa } = require('../src/services/excelService');

const encabezado = {
  doNo: 'ACE251336',
  ciudad: 'RIONEGRO',
  fecha: '2025-10-02',
  cliente: 'ECONOMIZADORES',
  horaInicio: '2:25AM',
  documentoTransporte: 'GGZ2617859',
  horaFin: '3:45AM',
  bultos: 4,
  deposito: 'bodeinter',
  peso: '',
  observaciones: 'mercancia en buen estado',
};

const itemEjemplo = {
  referencia: 'no dice',
  paisOrigen: 'no dice',
  descripcion:
    'toyota bz4x 4wd, vin no: LVGE41350SG300085, MOTOR:G97040R010U124FJ0047, LVGE41357SG300083, G97040R010U124FJ0046, LVGE41353SG300078,G97040R010U124FJ0041,LVGE41352SG300086,G97040R010U124FH0124',
  marca: 'toyota',
  cantidad: 4,
};

async function run() {
  const outDir = path.join(__dirname, '..', 'output_pruebas');
  fs.mkdirSync(outDir, { recursive: true });

  const casos = [
    { nombre: 'ejemplo_1_item.xlsx', items: [itemEjemplo] },
    {
      nombre: 'ejemplo_5_items.xlsx',
      items: [itemEjemplo, itemEjemplo, itemEjemplo, itemEjemplo, itemEjemplo],
    },
    {
      nombre: 'ejemplo_250_items.xlsx',
      items: Array.from({ length: 250 }, (_, i) => ({
        referencia: i % 3 === 0 ? 'no dice' : `REF-${i + 1}`,
        paisOrigen: 'China',
        descripcion: `Producto ${i + 1} generado para prueba de volumen`,
        marca: 'MarcaX',
        cantidad: 1 + (i % 20),
      })),
    },
  ];

  for (const caso of casos) {
    const buffer = await generarActa({ encabezado, items: caso.items });
    fs.writeFileSync(path.join(outDir, caso.nombre), buffer);
    console.log(`Generado: output_pruebas/${caso.nombre} (${caso.items.length} ítems)`);
  }

  console.log('\nAbre estos archivos y compáralos visualmente contra "ACTA compras..xlsx" original.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
