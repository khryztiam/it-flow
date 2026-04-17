import Layout from '@components/Layout';
import { useUser } from '@hooks/useProtegerRuta';
import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import styles from '@styles/DashboardUser.module.css';

export default function UserDashboard() {
  const { cargando: cargandoAuth } = useUser();
  const { usuarioDetalles } = useAuth();
  const [stats, setStats] = useState({
    tareasAsignadas: 0,
    tareasCompletas: 0,
    tareasEnProceso: 0,
    avancePromedio: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!cargandoAuth && usuarioDetalles?.id) {
      cargarStats();
    }
  }, [cargandoAuth, usuarioDetalles?.id]);

  const cargarStats = async () => {
    try {
      const { data: tareas, error: err } = await supabase
        .from('tareas')
        .select('id, estado, porcentaje_avance')
        .eq('asignado_a', usuarioDetalles.id);

      if (err) throw err;

      const stats = {
        tareasAsignadas: tareas.length,
        tareasCompletas: tareas.filter((t) => t.estado === 'completado').length,
        tareasEnProceso: tareas.filter((t) => t.estado === 'en_proceso').length,
        avancePromedio:
          tareas.length > 0
            ? Math.round(
                tareas.reduce((sum, t) => sum + (t.porcentaje_avance || 0), 0) /
                  tareas.length
              )
            : 0,
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
    <Layout titulo="Mi Dashboard">
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
            <p className={styles.numero}>{stats.tareasCompletas}</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.icono}>📊</div>
          <div className={styles.contenido}>
            <p className={styles.label}>Avance Promedio</p>
            <p className={styles.numero}>{stats.avancePromedio}%</p>
          </div>
        </div>
      </div>

      <div className={styles.seccion}>
        <h3>Acciones Rápidas</h3>
        <div className={styles.botones}>
          <a href="/user/tareas" className={styles.enlace}>
            Ver Mis Tareas
          </a>
        </div>
      </div>
    </Layout>
  );
}
