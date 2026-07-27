import { useEffect, useState } from 'react';

const ESTILOS_ESTADO = {
  listo: { texto: 'Listo', clase: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  revisar: { texto: 'Revisar', clase: 'bg-amber-100 text-amber-800 border-amber-300' },
  en_cola: { texto: 'En cola', clase: 'bg-slate-200 text-slate-700 border-slate-300' },
  analizando: { texto: 'Analizando…', clase: 'bg-blue-100 text-blue-800 border-blue-300' },
};

// Tarjeta compacta en grid. El detalle completo (fotos, campos, eliminar) vive
// en ItemDetalleModal — así "revisar" nunca interrumpe el flujo de seguir
// agregando productos; el inspector abre el detalle cuando él decide.
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

  const estilo = ESTILOS_ESTADO[item.estado] || ESTILOS_ESTADO.revisar;
  const sinCantidad = item.cantidad === '' || item.cantidad === null || item.cantidad === undefined;

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm ${sinCantidad ? 'border-red-300' : 'border-slate-200'}`}>
      <button type="button" onClick={() => onAbrir(item.id)} className="flex flex-1 flex-col text-left">
        <div className="flex h-20 items-center justify-center bg-slate-50">
          {thumbUrl ? (
            <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">📦</span>
          )}
        </div>
        <div className="flex items-start justify-between gap-1 px-2 pt-1.5">
          <span className="text-[11px] font-semibold text-slate-400">#{item.orden ?? ''}</span>
          <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-tight ${estilo.clase}`}>
            {estilo.texto}
          </span>
        </div>
        <p className="line-clamp-2 px-2 pb-1.5 pt-0.5 text-xs text-slate-700">
          {item.descripcion || <span className="italic text-slate-400">sin descripción</span>}
        </p>
      </button>

      <input
        type="number"
        inputMode="numeric"
        value={item.cantidad ?? ''}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onActualizar(item.id, { cantidad: e.target.value === '' ? '' : Number(e.target.value) })}
        placeholder="Cantidad"
        aria-label="Cantidad"
        className={`m-1.5 mt-0 rounded-lg border px-2 py-1.5 text-center text-sm ${sinCantidad ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
      />
    </div>
  );
}
