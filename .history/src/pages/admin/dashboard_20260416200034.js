import Layout from '@components/Layout';
import { useAdmin } from '@hooks/useProtegerRuta';
import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';
import styles from '@styles/DashboardAdmin.module.css';

export default function AdminDashboard() {
  const { cargando: cargandoAuth } = useAdmin();
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalPlantas: 0,
    totalPaises: 0,
    totalTareas: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!cargandoAuth) {
      cargarStats();
    }
  }, [cargandoAuth]);

  const cargarStats = async () => {
    try {
      const [usuarios, plantas, paises, tareas] = await Promise.all([
        supabase.from('usuarios').select('id', { count: 'exact' }),
        supabase.from('plantas').select('id', { count: 'exact' }),
        supabase.from('paises').select('id', { count: 'exact' }),
        supabase.from('tareas').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalUsuarios: usuarios.count || 0,
        totalPlantas: plantas.count || 0,
        totalPaises: paises.count || 0,
        totalTareas: tareas.count || 0,
      });
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
    <Layout titulo="Dashboard">
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.icono}>👥</div>
          <div className={styles.contenido}>
            <p className={styles.label}>Total de Usuarios</p>
            <p className={styles.numero}>{stats.totalUsuarios}</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.icono}>🏭</div>
          <div className={styles.contenido}>
            <p className={styles.label}>Total de Plantas</p>
            <p className={styles.numero}>{stats.totalPlantas}</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.icono}>🌍</div>
          <div className={styles.contenido}>
            <p className={styles.label}>Total de Países</p>
            <p className={styles.numero}>{stats.totalPaises}</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.icono}>✅</div>
          <div className={styles.contenido}>
            <p className={styles.label}>Total de Tareas</p>
            <p className={styles.numero}>{stats.totalTareas}</p>
          </div>
        </div>
      </div>

      <div className={styles.seccion}>
        <h3>Acciones Rápidas</h3>
        <div className={styles.botones}>
          <a href="/admin/gestion" className={styles.enlace}>
            Gestionar Configuración
          </a>
        </div>
      </div>
    </Layout>
  );
}
