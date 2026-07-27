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

export async function analizarProducto(fotosBlobs) {
  const fotos = await Promise.all(fotosBlobs.map(blobToBase64));
  const res = await fetch(`${BASE_URL}/analizar-producto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fotos }),
  });
  if (!res.ok) throw await leerError(res, 'No se pudo analizar el producto');
  return res.json();
}

export async function generarActa(encabezado, items) {
  const res = await fetch(`${BASE_URL}/generar-acta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      encabezado,
      items: items.map((it) => ({
        referencia: it.referencia,
        paisOrigen: it.paisOrigen,
        descripcion: it.descripcion,
        marca: it.marca,
        cantidad: it.cantidad,
      })),
    }),
  });
  if (!res.ok) throw await leerError(res, 'No se pudo generar el acta');
  return res.blob();
}

export async function procesarZip(zipFile) {
  const formData = new FormData();
  formData.append('zip', zipFile);
  const res = await fetch(`${BASE_URL}/procesar-zip`, { method: 'POST', body: formData });
  if (!res.ok) throw await leerError(res, 'No se pudo procesar el ZIP');
  return res.json();
}
