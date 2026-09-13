const { z } = require('zod');

const PASSWORD_MIN = 8;

const crear = z
  .object({
    email: z.string().trim().min(1).max(255).email('Email inválido.'),
    password: z.string().min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`),
    nombre: z.string().trim().max(255).optional(),
    rol: z.enum(['admin', 'inspector'], { message: 'El rol debe ser "admin" o "inspector".' }).optional(),
  })
  .strict();

const actualizar = z
  .object({
    nombre: z.string().trim().max(255).optional(),
    rol: z.enum(['admin', 'inspector'], { message: 'El rol debe ser "admin" o "inspector".' }).optional(),
    estado: z.enum(['activo', 'inactivo']).optional(),
  })
  .strict();

const cambiarPassword = z
  .object({
    password: z.string().min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`),
  })
  .strict();

module.exports = { crear, actualizar, cambiarPassword };
