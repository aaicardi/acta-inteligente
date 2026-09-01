import { useEffect, useRef, useState } from 'react';

// Pantalla "Nuevo producto" (Acta Inteligente v2 · 2a): número de ítem de la
// factura + fotos + "Listo" para disparar el análisis. La cámara real del
// navegador no tiene preview en vivo (usamos <input capture>, que abre la
// app nativa de cámara del celular): el centro de la pantalla muestra la
// última foto tomada (o un marco de guía si todavía no hay ninguna) para
// que quede claro que el disparo sí se registró.
export default function CapturaProducto({ numerosUsados = [], onAgregar, onCancelar }) {
  const [numero, setNumero] = useState('');
  const [errorNumero, setErrorNumero] = useState('');
  const [fotos, setFotos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const inputCamaraRef = useRef(null);
  const inputGaleriaRef = useRef(null);
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    const nuevas = fotos.map((f) => URL.createObjectURL(f));
    setUrls(nuevas);
    return () => nuevas.forEach((url) => URL.revokeObjectURL(url));
  }, [fotos]);

  function estaUsado(valor) {
    return numerosUsados.some((n) => String(n) === String(valor));
  }

  function manejarNumeroChange(valor) {
    const limpio = valor.replace(/[^0-9]/g, '');
    setNumero(limpio);
    setErrorNumero(limpio && estaUsado(limpio) ? `El ítem ${limpio} ya existe.` : '');
  }

  // Como <input capture> no tiene preview en vivo, no hay forma de mostrar
  // en pantalla que la foto "quedó guardada": disparamos una descarga del
  // archivo para que Android la indexe en la galería (álbum Downloads),
  // igual que cualquier imagen descargada desde el navegador.
  function guardarEnGaleria(file, idx) {
    try {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ActaInteligente_${Date.now()}_${idx}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      // Si el navegador bloquea la descarga automática, la foto sigue
      // disponible dentro del acta; solo no queda copia en la galería.
    }
  }

  function agregarArchivos(fileList, { deCamara = false } = {}) {
    const nuevos = Array.from(fileList || []);
    if (nuevos.length === 0) return;
    setError('');
    if (deCamara) nuevos.forEach((file, idx) => guardarEnGaleria(file, idx));
    setFotos((prev) => [...prev, ...nuevos]);
  }

  function quitarFoto(idx) {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  }

  // La cantidad NO se pide aquí: el inspector fotografía referencia por
  // referencia sin detenerse, y llena las cantidades después, todas juntas.
  async function manejarListo() {
    if (fotos.length === 0) return;
    if (!numero) {
      setErrorNumero('Ingresa el número de ítem.');
      return;
    }
    if (estaUsado(numero)) {
      setErrorNumero(`El ítem ${numero} ya existe.`);
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await onAgregar({ fotos, cantidad: '', numero });
      setFotos([]);
      setNumero('');
    } catch (err) {
      setError(err?.message || 'No se pudo agregar el producto. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  const ultimaUrl = urls[urls.length - 1];
  const listoDeshabilitado = fotos.length === 0 || enviando || !numero || !!errorNumero;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--tinta)', display: 'flex', flexDirection: 'column' }}>
      <input
        ref={inputCamaraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          agregarArchivos(e.target.files, { deCamara: true });
          e.target.value = '';
        }}
      />
      <input
        ref={inputGaleriaRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          agregarArchivos(e.target.files);
          e.target.value = '';
        }}
      />

      <div style={{ flexShrink: 0, padding: 'var(--s3) var(--s4)', display: 'flex', alignItems: 'flex-end', gap: 'var(--s3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            htmlFor="numero-item"
            style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-9)', letterSpacing: 'var(--track-label)', textTransform: 'uppercase', color: 'var(--texto-tenue-sobre-oscuro)' }}
          >
            Número de ítem (factura)
          </label>
          <input
            id="numero-item"
            type="text"
            inputMode="numeric"
            value={numero}
            onChange={(e) => manejarNumeroChange(e.target.value)}
            placeholder="Ej. 5"
            style={{
              width: '96px',
              height: '40px',
              borderRadius: 'var(--r-chip)',
              border: `var(--bd-estado) solid ${errorNumero ? 'var(--falta)' : 'rgba(245,246,244,.35)'}`,
              background: 'rgba(245,246,244,.08)',
              color: 'var(--bond)',
              padding: '0 10px',
              fontFamily: 'var(--mono)',
              fontSize: '16px',
              fontWeight: 'var(--peso-semi)',
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => inputGaleriaRef.current?.click()}
          style={{ marginLeft: 'auto', fontSize: 'var(--t-13)', fontWeight: 'var(--peso-medio)', color: 'var(--texto-tenue-sobre-oscuro)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          🖼 Galería
        </button>
      </div>
      {errorNumero && (
        <div style={{ flexShrink: 0, padding: '0 var(--s4)', fontSize: 'var(--t-11)', color: 'var(--falta-bg)' }}>{errorNumero}</div>
      )}

      <div style={{ flex: 1, minHeight: 0, position: 'relative', background: '#1B2226', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flexShrink: 0, padding: 'var(--s3) var(--s4) 0', textAlign: 'center', fontSize: 'var(--t-cuerpo-2)', fontWeight: 'var(--peso-medio)', color: 'var(--bond)' }}>
          {fotos.length === 0 ? 'Acércate a la etiqueta' : `${fotos.length} foto${fotos.length === 1 ? '' : 's'} de este producto`}
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 var(--s5)' }}>
          {ultimaUrl ? (
            <img
              src={ultimaUrl}
              alt=""
              style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 'var(--r)', border: 'var(--bd-acento) solid rgba(245,246,244,.45)', objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                maxWidth: '320px',
                aspectRatio: '4 / 3',
                border: 'var(--bd-acento) solid rgba(245,246,244,.45)',
                borderRadius: 'var(--r)',
              }}
            />
          )}
        </div>

        {fotos.length > 0 && (
          <div style={{ flexShrink: 0, padding: '0 var(--s4) var(--s4)', display: 'flex', alignItems: 'center', gap: 'var(--s2)', overflowX: 'auto' }}>
            {fotos.map((_, idx) => (
              <div key={idx} style={{ position: 'relative', width: '54px', height: '54px', flexShrink: 0, borderRadius: 'var(--r-chip)', overflow: 'hidden', border: 'var(--bd) solid rgba(245,246,244,.3)' }}>
                <img src={urls[idx]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => quitarFoto(idx)}
                  aria-label="Quitar foto"
                  style={{ position: 'absolute', top: 0, right: 0, width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: '12px', border: 'none' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ flexShrink: 0, padding: '10px var(--s4)', background: 'var(--falta-bg)', color: 'var(--falta)', fontSize: 'var(--t-14)' }}>{error}</div>
      )}

      <div style={{ flexShrink: 0, padding: 'var(--s4) var(--s4) var(--s5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--tinta)' }}>
        <button
          type="button"
          onClick={onCancelar}
          style={{ width: '84px', textAlign: 'left', fontSize: 'var(--t-15)', color: 'var(--texto-tenue-sobre-oscuro)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => inputCamaraRef.current?.click()}
          aria-label="Tomar foto"
          style={{ width: '80px', height: '80px', borderRadius: 'var(--r-redondo)', background: 'var(--bond)', border: '5px solid rgba(245,246,244,.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span style={{ width: '60px', height: '60px', borderRadius: 'var(--r-redondo)', background: 'var(--boli)' }} />
        </button>
        <button
          type="button"
          disabled={listoDeshabilitado}
          onClick={manejarListo}
          style={{
            width: '84px',
            textAlign: 'right',
            fontSize: 'var(--t-15)',
            fontWeight: 'var(--peso-semi)',
            color: listoDeshabilitado ? 'var(--texto-tenue-sobre-oscuro)' : 'var(--boli-claro)',
            background: 'none',
            border: 'none',
            cursor: listoDeshabilitado ? 'not-allowed' : 'pointer',
          }}
        >
          {enviando ? '…' : 'Listo →'}
        </button>
      </div>
    </div>
  );
}
