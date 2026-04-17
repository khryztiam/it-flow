import Layout from '@components/Layout';
import { useAdmin } from '@hooks/useProtegerRuta';
import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabaseClient';
import styles from '@styles/AsignacionesAdmin.module.css';

export default function AsignacionesAdmin() {
  const { cargando: cargandoAuth } = useAdmin();
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroPlanta, setFiltroPlanta] = useState('todas');

  useEffect(() => {
    if (!cargandoAuth) {
      cargarDatos();
    }
  }, [cargandoAuth]);

  const cargarDatos = async () => {
    try {
      // Cargar plantas
      const { data: plantasData, error: plantasErr } = await supabase
        .from('plantas')
        .select('id, nombre');

      if (plantasErr) throw plantasErr;
      setPlantas(plantasData || []);

      // Cargar tareas sin asignar de todas las plantas
      const { data: tareasData, error: tareasErr } = await supabase
        .from('tareas')
        .select('*, prioridad:prioridades(nombre), planta:plantas(nombre)')
        .is('asignado_a', null)
        .order('fecha_limite', { ascending: true });

      if (tareasErr) throw tareasErr;
      setTareas(tareasData || []);

      // Cargar todos los usuarios para asignar
      const { data: usuariosData, error: usuariosErr } = await supabase
        .from('usuarios')
        .select('id, nombre_completo, email, planta:plantas(id, nombre)')
        .eq('estado', 'activo');

      if (usuariosErr) throw usuariosErr;
      setUsuarios(usuariosData || []);
    } catch (err) {
      setError(`Error cargando datos: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const tareasFiltradas =
    filtroPlanta === 'todas'
      ? tareas
      : tareas.filter((t) => t.planta_id === filtroPlanta);

  const handleAsignar = async (tareaId, usuarioId) => {
    try {
      setError('');
      const { error: err } = await supabase
        .from('tareas')
        .update({ asignado_a: usuarioId })
        .eq('id', tareaId);

      if (err) throw err;

      setTareas(tareas.filter((t) => t.id !== tareaId));
    } catch (err) {
      setError(`Error asignando tarea: ${err.message}`);
    }
  };

  if (cargandoAuth || cargando) {
    return <Layout titulo="Asignaciones">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Gestión Global de Asignaciones (Admin)">
      <div className={styles.contenedor}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.encabezado}>
          <div className={styles.titulo}>
            <h3>Tareas sin Asignar - Todas las Plantas</h3>
            <p className={styles.contador}>{tareasFiltradas.length} tareas</p>
          </div>
        </div>

        <div className={styles.filtros}>
          <select
            className={styles.select}
            value={filtroPlanta}
            onChange={(e) => setFiltroPlanta(e.target.value)}
          >
            <option value="todas">📋 TODAS LAS PLANTAS</option>
            {plantas.map((p) => (
              <option key={p.id} value={p.id}>
                🏭 {p.nombre}
              </option>
            ))}
          </select>
        </div>

        {tareasFiltradas.length === 0 ? (
          <div className={styles.vacio}>
            <p>✅ Todas las tareas han sido asignadas</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {tareasFiltradas.map((tarea) => (
              <div key={tarea.id} className={styles.tarjeta}>
                <div className={styles.encabezadoTarjeta}>
                  <div>
                    <h4 className={styles.titulo}>{tarea.titulo}</h4>
                    <p className={styles.planta}>🏭 {tarea.planta?.nombre}</p>
                  </div>
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
                    className={styles.selectAsignar}
                    onChange={(e) => handleAsignar(tarea.id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="">-- Seleccionar usuario --</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre_completo} ({u.planta?.nombre})
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
