import Layout from '@components/Layout';
import { useUser } from '@hooks/useProtegerRuta';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TablaGenerica from '@components/TablaGenerica';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import { formatearFecha } from '@utils/formateo';
import styles from '@styles/TareasUser.module.css';

export default function TareasUser() {
  const { cargando: cargandoAuth } = useUser();
  const { usuarioDetalles } = useAuth();
  const router = useRouter();
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas');

  useEffect(() => {
    if (!cargandoAuth && usuarioDetalles?.id) {
      cargarTareas();
    }
  }, [cargandoAuth, usuarioDetalles?.id]);

  // Obtener token del usuario actual
  const obtenerToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.access_token) {
      throw new Error('No autenticado');
    }
    return data.session.access_token;
  };

  const callAPI = async (url, method = 'GET', body = null) => {
    const token = await obtenerToken();
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || response.statusText);
    }

    if (response.status === 204) return null;
    return response.json();
  };

  const cargarTareas = async () => {
    try {
      setCargando(true);
      const tareasData = await callAPI('/api/user/tareas');
      setTareas(tareasData || []);
    } catch (err) {
      console.error('Error cargando tareas:', err);
    } finally {
      setCargando(false);
    }
  };

  const tareasFiltradas =
    filtroEstado === 'todas'
      ? tareas
      : tareas.filter((t) => t.estado?.nombre === filtroEstado);

  const columnasTabla = [
    { key: 'titulo', label: 'Título', ancho: '30%' },
    {
      key: 'prioridad',
      label: 'Prioridad',
      ancho: '15%',
      render: (val) => val?.nombre || '-',
    },
    {
      key: 'porcentaje_avance',
      label: 'Avance',
      ancho: '15%',
      render: (val) => (
        <div className={styles.barra}>
          <div
            className={styles.relleno}
            style={{ width: `${val || 0}%` }}
          ></div>
          <span>{val || 0}%</span>
        </div>
      ),
    },
    {
      key: 'fecha_limite',
      label: 'Fecha Límite',
      ancho: '20%',
      render: (val) => formatearFecha(val),
    },
    {
      key: 'estado',
      label: 'Estado',
      ancho: '12%',
      render: (val) => (
        <span className={styles[`estado-${val?.nombre || ''}`]}>
          {val?.nombre || '-'}
        </span>
      ),
    },
  ];

  const acciones = [
    {
      label: 'Ver',
      color: 'info',
      onClick: (tarea) => router.push(`/user/tarea/${tarea.id}`),
    },
  ];

  if (cargandoAuth || cargando) {
    return <Layout titulo="Mis Tareas">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Mis Tareas Asignadas">
      <div className={styles.contenedor}>
        <div className={styles.encabezado}>
          <div>
            <h3>Tareas Asignadas</h3>
            <p className={styles.contador}>
              {tareasFiltradas.length} de {tareas.length} tareas
            </p>
          </div>
          <select
            className={styles.filtro}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todas">📋 Todas</option>
            <option value="pending">⏳ Pendientes</option>
            <option value="en_proceso">⚙️ En Proceso</option>
            <option value="en_revision">👀 En Revisión</option>
            <option value="completado">✅ Completadas</option>
            <option value="detenido">❌ Detenidas</option>
          </select>
        </div>

        <TablaGenerica
          columnas={columnasTabla}
          datos={tareasFiltradas}
          acciones={acciones}
          cargando={cargando}
          vacio={tareasFiltradas.length === 0 ? '✨ No hay tareas' : ''}
        />
      </div>
    </Layout>
  );
}
