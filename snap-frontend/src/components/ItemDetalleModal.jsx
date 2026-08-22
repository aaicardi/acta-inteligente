import { useEffect, useState } from 'react';
import Modal from './Modal';

const ESTILOS_ESTADO = {
  listo: { texto: 'Listo', clase: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  revisar: { texto: 'Revisar', clase: 'bg-amber-100 text-amber-800 border-amber-300' },
  en_cola: { texto: 'En cola', clase: 'bg-slate-200 text-slate-700 border-slate-300' },
  analizando: { texto: 'Analizando…', clase: 'bg-blue-100 text-blue-800 border-blue-300' },
};

export default function ItemDetalleModal({ item, onCerrar, onActualizar, onEliminar, onReintentar }) {
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    const nuevas = (item.fotos || []).map((f) => (f instanceof Blob ? URL.createObjectURL(f) : null)).filter(Boolean);
    setUrls(nuevas);
    return () => nuevas.forEach((url) => URL.revokeObjectURL(url));
  }, [item.fotos]);

  const estilo = ESTILOS_ESTADO[item.estado] || ESTILOS_ESTADO.revisar;

  return (
    <Modal titulo={`Producto #${item.orden ?? ''}`} onCerrar={onCerrar}>
      <span className={`mb-3 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${estilo.clase}`}>
        {estilo.texto}
      </span>

      {urls.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, idx) => (
            <img key={idx} src={url} alt="" className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 object-cover" />
          ))}
        </div>
      )}

      {item.referenciaCarpeta && (
        <p className="mb-2 text-xs text-slate-400">Carpeta ZIP: {item.referenciaCarpeta}</p>
      )}

      {item.motivoRevision && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">⚠ {item.motivoRevision}</p>
      )}

      <div className="space-y-3">
        <Campo label="Referencia" value={item.referencia} onChange={(v) => onActualizar(item.id, { referencia: v })} />
        <Campo label="Modelo" value={item.modelo} onChange={(v) => onActualizar(item.id, { modelo: v })} />
        <Campo label="Serial" value={item.serial} onChange={(v) => onActualizar(item.id, { serial: v })} />
        <Campo label="País de origen" value={item.paisOrigen} onChange={(v) => onActualizar(item.id, { paisOrigen: v })} />
        <CampoArea label="Descripción" value={item.descripcion} onChange={(v) => onActualizar(item.id, { descripcion: v })} />
        <Campo label="Marca" value={item.marca} onChange={(v) => onActualizar(item.id, { marca: v })} />
        <label className="flex flex-col text-sm text-slate-600">
          Cantidad (opcional; se puede completar después)
          <input
            type="number"
            inputMode="numeric"
            value={item.cantidad ?? ''}
            onChange={(e) => onActualizar(item.id, { cantidad: e.target.value === '' ? '' : Number(e.target.value) })}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        {item.estado === 'en_cola' && (
          <button
            type="button"
            onClick={() => onReintentar(item.id)}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
          >
            Reintentar análisis
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onEliminar(item.id);
            onCerrar();
          }}
          className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600"
        >
          Eliminar producto
        </button>
      </div>
    </Modal>
  );
}

function Campo({ label, value, onChange }) {
  return (
    <label className="flex flex-col text-sm text-slate-600">
      {label}
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
      />
    </label>
  );
}

function CampoArea({ label, value, onChange }) {
  return (
    <label className="flex flex-col text-sm text-slate-600">
      {label}
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
      />
    </label>
  );
}
