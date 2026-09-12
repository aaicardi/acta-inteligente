const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// MySQL gestionado (Aiven) exige TLS. Aiven firma con su propia CA, que no
// esta en el almacen de certificados del sistema: hay que darsela explicita.
// Se acepta de tres formas, en orden de preferencia:
//
// - DB_SSL_CA_B64: el ca.pem en base64, en una sola linea. Es la opcion para
//   paneles como el de Render, donde pegar un bloque multilinea suele perder
//   los saltos de linea (y un PEM sin ellos no parsea).
// - DB_SSL_CA: el contenido del ca.pem tal cual. Si llega aplanado en una
//   linea, se reconstruye el formato PEM antes de usarlo.
// - DB_SSL_CA_PATH: ruta al archivo (desarrollo local).
//
// Sin ninguna de las tres y con DB_SSL=true, la conexion falla en vez de caer
// a una verificacion relajada: preferimos un error claro antes que un canal
// cifrado que nadie valida.

const CABECERA = '-----BEGIN CERTIFICATE-----';
const PIE = '-----END CERTIFICATE-----';

// Un PEM pegado en un campo de una sola linea llega sin saltos. El cuerpo es
// base64, asi que se puede volver a partir en lineas de 64 caracteres.
function normalizarPem(texto) {
  const limpio = texto.trim();
  if (limpio.includes('\n')) return limpio;
  if (!limpio.startsWith(CABECERA)) return limpio;

  const cuerpo = limpio
    .slice(CABECERA.length, limpio.lastIndexOf(PIE))
    .replace(/\s+/g, '');

  return [CABECERA, ...cuerpo.match(/.{1,64}/g), PIE, ''].join('\n');
}

function leerCa() {
  if (process.env.DB_SSL_CA_B64) {
    return Buffer.from(process.env.DB_SSL_CA_B64, 'base64').toString('utf8');
  }
  if (process.env.DB_SSL_CA) {
    return normalizarPem(process.env.DB_SSL_CA);
  }
  if (process.env.DB_SSL_CA_PATH) {
    return fs.readFileSync(path.resolve(process.env.DB_SSL_CA_PATH), 'utf8');
  }
  return null;
}

function opcionesSsl() {
  if (process.env.DB_SSL !== 'true') return undefined;

  const ca = leerCa();

  if (!ca) {
    throw new Error(
      'DB_SSL=true pero falta el certificado: define DB_SSL_CA_B64 (ca.pem en base64, recomendado), DB_SSL_CA (su contenido) o DB_SSL_CA_PATH (ruta al archivo).'
    );
  }

  if (!ca.includes(CABECERA)) {
    throw new Error(
      'El certificado no parece un PEM valido: debe empezar por "-----BEGIN CERTIFICATE-----". Revisa DB_SSL_CA_B64 / DB_SSL_CA.'
    );
  }

  return { ca, minVersion: 'TLSv1.2', rejectUnauthorized: true };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: opcionesSsl(),
  waitForConnections: true,
  connectionLimit: 10,
  // Sin esto, mysql2 negocia una codificacion que corrompe tildes y eñes
  // (nombres de clientes, descripciones de producto) aunque las columnas ya
  // esten en utf8mb4 — el charset se fija en el protocolo de conexion, no en
  // el esquema.
  charset: 'utf8mb4',
});

module.exports = pool;
