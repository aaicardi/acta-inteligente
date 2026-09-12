import Modal from './Modal';
import { Boton } from './ds';

// Se monta junto al TabBar en cada pantalla que lo tiene (inicio, trabajo,
// histórico): así "Cuenta" da acceso a sesión/admin sin importar en qué punto
// del flujo esté el inspector, en vez de vivir escondido solo en la pantalla
// de inicio — que casi nunca se ve una vez hay un acta en curso.
export default function ModalCuenta({ sesion, onCerrar, onCerrarSesion, onAbrirAdmin }) {
  return (
    <Modal titulo="Cuenta" onCerrar={onCerrar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--t-10)', letterSpacing: 'var(--track-label)', textTransform: 'uppercase', color: 'var(--grafito)' }}>
            Sesión activa
          </div>
          <div style={{ fontSize: 'var(--t-15)', color: 'var(--tinta)', marginTop: '2px' }}>{sesion.usuario?.email}</div>
        </div>

        {sesion.usuario?.rol === 'admin' && (
          <Boton
            variante="secundaria"
            talla="md"
            onClick={() => {
              onCerrar();
              onAbrirAdmin();
            }}
          >
            Administración
          </Boton>
        )}

        <Boton variante="secundaria" talla="md" onClick={onCerrarSesion}>
          Cerrar sesión
        </Boton>
      </div>
    </Modal>
  );
}
