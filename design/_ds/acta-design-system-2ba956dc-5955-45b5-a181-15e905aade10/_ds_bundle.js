/* @ds-bundle: {"format":4,"namespace":"AforoDesignSystem_2ba956","components":[{"name":"Boton","sourcePath":"components/acciones/Boton.jsx"},{"name":"CampoCantidad","sourcePath":"components/captura/CampoCantidad.jsx"},{"name":"ItemCard","sourcePath":"components/captura/ItemCard.jsx"},{"name":"ColaChip","sourcePath":"components/estado/ColaChip.jsx"},{"name":"EstadoBadge","sourcePath":"components/estado/EstadoBadge.jsx"},{"name":"Sello","sourcePath":"components/estado/Sello.jsx"},{"name":"Skeleton","sourcePath":"components/estado/Skeleton.jsx"},{"name":"Velo","sourcePath":"components/estado/Velo.jsx"},{"name":"AppHeader","sourcePath":"components/estructura/AppHeader.jsx"},{"name":"BarraExcepcion","sourcePath":"components/estructura/BarraExcepcion.jsx"},{"name":"ResumenActa","sourcePath":"components/estructura/ResumenActa.jsx"},{"name":"Tarjeta","sourcePath":"components/estructura/Tarjeta.jsx"},{"name":"Campo","sourcePath":"components/formulario/Campo.jsx"},{"name":"EncabezadoForm","sourcePath":"components/formulario/EncabezadoForm.jsx"}],"sourceHashes":{"components/acciones/Boton.jsx":"bc4eaf3df92c","components/captura/CampoCantidad.jsx":"e5e9a2afd9ea","components/captura/ItemCard.jsx":"2ed9e1bc68c3","components/estado/ColaChip.jsx":"20a45720b528","components/estado/EstadoBadge.jsx":"cf8e32475ef6","components/estado/Sello.jsx":"9fd8c94ba0e0","components/estado/Skeleton.jsx":"2430edfc1b6b","components/estado/Velo.jsx":"84eba962c345","components/estructura/AppHeader.jsx":"e15b9d21e732","components/estructura/BarraExcepcion.jsx":"956a01782e5c","components/estructura/ResumenActa.jsx":"889519796e97","components/estructura/Tarjeta.jsx":"c35de84529cf","components/formulario/Campo.jsx":"e9cd9705d7ea","components/formulario/EncabezadoForm.jsx":"fe362a2267aa","ui_kits/acta-pwa/App.jsx":"0629b4d3ed64","ui_kits/acta-pwa/ModalRevision.jsx":"ca9d4dc1c375","ui_kits/acta-pwa/PantallaCaptura.jsx":"dc8ae9ab309e","ui_kits/acta-pwa/PantallaCierre.jsx":"e6bcc8e628d5","ui_kits/acta-pwa/PantallaEncabezado.jsx":"3a3d768f633e","ui_kits/acta-pwa/datos.js":"6e6989bd8915"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AforoDesignSystem_2ba956 = window.AforoDesignSystem_2ba956 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/acciones/Boton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const paletas = {
  primaria: {
    background: "var(--boli)",
    color: "#fff",
    border: "none"
  },
  acta: {
    background: "var(--sello)",
    color: "#fff",
    border: "none"
  },
  secundaria: {
    background: "#fff",
    color: "var(--tinta)",
    border: "var(--bd-estado) solid var(--tinta)"
  },
  excepcion: {
    background: "var(--copia-bd)",
    color: "#fff",
    border: "none"
  }
};
const tallas = {
  md: {
    minHeight: "52px",
    fontSize: "var(--t-15)"
  },
  tap: {
    minHeight: "var(--tap)",
    fontSize: "var(--t-15)"
  },
  lg: {
    minHeight: "var(--tap-lg)",
    fontSize: "var(--t-base)"
  },
  barra: {
    minHeight: "var(--tap-40)",
    fontSize: "var(--t-13)"
  }
};
function Boton({
  variante = "primaria",
  talla = "md",
  ancho = "full",
  disabled = false,
  children,
  style,
  ...rest
}) {
  const p = paletas[variante] || paletas.primaria;
  const t = tallas[talla] || tallas.md;
  const apagado = disabled ? {
    background: "var(--bond-2)",
    color: "#A9B0AB",
    border: "none",
    cursor: "not-allowed"
  } : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    style: {
      fontFamily: "var(--sans)",
      fontWeight: "var(--peso-semi)",
      borderRadius: "var(--r)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      padding: "0 var(--s3)",
      width: ancho === "full" ? "100%" : "auto",
      flexShrink: ancho === "full" ? 1 : 0,
      ...t,
      ...p,
      ...apagado,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Boton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/acciones/Boton.jsx", error: String((e && e.message) || e) }); }

// components/captura/CampoCantidad.jsx
try { (() => {
function CampoCantidad({
  valor = "",
  unidad = "UN",
  estado = "neutro",
  disabled = false,
  onChange,
  style
}) {
  const bordes = {
    neutro: "var(--linea)",
    falta: "var(--falta-bd)",
    ok: "var(--sello-bd)"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      marginTop: "var(--s2)",
      border: "var(--bd-estado) solid " + (bordes[estado] || bordes.neutro),
      borderRadius: "var(--r-chip)",
      height: "var(--tap-min)",
      padding: "0 8px",
      background: estado === "falta" ? "var(--falta-bg)" : "#fff",
      opacity: disabled ? .4 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: valor,
    disabled: disabled,
    onChange: onChange,
    placeholder: "\u2014",
    "aria-label": "Cantidad",
    inputMode: "numeric",
    style: {
      border: "none",
      outline: "none",
      fontFamily: "var(--mono)",
      fontSize: "var(--t-base)",
      fontWeight: "var(--peso-semi)",
      width: "100%",
      background: "transparent",
      color: "var(--tinta)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: "var(--t-10)",
      color: "var(--grafito)",
      letterSpacing: "var(--track-dato)"
    }
  }, unidad));
}
Object.assign(__ds_scope, { CampoCantidad });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/captura/CampoCantidad.jsx", error: String((e && e.message) || e) }); }

// components/estado/ColaChip.jsx
try { (() => {
function ColaChip({
  estado = "cola",
  children,
  style
}) {
  const sinc = estado === "sincronizado";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      fontFamily: "var(--mono)",
      fontSize: "var(--t-11)",
      letterSpacing: "var(--track-dato)",
      background: "#fff",
      border: "var(--bd) solid " + (sinc ? "var(--sello-bd)" : "var(--linea)"),
      color: sinc ? "var(--sello)" : "var(--tinta-70)",
      padding: "5px 9px",
      borderRadius: "var(--r-chip)",
      whiteSpace: "nowrap",
      ...style
    }
  }, estado === "analizando" && /*#__PURE__*/React.createElement("span", {
    style: {
      width: "12px",
      height: "12px",
      border: "1.5px solid var(--boli-bg)",
      borderTopColor: "var(--boli)",
      borderRadius: "var(--r-redondo)",
      animation: "acta-giro var(--dur-giro) var(--ease-lineal) infinite",
      flexShrink: 0
    }
  }), estado === "cola" && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u25CC"), sinc && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u25CF"), children);
}
Object.assign(__ds_scope, { ColaChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/estado/ColaChip.jsx", error: String((e && e.message) || e) }); }

// components/estado/EstadoBadge.jsx
try { (() => {
const mapa = {
  listo: {
    t: "Listo",
    bg: "var(--sello-bg)",
    c: "var(--sello)",
    bd: "var(--sello-bd)"
  },
  revisar: {
    t: "Revisar",
    bg: "var(--copia-bg)",
    c: "var(--copia)",
    bd: "var(--copia-bd)"
  },
  falta: {
    t: "Falta cantidad",
    bg: "var(--falta-bg)",
    c: "var(--falta)",
    bd: "var(--falta-bd)"
  },
  neutro: {
    t: "En cola",
    bg: "#fff",
    c: "var(--tinta-70)",
    bd: "var(--linea)"
  }
};
function EstadoBadge({
  estado = "listo",
  children,
  punto = true,
  style
}) {
  const e = mapa[estado] || mapa.listo;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      fontFamily: "var(--mono)",
      fontSize: "var(--t-10)",
      fontWeight: "var(--peso-semi)",
      letterSpacing: "var(--track-badge)",
      textTransform: "uppercase",
      padding: "4px 7px",
      borderRadius: "var(--r-chip)",
      whiteSpace: "nowrap",
      background: e.bg,
      color: e.c,
      border: "var(--bd) solid " + e.bd,
      ...style
    }
  }, punto && /*#__PURE__*/React.createElement("span", {
    style: {
      width: "6px",
      height: "6px",
      borderRadius: "var(--r-redondo)",
      background: "currentColor",
      flexShrink: 0
    }
  }), children || e.t);
}
Object.assign(__ds_scope, { EstadoBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/estado/EstadoBadge.jsx", error: String((e && e.message) || e) }); }

// components/estado/Sello.jsx
try { (() => {
const MASCARA = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='90'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/><feColorMatrix type='matrix' values='0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 -1.4 1.05'/></filter><rect width='180' height='90' filter='url(%23n)'/></svg>\")";
function Sello({
  children = "Diligenciada",
  animar = true,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      fontFamily: "var(--mono)",
      fontSize: "var(--t-13)",
      fontWeight: "var(--peso-semi)",
      letterSpacing: ".14em",
      textTransform: "uppercase",
      color: "var(--sello)",
      border: "var(--bd-sello) solid var(--sello)",
      borderRadius: "var(--r-chip)",
      padding: "7px 13px",
      transform: "rotate(-4.5deg)",
      opacity: .9,
      WebkitMaskImage: MASCARA,
      maskImage: MASCARA,
      WebkitMaskSize: "180px 90px",
      maskSize: "180px 90px",
      animation: animar ? "acta-sellar var(--dur-sello) var(--ease-sello) both" : "none",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Sello });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/estado/Sello.jsx", error: String((e && e.message) || e) }); }

// components/estado/Skeleton.jsx
try { (() => {
function Skeleton({
  alto = "13px",
  ancho = "100%",
  radio = "var(--r-min)",
  style,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      height: alto,
      width: ancho,
      borderRadius: radio,
      color: "transparent",
      background: "linear-gradient(90deg,var(--bond-2) 25%,#DDE0DB 50%,var(--bond-2) 75%)",
      backgroundSize: "200% 100%",
      animation: "acta-brillo var(--dur-brillo) var(--ease-lineal) infinite",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/estado/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/estado/Velo.jsx
try { (() => {
function Velo({
  estado = "cola",
  etiqueta,
  style
}) {
  const txt = etiqueta || (estado === "analizando" ? "Analizando" : "En cola");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--vidrio-velo)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      ...style
    }
  }, estado === "analizando" ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: "18px",
      height: "18px",
      border: "var(--bd-acento) solid var(--boli-bg)",
      borderTopColor: "var(--boli)",
      borderRadius: "var(--r-redondo)",
      animation: "acta-giro var(--dur-giro) var(--ease-lineal) infinite"
    }
  }) : /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: "15px"
    }
  }, "\u25CC"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: "var(--t-9)",
      letterSpacing: "var(--track-label)",
      textTransform: "uppercase",
      color: "var(--tinta-70)"
    }
  }, txt));
}
Object.assign(__ds_scope, { Velo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/estado/Velo.jsx", error: String((e && e.message) || e) }); }

// components/captura/ItemCard.jsx
try { (() => {
function ItemCard({
  numero,
  foto,
  descripcion,
  referencia,
  estado,
  razon,
  cantidad = "",
  unidad = "UN",
  sistema,
  falta = false,
  error,
  onCantidadChange,
  style
}) {
  const bordeColor = sistema ? "var(--linea)" : falta ? "var(--falta)" : estado === "revisar" ? "var(--copia-bd)" : "var(--linea)";
  const bordeAncho = !sistema && (falta || estado === "revisar") ? "var(--bd-estado)" : "var(--bd)";
  const analizando = sistema === "analizando";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      border: bordeAncho + " solid " + bordeColor,
      borderRadius: "var(--r)",
      overflow: "hidden",
      position: "relative",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: "1",
      background: "var(--bond-2)",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--mono)",
      fontSize: "var(--t-9)",
      color: "var(--grafito)",
      letterSpacing: "var(--track-badge)",
      ...(analizando ? {
        background: "linear-gradient(90deg,var(--bond-2) 25%,#DDE0DB 50%,var(--bond-2) 75%)",
        backgroundSize: "200% 100%",
        animation: "acta-brillo var(--dur-brillo) var(--ease-lineal) infinite"
      } : null)
    }
  }, foto ? /*#__PURE__*/React.createElement("img", {
    src: foto,
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : !sistema && "FOTO", /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: "6px",
      left: "6px",
      fontFamily: "var(--mono)",
      fontSize: "var(--t-10)",
      fontWeight: "var(--peso-semi)",
      background: "var(--tinta)",
      color: "#fff",
      padding: "2px 5px",
      borderRadius: "var(--r-min)"
    }
  }, numero), !sistema && !falta && estado && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: "6px",
      right: "6px"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.EstadoBadge, {
    estado: estado
  })), sistema && /*#__PURE__*/React.createElement(__ds_scope.Velo, {
    estado: sistema
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px"
    }
  }, analizando ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Skeleton, null), /*#__PURE__*/React.createElement(__ds_scope.Skeleton, {
    ancho: "60%",
    style: {
      marginTop: "var(--s1)"
    }
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--t-13)",
      fontWeight: "var(--peso-medio)",
      lineHeight: "var(--alto-titulo)",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      color: sistema ? "var(--grafito)" : "var(--tinta)"
    }
  }, descripcion), referencia && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: "var(--t-10)",
      color: "var(--grafito)",
      marginTop: "3px",
      letterSpacing: ".04em"
    }
  }, referencia), razon && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--t-11)",
      color: "var(--copia)",
      marginTop: "5px",
      lineHeight: "1.3",
      fontWeight: "var(--peso-medio)"
    }
  }, razon)), /*#__PURE__*/React.createElement(__ds_scope.CampoCantidad, {
    valor: cantidad,
    unidad: unidad,
    disabled: !!sistema,
    estado: falta ? "falta" : cantidad ? "ok" : "neutro",
    onChange: onCantidadChange
  }), error && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--t-11)",
      color: "var(--falta)",
      marginTop: "var(--s1)",
      fontWeight: "var(--peso-medio)"
    }
  }, error)));
}
Object.assign(__ds_scope, { ItemCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/captura/ItemCard.jsx", error: String((e && e.message) || e) }); }

// components/estructura/AppHeader.jsx
try { (() => {
function AppHeader({
  titulo,
  meta,
  chip,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderBottom: "var(--bd) solid var(--linea)",
      padding: "var(--s3) var(--s4)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "var(--s3)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h5", {
    style: {
      fontSize: "var(--t-titulo-app)",
      fontWeight: "var(--peso-bold)",
      letterSpacing: "var(--track-h4)"
    }
  }, titulo), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: "var(--t-11)",
      color: "var(--grafito)",
      letterSpacing: "var(--track-dato)",
      marginTop: "2px"
    }
  }, meta)), chip));
}
Object.assign(__ds_scope, { AppHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/estructura/AppHeader.jsx", error: String((e && e.message) || e) }); }

// components/estructura/BarraExcepcion.jsx
try { (() => {
function BarraExcepcion({
  cantidad = 0,
  onRevisar,
  style
}) {
  if (!cantidad) return null;
  const txt = cantidad === 1 ? "1 ítem necesita revisión" : cantidad + " ítems necesitan revisión";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--s3)",
      background: "var(--copia-bg)",
      border: "var(--bd) solid var(--copia-bd)",
      borderRadius: "var(--r)",
      padding: "10px var(--s3)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: "var(--t-14)",
      fontWeight: "var(--peso-semi)",
      color: "var(--copia)",
      lineHeight: "var(--alto-titulo)"
    }
  }, txt), /*#__PURE__*/React.createElement(__ds_scope.Boton, {
    variante: "excepcion",
    talla: "barra",
    ancho: "auto",
    onClick: onRevisar,
    style: {
      borderRadius: "var(--r-chip)"
    }
  }, "Revisar \u2192"));
}
Object.assign(__ds_scope, { BarraExcepcion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/estructura/BarraExcepcion.jsx", error: String((e && e.message) || e) }); }

// components/estructura/ResumenActa.jsx
try { (() => {
function ResumenActa({
  doNo,
  items,
  bultos,
  peso,
  sello,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--s4)",
      minHeight: "var(--tap-lg)",
      borderTop: "var(--bd) solid var(--linea)",
      paddingTop: "var(--s4)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: "var(--peso-semi)",
      fontSize: "var(--t-15)"
    }
  }, "D.O. ", doNo), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: "var(--t-12)",
      color: "var(--grafito)",
      marginTop: "2px"
    }
  }, items, " \xEDtems \xB7 ", bultos, " bultos \xB7 ", peso, " kg")), sello);
}
Object.assign(__ds_scope, { ResumenActa });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/estructura/ResumenActa.jsx", error: String((e && e.message) || e) }); }

