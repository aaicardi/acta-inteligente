import { useEffect, useState } from 'react';
import Modal from './Modal';
import GaleriaFotos from './GaleriaFotos';
import { EstadoBadge, Campo, Boton } from './ds';

const ESTADO_DS = { listo: 'listo', revisar: 'revisar', en_cola: 'neutro', analizando: 'neutro' };

export default function ItemDetalleModal({ item, onCerrar, onActualizar, onActualizarNumero, onEliminar, onReintentar }) {
  const [urls, setUrls] = useState([]);
  const [numeroTexto, setNumeroTexto] = useState(String(item.orden ?? ''));
  const [errorNumero, setErrorNumero] = useState('');
  const [indiceGaleria, setIndiceGaleria] = useState(null);

  useEffect(() => {
    const fotos = item.fotos || [];
    const sonBlobs = fotos.some((f) => f instanceof Blob);
    if (sonBlobs) {
      const nuevas = fotos.map((f) => (f instanceof Blob ? URL.createObjectURL(f) : null)).filter(Boolean);
      setUrls(nuevas);
      return () => nuevas.forEach((url) => URL.revokeObjectURL(url));
    }
    setUrls(fotos.map((f) => f.url).filter(Boolean));
  }, [item.fotos]);

  useEffect(() => {
    setNumeroTexto(String(item.orden ?? ''));
    setErrorNumero('');
  }, [item.id, item.orden]);

  async function confirmarNumero() {
    if (numeroTexto === String(item.orden ?? '')) return;
    const mensaje = await onActualizarNumero(item.id, numeroTexto);
    if (mensaje) {
      setErrorNumero(mensaje);
      setNumeroTexto(String(item.orden ?? ''));
    } else {
      setErrorNumero('');
    }
  }

  return (
    <Modal titulo={`Producto #${item.orden ?? ''}`} onCerrar={onCerrar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s4)' }}>
        <EstadoBadge estado={ESTADO_DS[item.estado] || 'neutro'}>
          {item.estado === 'analizando' ? 'Analizando…' : item.estado === 'en_cola' ? 'En cola' : undefined}
        </EstadoBadge>
      </div>

      {urls.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--s2)', overflowX: 'auto', marginBottom: 'var(--s4)' }}>
          {urls.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setIndiceGaleria(idx)}
              style={{ flexShrink: 0, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <img
                src={url}
                alt=""
                style={{ width: '80px', height: '80px', display: 'block', borderRadius: 'var(--r-min)', border: 'var(--bd) solid var(--linea)', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}

      {indiceGaleria !== null && (
        <GaleriaFotos urls={urls} indiceInicial={indiceGaleria} onCerrar={() => setIndiceGaleria(null)} />
      )}

      {Array.isArray(item.datosAdicionales) && item.datosAdicionales.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s1)', marginBottom: 'var(--s4)' }}>
          {item.datosAdicionales.map((d, idx) => (
            <span
              key={idx}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 'var(--t-11)',
                fontWeight: 'var(--peso-medio)',
                background: 'var(--fondo-heredado)',
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

      {item.motivoRevision && (
        <div
          style={{
            background: 'var(--copia-bg)',
            border: 'var(--bd) solid var(--copia-bd)',
            borderRadius: 'var(--r)',
            padding: '10px var(--s3)',
            fontSize: 'var(--t-14)',
            fontWeight: 'var(--peso-medio)',
            lineHeight: 'var(--alto-titulo)',
            color: 'var(--copia)',
            marginBottom: 'var(--s4)',
          }}
        >
          {item.motivoRevision}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Campo
          etiqueta="Número de ítem (factura)"
          type="text"
          valor={numeroTexto}
          error={errorNumero}
          onChange={(v) => setNumeroTexto(v.replace(/[^0-9]/g, ''))}
          onBlur={confirmarNumero}
        />
        <Campo etiqueta="Referencia" valor={item.referencia} onChange={(v) => onActualizar(item.id, { referencia: v })} />
        <Campo etiqueta="Modelo" valor={item.modelo} onChange={(v) => onActualizar(item.id, { modelo: v })} />
        <Campo etiqueta="Serial" valor={item.serial} onChange={(v) => onActualizar(item.id, { serial: v })} />
        <Campo etiqueta="País de origen" mono={false} valor={item.paisOrigen} onChange={(v) => onActualizar(item.id, { paisOrigen: v })} />
        <Campo etiqueta="Marca" mono={false} valor={item.marca} onChange={(v) => onActualizar(item.id, { marca: v })} />
        <Campo etiqueta="Descripción" ancho="wide" mono={false} textarea valor={item.descripcion} onChange={(v) => onActualizar(item.id, { descripcion: v })} />
        <Campo
          etiqueta="Cantidad"
          hint="Opcional; se puede completar después"
          type="number"
          valor={item.cantidad ?? ''}
          onChange={(v) => onActualizar(item.id, { cantidad: v === '' ? '' : Number(v) })}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 'var(--s5)' }}>
        {item.estado === 'en_cola' && (
          <Boton variante="primaria" talla="tap" onClick={() => onReintentar(item.id)}>
            Reintentar análisis
          </Boton>
        )}
        <Boton
          variante="secundaria"
          talla="tap"
          onClick={() => {
            onEliminar(item.id);
            onCerrar();
          }}
          style={{ color: 'var(--falta)', border: 'var(--bd-estado) solid var(--falta-bd)' }}
        >
          Eliminar producto
        </Boton>
      </div>
    </Modal>
  );
}
