import { useCallback, useEffect, useState } from 'react';
import EncabezadoForm from './components/EncabezadoForm';
import ListaItems from './components/ListaItems';
import CapturaProducto from './components/CapturaProducto';
import CargarZip from './components/CargarZip';
import ItemDetalleModal from './components/ItemDetalleModal';
import Modal from './components/Modal';
import * as db from './lib/db';
import * as api from './lib/api';

function encabezadoVacio() {
  return {
    doNo: '',
    cliente: '',
    documentoTransporte: '',
    deposito: '',
    ciudad: '',
    fecha: new Date().toISOString().slice(0, 10),
    horaInicio: '',
    horaFin: '',
    bultos: '',
    peso: '',
    observaciones: '',
  };
}

// Los fallos de red (sin señal) van a "en_cola" para reintentar solos al
// reconectar (ver Fase 4). Cualquier otro fallo (backend caído, IA sin
// configurar, límite de la API) va a "revisar" con el motivo visible.
function esFalloDeRed(err) {
  return err instanceof TypeError;
}

export default function App() {
  const [pantalla, setPantalla] = useState('cargando');
  const [encabezado, setEncabezado] = useState(encabezadoVacio());
  const [items, setItems] = useState([]);
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const [mostrarZip, setMostrarZip] = useState(false);
  const [mostrarEncabezado, setMostrarEncabezado] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');
  const [itemAbiertoId, setItemAbiertoId] = useState(null);

  useEffect(() => {
    (async () => {
      const enc = await db.leerEncabezado();
      const itemsGuardados = await db.leerItems();
      if (enc || itemsGuardados.length > 0) {
        setEncabezado(enc || encabezadoVacio());
        setItems(itemsGuardados);
        setPantalla('trabajo');
      } else {
        setPantalla('inicio');
      }
    })();
  }, []);

  const iniciarNuevaActa = useCallback(async () => {
    const ultimos = await db.leerUltimosValores();
    const enc = { ...encabezadoVacio(), ciudad: ultimos?.ciudad || '', deposito: ultimos?.deposito || '' };
    setEncabezado(enc);
    setItems([]);
    setError('');
    await db.guardarEncabezado(enc);
    setPantalla('trabajo');
    setMostrarEncabezado(true);
  }, []);

  const actualizarEncabezado = useCallback((campo, valor) => {
    setEncabezado((prev) => {
      const next = { ...prev, [campo]: valor };
      db.guardarEncabezado(next);
      return next;
    });
  }, []);

  const analizarYActualizar = useCallback(async (id, fotosParaAnalizar) => {
    try {
      const resultado = await api.analizarProducto(fotosParaAnalizar);
      setItems((prev) => {
        const next = prev.map((it) => (it.id === id ? { ...it, ...resultado } : it));
        const actualizado = next.find((it) => it.id === id);
        if (actualizado) db.guardarItem(actualizado);
        return next;
      });
    } catch (err) {
      setItems((prev) => {
        const cambios = esFalloDeRed(err)
          ? { estado: 'en_cola', motivoRevision: 'Sin conexión; se reintentará automáticamente.' }
          : { estado: 'revisar', motivoRevision: err.message };
        const next = prev.map((it) => (it.id === id ? { ...it, ...cambios } : it));
        const actualizado = next.find((it) => it.id === id);
        if (actualizado) db.guardarItem(actualizado);
        return next;
      });
    }
  }, []);

  const agregarItem = useCallback(
    async ({ fotos, cantidad }) => {
      const id = crypto.randomUUID();
      const nuevo = {
        id,
        orden: items.length + 1,
        referenciaCarpeta: null,
        fotos,
        cantidad,
        referencia: '',
        paisOrigen: '',
        descripcion: '',
        marca: '',
        estado: 'analizando',
        confianza: 0,
        motivoRevision: null,
      };
      setItems((prev) => [...prev, nuevo]);
      await db.guardarItem(nuevo);
      setMostrarCaptura(false);
      await analizarYActualizar(id, fotos);
    },
    [items.length, analizarYActualizar]
  );

  const reintentarItem = useCallback(
    async (id) => {
      const item = items.find((it) => it.id === id);
      if (!item) return;
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, estado: 'analizando' } : it)));
      await analizarYActualizar(id, item.fotos || []);
    },
    [items, analizarYActualizar]
  );

  // Fase 4: al recuperar señal, reintenta solos todos los ítems "en_cola".
  useEffect(() => {
    function alReconectar() {
      setItems((prev) => {
        prev.filter((it) => it.estado === 'en_cola').forEach((it) => reintentarItem(it.id));
        return prev;
      });
    }
    window.addEventListener('online', alReconectar);
    return () => window.removeEventListener('online', alReconectar);
  }, [reintentarItem]);

  const agregarItemsDesdeZip = useCallback(
    async (itemsBackend) => {
      const base = items.length;
      const nuevos = await Promise.all(
        itemsBackend.map(async (it, idx) => {
          // El backend solo manda fotos (base64) para items "revisar": el
          // inspector las necesita para corregir el campo dudoso.
          const fotos = await Promise.all(
            (it.fotos || []).map((dataUri) => fetch(dataUri).then((r) => r.blob()))
          );
          return {
            id: crypto.randomUUID(),
            orden: base + idx + 1,
            referenciaCarpeta: it.referenciaCarpeta,
            fotos,
            cantidad: '',
            referencia: it.referencia,
            paisOrigen: it.paisOrigen,
            descripcion: it.descripcion,
            marca: it.marca,
            estado: it.estado,
            confianza: it.confianza,
            motivoRevision: it.motivoRevision,
          };
        })
      );
      setItems((prev) => [...prev, ...nuevos]);
      await Promise.all(nuevos.map((it) => db.guardarItem(it)));
    },
    [items.length]
  );

  const procesarZip = useCallback(
    async (archivo) => {
      const resultado = await api.procesarZip(archivo);
      await agregarItemsDesdeZip(resultado.items);
      return resultado;
    },
    [agregarItemsDesdeZip]
  );

  const actualizarItem = useCallback((id, cambios) => {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, ...cambios } : it));
      const actualizado = next.find((it) => it.id === id);
      if (actualizado) db.guardarItem(actualizado);
      return next;
    });
  }, []);

  const eliminarItem = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    db.eliminarItem(id);
  }, []);

  const abrirItem = useCallback((id) => setItemAbiertoId(id), []);
  const cerrarItem = useCallback(() => setItemAbiertoId(null), []);
  const itemAbierto = items.find((it) => it.id === itemAbiertoId) || null;

  // La cantidad es opcional siempre: nunca bloquea "Generar acta". El
  // inspector puede completarla después, incluso directamente en el Excel
  // generado (ver spec.md, corregido tras feedback real de uso).
  const generarActa = useCallback(async () => {
    setError('');
    setGenerando(true);
    try {
      const blob = await api.generarActa(encabezado, items);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acta_${encabezado.doNo || 'sin_do'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      await db.guardarUltimosValores({ ciudad: encabezado.ciudad, deposito: encabezado.deposito });
      await db.vaciarActa();
      setItems([]);
      setEncabezado(encabezadoVacio());
      setPantalla('inicio');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  }, [encabezado, items]);

  if (pantalla === 'cargando') {
    return <div className="flex h-full items-center justify-center text-slate-400">Cargando…</div>;
  }

  if (pantalla === 'inicio') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Acta Inteligente</h1>
        <p className="mb-4 text-center text-slate-500">Diligenciamiento de actas de inspección previa con IA</p>
        <button
          type="button"
          onClick={iniciarNuevaActa}
          className="w-full max-w-xs rounded-xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white shadow active:bg-indigo-700"
        >
          Nueva acta
        </button>
        <button
          type="button"
          onClick={async () => {
            await iniciarNuevaActa();
            setMostrarEncabezado(false);
            setMostrarZip(true);
          }}
          className="w-full max-w-xs rounded-xl border border-slate-300 bg-white px-6 py-4 text-lg font-medium text-slate-700"
        >
          Cargar ZIP
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="flex-1 truncate text-lg font-bold text-slate-900">Acta Inteligente</h1>
        <button
          type="button"
          onClick={() => setMostrarEncabezado(true)}
          className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600"
        >
          📋 Encabezado
        </button>
        <span className="shrink-0 text-sm text-slate-400">{items.length}</span>
      </header>

      {error && (
        <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Vista principal: solo el grid de productos, con su propio scroll,
          para que el encabezado y los paneles de carga (ahora modales) nunca
          compitan por espacio ni se vuelvan pesados con cientos de ítems. */}
      <main className="flex-1 overflow-y-auto p-3 pb-28">
        <ListaItems items={items} onActualizar={actualizarItem} onAbrir={abrirItem} />
      </main>

      {mostrarEncabezado && (
        <Modal titulo="Encabezado del despacho" onCerrar={() => setMostrarEncabezado(false)}>
          <EncabezadoForm encabezado={encabezado} onCambiar={actualizarEncabezado} />
        </Modal>
      )}

      {mostrarCaptura && (
        <Modal titulo="Nuevo producto" onCerrar={() => setMostrarCaptura(false)}>
          <CapturaProducto onAgregar={agregarItem} onCancelar={() => setMostrarCaptura(false)} />
        </Modal>
      )}

      {mostrarZip && (
        <Modal titulo="Cargar ZIP del registro fotográfico" onCerrar={() => setMostrarZip(false)}>
          <CargarZip onProcesar={procesarZip} onCancelar={() => setMostrarZip(false)} />
        </Modal>
      )}

      {itemAbierto && (
        <ItemDetalleModal
          item={itemAbierto}
          onCerrar={cerrarItem}
          onActualizar={actualizarItem}
          onEliminar={eliminarItem}
          onReintentar={reintentarItem}
        />
      )}

      <footer className="fixed inset-x-0 bottom-0 mx-auto max-w-md space-y-2 border-t border-slate-200 bg-white p-3 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMostrarCaptura(true)}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white active:bg-indigo-700"
          >
            + Agregar producto
          </button>
          <button
            type="button"
            onClick={() => setMostrarZip(true)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-700"
          >
            ZIP
          </button>
        </div>
        <button
          type="button"
          disabled={generando || items.length === 0}
          onClick={generarActa}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white disabled:opacity-40"
        >
          {generando ? 'Generando acta…' : 'Generar acta'}
        </button>
      </footer>
    </div>
  );
}
