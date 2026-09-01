const MASCARA =
  'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'90\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\'/><feColorMatrix type=\'matrix\' values=\'0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 -1.4 1.05\'/></filter><rect width=\'180\' height=\'90\' filter=\'url(%23n)\'/></svg>")';

export default function Sello({ children = 'Diligenciada', animar = true, style }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--mono)',
        fontSize: 'var(--t-13)',
        fontWeight: 'var(--peso-semi)',
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: 'var(--sello)',
        border: 'var(--bd-sello) solid var(--sello)',
        borderRadius: 'var(--r-chip)',
        padding: '7px 13px',
        transform: 'rotate(-4.5deg)',
        opacity: 0.9,
        WebkitMaskImage: MASCARA,
        maskImage: MASCARA,
        WebkitMaskSize: '180px 90px',
        maskSize: '180px 90px',
        animation: animar ? 'acta-sellar var(--dur-sello) var(--ease-sello) both' : 'none',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
