// Limitador en memoria. Suficiente mientras el backend corre en una sola
// instancia; si algun dia se escala horizontalmente hay que moverlo a un
// almacen compartido (Redis), porque cada proceso llevaria su propia cuenta.
const ventanas = new Map();

function limpiar(registros, desde) {
  return registros.filter((momento) => momento > desde);
}

function crearLimitador({ maximo, ventanaMs, mensaje, clave }) {
  return function limitador(req, res, next) {
    const ahora = Date.now();
    const desde = ahora - ventanaMs;
    const id = clave(req);

    const registros = limpiar(ventanas.get(id) || [], desde);

    if (registros.length >= maximo) {
      const esperaSeg = Math.ceil((registros[0] + ventanaMs - ahora) / 1000);
      res.setHeader('Retry-After', String(esperaSeg));
      return res.status(429).json({ error: mensaje });
    }

    registros.push(ahora);
    ventanas.set(id, registros);
    return next();
  };
}

// Contra fuerza bruta de contraseñas. Por IP, porque en el login todavia no
// hay usuario identificado.
const limitarLogin = crearLimitador({
  maximo: 10,
  ventanaMs: 15 * 60 * 1000,
  mensaje: 'Demasiados intentos de inicio de sesión. Espera unos minutos.',
  clave: (req) => `login:${req.ip}`,
});

// Protege el saldo de OpenAI. Por usuario cuando hay sesion: un inspector
// analizando productos seguidos es normal, un bucle no.
const limitarAnalisis = crearLimitador({
  maximo: 60,
  ventanaMs: 60 * 1000,
  mensaje: 'Demasiados análisis seguidos. Espera un momento antes de continuar.',
  clave: (req) => `analisis:${req.auth?.userId ?? req.ip}`,
});

// Evita que el Map crezca sin limite con claves que ya no se usan.
const INTERVALO_LIMPIEZA_MS = 10 * 60 * 1000;
const VIDA_MAXIMA_MS = 60 * 60 * 1000;
setInterval(() => {
  const desde = Date.now() - VIDA_MAXIMA_MS;
  for (const [id, registros] of ventanas) {
    const vigentes = limpiar(registros, desde);
    if (vigentes.length === 0) ventanas.delete(id);
    else ventanas.set(id, vigentes);
  }
}, INTERVALO_LIMPIEZA_MS).unref();

module.exports = { limitarLogin, limitarAnalisis };
