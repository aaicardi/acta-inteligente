import { useRef, useState } from 'react';
import { AppHeader, Boton, Tarjeta, EstadoBadge, Campo } from './ds';
import { useUsuarios, useConsumoIa, useAuditoria, usePlantilla } from '../hooks/useAdmin';

const TABS = [
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'consumo', label: 'Consumo IA' },
  { id: 'plantilla', label: 'Plantilla' },
  { id: 'auditoria', label: 'Auditoría' },
];

function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SeccionUsuarios() {
  const { usuarios, cargando, error, crear, actualizar } = useUsuarios();
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('inspector');
  const [errorAlta, setErrorAlta] = useState('');

  async function crearUsuario() {
    setErrorAlta('');
    try {
      await crear.mutateAsync({ email, password, nombre, rol });
      setEmail('');
      setPassword('');
      setNombre('');
      setRol('inspector');
      setMostrarAlta(false);
    } catch (err) {
      setErrorAlta(err.message);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
      {error && <p style={{ color: 'var(--falta)', fontSize: 'var(--t-14)' }}>{error}</p>}

      {!mostrarAlta && (
        <Boton variante="secundaria" talla="md" onClick={() => setMostrarAlta(true)}>
          + Nuevo usuario
        </Boton>
      )}

      {mostrarAlta && (
        <Tarjeta etiqueta="Nuevo usuario">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
            <Campo etiqueta="Nombre" mono={false} valor={nombre} onChange={setNombre} />
            <Campo etiqueta="Email" type="email" mono={false} valor={email} onChange={setEmail} />
            <Campo etiqueta="Contraseña" type="password" mono={false} valor={password} onChange={setPassword} />
            <div>
              <label style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-10)', letterSpacing: 'var(--track-label)', textTransform: 'uppercase', color: 'var(--grafito)', display: 'block', marginBottom: 'var(--s1)' }}>
                Rol
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                style={{ width: '100%', height: '44px', borderRadius: 'var(--r-chip)', border: 'var(--bd-estado) solid var(--linea)', fontSize: 'var(--t-15)', padding: '0 10px' }}
              >
                <option value="inspector">Inspector</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {errorAlta && <p style={{ color: 'var(--falta)', fontSize: 'var(--t-13)' }}>{errorAlta}</p>}
            <div style={{ display: 'flex', gap: 'var(--s2)' }}>
              <Boton variante="primaria" talla="md" disabled={crear.isPending} onClick={crearUsuario}>
                {crear.isPending ? 'Creando…' : 'Crear'}
              </Boton>
              <Boton variante="secundaria" talla="md" onClick={() => setMostrarAlta(false)}>
                Cancelar
              </Boton>
            </div>
          </div>
        </Tarjeta>
      )}

      {cargando ? (
        <p style={{ color: 'var(--grafito)', fontSize: 'var(--t-14)' }}>Cargando…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
          {usuarios.map((u) => (
            <Tarjeta key={u.id} style={{ padding: 'var(--s3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--t-15)', fontWeight: 'var(--peso-semi)', color: 'var(--tinta)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.nombre || u.email}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-11)', color: 'var(--grafito)', marginTop: '3px' }}>{u.email}</div>
                </div>
                <select
                  value={u.rol}
                  onChange={(e) => actualizar.mutate({ id: u.id, cambios: { rol: e.target.value } })}
                  style={{ height: '36px', borderRadius: 'var(--r-chip)', border: 'var(--bd) solid var(--linea)', fontSize: 'var(--t-13)' }}
                >
                  <option value="inspector">Inspector</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={u.estado}
                  onChange={(e) => actualizar.mutate({ id: u.id, cambios: { estado: e.target.value } })}
                  style={{ height: '36px', borderRadius: 'var(--r-chip)', border: 'var(--bd) solid var(--linea)', fontSize: 'var(--t-13)' }}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}
    </div>
  );
}

function SeccionConsumo() {
  const { data, isLoading, error } = useConsumoIa();

  if (isLoading) return <p style={{ color: 'var(--grafito)', fontSize: 'var(--t-14)' }}>Cargando…</p>;
  if (error) return <p style={{ color: 'var(--falta)', fontSize: 'var(--t-14)' }}>{error.message}</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
      <p style={{ fontSize: 'var(--t-13)', color: 'var(--tinta-70)', lineHeight: 'var(--alto-nota)' }}>
        Consumo de IA de toda la historia de la empresa. Todavía no hay límites configurados: esto es solo informativo.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s2)' }}>
        <Tarjeta etiqueta="Análisis realizados">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-h3)', fontWeight: 'var(--peso-bold)', color: 'var(--tinta)' }}>{data.llamadas}</div>
        </Tarjeta>
        <Tarjeta etiqueta="Fallos">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-h3)', fontWeight: 'var(--peso-bold)', color: data.fallos > 0 ? 'var(--falta)' : 'var(--tinta)' }}>{data.fallos}</div>
        </Tarjeta>
        <Tarjeta etiqueta="Tokens de entrada">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-h4)', fontWeight: 'var(--peso-semi)', color: 'var(--tinta)' }}>{data.tokensIn.toLocaleString('es-CO')}</div>
        </Tarjeta>
        <Tarjeta etiqueta="Tokens de salida">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-h4)', fontWeight: 'var(--peso-semi)', color: 'var(--tinta)' }}>{data.tokensOut.toLocaleString('es-CO')}</div>
        </Tarjeta>
      </div>
    </div>
  );
}

