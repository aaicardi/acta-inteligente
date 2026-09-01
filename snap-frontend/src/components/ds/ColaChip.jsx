export default function ColaChip({ estado = 'cola', children, style }) {
  const sinc = estado === 'sincronizado';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'var(--mono)',
        fontSize: 'var(--t-11)',
        letterSpacing: 'var(--track-dato)',
        background: '#fff',
        border: `var(--bd) solid ${sinc ? 'var(--sello-bd)' : 'var(--linea)'}`,
        color: sinc ? 'var(--sello)' : 'var(--tinta-70)',
        padding: '5px 9px',
        borderRadius: 'var(--r-chip)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {estado === 'analizando' && (
        <span
          style={{
            width: '12px',
            height: '12px',
            border: '1.5px solid var(--boli-bg)',
            borderTopColor: 'var(--boli)',
            borderRadius: 'var(--r-redondo)',
            animation: 'acta-giro var(--dur-giro) var(--ease-lineal) infinite',
            flexShrink: 0,
          }}
        />
      )}
      {estado === 'cola' && <span aria-hidden="true">◌</span>}
      {sinc && <span aria-hidden="true">●</span>}
      {children}
    </span>
  );
}
