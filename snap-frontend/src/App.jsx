import { useCallback, useEffect, useRef, useState } from 'react';
import EncabezadoForm from './components/EncabezadoForm';
import ListaItems from './components/ListaItems';
import CapturaProducto from './components/CapturaProducto';
import ItemDetalleModal from './components/ItemDetalleModal';
import Modal from './components/Modal';
import Historico from './components/Historico';
import HistoricoDetalle from './components/HistoricoDetalle';
import { AppHeader, ColaChip, BarraExcepcion, Boton, Tarjeta, ResumenActa, Sello, CampoCantidad, TabBar } from './components/ds';
import * as api from './lib/api';

// Los fallos de red (sin señal) van a "en_cola" para reintentar solos al
// reconectar. Cualquier otro fallo (backend caído, IA sin configurar, límite
// de la API) va a "revisar" con el motivo visible.
function esFalloDeRed(err) {
  return err instanceof TypeError;
}

function sinCantidad(item) {
  return item.cantidad === '' || item.cantidad === null || item.cantidad === undefined;
}

// El número de ítem lo escribe el inspector (corresponde al número de línea
// de la factura), no se autoasigna: por eso siempre hay que reordenar antes
// de mostrar la lista o generar el acta, en vez de confiar en el orden de
// captura.
function ordenarPorNumero(lista) {
  return [...lista].sort((a, b) => Number(a.orden) - Number(b.orden));
}

const DEBOUNCE_MS = 400;

