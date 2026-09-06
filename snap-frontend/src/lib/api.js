const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return `data:${blob.type || 'image/jpeg'};base64,${base64}`;
}

async function leerError(res, mensajePorDefecto) {
  const data = await res.json().catch(() => ({}));
  return new Error(data.error || `${mensajePorDefecto} (HTTP ${res.status})`);
}

async function solicitar(path, { method = 'GET', body, mensajePorDefecto } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await leerError(res, mensajePorDefecto);
  if (res.status === 204) return null;
  return res.json();
}

export function crearActa() {
  return solicitar('/actas', { method: 'POST', body: {}, mensajePorDefecto: 'No se pudo crear el acta' });
}

export function obtenerActaEnCurso() {
  return solicitar('/actas/en-curso', { mensajePorDefecto: 'No se pudo consultar el acta en curso' });
}

export function actualizarEncabezado(actaId, cambios) {
  return solicitar(`/actas/${actaId}`, { method: 'PATCH', body: cambios, mensajePorDefecto: 'No se pudo actualizar el encabezado' });
}

export function agregarItem(actaId, { orden }) {
  return solicitar(`/actas/${actaId}/items`, { method: 'POST', body: { orden }, mensajePorDefecto: 'No se pudo agregar el producto' });
}

export async function analizarItem(actaId, itemId, fotosBlobs) {
  const fotos = await Promise.all(fotosBlobs.map(blobToBase64));
  return solicitar(`/actas/${actaId}/items/${itemId}/analizar`, {
    method: 'POST',
    body: { fotos },
    mensajePorDefecto: 'No se pudo analizar el producto',
  });
}

export function actualizarItem(actaId, itemId, cambios) {
  return solicitar(`/actas/${actaId}/items/${itemId}`, { method: 'PATCH', body: cambios, mensajePorDefecto: 'No se pudo actualizar el producto' });
}

export function actualizarNumeroItem(actaId, itemId, orden) {
  return solicitar(`/actas/${actaId}/items/${itemId}/orden`, { method: 'PATCH', body: { orden }, mensajePorDefecto: 'No se pudo actualizar el número de ítem' });
}

export function eliminarItem(actaId, itemId) {
  return solicitar(`/actas/${actaId}/items/${itemId}`, { method: 'DELETE', mensajePorDefecto: 'No se pudo eliminar el producto' });
}

export async function generarActa(actaId) {
  const res = await fetch(`${BASE_URL}/actas/${actaId}/generar`, { method: 'POST' });
  if (!res.ok) throw await leerError(res, 'No se pudo generar el acta');
  return res.blob();
}

export function listarActas({ q, estado } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (estado) params.set('estado', estado);
  const query = params.toString();
  return solicitar(`/actas${query ? `?${query}` : ''}`, { mensajePorDefecto: 'No se pudo listar el histórico' });
}

export function obtenerActaDetalle(actaId) {
  return solicitar(`/actas/${actaId}`, { mensajePorDefecto: 'No se pudo consultar el acta' });
}
