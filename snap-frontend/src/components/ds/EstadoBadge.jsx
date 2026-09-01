const MAPA = {
  listo: { t: 'Listo', bg: 'var(--sello-bg)', c: 'var(--sello)', bd: 'var(--sello-bd)' },
  revisar: { t: 'Revisar', bg: 'var(--copia-bg)', c: 'var(--copia)', bd: 'var(--copia-bd)' },
  falta: { t: 'Falta cantidad', bg: 'var(--falta-bg)', c: 'var(--falta)', bd: 'var(--falta-bd)' },
  neutro: { t: 'En cola', bg: '#fff', c: 'var(--tinta-70)', bd: 'var(--linea)' },
};

export default function EstadoBadge({ estado = 'listo', children, punto = true, style }) {
  const e = MAPA[estado] || MAPA.listo;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontFamily: 'var(--mono)',
        fontSize: 'var(--t-10)',
        fontWeight: 'var(--peso-semi)',
        letterSpacing: 'var(--track-badge)',
        textTransform: 'uppercase',
        padding: '4px 7px',
        borderRadius: 'var(--r-chip)',
        whiteSpace: 'nowrap',
        background: e.bg,
        color: e.c,
        border: `var(--bd) solid ${e.bd}`,
        ...style,
      }}
    >
      {punto && (
        <span
          style={{ width: '6px', height: '6px', borderRadius: 'var(--r-redondo)', background: 'currentColor', flexShrink: 0 }}
        />
      )}
      {children || e.t}
    </span>
  );
}
