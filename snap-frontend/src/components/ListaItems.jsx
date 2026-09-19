import ItemCard from './ItemCard';

export default function ListaItems({ items, onActualizar, onAbrir }) {
  if (items.length === 0) {
    return (
      <p
        style={{
          border: 'var(--bd-estado) dashed var(--linea)',
          borderRadius: 'var(--r)',
          padding: 'var(--s6) var(--s4)',
          textAlign: 'center',
          fontSize: 'var(--t-14)',
          color: 'var(--grafito)',
        }}
      >
        Todavía no hay productos. Toca "Agregar producto" para empezar.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: '10px' }}>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onActualizar={onActualizar} onAbrir={onAbrir} />
      ))}
    </div>
  );
}
