require('dotenv').config();
const express = require('express');
const cors = require('cors');
const actasRoutes = require('./routes/actas');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS_ORIGINS: lista separada por comas de los origenes permitidos
// (p. ej. "https://acta-inteligente.vercel.app"). Sin la variable se permite
// cualquier origen, que es lo comodo en desarrollo pero no debe usarse en
// produccion: el backend guarda datos de clientes y no exige autenticacion.
const origenes = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (origenes.length === 0) {
  console.warn('[cors] CORS_ORIGINS vacio: se aceptan peticiones de cualquier origen.');
}

app.use(
  cors({
    origin: origenes.length > 0 ? origenes : true,
  })
);
app.use(express.json({ limit: '50mb' })); // fotos en base64 viajan en el body

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/', actasRoutes);

app.listen(PORT, () => {
  console.log(`Acta Inteligente backend escuchando en http://localhost:${PORT}`);
});
