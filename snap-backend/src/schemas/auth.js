const { z } = require('zod');

const REQUERIDOS = 'Se requieren email y contraseña.';

const login = z
  .object({
    email: z
      .string({ error: REQUERIDOS })
      .trim()
      .min(1, REQUERIDOS)
      .max(255)
      .email('Email inválido.'),
    password: z.string({ error: REQUERIDOS }).min(1, REQUERIDOS),
  })
  .strict();

module.exports = { login };