function SeccionPlantilla() {
  const { personalizada, cargando, subir, restaurar } = usePlantilla();
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function manejarArchivo(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setError('');
    try {
      await subir.mutateAsync(archivo);
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarRestaurar() {
    setError('');
    try {
      await restaurar.mutateAsync();
    } catch (err) {
      setError(err.message);
    }
  }

  if (cargando) return <p style={{ color: 'var(--grafito)', fontSize: 'var(--t-14)' }}>Cargando…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
      <Tarjeta etiqueta="Plantilla activa">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
          <EstadoBadge estado={personalizada ? 'listo' : 'neutro'} punto={false}>
            {personalizada ? 'Personalizada' : 'Plantilla por defecto'}
          </EstadoBadge>
        </div>
        <p style={{ fontSize: 'var(--t-13)', color: 'var(--tinta-70)', lineHeight: 'var(--alto-nota)', marginTop: 'var(--s2)' }}>
          El archivo debe conservar exactamente la misma estructura de filas que la plantilla original (encabezado,
          tabla de ítems y pie de página) — solo puede cambiar textos fijos, logo y colores.
        </p>
      </Tarjeta>

      {error && <p style={{ color: 'var(--falta)', fontSize: 'var(--t-13)' }}>{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        style={{ display: 'none' }}
        onChange={manejarArchivo}
      />
      <Boton variante="primaria" talla="md" disabled={subir.isPending} onClick={() => inputRef.current?.click()}>
        {subir.isPending ? 'Subiendo…' : 'Subir plantilla (.xlsx)'}
      </Boton>
      {personalizada && (
        <Boton variante="secundaria" talla="md" disabled={restaurar.isPending} onClick={manejarRestaurar}>
          {restaurar.isPending ? 'Restaurando…' : 'Volver a la plantilla por defecto'}
        </Boton>
      )}
    </div>
  );
}

function SeccionAuditoria() {
  const { data: eventos = [], isLoading, error } = useAuditoria();

  if (isLoading) return <p style={{ color: 'var(--grafito)', fontSize: 'var(--t-14)' }}>Cargando…</p>;
  if (error) return <p style={{ color: 'var(--falta)', fontSize: 'var(--t-14)' }}>{error.message}</p>;
  if (eventos.length === 0) return <p style={{ color: 'var(--grafito)', fontSize: 'var(--t-14)' }}>Sin eventos todavía.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {eventos.map((ev) => (
        <div key={ev.id} style={{ background: '#fff', border: 'var(--bd) solid var(--linea)', borderRadius: 'var(--r)', padding: '8px var(--s3)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-11)', fontWeight: 'var(--peso-semi)', color: 'var(--tinta)' }}>
            {ev.accion} · {ev.recursoTipo} #{ev.recursoId}
          </div>
          <div style={{ fontSize: 'var(--t-11)', color: 'var(--grafito)', marginTop: '2px' }}>{formatearFecha(ev.creadoEn)}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel({ onCerrar }) {
  const [tab, setTab] = useState('usuarios');

  return (
    <div style={{ position: 'fixed', inset: 0, maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--bond)', zIndex: 40 }}>
      <AppHeader
        titulo="Administración"
        chip={
          // Texto explícito, no solo un ícono "✕": es la única salida de una
          // pantalla que cubre toda la app, y un símbolo solo se perdía entre
          // el resto de elementos del header (reporte real de un usuario).
          <button
            type="button"
            onClick={onCerrar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--sans)',
              fontSize: 'var(--t-13)',
              fontWeight: 'var(--peso-medio)',
              color: 'var(--tinta)',
              background: 'var(--fondo-tarjeta)',
              border: 'var(--bd) solid var(--linea)',
              borderRadius: 'var(--r-chip)',
              padding: '6px 10px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <span aria-hidden="true">←</span> Volver
          </button>
        }
      />

      <div style={{ flexShrink: 0, display: 'flex', overflowX: 'auto', borderBottom: 'var(--bd) solid var(--linea)', background: '#fff' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              flexShrink: 0,
              padding: '10px var(--s3)',
              fontSize: 'var(--t-13)',
              fontWeight: tab === t.id ? 'var(--peso-semi)' : 'var(--peso-medio)',
              color: tab === t.id ? 'var(--boli)' : 'var(--grafito)',
              borderBottom: tab === t.id ? '2px solid var(--boli)' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s4)' }}>
        {tab === 'usuarios' && <SeccionUsuarios />}
        {tab === 'consumo' && <SeccionConsumo />}
        {tab === 'plantilla' && <SeccionPlantilla />}
        {tab === 'auditoria' && <SeccionAuditoria />}
      </div>
    </div>
  );
}
