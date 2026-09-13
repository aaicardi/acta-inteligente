// Da de alta una empresa con su primer usuario administrador.
//
//   node scripts/crear-empresa.js "Agencia Aduanera SAS" admin@agencia.co "contraseña" [NIT]
//
// El alta de empresas no se expone por API a proposito: es una operacion de
// operador, no de autoservicio, y asi no hay superficie publica que permita
// crear tenants.
require('dotenv').config();
const pool = require('../src/db/pool');
const empresasDb = require('../src/db/empresas');
const usuariosDb = require('../src/db/usuarios');

const PASSWORD_MIN = 8;

async function main() {
  const [nombre, email, password, nit = ''] = process.argv.slice(2);

  if (!nombre || !email || !password) {
    console.error('Uso: node scripts/crear-empresa.js "<nombre>" <email> <password> [nit]');
    process.exit(1);
  }
  if (password.length < PASSWORD_MIN) {
    console.error(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
    process.exit(1);
  }

  const empresa = await empresasDb.crear({ nombre, nit });
  const usuario = await usuariosDb.crear({
    empresaId: empresa.id,
    email,
    password,
    nombre: 'Administrador',
    rol: 'admin',
  });

  console.log(`Empresa creada: #${empresa.id} ${empresa.nombre}`);
  console.log(`Administrador:  #${usuario.id} ${usuario.email}`);
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('No se pudo crear la empresa:', err.message);
    await pool.end();
    process.exit(1);
  });
