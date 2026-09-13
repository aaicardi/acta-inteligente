const pool = require('./pool');

// Solo registra: no valida pertenencia de empresa/item a un usuario, porque
// quien llama (services/consumoIaService.js) ya corre dentro de un contexto
// de request autenticado y confiable, no expuesto directo a una ruta publica.
async function registrar({ empresaId, itemId, proveedor, modelo, tokensIn, tokensOut, numFotos, exito }) {
  await pool.query(
    `INSERT INTO consumo_ia (empresa_id, item_id, proveedor, modelo, tokens_in, tokens_out, num_fotos, exito)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [empresaId, itemId, proveedor, modelo, tokensIn || 0, tokensOut || 0, numFotos || 0, exito]
  );
}

// Resumen simple por empresa: total de llamadas, tokens y fallos. Sirve para
// ver consumo antes de decidir una politica de cuotas (§ del spec: 3.1/3.2
// registran, no bloquean todavia).
async function resumenPorEmpresa(empresaId, { desde } = {}) {
  const condiciones = ['empresa_id = ?'];
  const valores = [empresaId];
  if (desde) {
    condiciones.push('creado_en >= ?');
    valores.push(desde);
  }

  const [filas] = await pool.query(
    `SELECT
       COUNT(*) AS llamadas,
       SUM(tokens_in) AS tokens_in,
       SUM(tokens_out) AS tokens_out,
       SUM(CASE WHEN exito THEN 0 ELSE 1 END) AS fallos
     FROM consumo_ia
     WHERE ${condiciones.join(' AND ')}`,
    valores
  );

  const fila = filas[0];
  return {
    llamadas: Number(fila.llamadas),
    tokensIn: Number(fila.tokens_in) || 0,
    tokensOut: Number(fila.tokens_out) || 0,
    fallos: Number(fila.fallos),
  };
}

module.exports = { registrar, resumenPorEmpresa };
