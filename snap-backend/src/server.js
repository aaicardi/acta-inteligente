require('dotenv').config();
const express = require('express');
const cors = require('cors');
const actasRoutes = require('./routes/actas');
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const empresaRoutes = require('./routes/empresa');
const { limitarLogin, limitarAnalisis } = require('./middleware/rateLimit');
const logger = require('./services/logger');

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
  logger.warn('CORS_ORIGINS vacío: se aceptan peticiones de cualquier origen.');
}

app.use(
  cors({
    origin: origenes.length > 0 ? origenes : true,
  })
);
// Las fotos ya no viajan en el body (se suben directo a Cloudinary, ver
// firma-subida): 1mb cubre de sobra el JSON mas grande real (un item con
// varios "datosAdicionales" no llega ni de lejos a eso).
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// El limitador de analisis va antes de las rutas de actas para que proteja el
// endpoint que gasta creditos de IA aunque la peticion venga autenticada.
app.use('/auth/login', limitarLogin);
app.use('/actas/:id/items/:itemId/analizar', limitarAnalisis);

app.use('/', authRoutes);
app.use('/', usuariosRoutes);
app.use('/', empresaRoutes);
app.use('/', actasRoutes);

app.listen(PORT, () => {
  logger.info(`Acta Inteligente backend escuchando en http://localhost:${PORT}`);
});
