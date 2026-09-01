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
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-h4)', background: 'none', border: 'none', color: 'var(--tinta-70)', cursor: 'pointer', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
