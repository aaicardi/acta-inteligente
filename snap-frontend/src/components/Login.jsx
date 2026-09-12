import { useState } from 'react';
import { Boton, Campo } from './ds';
import * as api from '../lib/api';

export default function Login({ onEntrar }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!email || !password) {
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
        <div style={{ marginBottom: 'var(--s2)' }}>
          <h1
            style={{
              fontFamily: 'var(--sans)',
              fontWeight: 'var(--peso-semi)',
              fontSize: 'var(--t-22)',
              color: 'var(--tinta)',
              margin: 0,
            }}
          >
            Acta Inteligente
          </h1>
          <p style={{ fontSize: 'var(--t-13)', color: 'var(--grafito)', margin: 'var(--s1) 0 0' }}>
            Ingresa con tu cuenta para continuar.
          </p>
        </div>

        <Campo
          etiqueta="Email"
          type="email"
          mono={false}
          valor={email}
          onChange={setEmail}
          placeholder="nombre@empresa.com"
          disabled={entrando}
        />

        <Campo
          etiqueta="Contraseña"
          type="password"
          mono={false}
          valor={password}
          onChange={setPassword}
          disabled={entrando}
          error={error}
        />

        <Boton type="submit" talla="lg" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </Boton>
      </form>
    </div>
  );
}
