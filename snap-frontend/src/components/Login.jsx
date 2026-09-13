import { useState } from 'react';
import { Boton, Campo } from './ds';
import * as api from '../lib/api';
import logoGIIA from '../image/logoGIIA.jpg';

export default function Login({ onEntrar }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [entrando, setEntrando] = useState(false);

  const faltanDatos = !email || !password;

  async function enviar(e) {
    e.preventDefault();
    if (faltanDatos) {
      setError('Ingresa tu email y contraseña.');
      return;
    }
    setError('');
    setEntrando(true);
    try {
      const sesion = await api.login(email, password);
      onEntrar(sesion);
    } catch (err) {
      setError(err.message);
      setEntrando(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--s4)',
        background: 'var(--bond)',
        overflowY: 'auto',
      }}
    >
      <form
        onSubmit={enviar}
        style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--s2)' }}>
          <img src={logoGIIA} alt="GIIA" style={{ width: '100%', maxWidth: '260px', height: 'auto' }} />
        </div>

        <div style={{ marginBottom: 'var(--s2)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--t-15)', color: 'var(--tinta)', margin: 0, lineHeight: 'var(--alto-base)' }}>
            Ingresa con tu cuenta para continuar. El acta se firma con tu usuario.
          </p>
        </div>

        <Campo
          etiqueta="Correo"
          type="email"
          mono={false}
          valor={email}
          onChange={setEmail}
          placeholder="nombre@empresa.com"
          disabled={entrando}
        />

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <label
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 'var(--t-10)',
                letterSpacing: 'var(--track-label)',
                textTransform: 'uppercase',
                color: 'var(--grafito)',
                display: 'block',
                marginBottom: 'var(--s1)',
              }}
            >
              Contraseña
            </label>
            <button
              type="button"
              onClick={() => setMostrarPassword((v) => !v)}
              disabled={entrando}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 'var(--t-10)',
                letterSpacing: 'var(--track-label)',
                textTransform: 'uppercase',
                color: 'var(--boli)',
                background: 'none',
                border: 'none',
                cursor: entrando ? 'not-allowed' : 'pointer',
                padding: 0,
                marginBottom: 'var(--s1)',
              }}
            >
              {mostrarPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <Campo
            type={mostrarPassword ? 'text' : 'password'}
            mono={false}
            valor={password}
            onChange={setPassword}
            disabled={entrando}
            error={error}
          />
        </div>

        <Boton type="submit" talla="lg" disabled={entrando || faltanDatos}>
          {entrando ? 'Entrando…' : faltanDatos ? 'Entrar · faltan datos' : 'Entrar'}
        </Boton>

        {!error && (
          <p style={{ fontSize: 'var(--t-13)', color: 'var(--grafito)', margin: 0, textAlign: 'center' }}>
            {faltanDatos ? 'Escribe tu correo y tu contraseña.' : 'Todo listo para entrar.'}
          </p>
        )}

        <hr style={{ border: 'none', borderTop: 'var(--bd) solid var(--linea)', margin: 'var(--s2) 0 0' }} />

        <div style={{ textAlign: 'center' }}>
          <a href="#" style={{ fontSize: 'var(--t-13)', textDecoration: 'none' }}>
            Olvidé mi contraseña
          </a>
        </div>
      </form>
    </div>
  );
}
