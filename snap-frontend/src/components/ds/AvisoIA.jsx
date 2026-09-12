import { useEffect, useState } from 'react';

const CLAVE_STORAGE = 'acta-aviso-ia-cerrado';

// Se cierra una sola vez por acta: la clave de localStorage se guarda por
// doNo (el identificador natural del despacho) para que un acta nueva vuelva
// a mostrar el aviso aunque el inspector ya haya cerrado el de una anterior.
function yaFueCerrado(claveActa) {
  try {
    return window.localStorage.getItem(CLAVE_STORAGE) === claveActa;
  } catch {
    return false;
  }
}

function marcarCerrado(claveActa) {
  try {
    window.localStorage.setItem(CLAVE_STORAGE, claveActa);
  } catch {
    // Sin localStorage (modo privado, cuota llena) el aviso simplemente
    // vuelve a aparecer en la próxima carga: no es un error a propagar.
  }
}

export default function AvisoIA({ claveActa, style }) {
  const [cerrado, setCerrado] = useState(() => yaFueCerrado(claveActa));

  useEffect(() => {
    setCerrado(yaFueCerrado(claveActa));
  }, [claveActa]);

  if (cerrado) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--s3)',
        borderLeft: 'var(--bd-marca) solid var(--boli)',
        background: 'var(--boli-bg)',
        padding: '10px var(--s3)',
        ...style,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 'var(--t-10)',
            letterSpacing: 'var(--track-label)',
            textTransform: 'uppercase',
            color: 'var(--boli)',
            marginBottom: '4px',
          }}
        >
          Lectura asistida por IA
        </div>
        <p style={{ fontSize: 'var(--t-13)', lineHeight: 'var(--alto-nota)', color: 'var(--tinta-70)' }}>
          La referencia, la marca y el país los lee una herramienta de IA a partir de tus fotos. Puede cometer
          errores: la cantidad la escribes tú y todo dato queda a tu revisión antes de generar el acta.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          marcarCerrado(claveActa);
          setCerrado(true);
        }}
        aria-label="Cerrar aviso"
        style={{
          flexShrink: 0,
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          color: 'var(--grafito)',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
