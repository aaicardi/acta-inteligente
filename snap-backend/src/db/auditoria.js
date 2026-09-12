const pool = require('./pool');

function aCamelCase(fila) {
  return {
    id: fila.id,
    empresaId: fila.empresa_id,
    usuarioId: fila.usuario_id,
    accion: fila.accion,
    recursoTipo: fila.recurso_tipo,
    recursoId: fila.recurso_id,
    detalle: fila.detalle,
    creadoEn: fila.creado_en,
  };
}

async function registrar({ empresaId, usuarioId, accion, recursoTipo, recursoId, detalle }) {
  await pool.query(
    `INSERT INTO auditoria (empresa_id, usuario_id, accion, recurso_tipo, recurso_id, detalle)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [empresaId, usuarioId ?? null, accion, recursoTipo, recursoId ?? null, detalle ? JSON.stringify(detalle) : null]
  );
}

// Paginado simple por fecha descendente: es el orden en que se consulta una
// auditoria en la practica ("que paso ultimo").
async function listarPorEmpresa(empresaId, { limite = 50, antesDe } = {}) {
  const condiciones = ['empresa_id = ?'];
  const valores = [empresaId];
  if (antesDe) {
    condiciones.push('id < ?');
    valores.push(antesDe);
  }
  valores.push(limite);

  const [filas] = await pool.query(
    `SELECT * FROM auditoria WHERE ${condiciones.join(' AND ')} ORDER BY id DESC LIMIT ?`,
    valores
  );
  return filas.map(aCamelCase);
}

module.exports = { registrar, listarPorEmpresa };
