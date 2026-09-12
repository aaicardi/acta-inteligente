// Cola de trabajos en memoria para el analisis de IA. Antes, /analizar
// bloqueaba la peticion HTTP hasta que OpenAI respondia (varios segundos, mas
// reintentos de rate limit); si el movil perdia señal a mitad, el trabajo se
// perdia sin dejar rastro. Ahora la ruta encola y responde de inmediato con
// estado "analizando"; el frontend consulta GET /actas/:id hasta que cambie.
//
// Concurrencia limitada (no una promesa por trabajo sin control) para no
// disparar N llamadas simultaneas a OpenAI si varios inspectores analizan a
// la vez — eso agotaria el rate limit de la cuenta para todos.
//
// Arranca in-process porque el volumen de un solo backend en Render no lo
// justifica: si algun dia hay que escalar a varias instancias, esto se migra
// a una cola compartida (Redis/BullMQ) sin cambiar el contrato de la API,
// que ya es asincrono desde esta version.
const logger = require('./logger');

const CONCURRENCIA = 3;

const pendientes = [];
let enCurso = 0;

function procesarSiguiente() {
  if (enCurso >= CONCURRENCIA || pendientes.length === 0) return;

  const trabajo = pendientes.shift();
  enCurso += 1;

  trabajo
    .tarea()
    .catch((err) => {
      // El propio tarea() ya debe manejar sus errores (ver rutas/actas.js:
      // el catch marca el item en 'revisar' con el motivo); esto es una red
      // de seguridad para no perder el proceso por una excepcion no atrapada.
      logger.error('Trabajo de análisis falló sin ser atrapado', err);
    })
    .finally(() => {
      enCurso -= 1;
      procesarSiguiente();
    });
}

// Encola una tarea (funcion async sin argumentos) y dispara el procesamiento.
// No devuelve una promesa del resultado: el resultado se comunica via la base
// de datos (el item actualizado), no via el valor de retorno, porque quien
// llama ya respondio 202 y no esta esperando.
function encolar(tarea) {
  pendientes.push({ tarea });
  procesarSiguiente();
}

module.exports = { encolar };
