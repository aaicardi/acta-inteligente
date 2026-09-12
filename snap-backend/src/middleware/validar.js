// Middleware generico de validacion con Zod. Un esquema invalido responde 400
// con el primer problema encontrado, en vez de dejar que un valor mal formado
// llegue a la capa de datos y falle mas abajo con un error de MySQL poco claro
// (p.ej. "Data too long for column 'cliente'" en vez de un mensaje legible).
function validarBody(esquema) {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req.body || {});
    if (!resultado.success) {
      const primero = resultado.error.issues[0];
      return res.status(400).json({ error: primero.message });
    }
    req.body = resultado.data;
    return next();
  };
}

module.exports = { validarBody };
