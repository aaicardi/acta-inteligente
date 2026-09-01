export default function Skeleton({ alto = '13px', ancho = '100%', radio = 'var(--r-min)', style, children }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: alto,
        width: ancho,
        borderRadius: radio,
        color: 'transparent',
        background: 'linear-gradient(90deg,var(--bond-2) 25%,#DDE0DB 50%,var(--bond-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'acta-brillo var(--dur-brillo) var(--ease-lineal) infinite',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
