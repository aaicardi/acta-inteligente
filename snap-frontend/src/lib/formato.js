export function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatearFechaHora(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
