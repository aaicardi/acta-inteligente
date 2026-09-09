// Registro de estrategias de extracción de datos de producto (patrón Strategy).
// Cada proveedor implementa la misma interfaz: extraerDatosProducto(fotosBase64) -> JSON
// según el schema de prompt.js. visionService.js no conoce el proveedor concreto,
// solo usa la estrategia activa a través de este registro.
const PROVEEDORES = {
  openai: () => require('./openaiProvider'),
  deepseek: () => require('./deepseekProvider'),
};

// Por defecto OpenAI (probado en producción); 'deepseek' existe pero no está
// validado — ver deepseekProvider.js.
function obtenerProveedor(nombre = process.env.VISION_PROVIDER || 'openai') {
  const cargar = PROVEEDORES[nombre];
  if (!cargar) {
    throw new Error(
      `VISION_PROVIDER="${nombre}" no es válido. Proveedores disponibles: ${Object.keys(PROVEEDORES).join(', ')}.`
    );
  }
  return cargar();
}

module.exports = { obtenerProveedor };
