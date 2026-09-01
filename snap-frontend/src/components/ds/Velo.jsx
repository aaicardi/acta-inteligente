export default function Velo({ estado = 'cola', etiqueta, style }) {
  const txt = etiqueta || (estado === 'analizando' ? 'Analizando' : 'En cola');
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--vidrio-velo)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        ...style,
      }}
    >
      {estado === 'analizando' ? (
        <span
          style={{
            width: '18px',
            height: '18px',
            border: 'var(--bd-acento) solid var(--boli-bg)',
            borderTopColor: 'var(--boli)',
            borderRadius: 'var(--r-redondo)',
            animation: 'acta-giro var(--dur-giro) var(--ease-lineal) infinite',
          }}
        />
      ) : (
        <span aria-hidden="true" style={{ fontSize: '15px' }}>◌</span>
      )}
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 'var(--t-9)',
          letterSpacing: 'var(--track-label)',
          textTransform: 'uppercase',
          color: 'var(--tinta-70)',
        }}
      >
        {txt}
      </span>
    </div>
  );
}
