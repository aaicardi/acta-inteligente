export default function AppHeader({ titulo, meta, chip, style }) {
  return (
    <div
      style={{
        background: '#fff',
        borderBottom: 'var(--bd) solid var(--linea)',
        padding: 'var(--s3) var(--s4)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s3)' }}>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: 'var(--t-titulo-app)',
              fontWeight: 'var(--peso-bold)',
              letterSpacing: 'var(--track-h4)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {titulo}
          </h1>
          {meta && (
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 'var(--t-11)',
                color: 'var(--grafito)',
                letterSpacing: 'var(--track-dato)',
                marginTop: '2px',
              }}
            >
              {meta}
            </div>
          )}
        </div>
        {chip}
      </div>
    </div>
  );
}
