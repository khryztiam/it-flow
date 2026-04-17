import { useState } from 'react';
import styles from '@styles/FormularioMulti.module.css';

/**
 * Formulario multiforms (crear/editar/eliminar en un solo componente)
 */
export default function FormularioMulti({
  modo, // 'crear', 'editar' o 'ver'
  campos, // Array de {name, label, type, required, options?, disabled?}
  valores, // Objeto con valores actuales
  onCambio, // Callback al cambiar campo
  cargando = false,
  error = null,
}) {
  const esVisible = (campo) => {
    if (!campo.mostrarEn) return true;
    return campo.mostrarEn.includes(modo);
  };

  const esEditando = modo === 'editar' || modo === 'crear';

  return (
    <div className={styles.formulario}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.campos}>
        {campos.map((campo) => {
          if (!esVisible(campo)) return null;

          return (
            <div key={campo.name} className={styles.grupo}>
              <label className={styles.label}>
                {campo.label}
                {campo.required && (
                  <span className={styles.obligatorio}>*</span>
                )}
              </label>

              {campo.type === 'text' ||
              campo.type === 'email' ||
              campo.type === 'password' ? (
                <input
                  type={campo.type}
                  name={campo.name}
                  value={valores[campo.name] || ''}
                  onChange={(e) => onCambio(campo.name, e.target.value)}
                  disabled={!esEditando || campo.disabled}
                  className={styles.input}
                  placeholder={campo.placeholder}
                  required={campo.required && esEditando}
                />
              ) : campo.type === 'number' ? (
                <input
                  type="number"
                  name={campo.name}
                  value={valores[campo.name] || 0}
                  onChange={(e) =>
                    onCambio(campo.name, parseInt(e.target.value))
                  }
                  disabled={!esEditando || campo.disabled}
                  className={styles.input}
                  required={campo.required && esEditando}
                />
              ) : campo.type === 'textarea' ? (
                <textarea
                  name={campo.name}
                  value={valores[campo.name] || ''}
                  onChange={(e) => onCambio(campo.name, e.target.value)}
                  disabled={!esEditando || campo.disabled}
                  className={styles.textarea}
                  rows={3}
                  placeholder={campo.placeholder}
                  required={campo.required && esEditando}
                />
              ) : campo.type === 'select' ? (
                <select
                  name={campo.name}
                  value={valores[campo.name] || ''}
                  onChange={(e) => onCambio(campo.name, e.target.value)}
                  disabled={!esEditando || campo.disabled}
                  className={styles.select}
                  required={campo.required && esEditando}
                >
                  <option value="">-- Seleccionar --</option>
                  {campo.options?.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : null}

              {campo.ayuda && <p className={styles.ayuda}>{campo.ayuda}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
