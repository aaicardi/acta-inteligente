export default function ResumenActa({ doNo, items, bultos, peso, sello, style }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--s4)',
        minHeight: 'var(--tap-lg)',
        borderTop: 'var(--bd) solid var(--linea)',
        paddingTop: 'var(--s4)',
        ...style,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'var(--peso-semi)', fontSize: 'var(--t-15)' }}>D.O. {doNo || '—'}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-12)', color: 'var(--grafito)', marginTop: '2px' }}>
          {items} ítems · {bultos || '—'} bultos · {peso || '—'} kg
        </div>
      </div>
      {sello}
    </div>
  );
}
