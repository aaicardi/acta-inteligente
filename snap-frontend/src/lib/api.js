const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const CLAVE_SESION = 'acta-inteligente:sesion';

// La sesión vive en localStorage para que el inspector no tenga que volver a
// entrar cada vez que la PWA se reinicia en medio de una jornada.
export function leerSesion() {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

function guardarSesion(sesion) {
  try {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } catch {
    // Modo privado o almacenamiento bloqueado: la sesión dura lo que la pestaña.
  }
}

export function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible.
  }
}

// Se avisa a la app cuando el backend rechaza la sesión, para que vuelva al
// login sin que cada llamada tenga que saber manejarlo.
let alExpirar = () => {};
export function cuandoExpireLaSesion(callback) {
  alExpirar = callback;
}

function cabeceraAuth() {
  const sesion = leerSesion();
  return sesion?.token ? { Authorization: `Bearer ${sesion.token}` } : undefined;
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await leerError(res, 'No se pudo iniciar sesión');
  const sesion = await res.json();
  guardarSesion(sesion);
  return sesion;
}

async function leerError(res, mensajePorDefecto) {
  const data = await res.json().catch(() => ({}));
  return new Error(data.error || `${mensajePorDefecto} (HTTP ${res.status})`);
}

async function solicitar(path, { method = 'GET', body, mensajePorDefecto } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...cabeceraAuth(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    cerrarSesion();
    alExpirar();
    throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
  }
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

// Sube un archivo directo a Cloudinary con una firma ya emitida por el
// backend (ver api.solicitarFirmaSubida): el binario nunca pasa por Render,
// solo la firma. FormData + fetch nativo, sin SDK de Cloudinary en el cliente.
async function subirDirectoACloudinary(archivo, firma) {
  const formData = new FormData();
  formData.append('file', archivo);
  formData.append('api_key', firma.apiKey);
  formData.append('timestamp', firma.timestamp);
  formData.append('signature', firma.signature);
  formData.append('folder', firma.folder);
  formData.append('type', firma.type);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || 'No se pudo subir la foto.');
  return { url: data.secure_url, publicId: data.public_id };
}

// `fotos` llega en dos formas segun el momento: File[] recien capturados (hay
// que subirlos primero) o los objetos {url, publicId} que ya devolvio el
// backend en un intento anterior (reintentarItem) — esos ya estan en
// Cloudinary y no se vuelven a subir.
export async function analizarItem(actaId, itemId, fotos) {
  const yaSubidas = fotos.filter((f) => !(f instanceof Blob));
  const pendientes = fotos.filter((f) => f instanceof Blob);

  let subidas = [];
  if (pendientes.length > 0) {
    const firma = await solicitar(`/actas/${actaId}/items/${itemId}/firma-subida`, {
      method: 'POST',
      mensajePorDefecto: 'No se pudo preparar la subida de fotos',
    });
    subidas = await Promise.all(pendientes.map((archivo) => subirDirectoACloudinary(archivo, firma)));
  }

  return solicitar(`/actas/${actaId}/items/${itemId}/analizar`, {
    method: 'POST',
    body: { fotos: [...yaSubidas, ...subidas] },
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
  const res = await fetch(`${BASE_URL}/actas/${actaId}/generar`, {
    method: 'POST',
    headers: cabeceraAuth(),
  });
  if (res.status === 401) {
    cerrarSesion();
    alExpirar();
    throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
  }
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

const POLL_INTERVALO_MS = 2000;
const POLL_MAX_INTENTOS = 60; // 2min: cubre reintentos de rate limit de la IA

// El analisis corre en segundo plano en el backend (POST /analizar responde
// 202 de inmediato); esto consulta el acta hasta que el item deje de estar
// 'analizando', para que la UI vea el resultado sin bloquear la peticion HTTP
// original en todo el tiempo que tarde la IA.
export async function esperarAnalisis(actaId, itemId) {
  for (let intento = 0; intento < POLL_MAX_INTENTOS; intento += 1) {
    await new Promise((r) => setTimeout(r, POLL_INTERVALO_MS));
    const acta = await obtenerActaDetalle(actaId);
    const item = acta.items.find((it) => it.id === itemId);
    if (!item) return null; // el item se elimino mientras se analizaba
    if (item.estado !== 'analizando') return item;
  }
  throw new Error('El análisis está tardando más de lo esperado. Intenta de nuevo.');
}

// --- Administración (solo rol admin) ---

export function listarUsuarios() {
  return solicitar('/usuarios', { mensajePorDefecto: 'No se pudo listar los usuarios' });
}

export function crearUsuario(datos) {
  return solicitar('/usuarios', { method: 'POST', body: datos, mensajePorDefecto: 'No se pudo crear el usuario' });
}

export function actualizarUsuario(id, cambios) {
  return solicitar(`/usuarios/${id}`, { method: 'PATCH', body: cambios, mensajePorDefecto: 'No se pudo actualizar el usuario' });
}

export function obtenerConsumoIa({ desde } = {}) {
  const query = desde ? `?desde=${encodeURIComponent(desde)}` : '';
  return solicitar(`/empresa/consumo-ia${query}`, { mensajePorDefecto: 'No se pudo consultar el consumo de IA' });
}

export function listarAuditoria({ limite } = {}) {
  const query = limite ? `?limite=${limite}` : '';
  return solicitar(`/empresa/auditoria${query}`, { mensajePorDefecto: 'No se pudo consultar la auditoría' });
}

export function obtenerEstadoPlantilla() {
  return solicitar('/empresa/plantilla', { mensajePorDefecto: 'No se pudo consultar la plantilla' });
}

export async function subirPlantilla(archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const res = await fetch(`${BASE_URL}/empresa/plantilla`, {
    method: 'POST',
    headers: cabeceraAuth(),
    body: formData,
  });
  if (res.status === 401) {
    cerrarSesion();
    alExpirar();
    throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
  }
  if (!res.ok) throw await leerError(res, 'No se pudo subir la plantilla');
  return res.json();
}

export function restaurarPlantilla() {
  return solicitar('/empresa/plantilla', { method: 'DELETE', mensajePorDefecto: 'No se pudo restaurar la plantilla' });
}
