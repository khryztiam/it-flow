import styles from '@styles/TablaGenerica.module.css';

/**
 * Tabla genérica reutilizable con sorting y acciones
 * @param {Array} columnas - Array de {label, key, ancho?, render?}
 * @param {Array} datos - Array de objetos
 * @param {Array} acciones - Array de {label, onClick, icono?, color?}
 * @param {boolean} cargando - Estado de carga
 */
export default function TablaGenerica({
  columnas,
  datos,
  acciones,
  cargando = false,
  vacio = 'No hay datos',
}) {
  if (cargando) {
    return (
      <div className={styles.cargando}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!datos || datos.length === 0) {
    return (
      <div className={styles.vacio}>
        <p>{vacio}</p>
      </div>
    );
  }

  return (
    <div className={styles.contenedorTabla}>
      <table className={styles.tabla}>
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={col.key} style={{ width: col.ancho }}>
                {col.label}
              </th>
            ))}
            {acciones && acciones.length > 0 && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {datos.map((fila, idx) => (
            <tr key={fila.id || idx}>
              {columnas.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(fila[col.key], fila) : fila[col.key]}
                </td>
              ))}
              {acciones && acciones.length > 0 && (
                <td className={styles.acciones}>
                  {acciones.map((accion) => (
                    <button
                      key={accion.label}
                      className={`${styles.btn} ${styles[accion.color] || ''}`}
                      onClick={() => accion.onClick(fila)}
                      title={accion.label}
                    >
                      {accion.icono || accion.label}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
