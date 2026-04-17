import Layout from '@components/Layout';
import { useSupervisor } from '@hooks/useProtegerRuta';
import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import styles from '@styles/Asignaciones.module.css';

export default function Asignaciones() {
  const { cargando: cargandoAuth } = useSupervisor();
  const { usuarioDetalles } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('todos');

  useEffect(() => {
    if (!cargandoAuth && usuarioDetalles?.planta_id) {
      cargarDatos();
    }
  }, [cargandoAuth, usuarioDetalles?.planta_id]);

  const cargarDatos = async () => {
    try {
      // Cargar tareas sin asignar
      const { data: tareasData, error: tareasErr } = await supabase
        .from('tareas')
        .select('*, prioridad:prioridades(nombre)')
        .eq('planta_id', usuarioDetalles.planta_id)
        .is('asignado_a', null)
        .order('fecha_limite', { ascending: true });

      if (tareasErr) throw tareasErr;
      setTareas(tareasData || []);

      // Cargar usuarios para asignar
      const { data: usuariosData, error: usuariosErr } = await supabase
        .from('usuarios')
        .select('id, nombre_completo, email')
        .eq('planta_id', usuarioDetalles.planta_id)
        .eq('estado', 'activo');

      if (usuariosErr) throw usuariosErr;
      setUsuarios(usuariosData || []);
    } catch (err) {
      setError(`Error cargando datos: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const handleAsignar = async (tareaId, usuarioId) => {
    try {
      setError('');
      const { error: err } = await supabase
        .from('tareas')
        .update({ asignado_a: usuarioId })
        .eq('id', tareaId);

      if (err) throw err;

      setTareas(tareas.filter((t) => t.id !== tareaId));
      // Recargar para mantener actualizado
      cargarDatos();
    } catch (err) {
      setError(`Error asignando tarea: ${err.message}`);
    }
  };

  if (cargandoAuth || cargando) {
    return <Layout titulo="Asignaciones">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Gestión de Asignaciones">
      <div className={styles.contenedor}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.encabezado}>
          <h3>Tareas sin Asignar</h3>
          <p className={styles.contador}>{tareas.length} tareas</p>
        </div>

        {tareas.length === 0 ? (
          <div className={styles.vacio}>
            <p>✅ Todas las tareas han sido asignadas</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {tareas.map((tarea) => (
              <div key={tarea.id} className={styles.tarjeta}>
                <div className={styles.encabezadoTarjeta}>
                  <h4 className={styles.titulo}>{tarea.titulo}</h4>
                  <span className={styles.prioridad}>
                    {tarea.prioridad?.nombre || 'N/A'}
                  </span>
                </div>

                <p className={styles.descripcion}>{tarea.descripcion}</p>

                <div className={styles.info}>
                  <span>
                    📅 {new Date(tarea.fecha_limite).toLocaleDateString()}
                  </span>
                </div>

                <div className={styles.usuarios}>
                  <label>Asignar a:</label>
                  <select
                    className={styles.select}
                    onChange={(e) => handleAsignar(tarea.id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="">-- Seleccionar usuario --</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
