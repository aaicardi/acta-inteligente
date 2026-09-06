import { useEffect, useState } from 'react';

export default function GaleriaFotos({ urls, indiceInicial = 0, onCerrar }) {
  const [indice, setIndice] = useState(indiceInicial);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onCerrar();
      if (e.key === 'ArrowLeft') setIndice((i) => (i - 1 + urls.length) % urls.length);
      if (e.key === 'ArrowRight') setIndice((i) => (i + 1) % urls.length);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [urls.length, onCerrar]);

  if (!urls || urls.length === 0) return null;

  function anterior(e) {
    e.stopPropagation();
    setIndice((i) => (i - 1 + urls.length) % urls.length);
  }

  function siguiente(e) {
    e.stopPropagation();
    setIndice((i) => (i + 1) % urls.length);
  }

  return (
    <div
      onClick={onCerrar}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'var(--tinta)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--s3) var(--s4)' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-11)', letterSpacing: 'var(--track-dato)', color: 'var(--texto-tenue-sobre-oscuro)' }}>
          FOTO {indice + 1} / {urls.length}
        </span>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-h4)', background: 'none', border: 'none', color: 'var(--texto-sobre-oscuro)', cursor: 'pointer', padding: '0 4px' }}
        >
          ✕
        </button>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 var(--s3)' }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            transform: `translateX(-${indice * 100}%)`,
            transition: 'transform .3s ease',
          }}
        >
          {urls.map((url, idx) => (
            <div key={idx} style={{ flex: '0 0 100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          ))}
        </div>

        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              style={{
                position: 'absolute',
                left: 'var(--s2)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 'var(--tap-40)',
                height: 'var(--tap-40)',
                background: 'rgba(245,246,244,.12)',
                border: 'var(--bd) solid rgba(245,246,244,.3)',
                borderRadius: 'var(--r-redondo)',
                color: 'var(--texto-sobre-oscuro)',
                fontSize: 'var(--t-h4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ←
            </button>
            <button
              type="button"
              onClick={siguiente}
              aria-label="Foto siguiente"
              style={{
                position: 'absolute',
                right: 'var(--s2)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 'var(--tap-40)',
                height: 'var(--tap-40)',
                background: 'rgba(245,246,244,.12)',
                border: 'var(--bd) solid rgba(245,246,244,.3)',
                borderRadius: 'var(--r-redondo)',
                color: 'var(--texto-sobre-oscuro)',
                fontSize: 'var(--t-h4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              →
            </button>
          </>
        )}
      </div>

      {urls.length > 1 && (
        <div style={{ display: 'flex', gap: 'var(--s2)', overflowX: 'auto', padding: 'var(--s3) var(--s4)' }}>
          {urls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt=""
              onClick={(e) => {
                e.stopPropagation();
                setIndice(idx);
              }}
              style={{
                width: '48px',
                height: '48px',
                flexShrink: 0,
                objectFit: 'cover',
                borderRadius: 'var(--r-min)',
                cursor: 'pointer',
                opacity: idx === indice ? 1 : 0.5,
                border: idx === indice ? 'var(--bd-acento) solid var(--texto-sobre-oscuro)' : 'var(--bd) solid transparent',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
