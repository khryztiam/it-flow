import { useMemo, useState } from 'react';
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const cambiarOrden = (key) => {
    setSortConfig((actual) => {
      if (actual.key !== key) {
        return { key, direction: 'asc' };
      }

      if (actual.direction === 'asc') {
        return { key, direction: 'desc' };
      }

      if (actual.direction === 'desc') {
        return { key: null, direction: null };
      }

      return { key, direction: 'asc' };
    });
  };

  const obtenerValorOrden = (columna, fila) => {
    if (typeof columna.sortValue === 'function') {
      return columna.sortValue(fila[columna.key], fila);
    }

    return fila[columna.key];
  };

  const normalizarValor = (valor) => {
    if (valor === null || valor === undefined || valor === '') return null;
    if (typeof valor === 'number') return valor;
    if (valor instanceof Date) return valor.getTime();

    const fecha = Date.parse(valor);
    if (!Number.isNaN(fecha) && String(valor).includes('-')) {
      return fecha;
    }

    return String(valor).toLocaleLowerCase('es');
  };

  const datosOrdenados = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return datos;

    const columna = columnas.find((item) => item.key === sortConfig.key);
    if (!columna) return datos;

    return [...datos]
      .map((fila, index) => ({ fila, index }))
      .sort((a, b) => {
        const valorA = normalizarValor(obtenerValorOrden(columna, a.fila));
        const valorB = normalizarValor(obtenerValorOrden(columna, b.fila));

        if (valorA === valorB) return a.index - b.index;
        if (valorA === null) return 1;
        if (valorB === null) return -1;

        if (valorA > valorB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }

        if (valorA < valorB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }

        return a.index - b.index;
      })
      .map(({ fila }) => fila);
  }, [columnas, datos, sortConfig]);

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
            {columnas.map((col) => {
              const activa = sortConfig.key === col.key;
              const direccion = activa ? sortConfig.direction : null;

              return (
                <th key={col.key} style={{ width: col.ancho }}>
                  {col.sortable ? (
                    <button
                      type="button"
                      className={`${styles.sortButton} ${
                        activa ? styles.sortButtonActive : ''
                      }`}
                      onClick={() => cambiarOrden(col.key)}
                    >
                      <span>{col.label}</span>
                      <span className={styles.sortIcon} aria-hidden="true">
                        {direccion === 'asc'
                          ? '▲'
                          : direccion === 'desc'
                            ? '▼'
                            : '↕'}
                      </span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
            {acciones && acciones.length > 0 && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {datosOrdenados.map((fila, idx) => (
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
                      disabled={accion.disabled ? accion.disabled(fila) : false}
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
