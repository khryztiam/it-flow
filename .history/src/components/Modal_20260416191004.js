import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import styles from '@styles/Modal.module.css';

/**
 * Modal reutilizable
 * @param {boolean} abierto - Si está abierto
 * @param {function} onCerrar - Callback al cerrar
 * @param {string} titulo - Título del modal
 * @param {ReactNode} children - Contenido
 * @param {function} onAceptar - Callback botón aceptar (opcional)
 * @param {boolean} cargando - Estado de carga
 */
export default function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  onAceptar,
  onEliminar,
  cargando = false,
  modo = 'ver',
  textoCancel = 'Cancelar',
}) {
  // Cerrar con ESC
  useEffect(() => {
    if (!abierto) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCerrar();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [abierto, onCerrar]);

  const estaEditando = modo === 'crear' || modo === 'editar';

  const textoAceptar = 
    modo === 'crear' ? 'Crear' : 
    modo === 'editar' ? 'Actualizar' : 
    'Guardar';

  if (!abierto) return null;

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.contenedor} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>{titulo}</h2>
          <button
            className={styles.btnCerrar}
            onClick={onCerrar}
            disabled={cargando}
          >
            <FiX />
          </button>
        </header>

        <div className={styles.cuerpo}>{children}</div>

        <footer className={styles.footer}>
          <button
            className={styles.btnCancel}
            onClick={onCerrar}
            disabled={cargando}
          >
            {textoCancel}
          </button>

          {onEliminar && modo === 'editar' && (
            <button
              className={styles.btnEliminar}
              onClick={onEliminar}
              disabled={cargando}
            >
              {cargando ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}

          {estaEditando && onAceptar && (
            <button
              className={styles.btnAceptar}
              onClick={onAceptar}
              disabled={cargando}
            >
              {cargando ? 'Guardando...' : textoAceptar}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
