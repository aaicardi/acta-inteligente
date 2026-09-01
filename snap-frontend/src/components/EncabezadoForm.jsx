import { Campo } from './ds';

const CAMPOS = [
  { name: 'doNo', label: 'D.O No', type: 'text', mono: true },
  { name: 'cliente', label: 'Cliente', type: 'text', mono: false },
  { name: 'documentoTransporte', label: 'Documento de transporte', type: 'text', mono: true },
  { name: 'deposito', label: 'Depósito', type: 'text', mono: false },
  { name: 'ciudad', label: 'Ciudad', type: 'text', mono: false },
  { name: 'fecha', label: 'Fecha', type: 'date', mono: true },
  { name: 'horaInicio', label: 'Hora inicio', type: 'time', mono: true },
  { name: 'horaFin', label: 'Hora finalización', type: 'time', mono: true },
  { name: 'bultos', label: 'Bultos', type: 'number', mono: true },
  { name: 'peso', label: 'Peso (KG)', type: 'text', mono: true },
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {CAMPOS.map((campo) => {
        const esHora = campo.type === 'time';
        return (
          <Campo
            key={campo.name}
            etiqueta={campo.label}
            type={campo.type}
            mono={campo.mono}
            valor={esHora ? a24Horas(encabezado[campo.name]) : (encabezado[campo.name] ?? '')}
            onChange={(v) => onCambiar(campo.name, esHora ? a12Horas(v) : v)}
          />
        );
      })}
      <Campo
        etiqueta="Observaciones"
        ancho="wide"
        mono={false}
        textarea
        placeholder="Opcional"
        valor={encabezado.observaciones ?? ''}
        onChange={(v) => onCambiar('observaciones', v)}
      />
    </div>
  );
}
