import { useState } from 'react';
import GaleriaFotos from './GaleriaFotos';
import { EstadoBadge } from './ds';

const ESTADO_DS = { listo: 'listo', revisar: 'revisar', en_cola: 'neutro', analizando: 'neutro' };

// El acta del histórico ya está cerrada: los datos se leen, no se editan. A
// diferencia de ItemDetalleModal (inspección), aquí todo queda a la vista sin
// desplegables — el inspector consulta, no diligencia.
function Dato({ etiqueta, valor }) {
  const vacio = valor === null || valor === undefined || valor === '';
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 'var(--t-9)',
          letterSpacing: 'var(--track-label)',
          textTransform: 'uppercase',
          color: 'var(--grafito)',
        }}
      >
        {etiqueta}
      </div>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 'var(--t-13)',
          letterSpacing: 'var(--track-dato)',
          fontWeight: 'var(--peso-medio)',
          color: vacio ? 'var(--grafito)' : 'var(--tinta)',
          marginTop: '2px',
          wordBreak: 'break-word',
        }}
      >
        {vacio ? 'No dice' : valor}
      </div>
    </div>
  );
}

export default function ItemHistoricoCard({ item }) {
  const [indiceGaleria, setIndiceGaleria] = useState(null);
  const fotos = (item.fotos || []).filter((f) => f.url);
  const urls = fotos.map((f) => f.url);
  const adicionales = Array.isArray(item.datosAdicionales) ? item.datosAdicionales : [];

  return (
    <div style={{ background: '#fff', border: 'var(--bd) solid var(--linea)', borderRadius: 'var(--r)' }}>
      {/* Cabecera: número de ítem, referencia y cantidad — la línea que el
          inspector escanea para ubicar el producto dentro del acta. */}
      <div
        style={{
          padding: '10px var(--s3)',
          borderBottom: 'var(--bd) solid var(--linea)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s2)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 'var(--t-10)',
            fontWeight: 'var(--peso-semi)',
            background: 'var(--tinta)',
            color: '#fff',
            padding: '2px 5px',
            borderRadius: 'var(--r-min)',
            flexShrink: 0,
          }}
        >
          {item.orden}
        </span>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 'var(--t-12)',
            letterSpacing: 'var(--track-dato)',
            color: item.referencia ? 'var(--tinta)' : 'var(--grafito)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.referencia || 'Sin referencia'}
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--s2)', flexShrink: 0 }}>
          {item.estado && <EstadoBadge estado={ESTADO_DS[item.estado] || 'neutro'} />}
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 'var(--t-11)',
              letterSpacing: 'var(--track-dato)',
              color: item.cantidad ? 'var(--tinta)' : 'var(--grafito)',
            }}
          >
            {item.cantidad ? `${item.cantidad} UN` : 'Sin cantidad'}
          </span>
        </span>
      </div>

      {item.motivoRevision && (
        <div
          style={{
            margin: 'var(--s3) var(--s3) 0',
            background: 'var(--copia-bg)',
            border: 'var(--bd) solid var(--copia-bd)',
            borderRadius: 'var(--r)',
            padding: '6px 10px',
            fontSize: 'var(--t-12)',
            fontWeight: 'var(--peso-medio)',
            lineHeight: 'var(--alto-titulo)',
            color: 'var(--copia)',
          }}
        >
          {item.motivoRevision}
        </div>
      )}

      <div style={{ padding: 'var(--s3)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px var(--s4)' }}>
        <Dato etiqueta="Referencia" valor={item.referencia} />
        <Dato etiqueta="País de origen" valor={item.paisOrigen} />
        <Dato etiqueta="Modelo" valor={item.modelo} />
        <Dato etiqueta="Serial" valor={item.serial} />
        <Dato etiqueta="Marca" valor={item.marca} />
        <Dato etiqueta="Cantidad" valor={item.cantidad ? `${item.cantidad} UN` : ''} />
      </div>

      {adicionales.length > 0 && (
        <div style={{ padding: '0 var(--s3) var(--s3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--s1)' }}>
          {adicionales.map((d, idx) => (
            <span
              key={idx}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 'var(--t-11)',
                fontWeight: 'var(--peso-medio)',
                background: 'var(--bond-2)',
                border: 'var(--bd) solid var(--linea)',
                borderRadius: 'var(--r-chip)',
                padding: '4px 8px',
                color: 'var(--tinta)',
              }}
            >
              {d.etiqueta}: {d.valor}
            </span>
          ))}
        </div>
      )}

      <div style={{ padding: '0 var(--s3) var(--s3)' }}>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 'var(--t-9)',
            letterSpacing: 'var(--track-label)',
            textTransform: 'uppercase',
            color: 'var(--grafito)',
          }}
        >
          Descripción
        </div>
        <div
          style={{
            fontSize: 'var(--t-14)',
            lineHeight: 'var(--alto-nota)',
            color: item.descripcion ? 'var(--tinta)' : 'var(--grafito)',
            marginTop: '3px',
            textWrap: 'pretty',
          }}
        >
          {item.descripcion || 'Sin descripción'}
        </div>
      </div>

      <div style={{ padding: '0 var(--s3) var(--s3)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s2)', marginBottom: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 'var(--t-9)',
              letterSpacing: 'var(--track-label)',
              textTransform: 'uppercase',
              color: 'var(--grafito)',
            }}
          >
            Fotos
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-10)', color: 'var(--tinta-70)' }}>
            {fotos.length === 0
              ? 'sin fotos'
              : `${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'} · toca para ampliar`}
          </span>
        </div>

        {fotos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {fotos.map((foto, idx) => (
              <button
                key={foto.id ?? idx}
                type="button"
                onClick={() => setIndiceGaleria(idx)}
                aria-label={`Ampliar foto ${idx + 1}`}
                style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <img
                  src={foto.url}
                  alt=""
                  loading="lazy"
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    display: 'block',
                    objectFit: 'cover',
                    borderRadius: 'var(--r-min)',
                    background: 'var(--bond-2)',
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {indiceGaleria !== null && (
        <GaleriaFotos urls={urls} indiceInicial={indiceGaleria} onCerrar={() => setIndiceGaleria(null)} />
      )}
    </div>
  );
}
