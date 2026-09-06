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
        {/* flex:1 + minWidth:0 dejan que el bloque de texto reclame el ancho
            sobrante y, aun asi, pueda encogerse por debajo de su contenido:
            sin minWidth:0 un hijo flex nunca baja de su tamano intrinseco y el
            ellipsis no llega a aplicarse. */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
                // El meta es una linea de datos ("D.O. 123 · 4 items"): partirlo
                // en dos descuadra la cabecera en moviles estrechos.
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
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
