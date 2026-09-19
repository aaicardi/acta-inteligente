const TABS = [
  { key: 'inspeccion', label: 'Inspección', meta: 'Diligenciar' },
  { key: 'historico', label: 'Actas' },
  { key: 'cuenta', label: 'Cuenta', meta: 'Sesión' },
];

// El admin gestiona la empresa (usuarios, plantilla, consumo, auditoria) pero
// no diligencia actas — eso es trabajo del inspector, y el backend ya lo
// rechaza con 403 si se intenta. Ocultar la pestaña aqui evita ofrecer una
// accion que de todas formas fallaria.
//
// `orientacion` la decide AppShell según el breakpoint: "horizontal" (barra
// inferior, patrón móvil) u "vertical" (sidebar de desktop, ≥1024px).
export default function TabBar({ activa, onCambiar, totalActas = 0, ocultarInspeccion = false, orientacion = 'horizontal' }) {
  const tabs = ocultarInspeccion ? TABS.filter((t) => t.key !== 'inspeccion') : TABS;
  const vertical = orientacion === 'vertical';

  return (
    <div
      style={{
        flexShrink: 0,
        background: '#fff',
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        borderTop: vertical ? 'none' : 'var(--bd) solid var(--linea)',
        borderRight: vertical ? 'var(--bd) solid var(--linea)' : 'none',
        width: vertical ? '220px' : 'auto',
        height: vertical ? '100%' : 'auto',
        padding: vertical ? 'var(--s4) var(--s2)' : 0,
        gap: vertical ? '4px' : 0,
      }}
    >
      {tabs.map((t) => {
        // "cuenta" abre un modal, no una pestaña con estado propio: nunca
        // queda marcada como activa (activa solo vale 'inspeccion' o
        // 'historico' en App.jsx).
        const on = activa === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onCambiar(t.key)}
            style={{
              flex: vertical ? 'none' : 1,
              minHeight: vertical ? '48px' : '60px',
              padding: vertical ? '0 var(--s3)' : '10px 12px 12px',
              cursor: 'pointer',
              background: vertical && on ? 'var(--fondo-hundido)' : 'none',
              border: 'none',
              borderTop: !vertical ? `var(--bd-acento) solid ${on ? 'var(--tinta)' : 'transparent'}` : 'none',
              borderLeft: vertical ? `var(--bd-acento) solid ${on ? 'var(--tinta)' : 'transparent'}` : 'none',
              borderRadius: vertical ? 'var(--r)' : 0,
              display: 'flex',
              flexDirection: vertical ? 'row' : 'column',
              alignItems: vertical ? 'baseline' : 'center',
              justifyContent: vertical ? 'flex-start' : 'center',
              gap: vertical ? '8px' : '2px',
              textAlign: vertical ? 'left' : 'center',
            }}
          >
            <span style={{ fontSize: 'var(--t-15)', fontWeight: on ? 'var(--peso-bold)' : 'var(--peso-medio)', color: on ? 'var(--tinta)' : 'var(--grafito)' }}>
              {t.label}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-9)', letterSpacing: 'var(--track-label)', textTransform: 'uppercase', color: 'var(--grafito)' }}>
              {t.key === 'historico' ? `${totalActas} guardadas` : t.meta}
            </span>
          </button>
        );
      })}
    </div>
  );
}
