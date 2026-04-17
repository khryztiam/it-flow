import styles from '@styles/Tabs.module.css';

/**
 * Componente Tabs (pestañas)
 * @param {Array} tabs - Array de {id, label, icono?}
 * @param {string} activo - ID del tab activo
 * @param {function} onChange - Callback al cambiar tab
 */
export default function Tabs({ tabs, activo, onChange }) {
  return (
    <div className={styles.contenedor}>
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activo === tab.id ? styles.activo : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icono && <span className={styles.icono}>{tab.icono}</span>}
            <span>{tab.label}</span>
            {tab.count && <span className={styles.badge}>{tab.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
