// Tests de la logica de negocio del analisis de IA: no llaman a OpenAI (se
// inyecta un extractor de prueba, ver analizarProducto en visionService.js),
// asi que no necesitan credenciales ni red. Cubren justo lo que hoy fallaria
// en silencio si se rompe: el umbral de confianza, la construccion de la
// descripcion, y el limite de tamano de foto (H10 del spec).
const test = require('node:test');
const assert = require('node:assert');

const { analizarProducto, validarFotos, construirDescripcion, CONFIANZA_UMBRAL } = require('../src/services/visionService');

function datosProducto(overrides = {}) {
  return {
    referencia: 'REF-1',
    modelo: 'no dice',
    serial: 'no dice',
    paisOrigen: 'China',
    descripcionProducto: 'Licuadora portátil',
    color: 'negro',
    material: 'plástico',
    medidas: '',
    marca: 'Acme',
    datosAdicionales: [],
    confianza: 0.9,
    motivoRevision: null,
    ...overrides,
  };
}

// El extractor real devuelve { datos, usage, modelo } (ver openaiProvider.js);
// estos tests envuelven datosProducto() de la misma forma.
function respuestaExtractor(overrides = {}, usage = { total_tokens: 100 }) {
  return { datos: datosProducto(overrides), usage, modelo: 'gpt-4o-mini' };
}

test('confianza por debajo del umbral marca el item para revisar', async () => {
  const extractor = async () => respuestaExtractor({ confianza: CONFIANZA_UMBRAL - 0.01 });
  const resultado = await analizarProducto(['https://ejemplo.test/foto.jpg'], extractor);
  assert.equal(resultado.estado, 'revisar');
});

test('confianza en el umbral o por encima, sin motivo, queda listo', async () => {
  const extractor = async () => respuestaExtractor({ confianza: CONFIANZA_UMBRAL });
  const resultado = await analizarProducto(['https://ejemplo.test/foto.jpg'], extractor);
  assert.equal(resultado.estado, 'listo');
});

test('un motivoRevision fuerza a revisar aunque la confianza sea alta', async () => {
  const extractor = async () => respuestaExtractor({ confianza: 0.99, motivoRevision: 'foto borrosa' });
  const resultado = await analizarProducto(['https://ejemplo.test/foto.jpg'], extractor);
  assert.equal(resultado.estado, 'revisar');
});

test('el usage y el modelo del proveedor se propagan en el resultado', async () => {
  const extractor = async () => respuestaExtractor({}, { prompt_tokens: 500, completion_tokens: 50, total_tokens: 550 });
  const resultado = await analizarProducto(['https://ejemplo.test/foto.jpg'], extractor);
  assert.deepEqual(resultado.usage, { prompt_tokens: 500, completion_tokens: 50, total_tokens: 550 });
  assert.equal(resultado.modeloIa, 'gpt-4o-mini');
});

test('sin fotos lanza SIN_FOTOS antes de llamar al extractor', async () => {
  let extractorLlamado = false;
  const extractor = async () => {
    extractorLlamado = true;
    return respuestaExtractor();
  };
  await assert.rejects(() => analizarProducto([], extractor), { code: 'SIN_FOTOS' });
  assert.equal(extractorLlamado, false);
});

test('una foto base64 que supera 20MB lanza FOTO_MUY_GRANDE', () => {
  // ~4/3 del tamano real: una cadena de 28MB de "A" en base64 decodifica a
  // mas de 20MB.
  const fotoGigante = 'A'.repeat(28 * 1024 * 1024);
  assert.throws(() => validarFotos([fotoGigante]), { code: 'FOTO_MUY_GRANDE' });
});

test('una URL http no se valida por tamaño (ya la subio Cloudinary)', () => {
  // Una URL, sin importar su longitud como string, no es base64 de una foto:
  // no debe evaluarse contra el limite de bytes decodificados.
  assert.doesNotThrow(() => validarFotos(['https://res.cloudinary.com/demo/imagen.jpg']));
});

test('construirDescripcion arma el texto combinando todos los campos', () => {
  const texto = construirDescripcion(datosProducto({ medidas: '30x20x15 cm' }));
  assert.match(texto, /^Licuadora portátil\. Color: negro\. Material: plástico\./);
  assert.match(texto, /Medidas: 30x20x15 cm\./);
  assert.match(texto, /Modelo: no dice\. Serial: no dice\./);
});

test('construirDescripcion usa "no dice" cuando falta la descripcion base', () => {
  const texto = construirDescripcion(datosProducto({ descripcionProducto: '' }));
  assert.match(texto, /^no dice\./);
});

test('construirDescripcion agrega datosAdicionales solo cuando tienen etiqueta y valor', () => {
  const texto = construirDescripcion(
    datosProducto({
      datosAdicionales: [
        { etiqueta: 'Capacidad', valor: '750ML' },
        { etiqueta: '', valor: 'se descarta sin etiqueta' },
        { etiqueta: 'Lote', valor: '' },
      ],
    })
  );
  assert.match(texto, /Capacidad: 750ML\./);
  assert.doesNotMatch(texto, /se descarta sin etiqueta/);
});
