import { useEffect, useRef, useState } from 'react';

export default function CapturaProducto({ onAgregar, onCancelar }) {
  const [fotos, setFotos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const inputCamaraRef = useRef(null);
  const inputGaleriaRef = useRef(null);
  const [urls, setUrls] = useState([]);

  // Estado (no ref): así React repinta las miniaturas apenas las URLs quedan
  // listas, en la misma foto agregada (un ref no dispara un nuevo render).
  useEffect(() => {
    const nuevas = fotos.map((f) => URL.createObjectURL(f));
    setUrls(nuevas);
    return () => nuevas.forEach((url) => URL.revokeObjectURL(url));
  }, [fotos]);

  function agregarArchivos(fileList) {
    const nuevos = Array.from(fileList || []);
    if (nuevos.length === 0) return;
    setFotos((prev) => [...prev, ...nuevos]);
  }

  function quitarFoto(idx) {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  }

  // La cantidad NO se pide aquí: el inspector fotografía referencia por
  // referencia sin detenerse, y llena las cantidades después, todas juntas,
  // tomándolas del total que dice la factura para cada referencia.
  async function manejarAgregar() {
    setEnviando(true);
    try {
      await onAgregar({ fotos, cantidad: '' });
      setFotos([]);
    } finally {
      setEnviando(false);
    }
  }

  const puedeAnalizar = fotos.length > 0 && !enviando;

  return (
    <div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {fotos.map((_, idx) => (
          <div key={idx} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-indigo-300">
            <img src={urls[idx]} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => quitarFoto(idx)}
              className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-bl-lg bg-black/60 text-white"
              aria-label="Quitar foto"
            >
              ×
            </button>
          </div>
        ))}
        {fotos.length === 0 && (
          <p className="py-6 text-sm text-indigo-500">Toma una o varias fotos del producto (distintas caras/etiquetas).</p>
        )}
      </div>

      <div className="mb-3 flex gap-2">
        <input
          ref={inputCamaraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            agregarArchivos(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={inputGaleriaRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            agregarArchivos(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputCamaraRef.current?.click()}
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-3 text-base font-medium text-white active:bg-indigo-700"
        >
          📷 Tomar foto
        </button>
        <button
          type="button"
          onClick={() => inputGaleriaRef.current?.click()}
          className="rounded-lg border border-indigo-300 bg-white px-3 py-3 text-base font-medium text-indigo-700"
        >
          🖼 Galería
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!puedeAnalizar}
          onClick={manejarAgregar}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-3 text-base font-semibold text-white disabled:opacity-40"
        >
          {enviando ? 'Analizando…' : 'Analizar'}
        </button>
      </div>
    </div>
  );
}
