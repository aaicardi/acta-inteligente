import { cloneElement } from 'react';

// Contenedor raíz de cada pantalla de la app. Reemplaza el patrón repetido
// `position:fixed; inset:0; maxWidth:480px; margin:0 auto` que había en
// App.jsx/Historico.jsx/HistoricoDetalle.jsx/AdminPanel.jsx: eso fijaba un
// "viewport" de ancho móvil centrado incluso en monitores grandes.
//
// < 1024px (móvil/tablet): columna única a todo el ancho, igual que antes,
// con el TabBar como barra inferior.
// >= 1024px (desktop): sidebar fija con el TabBar en modo vertical a la
// izquierda + panel de contenido centrado con ancho máximo generoso, para
// aprovechar el espacio horizontal en vez de dejarlo vacío.
//
// `tabBar` se recibe como un <TabBar .../> ya armado (con sus props de
// datos) y aquí se clona dos veces con la orientación correcta: los dos se
// montan siempre, CSS decide cuál se ve en cada breakpoint.
export default function AppShell({ tabBar, children }) {
  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--bond)] lg:flex-row">
      {tabBar && (
        <div className="hidden lg:block lg:flex-shrink-0">
          {cloneElement(tabBar, { orientacion: 'vertical' })}
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="mx-auto flex min-h-0 w-full flex-1 flex-col lg:max-w-[1400px]">
          {children}
        </div>
      </div>
      {tabBar && <div className="lg:hidden">{cloneElement(tabBar, { orientacion: 'horizontal' })}</div>}
    </div>
  );
}
