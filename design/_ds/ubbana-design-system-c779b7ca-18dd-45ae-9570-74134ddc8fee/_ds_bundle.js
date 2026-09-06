/* @ds-bundle: {"format":4,"namespace":"UbbanaDesignSystem_c779b7","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconTile","sourcePath":"components/core/IconTile.jsx"},{"name":"StatusOrb","sourcePath":"components/core/StatusOrb.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"9860b018425c","components/core/Badge.jsx":"d3245d13ccc7","components/core/Button.jsx":"b9d5abc1814a","components/core/Card.jsx":"d3a89d9e1c51","components/core/IconTile.jsx":"87bb7b8d914b","components/core/StatusOrb.jsx":"285fb39eff33","ui_kits/kiosk/KioskStage.jsx":"d27883417ffc"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.UbbanaDesignSystem_c779b7 = window.UbbanaDesignSystem_c779b7 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function Avatar({
  initials,
  size = 130,
  ringing
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size
    }
  }, ringing && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      border: '2px solid rgba(76,175,125,.5)',
      animation: 'pulseRing 1.8s ease-out infinite'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      border: '2px solid rgba(76,175,125,.5)',
      animation: 'pulseRing 1.8s ease-out infinite',
      animationDelay: '.7s'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'var(--color-neutral-avatar)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: size * 0.24,
      fontWeight: 'var(--weight-semibold)',
      color: '#fff'
    }
  }, initials));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function Badge({
  active,
  tone = 'neutral',
  children,
  onClick
}) {
  const tones = {
    neutral: {
      background: active ? 'var(--color-primary)' : 'var(--color-surface-dark)',
      color: active ? '#fff' : 'var(--color-text-on-dark-muted)'
    },
    warning: {
      background: 'var(--color-warning-bg)',
      color: 'var(--color-warning)'
    },
    danger: {
      background: 'rgba(239,68,68,.15)',
      color: 'var(--color-danger)'
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 'var(--weight-medium)',
      fontSize: 12.5,
      padding: '7px 13px',
      borderRadius: 'var(--radius-pill)',
      cursor: onClick ? 'pointer' : 'default',
      display: 'inline-block',
      ...tones[tone]
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  onClick
}) {
  const sizes = {
    sm: {
      padding: '9px 18px',
      fontSize: 14
    },
    md: {
      padding: '14px 30px',
      fontSize: 16
    },
    lg: {
      padding: '16px 36px',
      fontSize: 18
    }
  };
  const base = {
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--weight-medium)',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background var(--duration-fast) var(--ease-standard), transform var(--duration-fast)',
    ...sizes[size]
  };
  const variants = {
    primary: {
      background: 'var(--color-primary)',
      color: 'var(--color-on-primary)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--color-text-on-dark-muted)',
      border: '1px solid var(--color-border-dark)'
    },
    ghost: {
      background: 'var(--color-surface-dark)',
      color: 'var(--color-text-on-dark)'
    }
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: disabled ? undefined : onClick,
    style: {
      ...base,
      ...variants[variant]
    },
    onMouseEnter: e => {
      if (!disabled && variant === 'primary') e.currentTarget.style.background = 'var(--color-primary-hover)';
    },
    onMouseLeave: e => {
      if (!disabled && variant === 'primary') e.currentTarget.style.background = 'var(--color-primary)';
    }
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function Card({
  tone = 'light',
  children,
  style
}) {
  const tones = {
    light: {
      background: 'var(--color-bg-light)',
      border: '1px solid var(--color-border-light)',
      color: 'var(--color-text-dark)',
      boxShadow: 'var(--shadow-card)'
    },
    dark: {
      background: 'var(--color-surface-dark)',
      border: '1px solid var(--color-border-dark)',
      color: 'var(--color-text-on-dark)'
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-lg)',
      padding: '22px 30px',
      fontFamily: 'var(--font-body)',
      ...tones[tone],
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconTile.jsx
try { (() => {
function IconTile({
  size = 44,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, children);
}
Object.assign(__ds_scope, { IconTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconTile.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusOrb.jsx
try { (() => {
const ICONS = {
  idle: null,
  listening: /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7
    }
  }, [0, .15, .3, .15, 0].map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 7,
      height: 46,
      background: '#fff',
      borderRadius: 4,
      animation: 'waveBar .9s ease-in-out infinite',
      animationDelay: `${d}s`
    }
  }))),
  granted: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "45%",
    height: "45%",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 13l4 4 10-10",
    stroke: "#fff",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })),
  emergency: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "42%",
    height: "42%",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 3 2 20h20L12 3Z",
    fill: "#fff"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 10v4",
    stroke: "#EF4444",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "16.6",
    r: "1.1",
    fill: "#EF4444"
  })),
  denied: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "40%",
    height: "40%",
    fill: "none"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9",
    stroke: "#F59E0B",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7v6",
    stroke: "#F59E0B",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "16.3",
    r: "1.15",
    fill: "#F59E0B"
  }))
};
const FILLS = {
  idle: 'radial-gradient(circle at 35% 30%,#65C495,#3D9A65 70%)',
  listening: 'radial-gradient(circle at 35% 30%,#65C495,#3D9A65 70%)',
  granted: 'var(--color-primary)',
  denied: 'var(--color-warning-bg)',
  emergency: 'var(--color-danger)'
};
function StatusOrb({
  status = 'idle',
  size = 180,
  pulse
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, pulse && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      border: `2px solid ${status === 'emergency' ? 'rgba(239,68,68,.6)' : 'rgba(76,175,125,.55)'}`,
      animation: 'pulseRing 1.8s ease-out infinite'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      border: `2px solid ${status === 'emergency' ? 'rgba(239,68,68,.6)' : 'rgba(76,175,125,.55)'}`,
      animation: 'pulseRing 1.8s ease-out infinite',
      animationDelay: '.6s'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: FILLS[status] || FILLS.idle,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: status === 'idle' ? 'orbBreathe 3.4s ease-in-out infinite' : status === 'granted' ? 'checkPop .5s ease-out' : 'none'
    }
  }, ICONS[status]));
}
Object.assign(__ds_scope, { StatusOrb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusOrb.jsx", error: String((e && e.message) || e) }); }

// ui_kits/kiosk/KioskStage.jsx
try { (() => {
const {
  Button,
  Badge,
  Avatar,
  StatusOrb,
  IconTile,
  Card
} = window.UbbanaDesignSystem_c779b7;
const NAV = [['idle', 'Reposo'], ['listening', 'Escuchando'], ['speaking', 'Hablando'], ['face', 'Rostro'], ['code', 'Código'], ['call', 'Videollamada'], ['granted', 'Concedido'], ['denied', 'Denegado'], ['emergency', 'Emergencia']];
function BuildingIcon() {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "10",
    width: "5",
    height: "11",
    rx: "1.5",
    fill: "rgba(255,255,255,.92)"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "10",
    y: "5",
    width: "5",
    height: "16",
    rx: "1.5",
    fill: "rgba(255,255,255,.92)"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "17",
    y: "13",
    width: "4",
    height: "8",
    rx: "1.5",
    fill: "rgba(255,255,255,.92)"
  }));
}
function Topbar({
  conjuntoName
}) {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '34px 48px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(IconTile, null, /*#__PURE__*/React.createElement(BuildingIcon, null)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 19,
      fontWeight: 600,
      lineHeight: 1.2
    }
  }, "Ubbana"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--color-text-on-dark-muted)'
    }
  }, conjuntoName))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 26,
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums'
    }
  }, now.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--color-text-on-dark-muted)',
      textTransform: 'capitalize'
    }
  }, now.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }))));
}
function Stage({
  screen,
  residentName,
  faceRecognized,
  toggleFace
}) {
  if (screen === 'idle') return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 34
    }
  }, /*#__PURE__*/React.createElement(StatusOrb, {
    status: "idle",
    size: 210
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 42,
      fontWeight: 600
    }
  }, "Habla o ac\xE9rcate para comenzar"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      color: 'var(--color-text-on-dark-muted)',
      marginTop: 12
    }
  }, "Estoy aqu\xED para ayudarte a entrar")));
  if (screen === 'listening') return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 34
    }
  }, /*#__PURE__*/React.createElement(StatusOrb, {
    status: "listening",
    size: 210,
    pulse: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 42,
      fontWeight: 600
    }
  }, "Te escucho\u2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      color: 'var(--color-text-on-dark-muted)',
      marginTop: 12
    }
  }, "Habla con naturalidad, no necesitas acercarte m\xE1s")));
  if (screen === 'speaking') return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 210,
      height: 210,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%,#65C495,#3D9A65 70%)',
      animation: 'orbBreathe 1.4s ease-in-out infinite',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "60",
    height: "60",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M11 5 6 9H3v6h3l5 4V5Z",
    fill: "rgba(255,255,255,.92)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15.5 8.5a5 5 0 0 1 0 7",
    stroke: "rgba(255,255,255,.92)",
    strokeWidth: "2",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 6a8.5 8.5 0 0 1 0 12",
    stroke: "rgba(255,255,255,.6)",
    strokeWidth: "2",
    strokeLinecap: "round"
  }))), /*#__PURE__*/React.createElement(Card, {
    tone: "dark",
    style: {
      maxWidth: 820,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      lineHeight: 1.45
    }
  }, "\"Un momento \u2014 ya te comunico con el apartamento 203.\"")));
  if (screen === 'face') return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 64
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 360,
      height: 360,
      borderRadius: 24,
      overflow: 'hidden',
      background: 'repeating-linear-gradient(45deg,#33363f,#33363f 12px,#2b2e36 12px,#2b2e36 24px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'rgba(255,255,255,.4)',
      letterSpacing: '.05em'
    }
  }, "c\xE1mara en vivo"), !faceRecognized && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '18%',
      left: '18%',
      width: 38,
      height: 38,
      borderTop: '3px solid #4CAF7D',
      borderLeft: '3px solid #4CAF7D',
      borderRadius: '6px 0 0 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '18%',
      right: '18%',
      width: 38,
      height: 38,
      borderTop: '3px solid #4CAF7D',
      borderRight: '3px solid #4CAF7D',
      borderRadius: '0 6px 0 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: '18%',
      left: '18%',
      width: 38,
      height: 38,
      borderBottom: '3px solid #4CAF7D',
      borderLeft: '3px solid #4CAF7D',
      borderRadius: '0 0 0 6px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: '18%',
      right: '18%',
      width: 38,
      height: 38,
      borderBottom: '3px solid #4CAF7D',
      borderRight: '3px solid #4CAF7D',
      borderRadius: '0 0 6px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 3,
      background: 'linear-gradient(90deg,transparent,#4CAF7D,transparent)',
      animation: 'scanLine 1.6s ease-in-out infinite alternate'
    }
  })), faceRecognized && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(76,175,125,.18)',
      border: '3px solid #4CAF7D'
    }
  })), /*#__PURE__*/React.createElement("div", null, !faceRecognized && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 40,
      fontWeight: 600
    }
  }, "Identificando\u2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      color: 'var(--color-text-on-dark-muted)',
      marginTop: 10,
      maxWidth: 420
    }
  }, "Mant\xE9n tu rostro frente a la c\xE1mara un momento")), faceRecognized && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 40,
      fontWeight: 600
    }
  }, "\xA1Hola, ", residentName, "!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      color: 'var(--color-text-on-dark-muted)',
      marginTop: 10,
      maxWidth: 420
    }
  }, "Bienvenido de vuelta \u2014 abriendo la puerta principal")), /*#__PURE__*/React.createElement(Badge, {
    onClick: toggleFace
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, "\u25B6 simular reconocimiento"))));
  if (screen === 'code') return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 34
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 180,
      height: 180,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%,#4b5563,#374151 70%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 40,
      fontWeight: 600
    }
  }, "Dime el c\xF3digo de la porter\xEDa"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      color: 'var(--color-text-on-dark-muted)',
      marginTop: 10
    }
  }, "Puedes decirlo en voz alta, d\xEDgito por d\xEDgito")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: '#4CAF7D'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: '#4CAF7D'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,.3)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,.3)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 14,
      color: 'rgba(255,255,255,.4)'
    }
  }, "escuch\xE9: 3 \u2013 8 \u2013 \u2026"));
  if (screen === 'call') return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 70
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 300,
      height: 380,
      borderRadius: 22,
      position: 'relative',
      background: 'repeating-linear-gradient(45deg,#33363f,#33363f 12px,#2b2e36 12px,#2b2e36 24px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'rgba(255,255,255,.4)'
    }
  }, "tu c\xE1mara")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 30
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    initials: "AT",
    ringing: true,
    size: 130
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 38,
      fontWeight: 600
    }
  }, "Llamando a Ana Torres"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      color: 'var(--color-text-on-dark-muted)',
      marginTop: 8
    }
  }, "Apto 203 \xB7 el residente decidir\xE1 tu ingreso"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline"
  }, "Cancelar"))));
  if (screen === 'granted') return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 30
    }
  }, /*#__PURE__*/React.createElement(StatusOrb, {
    status: "granted",
    size: 180
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 44,
      fontWeight: 600,
      color: '#65C495'
    }
  }, "\xA1Acceso concedido!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      color: 'rgba(255,255,255,.6)',
      marginTop: 12
    }
  }, "Bienvenido, ", residentName, " \u2014 puerta principal abierta")));
  if (screen === 'denied') return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 30
    }
  }, /*#__PURE__*/React.createElement(StatusOrb, {
    status: "denied",
    size: 180
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 38,
      fontWeight: 600
    }
  }, "No pudimos verificar tu c\xF3digo"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      color: 'var(--color-text-on-dark-muted)',
      marginTop: 10,
      maxWidth: 560
    }
  }, "No te preocupes, puedo comunicarte directamente con el residente")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg"
  }, "Hablar con el residente"));
  if (screen === 'emergency') return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 26
    }
  }, /*#__PURE__*/React.createElement(StatusOrb, {
    status: "emergency",
    size: 180,
    pulse: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 42,
      fontWeight: 700,
      color: '#EF4444'
    }
  }, "Salida de emergencia activada"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      color: 'rgba(255,255,255,.65)',
      marginTop: 12
    }
  }, "Todas las puertas han sido liberadas por seguridad")));
  return null;
}
function KioskApp() {
  const [screen, setScreen] = React.useState('idle');
  const [faceRecognized, setFaceRecognized] = React.useState(false);
  const residentName = 'Carlos Méndez';
  const conjuntoName = 'Torres del Parque';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1600,
      height: 1000,
      position: 'relative',
      background: 'linear-gradient(180deg,#1E2027 0%,#23252D 100%)',
      borderRadius: 28,
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
      color: '#fff',
      boxShadow: 'var(--shadow-elevated)'
    }
  }, /*#__PURE__*/React.createElement(Topbar, {
    conjuntoName: conjuntoName
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 130,
      left: 0,
      right: 0,
      bottom: 96,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 80px'
    }
  }, /*#__PURE__*/React.createElement(Stage, {
    screen: screen,
    residentName: residentName,
    faceRecognized: faceRecognized,
    toggleFace: () => setFaceRecognized(v => !v)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: '14px 28px 18px',
      background: 'rgba(0,0,0,.32)',
      backdropFilter: 'var(--blur-panel)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'rgba(255,255,255,.35)',
      letterSpacing: '.06em'
    }
  }, "vista previa \u2014 estados"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, NAV.map(([key, label]) => /*#__PURE__*/React.createElement(Badge, {
    key: key,
    active: key === screen,
    onClick: () => {
      setScreen(key);
      setFaceRecognized(false);
    }
  }, label)))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(KioskApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/kiosk/KioskStage.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconTile = __ds_scope.IconTile;

__ds_ns.StatusOrb = __ds_scope.StatusOrb;

})();
