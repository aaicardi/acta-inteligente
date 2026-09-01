export default function CampoCantidad({ valor = '', unidad = 'UN', estado = 'neutro', disabled = false, onChange, style }) {
  const bordes = { neutro: 'var(--linea)', falta: 'var(--falta-bd)', ok: 'var(--sello-bd)' };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: 'var(--s2)',
        border: `var(--bd-estado) solid ${bordes[estado] || bordes.neutro}`,
        borderRadius: 'var(--r-chip)',
        height: 'var(--tap-min)',
        padding: '0 8px',
        background: estado === 'falta' ? 'var(--falta-bg)' : '#fff',
        opacity: disabled ? 0.4 : 1,
        ...style,
      }}
    >
      <input
        value={valor}
        disabled={disabled}
        onChange={onChange}
        placeholder="—"
        aria-label="Cantidad"
        inputMode="numeric"
        style={{
          border: 'none',
          outline: 'none',
          fontFamily: 'var(--mono)',
          fontSize: 'var(--t-base)',
          fontWeight: 'var(--peso-semi)',
          width: '100%',
          background: 'transparent',
          color: 'var(--tinta)',
        }}
      />
      <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-10)', color: 'var(--grafito)', letterSpacing: 'var(--track-dato)' }}>
        {unidad}
      </span>
    </div>
  );
}
