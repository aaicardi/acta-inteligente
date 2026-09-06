const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// MySQL gestionado (Aiven) exige TLS. Aiven firma con su propia CA, que no
// esta en el almacen de certificados del sistema: hay que darsela explicita.
//
// - DB_SSL_CA_PATH: ruta al ca.pem (desarrollo local, ver README).
// - DB_SSL_CA: el contenido del ca.pem pegado entero (Render/Vercel, que solo
//   permiten variables de entorno, no archivos).
//
// Sin ninguna de las dos y con DB_SSL=true, la conexion falla en vez de caer a
// una verificacion relajada: preferimos un error claro antes que un canal
// cifrado que nadie valida.
function opcionesSsl() {
  if (process.env.DB_SSL !== 'true') return undefined;

  const ca = process.env.DB_SSL_CA
    || (process.env.DB_SSL_CA_PATH
      ? fs.readFileSync(path.resolve(process.env.DB_SSL_CA_PATH), 'utf8')
      : null);

  if (!ca) {
    throw new Error(
      'DB_SSL=true pero falta el certificado: define DB_SSL_CA_PATH (ruta al ca.pem) o DB_SSL_CA (su contenido).'
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
});

module.exports = pool;
