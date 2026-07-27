require('dotenv').config();
const express = require('express');
const cors = require('cors');
const actaRoutes = require('./routes/acta');
const analizarRoutes = require('./routes/analizar');
const zipRoutes = require('./routes/zip');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // fotos en base64 viajan en el body

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/', actaRoutes);
app.use('/', analizarRoutes);
app.use('/', zipRoutes);

app.listen(PORT, () => {
  console.log(`Acta Inteligente backend escuchando en http://localhost:${PORT}`);
});
