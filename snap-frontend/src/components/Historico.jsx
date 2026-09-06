import { AppHeader, Tarjeta, EstadoBadge } from './ds';

function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Historico({ actas, cargando, error, busqueda, onBusqueda, onAbrir, tabBar }) {
  return (
    <div style={{ position: 'fixed', inset: 0, maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--bond)' }}>
      <AppHeader titulo="Mis actas" meta={`${actas.length} acta${actas.length === 1 ? '' : 's'}`} />

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s4)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
        <input
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
          placeholder="Buscar por D.O. o cliente"
          aria-label="Buscar acta"
          style={{
            width: '100%',
            minHeight: '52px',
            background: '#fff',
            border: 'var(--bd) solid var(--linea)',
            borderRadius: 'var(--r)',
            padding: '0 var(--s3)',
            fontFamily: 'var(--sans)',
            fontSize: 'var(--t-15)',
            color: 'var(--tinta)',
          }}
        />

        {error && (
          <p style={{ borderRadius: 'var(--r)', background: 'var(--falta-bg)', padding: '10px var(--s3)', fontSize: 'var(--t-14)', color: 'var(--falta)' }}>{error}</p>
        )}

        {cargando ? (
          <p style={{ textAlign: 'center', fontSize: 'var(--t-14)', color: 'var(--grafito)' }}>Cargando…</p>
        ) : actas.length === 0 ? (
          <p
            style={{
              border: 'var(--bd-estado) dashed var(--linea)',
              borderRadius: 'var(--r)',
              padding: 'var(--s6) var(--s4)',
              textAlign: 'center',
              fontSize: 'var(--t-14)',
              color: 'var(--grafito)',
            }}
          >
            No hay actas guardadas todavía.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
            {actas.map((acta) => (
              <div key={acta.id} onClick={() => onAbrir(acta.id)} style={{ cursor: 'pointer' }}>
                <Tarjeta style={{ padding: 'var(--s3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: 'var(--t-15)', fontWeight: 'var(--peso-semi)', color: 'var(--tinta)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {acta.cliente || 'Sin cliente'}
                        </span>
                        {acta.estado === 'en_curso' && <EstadoBadge estado="en_curso" punto={false} />}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-11)', letterSpacing: 'var(--track-dato)', color: 'var(--grafito)', marginTop: '3px' }}>
                        {formatearFecha(acta.fecha)} · D.O. {acta.doNo || '—'} · {acta.totalItems} ítems · {acta.totalFotos} fotos
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-14)', color: 'var(--boli)', flexShrink: 0 }} aria-hidden="true">→</span>
                  </div>
                </Tarjeta>
              </div>
            ))}
          </div>
        )}
      </div>
      {tabBar}
    </div>
  );
}
