// Aplica las migraciones pendientes de db/migrations en orden alfabético.
// Cada archivo se aplica una sola vez y queda registrado en `migraciones`.
//
//   npm run migrate           aplica lo pendiente
//   npm run migrate -- --dry  muestra lo que aplicaría, sin tocar la base
//
// Las bases que ya tenían el esquema antes de existir este runner (produccion
// y los docker compose ya levantados) se marcan solas: si las tablas del
// esquema base ya existen, 001 se registra como aplicada sin ejecutarse.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

const DIRECTORIO = path.join(__dirname, '..', 'db', 'migrations');
const MIGRACION_BASE = '001_schema.sql';

async function asegurarTablaDeControl() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migraciones (
      nombre      VARCHAR(255) NOT NULL PRIMARY KEY,
      aplicada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
}

async function yaTieneEsquemaBase() {
  const [filas] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name IN ('actas','items','fotos')`
  );
  return filas[0].n === 3;
}

async function aplicadas() {
  const [filas] = await pool.query('SELECT nombre FROM migraciones');
  return new Set(filas.map((f) => f.nombre));
}

// Un .sql puede traer varias sentencias; mysql2 solo las ejecuta juntas con
// multipleStatements activo, que no queremos en el pool de la app. Partir por
// ";" es seguro aquí porque las migraciones no contienen procedimientos ni
// literales con punto y coma.
//
// Los comentarios se quitan ANTES de partir por ";", no despues: un comentario
// puede tener su propio ";" en el texto (p.ej. "el volumen sea bajo; para eso
// se necesita otro motor"), y partir primero cortaria la sentencia real a la
// mitad sin ningun error visible.
function sentencias(sql) {
  const sinComentarios = sql
    .split('\n')
    .filter((linea) => !linea.trim().startsWith('--'))
    .join('\n');

  return sinComentarios
    .split(';')
    .map((fragmento) => fragmento.trim())
    .filter(Boolean);
}

async function ejecutar(nombre, dryRun) {
  const sql = fs.readFileSync(path.join(DIRECTORIO, nombre), 'utf8');
  if (dryRun) {
    console.log(`  [dry] ${nombre} (${sentencias(sql).length} sentencias)`);
    return;
  }
  const conexion = await pool.getConnection();
  try {
    for (const sentencia of sentencias(sql)) {
      await conexion.query(sentencia);
    }
    await conexion.query('INSERT INTO migraciones (nombre) VALUES (?)', [nombre]);
    console.log(`  ✓ ${nombre}`);
  } finally {
    conexion.release();
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry');

  await asegurarTablaDeControl();
  const hechas = await aplicadas();

  if (!hechas.has(MIGRACION_BASE) && (await yaTieneEsquemaBase())) {
    if (dryRun) {
      console.log(`  [dry] ${MIGRACION_BASE} se marcaría como aplicada (el esquema ya existe)`);
    } else {
      await pool.query('INSERT INTO migraciones (nombre) VALUES (?)', [MIGRACION_BASE]);
      console.log(`  ✓ ${MIGRACION_BASE} (ya existía; solo se registra)`);
    }
    hechas.add(MIGRACION_BASE);
  }

  const pendientes = fs
    .readdirSync(DIRECTORIO)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .filter((f) => !hechas.has(f));

  if (pendientes.length === 0) {
    console.log('Sin migraciones pendientes.');
    return;
  }

  console.log(`${pendientes.length} migración(es) pendiente(s) en ${process.env.DB_NAME}@${process.env.DB_HOST}:`);
  for (const nombre of pendientes) {
    await ejecutar(nombre, dryRun);
  }
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('Migración fallida:', err.message);
    await pool.end();
    process.exit(1);
  });