export default function App() {
  const [seccion, setSeccion] = useState('inspeccion');
  const [pantalla, setPantalla] = useState('cargando');
  const [actaId, setActaId] = useState(null);
  const [encabezado, setEncabezado] = useState(null);
  const [items, setItems] = useState([]);
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const [mostrarEncabezado, setMostrarEncabezado] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');
  const [itemAbiertoId, setItemAbiertoId] = useState(null);
  const [resumenGenerado, setResumenGenerado] = useState(null);

  const [actas, setActas] = useState([]);
  const [cargandoHistorico, setCargandoHistorico] = useState(false);
  const [errorHistorico, setErrorHistorico] = useState('');
  const [busquedaHistorico, setBusquedaHistorico] = useState('');
  const [vistaHistorico, setVistaHistorico] = useState('lista');
  const [actaDetalle, setActaDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [descargandoDetalle, setDescargandoDetalle] = useState(false);

  const debounceRef = useRef({});

  // El contador "N guardadas" del TabBar necesita el conteo de actas desde el
  // arranque, no solo cuando el inspector entra a la pestaña Histórico —
  // si no, refrescar la página muestra "0" hasta la primera visita a Actas.
  useEffect(() => {
    api.listarActas().then(setActas).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const enCurso = await api.obtenerActaEnCurso();
        if (enCurso) {
          setActaId(enCurso.id);
          setEncabezado(enCurso);
          setItems(enCurso.items || []);
          setPantalla('trabajo');
        } else {
          setPantalla('inicio');
        }
      } catch {
        setPantalla('inicio');
      }
    })();
  }, []);

  const iniciarNuevaActa = useCallback(async () => {
    setError('');
    try {
      const acta = await api.crearActa();
      setActaId(acta.id);
      setEncabezado(acta);
      setItems([]);
      setResumenGenerado(null);
      setPantalla('trabajo');
      setMostrarEncabezado(true);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const actualizarEncabezado = useCallback(
    (campo, valor) => {
      setEncabezado((prev) => ({ ...prev, [campo]: valor }));
      clearTimeout(debounceRef.current[campo]);
      debounceRef.current[campo] = setTimeout(async () => {
        try {
          await api.actualizarEncabezado(actaId, { [campo]: valor });
        } catch (err) {
          setError(err.message);
        }
      }, DEBOUNCE_MS);
    },
    [actaId]
  );

  const analizarYActualizar = useCallback(
    async (id, fotosParaAnalizar) => {
      try {
        const item = await api.analizarItem(actaId, id, fotosParaAnalizar);
        setItems((prev) => prev.map((it) => (it.id === id ? item : it)));
      } catch (err) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? esFalloDeRed(err)
                ? { ...it, estado: 'en_cola', motivoRevision: 'Sin conexión; se reintentará automáticamente.' }
                : { ...it, estado: 'revisar', motivoRevision: err.message }
              : it
          )
        );
      }
    },
    [actaId]
  );

  const agregarItem = useCallback(
    async ({ fotos, cantidad, numero }) => {
      const numeroLimpio = Number(numero);
      if (!numero || Number.isNaN(numeroLimpio)) {
        throw new Error('Ingresa el número de ítem de la factura.');
      }
      if (items.some((it) => Number(it.orden) === numeroLimpio)) {
        throw new Error(`El ítem ${numeroLimpio} ya existe. Usa otro número.`);
      }

      const creado = await api.agregarItem(actaId, { orden: numeroLimpio });
      const nuevo = { ...creado, fotos, cantidad, estado: 'analizando' };
      setItems((prev) => [...prev, nuevo]);
      setMostrarCaptura(false);
      await analizarYActualizar(creado.id, fotos);
      if (cantidad !== '' && cantidad !== undefined) {
        try {
          await api.actualizarItem(actaId, creado.id, { cantidad });
        } catch (err) {
          setError(err.message);
        }
      }
    },
    [items, actaId, analizarYActualizar]
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

  // Al recuperar señal, reintenta solos todos los ítems "en_cola".
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

  const actualizarItem = useCallback(
    (id, cambios) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...cambios } : it)));
      const key = `item-${id}`;
      clearTimeout(debounceRef.current[key]);
      debounceRef.current[key] = setTimeout(async () => {
        try {
          await api.actualizarItem(actaId, id, cambios);
        } catch (err) {
          setError(err.message);
        }
      }, DEBOUNCE_MS);
    },
    [actaId]
  );

  // No se puede repetir número de ítem: valida contra el resto de la lista
  // antes de pedirlo al backend, y devuelve el mensaje de error para
  // mostrarlo en el formulario (o '' si quedó bien).
  const actualizarNumero = useCallback(
    async (id, numero) => {
      const numeroLimpio = Number(numero);
      if (numero === '' || numero === null || numero === undefined || Number.isNaN(numeroLimpio)) {
        return 'Ingresa un número de ítem.';
      }
      const duplicado = items.some((it) => it.id !== id && Number(it.orden) === numeroLimpio);
      if (duplicado) {
        return `El ítem ${numeroLimpio} ya existe.`;
      }
      try {
        await api.actualizarNumeroItem(actaId, id, numeroLimpio);
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, orden: numeroLimpio } : it)));
        return '';
      } catch (err) {
        return err.message;
      }
    },
    [items, actaId]
  );

  const eliminarItem = useCallback(
    async (id) => {
      try {
        await api.eliminarItem(actaId, id);
        setItems((prev) => prev.filter((it) => it.id !== id));
      } catch (err) {
        setError(err.message);
      }
    },
    [actaId]
  );

  const abrirItem = useCallback((id) => setItemAbiertoId(id), []);
  const cerrarItem = useCallback(() => setItemAbiertoId(null), []);
  const itemAbierto = items.find((it) => it.id === itemAbiertoId) || null;

  const abrirPrimeraRevision = useCallback(() => {
    const primero = ordenarPorNumero(items).find((it) => it.estado === 'revisar');
    if (primero) abrirItem(primero.id);
  }, [items, abrirItem]);

  // La cantidad es opcional siempre: nunca bloquea "Generar acta". La
  // pantalla de cierre solo la resalta para que el inspector la revise antes
  // de firmar.
  const generarActa = useCallback(async () => {
    setError('');
    setGenerando(true);
    try {
      const blob = await api.generarActa(actaId);
      const nombreArchivo = `acta_${encabezado.doNo || 'sin_do'}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setResumenGenerado({
        doNo: encabezado.doNo,
        archivo: nombreArchivo,
        items: items.length,
        bultos: encabezado.bultos,
        peso: encabezado.peso,
      });

      setItems([]);
      setEncabezado(null);
      setActaId(null);
      setPantalla('exito');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  }, [actaId, encabezado, items]);

  const cargarHistorico = useCallback(async (q) => {
    setCargandoHistorico(true);
    setErrorHistorico('');
    try {
      const lista = await api.listarActas(q ? { q } : {});
      setActas(lista);
    } catch (err) {
      setErrorHistorico(err.message);
    } finally {
      setCargandoHistorico(false);
    }
  }, []);

  const irAHistorico = useCallback(() => {
    setSeccion('historico');
    setVistaHistorico('lista');
    cargarHistorico(busquedaHistorico);
  }, [cargarHistorico, busquedaHistorico]);

  useEffect(() => {
    if (seccion !== 'historico' || vistaHistorico !== 'lista') return;
    const timeout = setTimeout(() => cargarHistorico(busquedaHistorico), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [busquedaHistorico, seccion, vistaHistorico, cargarHistorico]);

  // Un acta "en_curso" todavía se está diligenciando: abrirla debe llevar al
  // inspector de vuelta al flujo normal de captura/edición, no a la vista de
  // solo lectura (esa es exclusiva de actas ya "generada").
  const abrirActaHistorico = useCallback(async (id) => {
    setVistaHistorico('detalle');
    setCargandoDetalle(true);
    setErrorDetalle('');
    setActaDetalle(null);
    try {
      const acta = await api.obtenerActaDetalle(id);
      if (acta.estado === 'en_curso') {
        setActaId(acta.id);
        setEncabezado(acta);
        setItems(acta.items || []);
        setSeccion('inspeccion');
        setPantalla('trabajo');
        return;
      }
      setActaDetalle(acta);
    } catch (err) {
      setErrorDetalle(err.message);
    } finally {
      setCargandoDetalle(false);
    }
  }, []);

  const descargarDesdeHistorico = useCallback(async () => {
    if (!actaDetalle) return;
    setDescargandoDetalle(true);
    setErrorDetalle('');
    try {
      const blob = await api.generarActa(actaDetalle.id);
      const nombreArchivo = `acta_${actaDetalle.doNo || 'sin_do'}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorDetalle(err.message);
    } finally {
      setDescargandoDetalle(false);
    }
  }, [actaDetalle]);

  if (pantalla === 'cargando' && seccion === 'inspeccion') {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 'var(--t-13)', color: 'var(--grafito)' }}>
        Cargando…
      </div>
    );
  }

  if (seccion === 'historico') {
    const tabBar = <TabBar activa={seccion} onCambiar={(s) => (s === 'inspeccion' ? setSeccion('inspeccion') : irAHistorico())} totalActas={actas.length} />;
    return vistaHistorico === 'lista' ? (
      <Historico
        actas={actas}
        cargando={cargandoHistorico}
        error={errorHistorico}
        busqueda={busquedaHistorico}
        onBusqueda={setBusquedaHistorico}
        onAbrir={abrirActaHistorico}
        tabBar={tabBar}
      />
    ) : (
      <HistoricoDetalle
        acta={actaDetalle}
        cargando={cargandoDetalle}
        error={errorDetalle}
        descargando={descargandoDetalle}
        onVolver={() => setVistaHistorico('lista')}
        onDescargar={descargarDesdeHistorico}
        tabBar={tabBar}
      />
    );
  }

  if (pantalla === 'inicio') {
    return (
      <div style={{ position: 'fixed', inset: 0, maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--bond)' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--s5)',
            padding: 'var(--s5)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-11)', letterSpacing: 'var(--track-eyebrow)', textTransform: 'uppercase', color: 'var(--grafito)' }}>
            GO.PD.02-F.02
          </div>
          <h1 style={{ fontSize: 'var(--t-h2)', fontWeight: 'var(--peso-bold)', letterSpacing: 'var(--track-h2)', color: 'var(--tinta)' }}>Acta Inteligente</h1>
          <p style={{ fontSize: 'var(--t-base)', lineHeight: 'var(--alto-nota)', color: 'var(--tinta-70)', maxWidth: '320px' }}>
            Diligenciamiento de actas de inspección previa con IA.
          </p>
          {error && <p style={{ fontSize: 'var(--t-14)', color: 'var(--falta)' }}>{error}</p>}
          <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
            <Boton variante="primaria" talla="lg" onClick={iniciarNuevaActa}>
              Nueva acta →
            </Boton>
          </div>
        </div>
        <TabBar activa={seccion} onCambiar={(s) => (s === 'inspeccion' ? setSeccion('inspeccion') : irAHistorico())} totalActas={actas.length} />
      </div>
    );
  }

  if (pantalla === 'cierre') {
    const pendientesSistema = items.filter((it) => it.estado === 'analizando' || it.estado === 'en_cola').length;
    const itemsCierre = ordenarPorNumero(items.filter((it) => it.estado !== 'analizando' && it.estado !== 'en_cola'));
    const faltantes = itemsCierre.filter(sinCantidad).length;
    return (
      <div style={{ position: 'fixed', inset: 0, maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--bond)' }}>
        <AppHeader
          titulo={faltantes ? (faltantes === 1 ? 'Falta 1 cantidad' : `Faltan ${faltantes} cantidades`) : 'Cierre del acta'}
          meta={`D.O. ${encabezado.doNo || '—'}`}
        />
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s4)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
          {error && (
            <p style={{ borderRadius: 'var(--r)', background: 'var(--falta-bg)', padding: '10px var(--s3)', fontSize: 'var(--t-14)', color: 'var(--falta)' }}>{error}</p>
          )}
          <Tarjeta etiqueta="Resumen del acta">
            <p style={{ fontSize: 'var(--t-14)', lineHeight: 'var(--alto-nota)', color: 'var(--tinta-70)', marginBottom: 'var(--s4)' }}>
              Verifica el conteo antes de generar. La cantidad es opcional: puedes completarla después, incluso directamente en el Excel.
            </p>
            <ResumenActa doNo={encabezado.doNo} items={items.length} bultos={encabezado.bultos} peso={encabezado.peso} />
          </Tarjeta>

          {pendientesSistema > 0 && (
            <div
              style={{
                background: 'var(--copia-bg)',
                border: 'var(--bd) solid var(--copia-bd)',
                borderRadius: 'var(--r)',
                padding: '10px var(--s3)',
                fontSize: 'var(--t-14)',
                fontWeight: 'var(--peso-medio)',
                color: 'var(--copia)',
              }}
            >
              {pendientesSistema} producto{pendientesSistema === 1 ? '' : 's'} todavía se {pendientesSistema === 1 ? 'está analizando' : 'están analizando'}. Puedes generar el acta igual y completarlo{pendientesSistema === 1 ? '' : 's'} después.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {itemsCierre.map((it) => (
              <div
                key={it.id}
                style={{
                  background: '#fff',
                  border: `${sinCantidad(it) ? 'var(--bd-estado)' : 'var(--bd)'} solid ${sinCantidad(it) ? 'var(--falta)' : 'var(--linea)'}`,
                  borderRadius: 'var(--r)',
                  padding: '10px var(--s3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--s3)',
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
                  {it.orden}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--t-13)', fontWeight: 'var(--peso-medio)', color: 'var(--tinta)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {it.descripcion || 'Sin descripción'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-10)', color: 'var(--grafito)', marginTop: '2px', letterSpacing: '.04em' }}>
                    {it.referencia || '—'}
                  </div>
                </div>
                <div style={{ width: '92px', flexShrink: 0 }}>
                  <CampoCantidad
                    valor={it.cantidad ?? ''}
                    estado={sinCantidad(it) ? 'falta' : 'ok'}
                    onChange={(e) => {
                      const digitos = e.target.value.replace(/[^0-9]/g, '');
                      actualizarItem(it.id, { cantidad: digitos === '' ? '' : Number(digitos) });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', borderTop: 'var(--bd) solid var(--linea)', padding: '10px var(--s3) var(--s3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Boton variante="acta" talla="lg" disabled={generando} onClick={generarActa}>
            {generando ? 'Generando acta…' : 'Generar acta · GO.PD.02-F.02'}
          </Boton>
          <Boton variante="secundaria" talla="md" onClick={() => setPantalla('trabajo')}>
            Volver a la captura
          </Boton>
        </div>
      </div>
    );
  }

  if (pantalla === 'exito' && resumenGenerado) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflowY: 'auto',
          padding: 'var(--s6) var(--s4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--s5)',
          background: 'var(--bond)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Sello>Diligenciada</Sello>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--t-h3)', fontWeight: 'var(--peso-bold)', letterSpacing: 'var(--track-h4)', color: 'var(--tinta)' }}>Acta generada</h2>
          <p style={{ fontSize: 'var(--t-cuerpo-2)', lineHeight: 'var(--alto-nota)', color: 'var(--tinta-70)', marginTop: 'var(--s1)' }}>
            {resumenGenerado.items} ítem{resumenGenerado.items === 1 ? '' : 's'} en el formato oficial. Descargada en el dispositivo.
          </p>
        </div>
        <Tarjeta etiqueta="Archivo" franja="sello">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-13)', color: 'var(--tinta)', letterSpacing: 'var(--track-dato)' }}>{resumenGenerado.archivo}</div>
          <ResumenActa doNo={resumenGenerado.doNo} items={resumenGenerado.items} bultos={resumenGenerado.bultos} peso={resumenGenerado.peso} />
        </Tarjeta>
        <Boton variante="secundaria" talla="md" onClick={iniciarNuevaActa}>
          Nueva acta
        </Boton>
      </div>
    );
  }

  const pendientesSistema = items.filter((it) => it.estado === 'analizando' || it.estado === 'en_cola').length;
  const revisarCount = items.filter((it) => it.estado === 'revisar').length;
  const itemsOrdenados = ordenarPorNumero(items);
  const numerosUsados = items.map((it) => it.orden);

  return (
    <div style={{ position: 'fixed', inset: 0, maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--bond)' }}>
      <AppHeader
        titulo="Acta en curso"
        meta={`D.O. ${encabezado.doNo || '—'} · ${items.length} ítem${items.length === 1 ? '' : 's'}`}
        chip={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setMostrarEncabezado(true)}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 'var(--t-10)',
                letterSpacing: 'var(--track-label)',
                textTransform: 'uppercase',
                color: 'var(--boli)',
                background: 'none',
                border: 'var(--bd) solid var(--boli)',
                borderRadius: 'var(--r-chip)',
                padding: '6px 8px',
                cursor: 'pointer',
              }}
            >
              Encabezado
            </button>
            {/* Sincronizado se reduce al punto verde: la palabra no anade nada
                que el color no diga ya, y en moviles estrechos le robaba el
                ancho al titulo del acta. Los pendientes si llevan texto,
                porque el numero es un dato que el icono no puede dar. */}
            <ColaChip
              estado={pendientesSistema ? 'cola' : 'sincronizado'}
              title={pendientesSistema ? `${pendientesSistema} en cola` : 'Sincronizado'}
            >
              {pendientesSistema ? `${pendientesSistema} en cola` : null}
            </ColaChip>
          </div>
        }
      />

      {error && (
        <p style={{ borderBottom: 'var(--bd) solid var(--falta-bd)', background: 'var(--falta-bg)', padding: '8px var(--s4)', fontSize: 'var(--t-14)', color: 'var(--falta)' }}>
          {error}
        </p>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s3)', display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
        <BarraExcepcion cantidad={revisarCount} onRevisar={abrirPrimeraRevision} />
        <ListaItems items={itemsOrdenados} onActualizar={actualizarItem} onAbrir={abrirItem} />
      </div>

      {mostrarEncabezado && (
        <Modal titulo="Encabezado del despacho" onCerrar={() => setMostrarEncabezado(false)}>
          <EncabezadoForm encabezado={encabezado} onCambiar={actualizarEncabezado} />
        </Modal>
      )}

      {mostrarCaptura && (
        <CapturaProducto numerosUsados={numerosUsados} onAgregar={agregarItem} onCancelar={() => setMostrarCaptura(false)} />
      )}

      {itemAbierto && (
        <ItemDetalleModal
          item={itemAbierto}
          onCerrar={cerrarItem}
          onActualizar={actualizarItem}
          onActualizarNumero={actualizarNumero}
          onEliminar={eliminarItem}
          onReintentar={reintentarItem}
        />
      )}

      <div style={{ background: '#fff', borderTop: 'var(--bd) solid var(--linea)', padding: '10px var(--s3) var(--s3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Boton variante="primaria" talla="tap" onClick={() => setMostrarCaptura(true)}>
          Agregar producto
        </Boton>
        <Boton variante="acta" talla="tap" disabled={items.length === 0} onClick={() => setPantalla('cierre')}>
          Generar acta
        </Boton>
      </div>

      <TabBar activa={seccion} onCambiar={(s) => (s === 'inspeccion' ? setSeccion('inspeccion') : irAHistorico())} totalActas={actas.length} />
    </div>
  );
}
