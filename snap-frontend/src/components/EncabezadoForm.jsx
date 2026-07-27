const CAMPOS = [
  { name: 'doNo', label: 'D.O No', type: 'text' },
  { name: 'cliente', label: 'Cliente', type: 'text' },
  { name: 'documentoTransporte', label: 'Documento de transporte', type: 'text' },
  { name: 'deposito', label: 'Depósito', type: 'text' },
  { name: 'ciudad', label: 'Ciudad', type: 'text' },
  { name: 'fecha', label: 'Fecha', type: 'date' },
  { name: 'horaInicio', label: 'Hora inicio', type: 'time' },
  { name: 'horaFin', label: 'Hora finalización', type: 'time' },
  { name: 'bultos', label: 'Bultos', type: 'number' },
  { name: 'peso', label: 'Peso (KG)', type: 'text' },
];

// El acta oficial guarda la hora como texto "2:25AM" (ver plantilla.md), pero
// <input type="time"> nativo solo acepta/devuelve 24h "HH:MM". Convertimos en
// ambos sentidos para poder usar el selector nativo del celular sin romper el
// formato que espera el Excel.
function a24Horas(hora12) {
  const match = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec((hora12 || '').trim());
  if (!match) return '';
  let [, h, m, periodo] = match;
  h = parseInt(h, 10);
  if (periodo.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (periodo.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

function a12Horas(hora24) {
  if (!hora24) return '';
  const [h, m] = hora24.split(':').map(Number);
  const periodo = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')}${periodo}`;
}

export default function EncabezadoForm({ encabezado, onCambiar }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CAMPOS.map((campo) => {
        const esHora = campo.type === 'time';
        return (
          <label key={campo.name} className="col-span-1 flex flex-col text-sm text-slate-600">
            {campo.label}
            <input
              type={campo.type}
              placeholder={campo.placeholder}
              value={esHora ? a24Horas(encabezado[campo.name]) : encabezado[campo.name] ?? ''}
              onChange={(e) => onCambiar(campo.name, esHora ? a12Horas(e.target.value) : e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
        );
      })}
      <label className="col-span-2 flex flex-col text-sm text-slate-600">
        Observaciones
        <textarea
          value={encabezado.observaciones ?? ''}
          onChange={(e) => onCambiar('observaciones', e.target.value)}
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
          rows={2}
        />
      </label>
    </div>
  );
}
