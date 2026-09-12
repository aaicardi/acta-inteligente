import { useCallback, useEffect, useState } from 'react';
import EncabezadoForm from './components/EncabezadoForm';
import ListaItems from './components/ListaItems';
import CapturaProducto from './components/CapturaProducto';
import ItemDetalleModal from './components/ItemDetalleModal';
import Modal from './components/Modal';
import Historico from './components/Historico';
import HistoricoDetalle from './components/HistoricoDetalle';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import ModalCuenta from './components/ModalCuenta';
import { AppHeader, ColaChip, BarraExcepcion, Boton, Tarjeta, ResumenActa, Sello, CampoCantidad, TabBar } from './components/ds';
import * as api from './lib/api';
import { useActaEnCurso } from './hooks/useActaEnCurso';
import { useHistorico, useActaDetalle } from './hooks/useHistorico';

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

export default function App() {
  const [sesion, setSesion] = useState(() => api.leerSesion());
  const [seccion, setSeccion] = useState('inspeccion');
  const [pantalla, setPantalla] = useState('cargando');
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const [mostrarEncabezado, setMostrarEncabezado] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');
  const [itemAbiertoId, setItemAbiertoId] = useState(null);
  const [resumenGenerado, setResumenGenerado] = useState(null);
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const [mostrarCuenta, setMostrarCuenta] = useState(false);

  const [vistaHistorico, setVistaHistorico] = useState('lista');
  const [actaDetalleId, setActaDetalleId] = useState(null);
  const [descargandoDetalle, setDescargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');

  const esAdmin = sesion?.usuario?.rol === 'admin';

  // El admin no diligencia actas (el backend ya rechaza con 403 crear/editar):
  // no tiene sentido ni siquiera consultar el acta en curso para ese rol.
  const {
    acta,
    cargando: cargandoActa,
    crearActa,
    actualizarEncabezado,
    agregarItem: agregarItemMutation,
    actualizarItem,
    actualizarNumero,
    eliminarItem: eliminarItemMutation,
    reintentarItem,
    reintentarEnCola,
    generar,
    abrirActaExistente,
  } = useActaEnCurso(!!sesion && !esAdmin);

  const historico = useHistorico(!!sesion);
  const {
    data: actaDetalle,
    isLoading: cargandoDetalle,
    error: errorDetalleQuery,
  } = useActaDetalle(vistaHistorico === 'detalle' ? actaDetalleId : null);

  const encabezado = acta;
  const items = acta?.items || [];

  // Si el backend rechaza la sesión (expirada o revocada), la app vuelve al
  // login sin que cada llamada tenga que gestionarlo por su cuenta.
  useEffect(() => {
    api.cuandoExpireLaSesion(() => setSesion(null));
  }, []);

  // Una vez que se resuelve si hay acta en curso, decide la pantalla inicial.
  // El admin nunca pasa por "inspección": entra directo al histórico, que es
  // lo único que le compete ver de las actas.
  useEffect(() => {
    if (!sesion) return;
    if (esAdmin) {
      setSeccion('historico');
      return;
    }
    if (cargandoActa) return;
    setPantalla(acta ? 'trabajo' : 'inicio');
    // Solo debe correr cuando termina la carga inicial, no en cada cambio de
    // `acta` (que ocurre todo el tiempo mientras se trabaja en ella).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion, esAdmin, cargandoActa]);

  // Al recuperar señal, reintenta solos todos los ítems "en_cola".
  useEffect(() => {
    window.addEventListener('online', reintentarEnCola);
    return () => window.removeEventListener('online', reintentarEnCola);
  }, [reintentarEnCola]);

  const iniciarNuevaActa = useCallback(async () => {
    setError('');
    try {
      await crearActa();
      setResumenGenerado(null);
      setPantalla('trabajo');
      setMostrarEncabezado(true);
    } catch (err) {
      setError(err.message);
    }
  }, [crearActa]);

  // Tras generar un acta ya no queda "acta en curso" (se limpió en
  // useActaEnCurso.generar): distinto de "Nueva acta", que crea una de una
  // vez, esto solo lleva a la pantalla de inicio sin diligenciar nada más.
  const irAlInicio = useCallback(() => {
    setResumenGenerado(null);
    setPantalla('inicio');
  }, []);

  const agregarItem = useCallback(
    async (datos) => {
      setMostrarCaptura(false);
      await agregarItemMutation(datos);
    },
    [agregarItemMutation]
  );

  const eliminarItem = useCallback(
    async (id) => {
      try {
        await eliminarItemMutation(id);
      } catch (err) {
        setError(err.message);
      }
    },
    [eliminarItemMutation]
  );

  const abrirItem = useCallback((id) => setItemAbiertoId(id), []);
  const cerrarItem = useCallback(() => setItemAbiertoId(null), []);
  const itemAbierto = items.find((it) => it.id === itemAbiertoId) || null;

  const abrirPrimeraRevision = useCallback(() => {
    const primero = ordenarPorNumero(items).find((it) => it.estado === 'revisar');
    if (primero) abrirItem(primero.id);
  }, [items, abrirItem]);

  function descargar(blob, nombreArchivo) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // La cantidad es opcional siempre: nunca bloquea "Generar acta". La
  // pantalla de cierre solo la resalta para que el inspector la revise antes
  // de firmar.
  const generarActaYCerrar = useCallback(async () => {
    setError('');
    setGenerando(true);
    try {
      const { blob, resumen } = await generar();
      descargar(blob, resumen.archivo);
      setResumenGenerado(resumen);
      setPantalla('exito');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  }, [generar]);

  const irAHistorico = useCallback(() => {
    setSeccion('historico');
    setVistaHistorico('lista');
  }, []);

  // "cuenta" no es una sección con su propia pantalla (a diferencia de
  // inspeccion/historico): abre un modal encima de lo que se esté viendo, así
  // que el TabBar siempre da acceso a sesión/admin sin importar en qué
  // pantalla del flujo esté el inspector.
  const manejarCambioTab = useCallback(
    (tab) => {
      if (tab === 'inspeccion' && !esAdmin) setSeccion('inspeccion');
      else if (tab === 'historico') irAHistorico();
      else if (tab === 'cuenta') setMostrarCuenta(true);
    },
    [irAHistorico, esAdmin]
  );

  const cerrarSesion = useCallback(() => {
    api.cerrarSesion();
    setSesion(null);
  }, []);

  const abrirActaHistorico = useCallback((id) => {
    setVistaHistorico('detalle');
    setActaDetalleId(id);
  }, []);

  // Un acta "en_curso" todavía se está diligenciando: abrirla debe llevar al
  // inspector de vuelta al flujo normal de captura/edición, no a la vista de
  // solo lectura (esa es exclusiva de actas ya "generada"). Reacciona al
  // resultado del propio useActaDetalle en vez de hacer un fetch aparte, para
  // no pedir el mismo detalle dos veces. El admin nunca entra a ese flujo (no
  // diligencia actas): se queda viendo el detalle en solo lectura tal cual.
  useEffect(() => {
    if (esAdmin) return;
    if (actaDetalle?.estado === 'en_curso') {
      abrirActaExistente(actaDetalle);
      setSeccion('inspeccion');
      setPantalla('trabajo');
    }
  }, [actaDetalle, abrirActaExistente, esAdmin]);

  const descargarDesdeHistorico = useCallback(async () => {
    if (!actaDetalle) return;
    setDescargandoDetalle(true);
    setErrorDetalle('');
    try {
      const blob = await api.generarActa(actaDetalle.id);
      descargar(blob, `acta_${actaDetalle.doNo || 'sin_do'}.xlsx`);
    } catch (err) {
      setErrorDetalle(err.message);
    } finally {
      setDescargandoDetalle(false);
    }
  }, [actaDetalle]);

  if (!sesion) {
    return <Login onEntrar={setSesion} />;
  }

  let contenido;

  if (pantalla === 'cargando' && seccion === 'inspeccion') {
    contenido = (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 'var(--t-13)', color: 'var(--grafito)' }}>
        Cargando…
      </div>
    );
  } else if (seccion === 'historico') {
    const tabBar = <TabBar activa={seccion} onCambiar={manejarCambioTab} totalActas={historico.actas.length} ocultarInspeccion={esAdmin} />;
    contenido = vistaHistorico === 'lista' ? (
      <Historico
        actas={historico.actas}
        cargando={historico.cargando}
        error={historico.error}
        busqueda={historico.busqueda}
        onBusqueda={historico.onBusqueda}
        onAbrir={abrirActaHistorico}
        tabBar={tabBar}
      />
    ) : (
      <HistoricoDetalle
        acta={actaDetalle}
        cargando={cargandoDetalle}
        error={errorDetalle || errorDetalleQuery?.message || ''}
        descargando={descargandoDetalle}
        onVolver={() => setVistaHistorico('lista')}
        onDescargar={descargarDesdeHistorico}
        tabBar={tabBar}
      />
    );
  } else if (pantalla === 'inicio') {
    contenido = (
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
        <TabBar activa={seccion} onCambiar={manejarCambioTab} totalActas={historico.actas.length} ocultarInspeccion={esAdmin} />
      </div>
    );
  } else if (pantalla === 'cierre') {
    const pendientesSistema = items.filter((it) => it.estado === 'analizando' || it.estado === 'en_cola').length;
    const itemsCierre = ordenarPorNumero(items.filter((it) => it.estado !== 'analizando' && it.estado !== 'en_cola'));
    const faltantes = itemsCierre.filter(sinCantidad).length;
    contenido = (
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
          <Boton variante="acta" talla="lg" disabled={generando} onClick={generarActaYCerrar}>
            {generando ? 'Generando acta…' : 'Generar acta · GO.PD.02-F.02'}
          </Boton>
          <Boton variante="secundaria" talla="md" onClick={() => setPantalla('trabajo')}>
            Volver a la captura
          </Boton>
        </div>
      </div>
    );
  } else if (pantalla === 'exito' && resumenGenerado) {
    contenido = (
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
        <Boton variante="primaria" talla="md" onClick={iniciarNuevaActa}>
          Nueva acta
        </Boton>
        <Boton variante="secundaria" talla="md" onClick={irAlInicio}>
          Ir al inicio
        </Boton>
      </div>
    );
  } else {
    const pendientesSistema = items.filter((it) => it.estado === 'analizando' || it.estado === 'en_cola').length;
    const revisarCount = items.filter((it) => it.estado === 'revisar').length;
    const itemsOrdenados = ordenarPorNumero(items);
    const numerosUsados = items.map((it) => it.orden);

    contenido = (
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

      <TabBar activa={seccion} onCambiar={manejarCambioTab} totalActas={historico.actas.length} ocultarInspeccion={esAdmin} />
    </div>
    );
  }

  return (
    <>
      {contenido}
      {mostrarCuenta && (
        <ModalCuenta
          sesion={sesion}
          onCerrar={() => setMostrarCuenta(false)}
          onCerrarSesion={cerrarSesion}
          onAbrirAdmin={() => setMostrarAdmin(true)}
        />
      )}
      {mostrarAdmin && <AdminPanel onCerrar={() => setMostrarAdmin(false)} />}
    </>
  );
}
