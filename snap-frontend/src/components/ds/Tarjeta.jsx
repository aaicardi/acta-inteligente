const FRANJAS = {
  boli: 'var(--boli)',
  falta: 'var(--falta)',
  copia: 'var(--copia-bd)',
  sello: 'var(--sello)',
};

export default function Tarjeta({ etiqueta, franja, children, style, ...rest }) {
  const c = FRANJAS[franja];
  return (
    <div
      style={{
        background: 'var(--fondo-tarjeta)',
        border: 'var(--bd) solid var(--linea)',
        borderRadius: 'var(--r)',
        padding: 'var(--s4)',
        borderLeft: c ? `var(--bd-marca) solid ${c}` : undefined,
        ...style,
      }}
      {...rest}
    >
      {etiqueta && (
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 'var(--t-11)',
            letterSpacing: 'var(--track-label)',
            textTransform: 'uppercase',
            color: c || 'var(--grafito)',
            marginBottom: 'var(--s3)',
          }}
        >
          {etiqueta}
        </div>
      )}
      {children}
    </div>
  );
}