// components/estructura/Tarjeta.jsx
try { (() => {
const franjas = {
  boli: "var(--boli)",
  falta: "var(--falta)",
  copia: "var(--copia-bd)",
  sello: "var(--sello)"
};
function Tarjeta({
  etiqueta,
  franja,
  children,
  style
}) {
  const c = franjas[franja];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--fondo-tarjeta)",
      border: "var(--bd) solid var(--linea)",
      borderRadius: "var(--r)",
      padding: "var(--s4)",
      borderLeft: c ? "var(--bd-marca) solid " + c : undefined,
      ...style
    }
  }, etiqueta && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: "var(--t-11)",
      letterSpacing: "var(--track-label)",
      textTransform: "uppercase",
      color: c || "var(--grafito)",
      marginBottom: "var(--s3)"
    }
  }, etiqueta), children);
}
Object.assign(__ds_scope, { Tarjeta });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/estructura/Tarjeta.jsx", error: String((e && e.message) || e) }); }

// components/formulario/Campo.jsx
try { (() => {
function Campo({
  etiqueta,
  valor,
  children,
  heredado = false,
  mono = true,
  hint,
  vacio = false,
  ancho,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: ancho === "wide" ? "1 / -1" : undefined,
      ...style
    }
  }, etiqueta && /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: "var(--t-10)",
      letterSpacing: "var(--track-label)",
      textTransform: "uppercase",
      color: "var(--grafito)",
      display: "block",
      marginBottom: "var(--s1)"
    }
  }, etiqueta), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "var(--bd-estado) solid var(--linea)",
      borderRadius: "var(--r-chip)",
      height: "52px",
      display: "flex",
      alignItems: "center",
      padding: "0 10px",
      fontFamily: mono ? "var(--mono)" : "var(--sans)",
      fontSize: mono ? "16px" : "var(--t-15)",
      fontWeight: mono ? "var(--peso-medio)" : "var(--peso-normal)",
      background: heredado ? "var(--fondo-heredado)" : "#fff",
      color: vacio ? "#B6BCB8" : heredado ? "var(--tinta-70)" : "var(--tinta)"
    }
  }, children || valor), (hint || heredado) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--t-11)",
      color: "var(--grafito)",
      marginTop: "var(--s1)"
    }
  }, hint || "↺ del acta anterior"));
}
Object.assign(__ds_scope, { Campo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/formulario/Campo.jsx", error: String((e && e.message) || e) }); }

// components/formulario/EncabezadoForm.jsx
try { (() => {
function EncabezadoForm({
  datos = {},
  style
}) {
  const d = {
    doNo: "2026-04471",
    cliente: "Comercial JMC S.A.S",
    deposito: "Zona Franca Rionegro",
    bultos: "14",
    peso: "312,50",
    horaInicio: "08:15",
    horaFin: "--:--",
    ...datos
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Campo, {
    etiqueta: "D.O. No",
    valor: d.doNo,
    ancho: "wide",
    hint: "Siempre nuevo. No se hereda."
  }), /*#__PURE__*/React.createElement(__ds_scope.Campo, {
    etiqueta: "Cliente",
    valor: d.cliente,
    mono: false,
    heredado: true
  }), /*#__PURE__*/React.createElement(__ds_scope.Campo, {
    etiqueta: "Dep\xF3sito",
    valor: d.deposito,
    mono: false,
    heredado: true
  }), /*#__PURE__*/React.createElement(__ds_scope.Campo, {
    etiqueta: "Bultos",
    valor: d.bultos
  }), /*#__PURE__*/React.createElement(__ds_scope.Campo, {
    etiqueta: "Peso (kg)",
    valor: d.peso
  }), /*#__PURE__*/React.createElement(__ds_scope.Campo, {
    etiqueta: "Hora inicio",
    valor: d.horaInicio
  }), /*#__PURE__*/React.createElement(__ds_scope.Campo, {
    etiqueta: "Hora fin",
    valor: d.horaFin,
    vacio: true,
    hint: "Al generar el acta"
  }));
}
Object.assign(__ds_scope, { EncabezadoForm });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/formulario/EncabezadoForm.jsx", error: String((e && e.message) || e) }); }

// ui_kits/acta-pwa/App.jsx
try { (() => {
function App() {
  const {
    useState,
    useEffect
  } = React;
  const base = window.ACTA_DATOS;
  const [paso, setPaso] = useState("encabezado");
  const [items, setItems] = useState(base.items);
  const [validando, setValidando] = useState(false);
  const [revisando, setRevisando] = useState(null);
  const [generada, setGenerada] = useState(false);

  /* la cola se resuelve sola cuando vuelve la señal */
  useEffect(() => {
    if (paso !== "captura") return;
    const t1 = setTimeout(() => setItems(is => is.map(i => i.numero === "03" ? {
      ...i,
      sistema: undefined
    } : i)), 2600);
    const t2 = setTimeout(() => setItems(is => is.map(i => i.numero === "04" ? {
      ...i,
      sistema: "analizando"
    } : i)), 3400);
    const t3 = setTimeout(() => setItems(is => is.map(i => i.numero === "04" ? {
      ...i,
      sistema: undefined,
      estado: "listo",
      descripcion: "Abrazadera inox 40-60 mm",
      referencia: "REF 21884-C · IT"
    } : i)), 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [paso]);
  const enCola = items.filter(i => i.sistema).length;
  const porRevisar = items.filter(i => !i.sistema && i.estado === "revisar");
  const faltantes = items.filter(i => !i.sistema && !i.cantidad).length;
  const setCantidad = (numero, valor) => setItems(is => is.map(i => i.numero === numero ? {
    ...i,
    cantidad: valor
  } : i));
  const generar = () => {
    if (faltantes > 0) {
      setValidando(true);
      return;
    }
    setValidando(false);
    setPaso("cierre");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: "100%",
      overflow: "hidden"
    }
  }, paso === "encabezado" && /*#__PURE__*/React.createElement(PantallaEncabezado, {
    datos: base.encabezado,
    onContinuar: () => setPaso("captura")
  }), paso === "captura" && /*#__PURE__*/React.createElement(PantallaCaptura, {
    items: items,
    enCola: enCola,
    validando: validando,
    faltantes: faltantes,
    onCantidad: setCantidad,
    onRevisar: () => setRevisando(0),
    onGenerar: generar,
    onAgregar: () => setItems(is => is.concat([{
      numero: String(is.length + 1).padStart(2, "0"),
      sistema: "analizando",
      cantidad: ""
    }]))
  }), paso === "cierre" && /*#__PURE__*/React.createElement(PantallaCierre, {
    generada: generada,
    onGenerar: () => setGenerada(true),
    onVolver: () => {
      setGenerada(false);
      setPaso("captura");
    }
  }), revisando !== null && porRevisar[revisando] && /*#__PURE__*/React.createElement(ModalRevision, {
    item: porRevisar[revisando],
    indice: revisando + 1,
    total: porRevisar.length,
    onCerrar: () => setRevisando(null),
    onConfirmar: () => {
      const actual = porRevisar[revisando];
      setItems(is => is.map(i => i.numero === actual.numero ? {
        ...i,
        estado: "listo",
        razon: undefined
      } : i));
      setRevisando(revisando + 1 < porRevisar.length ? revisando : null);
    }
  }));
}
Object.assign(window, {
  App
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/acta-pwa/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/acta-pwa/ModalRevision.jsx
try { (() => {
const DS = () => window.AforoDesignSystem_2ba956;

/* Encadena los ítems ámbar: al confirmar el último la barra de excepción
   desaparece sola. El layout interno del modal no está definido en el spec
   v0.2 — ver README.md de este kit. */
function ModalRevision({
  item,
  indice,
  total,
  onConfirmar,
  onCerrar
}) {
  const {
    Boton,
    EstadoBadge,
    Campo
  } = DS();
  if (!item) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "rgba(18,24,27,.55)",
      display: "flex",
      alignItems: "flex-end",
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--bond)",
      width: "100%",
      borderTopLeftRadius: "var(--r-mob)",
      borderTopRightRadius: "var(--r-mob)",
      maxHeight: "92%",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "var(--s3) var(--s4)",
      borderBottom: "var(--bd) solid var(--linea)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--t-titulo-app)",
      fontWeight: "var(--peso-bold)",
      letterSpacing: "var(--track-h4)"
    }
  }, "Revisar \xEDtem ", item.numero), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: "var(--t-11)",
      color: "var(--grafito)",
      letterSpacing: "var(--track-dato)",
      marginTop: "2px"
    }
  }, indice, " de ", total, " por revisar")), /*#__PURE__*/React.createElement("button", {
    onClick: onCerrar,
    "aria-label": "Cerrar",
    style: {
      fontFamily: "var(--mono)",
      fontSize: "18px",
      background: "none",
      border: "none",
      color: "var(--grafito)",
      cursor: "pointer",
      padding: "8px"
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "var(--s4)",
      display: "grid",
      gap: "var(--s3)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      aspectRatio: "4 / 3",
      background: "var(--bond-2)",
      border: "var(--bd) solid var(--linea)",
      borderRadius: "var(--r)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--mono)",
      fontSize: "var(--t-10)",
      letterSpacing: "var(--track-badge)",
      color: "var(--grafito)"
    }
  }, "FOTO 1 / 3", /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: "8px",
      right: "8px"
    }
  }, /*#__PURE__*/React.createElement(EstadoBadge, {
    estado: "revisar"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--copia-bg)",
      border: "var(--bd) solid var(--copia-bd)",
      borderRadius: "var(--r)",
      padding: "10px var(--s3)",
      fontSize: "var(--t-14)",
      fontWeight: "var(--peso-semi)",
      color: "var(--copia)",
      lineHeight: "var(--alto-titulo)"
    }
  }, item.razon, ". No aparece en ninguna de las 3 fotos."), /*#__PURE__*/React.createElement(Campo, {
    etiqueta: "Descripci\xF3n",
    valor: item.descripcion,
    mono: false
  }), /*#__PURE__*/React.createElement(Campo, {
    etiqueta: "Referencia",
    valor: item.referencia
  }), /*#__PURE__*/React.createElement(Campo, {
    etiqueta: "Pa\xEDs de origen",
    valor: "\u2014",
    vacio: true,
    hint: "Escr\xEDbelo o t\xF3male foto a la etiqueta"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderTop: "var(--bd) solid var(--linea)",
      padding: "10px var(--s3) var(--s3)",
      display: "grid",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement(Boton, {
    variante: "acta",
    talla: "tap",
    onClick: onConfirmar
  }, indice < total ? "Confirmar y siguiente →" : "Confirmar y cerrar"), /*#__PURE__*/React.createElement(Boton, {
    variante: "secundaria",
    onClick: onCerrar
  }, "Volver a tomar la foto"))));
}
Object.assign(window, {
  ModalRevision
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/acta-pwa/ModalRevision.jsx", error: String((e && e.message) || e) }); }

// ui_kits/acta-pwa/PantallaCaptura.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DS = () => window.AforoDesignSystem_2ba956;
function PantallaCaptura({
  items,
  enCola,
  validando,
  faltantes,
  onCantidad,
  onRevisar,
  onGenerar,
  onAgregar
}) {
  const {
    AppHeader,
    ColaChip,
    BarraExcepcion,
    ItemCard,
    Boton
  } = DS();
  const analizados = items.filter(i => !i.sistema).length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "var(--bond)"
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    titulo: validando ? faltantes === 1 ? "Falta 1 cantidad" : "Faltan " + faltantes + " cantidades" : "Acta en curso",
    meta: "D.O. 2026-04471 · " + (validando ? "según factura" : items.length + " ítems"),
    chip: enCola ? /*#__PURE__*/React.createElement(ColaChip, {
      estado: "cola"
    }, enCola, " en cola") : /*#__PURE__*/React.createElement(ColaChip, {
      estado: "sincronizado"
    }, "Sincronizado")
  }), !validando && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--s3) var(--s3) 0"
    }
  }, /*#__PURE__*/React.createElement(BarraExcepcion, {
    cantidad: items.filter(i => !i.sistema && i.estado === "revisar").length,
    onRevisar: onRevisar
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "var(--s3)",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
      alignContent: "start"
    }
  }, items.map(it => /*#__PURE__*/React.createElement(ItemCard, _extends({
    key: it.numero
  }, it, {
    falta: validando && !it.cantidad && !it.sistema,
    error: validando && !it.cantidad && !it.sistema ? "Escribe la cantidad" : null,
    onCantidadChange: e => onCantidad(it.numero, e.target.value.replace(/[^0-9]/g, ""))
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderTop: "var(--bd) solid var(--linea)",
      padding: "10px var(--s3) var(--s3)",
      display: "grid",
      gap: "8px"
    }
  }, analizados > 0 && /*#__PURE__*/React.createElement(Boton, {
    variante: "acta",
    talla: "tap",
    disabled: validando && faltantes > 0,
    onClick: onGenerar
  }, validando && faltantes > 0 ? "Generar acta · faltan " + faltantes : "Generar acta"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement(Boton, {
    onClick: onAgregar
  }, "Agregar producto"), /*#__PURE__*/React.createElement(Boton, {
    variante: "secundaria",
    ancho: "auto",
    style: {
      padding: "0 var(--s4)"
    }
  }, "ZIP"))));
}
Object.assign(window, {
  PantallaCaptura
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/acta-pwa/PantallaCaptura.jsx", error: String((e && e.message) || e) }); }

// ui_kits/acta-pwa/PantallaCierre.jsx
try { (() => {
const DS = () => window.AforoDesignSystem_2ba956;
function PantallaCierre({
  generada,
  onGenerar,
  onVolver
}) {
  const {
    AppHeader,
    ColaChip,
    Tarjeta,
    ResumenActa,
    Sello,
    Boton
  } = DS();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "var(--bond)"
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    titulo: "Cierre del acta",
    meta: "D.O. 2026-04471 \xB7 hora fin 09:42",
    chip: /*#__PURE__*/React.createElement(ColaChip, {
      estado: "sincronizado"
    }, "Sincronizado")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "var(--s4)",
      display: "grid",
      gap: "var(--s3)",
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement(Tarjeta, {
    etiqueta: "Resumen del acta"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--t-14)",
      lineHeight: "var(--alto-nota)",
      color: "var(--tinta-70)",
      marginBottom: "var(--s4)"
    }
  }, "Verifica el conteo antes de firmar. El archivo sale con el formato oficial; la pantalla no lo previsualiza."), /*#__PURE__*/React.createElement(ResumenActa, {
    doNo: "2026-04471",
    items: 6,
    bultos: 14,
    peso: "312,50",
    sello: generada ? /*#__PURE__*/React.createElement(Sello, null) : null
  })), generada && /*#__PURE__*/React.createElement(Tarjeta, {
    etiqueta: "Archivo generado",
    franja: "sello"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: "var(--t-13)",
      fontWeight: "var(--peso-medio)"
    }
  }, "GO.PD.02-F.02_2026-04471.xlsx"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: "var(--t-11)",
      color: "var(--grafito)",
      marginTop: "3px"
    }
  }, "6 filas \xB7 18 fotos \xB7 4,2 MB"), /*#__PURE__*/React.createElement(Boton, {
    variante: "secundaria",
    style: {
      marginTop: "var(--s3)"
    }
  }, "Descargar Excel"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderTop: "var(--bd) solid var(--linea)",
      padding: "10px var(--s3) var(--s3)",
      display: "grid",
      gap: "8px"
    }
  }, !generada ? /*#__PURE__*/React.createElement(Boton, {
    variante: "acta",
    talla: "lg",
    onClick: onGenerar
  }, "Generar acta") : /*#__PURE__*/React.createElement(Boton, {
    talla: "tap",
    onClick: onVolver
  }, "Nueva acta"), !generada && /*#__PURE__*/React.createElement(Boton, {
    variante: "secundaria",
    onClick: onVolver
  }, "Volver a la captura")));
}
Object.assign(window, {
  PantallaCierre
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/acta-pwa/PantallaCierre.jsx", error: String((e && e.message) || e) }); }

// ui_kits/acta-pwa/PantallaEncabezado.jsx
try { (() => {
const DS = () => window.AforoDesignSystem_2ba956;
function PantallaEncabezado({
  datos,
  onContinuar
}) {
  const {
    AppHeader,
    EncabezadoForm,
    Boton,
    ColaChip
  } = DS();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "var(--bond)"
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    titulo: "Nueva acta",
    meta: "GO.PD.02-F.02 \xB7 sin sincronizar",
    chip: /*#__PURE__*/React.createElement(ColaChip, {
      estado: "cola"
    }, "Offline")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "var(--s4)"
    }
  }, /*#__PURE__*/React.createElement(EncabezadoForm, {
    datos: datos
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderTop: "var(--bd) solid var(--linea)",
      padding: "10px var(--s3) var(--s3)"
    }
  }, /*#__PURE__*/React.createElement(Boton, {
    talla: "tap",
    onClick: onContinuar
  }, "Empezar captura")));
}
Object.assign(window, {
  PantallaEncabezado
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/acta-pwa/PantallaEncabezado.jsx", error: String((e && e.message) || e) }); }

// ui_kits/acta-pwa/datos.js
try { (() => {
window.ACTA_DATOS = {
  encabezado: {
    doNo: "2026-04471",
    cliente: "Comercial JMC S.A.S",
    deposito: "Zona Franca Rionegro",
    bultos: "14",
    peso: "312,50",
    horaInicio: "08:15",
    horaFin: "--:--"
  },
  items: [{
    numero: "01",
    descripcion: 'Válvula de bola bronce 1/2"',
    referencia: "REF 90412-B · CN",
    estado: "listo",
    cantidad: ""
  }, {
    numero: "02",
    descripcion: "Acople rápido neumático",
    referencia: "REF ilegible",
    estado: "revisar",
    razon: "Falta país de origen",
    cantidad: ""
  }, {
    numero: "03",
    descripcion: "Manguera hidráulica R2 3/8\"",
    referencia: "REF 55210-H · BR",
    estado: "listo",
    sistema: "analizando",
    cantidad: ""
  }, {
    numero: "04",
    descripcion: "Sin analizar",
    referencia: "Sube cuando haya señal",
    sistema: "cola",
    cantidad: ""
  }, {
    numero: "05",
    descripcion: "Racor recto giratorio M16",
    referencia: "REF 77031-A · DE",
    estado: "listo",
    cantidad: "120"
  }, {
    numero: "06",
    descripcion: "Empaque plano de nitrilo",
    referencia: "REF marca ilegible",
    estado: "revisar",
    razon: "Marca ilegible en las 3 fotos",
    cantidad: "8"
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/acta-pwa/datos.js", error: String((e && e.message) || e) }); }

__ds_ns.Boton = __ds_scope.Boton;

__ds_ns.CampoCantidad = __ds_scope.CampoCantidad;

__ds_ns.ItemCard = __ds_scope.ItemCard;

__ds_ns.ColaChip = __ds_scope.ColaChip;

__ds_ns.EstadoBadge = __ds_scope.EstadoBadge;

__ds_ns.Sello = __ds_scope.Sello;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Velo = __ds_scope.Velo;

__ds_ns.AppHeader = __ds_scope.AppHeader;

__ds_ns.BarraExcepcion = __ds_scope.BarraExcepcion;

__ds_ns.ResumenActa = __ds_scope.ResumenActa;

__ds_ns.Tarjeta = __ds_scope.Tarjeta;

__ds_ns.Campo = __ds_scope.Campo;

__ds_ns.EncabezadoForm = __ds_scope.EncabezadoForm;

})();
