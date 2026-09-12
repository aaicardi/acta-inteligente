export default function Modal({ titulo, onCerrar, children }) {
  return (
    <div
      onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(18,24,27,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#fff',
          borderTop: 'var(--bd-acento) solid var(--tinta)',
          padding: 'var(--s3) var(--s4) var(--s5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s4)' }}>
          <h2 style={{ flex: 1, fontSize: 'var(--t-titulo-app)', fontWeight: 'var(--peso-bold)', letterSpacing: 'var(--track-h4)', color: 'var(--tinta)' }}>
            {titulo}
          </h2>
          {/* Texto explícito, no solo un ícono "✕": un símbolo solo es fácil
              de pasar por alto (reporte real de un usuario sobre AdminPanel,
              que usaba el mismo patrón). */}
          <button
            type="button"
            onClick={onCerrar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--sans)',
              fontSize: 'var(--t-13)',
              fontWeight: 'var(--peso-medio)',
              color: 'var(--tinta)',
              background: 'var(--fondo-tarjeta)',
              border: 'var(--bd) solid var(--linea)',
              borderRadius: 'var(--r-chip)',
              padding: '6px 10px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <span aria-hidden="true">✕</span> Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
