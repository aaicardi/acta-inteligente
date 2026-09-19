require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const actasRoutes = require('./routes/actas');
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const empresaRoutes = require('./routes/empresa');
const { limitarLogin, limitarAnalisis } = require('./middleware/rateLimit');
const { recuperarItemsHuerfanos } = require('./services/recuperacionAnalisis');
const logger = require('./services/logger');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());


const origenes = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (origenes.length === 0) {
  if (process.env.NODE_ENV === 'production') {
    logger.error('CORS_ORIGINS vacío en producción: el backend no puede arrancar así.');
    process.exit(1);
  }
  logger.warn('CORS_ORIGINS vacío: se aceptan peticiones de cualquier origen.');
}

app.use(
  cors({
    origin: origenes.length > 0 ? origenes : true,
  })
);

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth/login', limitarLogin);
app.use('/actas/:id/items/:itemId/analizar', limitarAnalisis);

app.use('/', authRoutes);
app.use('/', usuariosRoutes);
app.use('/', empresaRoutes);
app.use('/', actasRoutes);

(async () => {
  await recuperarItemsHuerfanos();
  app.listen(PORT, () => {
    logger.info(`Acta Inteligente backend escuchando en http://localhost:${PORT}`);
  });
})();
