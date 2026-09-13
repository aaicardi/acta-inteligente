const consumoIaDb = require('../db/consumoIa');
const logger = require('./logger');

// Envuelve una llamada a analizarProducto para registrar su consumo (tokens,
// exito/fallo) en consumo_ia, sin que visionService ni la ruta de /analizar
// tengan que conocer el detalle de esa tabla. Solo mide: no bloquea ni limita
// a nadie todavia (ver §2 del spec — decision de producto pendiente).
//
// El registro nunca debe tumbar el analisis real: si falla el INSERT, se
// loguea y se continua, porque medir consumo es secundario al resultado que
// el inspector esta esperando.
async function conRegistro({ empresaId, itemId, numFotos }, tarea) {
  const proveedor = process.env.VISION_PROVIDER || 'openai';

  try {
    const resultado = await tarea();
    await registrarSilencioso({
      empresaId,
      itemId,
      proveedor,
      modelo: resultado.modeloIa || 'desconocido',
      tokensIn: resultado.usage?.prompt_tokens,
      tokensOut: resultado.usage?.completion_tokens,
      numFotos,
      exito: true,
    });
    return resultado;
  } catch (err) {
    await registrarSilencioso({
      empresaId,
      itemId,
      proveedor,
      modelo: 'desconocido',
      numFotos,
      exito: false,
    });
    throw err;
  }
}

async function registrarSilencioso(datos) {
  try {
    await consumoIaDb.registrar(datos);
  } catch (err) {
    logger.error('No se pudo registrar el consumo de IA', err, { empresaId: datos.empresaId, itemId: datos.itemId });
  }
}

module.exports = { conRegistro };
