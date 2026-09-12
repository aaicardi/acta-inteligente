const { z } = require('zod');

// Los limites de longitud espejan las columnas de db/migrations/001_schema.sql:
// sin esto, un valor demasiado largo llega hasta MySQL y falla con un error
// crudo ("Data too long for column 'cliente'") en vez de un 400 legible.
const actualizarEncabezado = z
  .object({
    doNo: z.string().trim().max(64).optional(),
    cliente: z.string().trim().max(255).optional(),
    documentoTransporte: z.string().trim().max(128).optional(),
    deposito: z.string().trim().max(255).optional(),
    ciudad: z.string().trim().max(128).optional(),
    // '' se admite explicitamente: es como el frontend borra la fecha, y
    // actasDb.actualizarEncabezado ya la traduce a NULL en ese caso.
    fecha: z.union([z.literal(''), z.iso.date()]).optional(),
    horaInicio: z.string().trim().max(16).optional(),
    horaFin: z.string().trim().max(16).optional(),
    bultos: z.string().trim().max(32).optional(),
    peso: z.string().trim().max(32).optional(),
    observaciones: z.string().max(65535).optional(),
  })
  .strict();

const crearItem = z
  .object({
    orden: z.union([z.number(), z.string().trim().min(1)]),
  })
  .strict();

const actualizarOrdenItem = z
  .object({
    orden: z.union([z.number(), z.string().trim().min(1)]),
  })
  .strict();

const datoAdicional = z
  .object({
    etiqueta: z.string().trim().max(255),
    valor: z.string().trim().max(255),
  })
  .strict();

const actualizarItem = z
  .object({
    referencia: z.string().trim().max(255).optional(),
    modelo: z.string().trim().max(255).optional(),
    serial: z.string().trim().max(255).optional(),
    paisOrigen: z.string().trim().max(128).optional(),
    descripcion: z.string().max(65535).optional(),
    marca: z.string().trim().max(255).optional(),
    datosAdicionales: z.array(datoAdicional).max(20).optional(),
    // El frontend manda '' cuando el inspector borra el campo (ver
    // App.jsx: "digitos === '' ? '' : Number(digitos)"); se normaliza aqui a
    // null, que es lo que la columna INT de MySQL espera para "sin cantidad".
    cantidad: z
      .union([z.number().int().min(0), z.null(), z.literal('')])
      .transform((v) => (v === '' ? null : v))
      .optional(),
    confianza: z.number().min(0).max(1).nullable().optional(),
    motivoRevision: z.string().trim().max(255).nullable().optional(),
    estado: z.enum(['analizando', 'listo', 'revisar', 'en_cola']).optional(),
  })
  .strict();

// Cada foto ya fue subida por el navegador directo a Cloudinary (ver
// cloudinaryService.firmarSubida): la ruta solo persiste url+publicId, no
// vuelve a recibir el binario.
const fotoSubida = z
  .object({
    url: z.url().max(500),
    publicId: z.string().trim().min(1).max(255),
  })
  .strict();

const analizarItem = z
  .object({
    fotos: z.array(fotoSubida).min(1, 'Se requiere "fotos": lista de fotos ya subidas a Cloudinary.'),
  })
  .strict();

module.exports = { actualizarEncabezado, crearItem, actualizarOrdenItem, actualizarItem, analizarItem };
