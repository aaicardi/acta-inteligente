import { useEffect, useState } from 'react';
import { EstadoBadge, Velo, Skeleton, CampoCantidad } from './ds';

// Capa de sistema (analizando / en_cola) vs capa de persona (listo / revisar):
// nunca se muestran a la vez — ver Acta Inteligente v2, componente ItemCard.
const SISTEMA = { analizando: 'analizando', en_cola: 'cola' };

export default function ItemCard({ item, onActualizar, onAbrir }) {
  const [thumbUrl, setThumbUrl] = useState(null);

  useEffect(() => {
    const primera = (item.fotos || []).find((f) => f instanceof Blob);
    if (!primera) {
      setThumbUrl(null);
      return;
    }
    const url = URL.createObjectURL(primera);
    setThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [item.fotos]);

  const sistema = SISTEMA[item.estado] || null;
  const estado = sistema ? null : item.estado === 'revisar' ? 'revisar' : 'listo';
  const sinCantidad = item.cantidad === '' || item.cantidad === null || item.cantidad === undefined;

  return (
    <div
      style={{
        background: '#fff',
        border: `var(--bd) solid ${estado === 'revisar' ? 'var(--copia-bd)' : 'var(--linea)'}`,
        borderRadius: 'var(--r)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <button type="button" onClick={() => onAbrir(item.id)} style={{ display: 'block', width: '100%', textAlign: 'left' }}>
        <div
          style={{
            aspectRatio: '1',
            background: 'var(--bond-2)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--mono)',
            fontSize: 'var(--t-9)',
            color: 'var(--grafito)',
            letterSpacing: 'var(--track-badge)',
          }}
        >
          {thumbUrl ? (
            <img src={thumbUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            !sistema && 'FOTO'
          )}
          <span
            style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              fontFamily: 'var(--mono)',
              fontSize: 'var(--t-10)',
              fontWeight: 'var(--peso-semi)',
              background: 'var(--tinta)',
              color: '#fff',
              padding: '2px 5px',
              borderRadius: 'var(--r-min)',
            }}
          >
            {item.orden ?? ''}
          </span>
          {!sistema && (
            <span style={{ position: 'absolute', top: '6px', right: '6px' }}>
              <EstadoBadge estado={estado} />
            </span>
          )}
          {sistema && <Velo estado={sistema} />}
        </div>

        <div style={{ padding: '8px' }}>
          {sistema === 'analizando' ? (
            <>
              <Skeleton />
              <Skeleton ancho="60%" style={{ marginTop: 'var(--s1)' }} />
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 'var(--t-13)',
                  fontWeight: 'var(--peso-medio)',
                  lineHeight: 'var(--alto-titulo)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  color: sistema ? 'var(--grafito)' : 'var(--tinta)',
                }}
              >
                {item.descripcion || (sistema ? 'Sin analizar' : 'Sin descripción')}
              </div>
              {item.referencia && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-10)', color: 'var(--grafito)', marginTop: '3px', letterSpacing: '.04em' }}>
                  {item.referencia}
                </div>
              )}
              {estado === 'revisar' && item.motivoRevision && (
                <div style={{ fontSize: 'var(--t-11)', color: 'var(--copia)', marginTop: '5px', lineHeight: '1.3', fontWeight: 'var(--peso-medio)' }}>
                  {item.motivoRevision}
                </div>
              )}
            </>
          )}
        </div>
      </button>

      <div style={{ padding: '0 8px 8px' }}>
        <CampoCantidad
          valor={item.cantidad ?? ''}
          disabled={!!sistema}
          estado={sinCantidad ? 'neutro' : 'ok'}
          onChange={(e) => {
            const digitos = e.target.value.replace(/[^0-9]/g, '');
            onActualizar(item.id, { cantidad: digitos === '' ? '' : Number(digitos) });
          }}
        />
      </div>
    </div>
  );
}
