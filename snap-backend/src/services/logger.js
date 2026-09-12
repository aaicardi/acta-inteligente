// Logger minimo sin dependencia externa: emite un JSON por linea a stdout/stderr,
// que es el formato que Render (y cualquier plataforma moderna) ya captura y
// permite filtrar. No hay servicio externo conectado todavia (Sentry o similar
// se añadiria despues, sin cambiar esta interfaz) — ver H14 del spec.
//
// Uso: logger.info('mensaje', { empresaId, actaId }) / logger.error(...)
// El primer argumento es el mensaje humano; el segundo, contexto estructurado
// que un sistema de logs puede indexar (a diferencia de interpolarlo en el
// string, que solo un humano puede parsear).
function emitir(nivel, mensaje, contexto) {
  const linea = {
    nivel,
    mensaje,
    ts: new Date().toISOString(),
    ...(contexto && Object.keys(contexto).length > 0 ? { contexto } : {}),
  };
  const salida = nivel === 'error' || nivel === 'warn' ? console.error : console.log;
  salida(JSON.stringify(linea));
}

// Los errores nunca se serializan bien con JSON.stringify por si solos
// (Error no es enumerable) — se extraen los campos utiles a mano.
function serializarError(err) {
  if (!(err instanceof Error)) return { valor: err };
  return { mensaje: err.message, codigo: err.code, stack: err.stack };
}

function info(mensaje, contexto) {
  emitir('info', mensaje, contexto);
}

function warn(mensaje, contexto) {
  emitir('warn', mensaje, contexto);
}

function error(mensaje, err, contexto = {}) {
  emitir('error', mensaje, { ...contexto, error: serializarError(err) });
}

module.exports = { info, warn, error };
