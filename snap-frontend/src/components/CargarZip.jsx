import { useRef, useState } from 'react';

export default function CargarZip({ onProcesar, onCancelar }) {
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [ignoradas, setIgnoradas] = useState([]);

  async function manejarProcesar() {
    if (!archivo) return;
    setProcesando(true);
    setError('');
    try {
      const resultado = await onProcesar(archivo);
      setIgnoradas(resultado?.carpetasIgnoradas || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        Selecciona el .zip con una carpeta por producto. El sistema analizará cada carpeta y agregará un ítem por
        cada una a la lista, en el mismo orden.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(e) => setArchivo(e.target.files?.[0] || null)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mb-3 w-full rounded-lg border border-indigo-300 bg-white px-3 py-3 text-base font-medium text-indigo-700"
      >
        {archivo ? `📦 ${archivo.name}` : '📦 Elegir archivo .zip'}
      </button>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {ignoradas.length > 0 && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Carpetas sin fotos válidas (ignoradas): {ignoradas.join(', ')}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-700"
        >
          Cerrar
        </button>
        <button
          type="button"
          disabled={!archivo || procesando}
          onClick={manejarProcesar}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-3 text-base font-semibold text-white disabled:opacity-40"
        >
          {procesando ? 'Procesando…' : 'Procesar ZIP'}
        </button>
      </div>
    </div>
  );
}
