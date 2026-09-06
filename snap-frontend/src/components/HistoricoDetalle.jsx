import { AppHeader, Tarjeta, Campo, ResumenActa, Boton } from './ds';
import ItemHistoricoCard from './ItemHistoricoCard';

function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function HistoricoDetalle({ acta, cargando, error, descargando, onVolver, onDescargar, tabBar }) {
  if (cargando || !acta) {
    return (
      <div style={{ position: 'fixed', inset: 0, maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--bond)' }}>
        <AppHeader titulo="Acta" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--t-14)', color: 'var(--grafito)' }}>
          {error || 'Cargando…'}
        </div>
        {tabBar}
      </div>
    );
  }

  const totalFotos = acta.items.reduce((n, it) => n + (it.fotos?.length || 0), 0);
  const generada = acta.estado === 'generada';

  return (
    <div style={{ position: 'fixed', inset: 0, maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--bond)' }}>
      <AppHeader titulo={acta.cliente || 'Sin cliente'} meta={`D.O. ${acta.doNo || '—'} · ${formatearFecha(acta.fecha)}`} />

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s4)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
        <button
          type="button"
          onClick={onVolver}
          style={{ alignSelf: 'flex-start', fontFamily: 'var(--mono)', fontSize: 'var(--t-11)', letterSpacing: 'var(--track-dato)', color: 'var(--boli)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← MIS ACTAS
        </button>

        {error && (
          <p style={{ borderRadius: 'var(--r)', background: 'var(--falta-bg)', padding: '10px var(--s3)', fontSize: 'var(--t-14)', color: 'var(--falta)' }}>{error}</p>
        )}

        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-11)', letterSpacing: 'var(--track-dato)', color: 'var(--grafito)' }}>
            GO.PD.02-F.02 · {generada ? 'GENERADA' : 'EN CURSO'}
          </div>
          <h2 style={{ fontSize: 'var(--t-h3)', fontWeight: 'var(--peso-bold)', letterSpacing: 'var(--track-h4)', color: 'var(--tinta)', marginTop: '2px' }}>
            {acta.cliente || 'Sin cliente'}
          </h2>
        </div>

        <Tarjeta etiqueta="Datos de la inspección">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Campo etiqueta="D.O. No" valor={acta.doNo} mono vacio={!acta.doNo} />
            <Campo etiqueta="Doc. transporte" valor={acta.documentoTransporte} mono vacio={!acta.documentoTransporte} />
            <Campo etiqueta="Depósito" valor={acta.deposito} vacio={!acta.deposito} />
            <Campo etiqueta="Ciudad" valor={acta.ciudad} vacio={!acta.ciudad} />
            <Campo etiqueta="Fecha" valor={formatearFecha(acta.fecha)} mono />
            <Campo etiqueta="Horas" valor={`${acta.horaInicio || '--:--'} → ${acta.horaFin || '--:--'}`} mono />
            <Campo etiqueta="Cliente" valor={acta.cliente} ancho="wide" vacio={!acta.cliente} />
            {acta.observaciones && (
              <Campo etiqueta="Observaciones" valor={acta.observaciones} ancho="wide" mono={false} />
            )}
          </div>
          <ResumenActa doNo={acta.doNo} items={acta.items.length} bultos={acta.bultos} peso={acta.peso} />
        </Tarjeta>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s2)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-10)', letterSpacing: 'var(--track-label)', textTransform: 'uppercase', color: 'var(--grafito)' }}>
            Ítems del acta
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-11)', color: 'var(--tinta-70)' }}>
            {acta.items.length} {acta.items.length === 1 ? 'ítem' : 'ítems'} · {totalFotos} {totalFotos === 1 ? 'foto' : 'fotos'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
          {acta.items.length === 0 ? (
            <p style={{ fontSize: 'var(--t-14)', color: 'var(--grafito)' }}>Esta acta no tiene productos registrados.</p>
          ) : (
            acta.items.map((item) => <ItemHistoricoCard key={item.id} item={item} />)
          )}
        </div>
      </div>

      <div style={{ background: '#fff', borderTop: 'var(--bd) solid var(--linea)', padding: '10px var(--s3) var(--s3)' }}>
        <Boton variante="primaria" talla="tap" disabled={descargando} onClick={onDescargar}>
          {descargando ? 'Descargando…' : 'Descargar Excel'}
        </Boton>
      </div>
      {tabBar}
    </div>
  );
}
