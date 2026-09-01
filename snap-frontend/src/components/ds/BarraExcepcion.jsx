import Boton from './Boton';

export default function BarraExcepcion({ cantidad = 0, onRevisar, style }) {
  if (!cantidad) return null;
  const txt = cantidad === 1 ? '1 ítem necesita revisión' : `${cantidad} ítems necesitan revisión`;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--s3)',
        background: 'var(--copia-bg)',
        border: 'var(--bd) solid var(--copia-bd)',
        borderRadius: 'var(--r)',
        padding: '10px var(--s3)',
        ...style,
      }}
    >
      <div style={{ flex: 1, fontSize: 'var(--t-14)', fontWeight: 'var(--peso-semi)', color: 'var(--copia)', lineHeight: 'var(--alto-titulo)' }}>
        {txt}
      </div>
      <Boton variante="excepcion" talla="barra" ancho="auto" onClick={onRevisar} style={{ borderRadius: 'var(--r-chip)' }}>
        Revisar →
      </Boton>
    </div>
  );
}
