const TABS = [
  { key: 'inspeccion', label: 'Inspección', meta: 'Diligenciar' },
  { key: 'historico', label: 'Actas' },
  { key: 'cuenta', label: 'Cuenta', meta: 'Sesión' },
];

// El admin gestiona la empresa (usuarios, plantilla, consumo, auditoria) pero
// no diligencia actas — eso es trabajo del inspector, y el backend ya lo
// rechaza con 403 si se intenta. Ocultar la pestaña aqui evita ofrecer una
// accion que de todas formas fallaria.
export default function TabBar({ activa, onCambiar, totalActas = 0, ocultarInspeccion = false }) {
  const tabs = ocultarInspeccion ? TABS.filter((t) => t.key !== 'inspeccion') : TABS;
  return (
    <div style={{ flexShrink: 0, background: '#fff', borderTop: 'var(--bd) solid var(--linea)', display: 'flex' }}>
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
              flex: 1,
              minHeight: '60px',
              padding: '10px 12px 12px',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              borderTop: `var(--bd-acento) solid ${on ? 'var(--tinta)' : 'transparent'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
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
