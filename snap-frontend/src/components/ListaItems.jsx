import ItemCard from './ItemCard';

export default function ListaItems({ items, onActualizar, onAbrir }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
        Todavía no hay productos. Toca "Agregar producto" para empezar.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onActualizar={onActualizar} onAbrir={onAbrir} />
      ))}
    </div>
  );
}
