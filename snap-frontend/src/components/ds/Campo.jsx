export default function Campo({
  etiqueta,
  valor,
  children,
  heredado = false,
  mono = true,
  hint,
  error,
  vacio = false,
  ancho,
  onChange,
  onBlur,
  type = 'text',
  textarea = false,
  placeholder,
  disabled = false,
  style,
}) {
  const cajaEstilo = {
    border: `var(--bd-estado) solid ${error ? 'var(--falta)' : 'var(--linea)'}`,
    borderRadius: 'var(--r-chip)',
    fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
    fontSize: mono ? '16px' : 'var(--t-15)',
    fontWeight: mono ? 'var(--peso-medio)' : 'var(--peso-normal)',
    background: heredado ? 'var(--fondo-heredado)' : '#fff',
    color: 'var(--tinta)',
    width: '100%',
  };

  return (
    <div style={{ gridColumn: ancho === 'wide' ? '1 / -1' : undefined, ...style }}>
      {etiqueta && (
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
          {etiqueta}
        </label>
      )}

      {onChange ? (
        textarea ? (
          <textarea
            value={valor ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            style={{ ...cajaEstilo, padding: '10px', resize: 'none' }}
          />
        ) : (
          <input
            type={type}
            inputMode={type === 'number' ? 'numeric' : undefined}
            value={valor ?? ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            style={{ ...cajaEstilo, height: '52px', padding: '0 10px' }}
          />
        )
      ) : (
        <div
          style={{
            ...cajaEstilo,
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            color: vacio ? '#B6BCB8' : heredado ? 'var(--tinta-70)' : 'var(--tinta)',
          }}
        >
          {children || valor || (vacio ? '—' : '')}
        </div>
      )}

      {error ? (
        <div style={{ fontSize: 'var(--t-11)', color: 'var(--falta)', marginTop: 'var(--s1)' }}>{error}</div>
      ) : (
        (hint || heredado) && (
          <div style={{ fontSize: 'var(--t-11)', color: 'var(--grafito)', marginTop: 'var(--s1)' }}>
            {hint || '↺ del acta anterior'}
          </div>
        )
      )}
    </div>
  );
}
