const PALETAS = {
  primaria: { background: 'var(--boli)', color: '#fff', border: 'none' },
  acta: { background: 'var(--sello)', color: '#fff', border: 'none' },
  secundaria: { background: '#fff', color: 'var(--tinta)', border: 'var(--bd-estado) solid var(--tinta)' },
  excepcion: { background: 'var(--copia-bd)', color: '#fff', border: 'none' },
};

const TALLAS = {
  md: { minHeight: '52px', fontSize: 'var(--t-15)' },
  tap: { minHeight: 'var(--tap)', fontSize: 'var(--t-15)' },
  lg: { minHeight: 'var(--tap-lg)', fontSize: 'var(--t-base)' },
  barra: { minHeight: 'var(--tap-40)', fontSize: 'var(--t-13)' },
};

export default function Boton({
  variante = 'primaria',
  talla = 'md',
  ancho = 'full',
  disabled = false,
  children,
  style,
  ...rest
}) {
  const p = PALETAS[variante] || PALETAS.primaria;
  const t = TALLAS[talla] || TALLAS.md;
  const apagado = disabled ? { background: 'var(--bond-2)', color: '#A9B0AB', border: 'none', cursor: 'not-allowed' } : null;
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        fontFamily: 'var(--sans)',
        fontWeight: 'var(--peso-semi)',
        borderRadius: 'var(--r)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '0 var(--s3)',
        width: ancho === 'full' ? '100%' : 'auto',
        flexShrink: ancho === 'full' ? 1 : 0,
        ...t,
        ...p,
        ...apagado,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
