import Layout from '@components/Layout';
import { useSupervisor } from '@hooks/useProtegerRuta';
import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuth } from '@context/AuthContext';
import styles from '@styles/DashboardSupervisor.module.css';

export default function SupervisorDashboard() {
  const { cargando: cargandoAuth } = useSupervisor();
  const { usuarioDetalles } = useAuth();
  const [stats, setStats] = useState({
    tareasAsignadas: 0,
    tareasEnProceso: 0,
    tareasCompletadas: 0,
    tareasVencidas: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!cargandoAuth && usuarioDetalles?.planta_id) {
      cargarStats();
    }
  }, [cargandoAuth, usuarioDetalles?.planta_id]);

  const cargarStats = async () => {
    try {
      // Obtener todas las tareas de la planta del supervisor
      const { data: tareas, error: err } = await supabase
        .from('tareas')
        .select('id, estado, fecha_limite')
        .eq('planta_id', usuarioDetalles.planta_id);

      if (err) throw err;

      const ahora = new Date();
      const stats = {
        tareasAsignadas: tareas.length,
        tareasEnProceso: tareas.filter((t) => t.estado === 'en_proceso').length,
        tareasCompletadas: tareas.filter((t) => t.estado === 'completado')
          .length,
        tareasVencidas: tareas.filter((t) => {
          const fechaLimite = new Date(t.fecha_limite);
          return fechaLimite < ahora && t.estado !== 'completado';
        }).length,
      };

      setStats(stats);
    } catch (err) {
      console.error('Error cargando stats:', err);
    } finally {
      setCargando(false);
    }
  };

  if (cargandoAuth || cargando) {
    return <Layout titulo="Dashboard">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Dashboard - Supervisor">
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.icono}>📋</div>
          <div className={styles.contenido}>
            <p className={styles.label}>Tareas Asignadas</p>
            <p className={styles.numero}>{stats.tareasAsignadas}</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.icono}>⚙️</div>
          <div className={styles.contenido}>
            <p className={styles.label}>En Proceso</p>
            <p className={styles.numero}>{stats.tareasEnProceso}</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.icono}>✅</div>
          <div className={styles.contenido}>
            <p className={styles.label}>Completadas</p>
            <p className={styles.numero}>{stats.tareasCompletadas}</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.icono}>⚠️</div>
          <div className={styles.contenido}>
            <p className={styles.label}>Vencidas</p>
            <p className={styles.numero}>{stats.tareasVencidas}</p>
          </div>
        </div>
      </div>

      <div className={styles.seccion}>
        <h3>Acciones Rápidas</h3>
        <div className={styles.botones}>
          <a href="/supervisor/tareas" className={styles.enlace}>
            Crear Nueva Tarea
          </a>
          <a href="/supervisor/asignaciones" className={styles.enlace}>
            Gestionar Asignaciones
          </a>
        </div>
      </div>
    </Layout>
  );
}
