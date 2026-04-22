import Layout from '@components/Layout';
import { useUser } from '@hooks/useProtegerRuta';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TablaGenerica from '@components/TablaGenerica';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import { formatearFecha } from '@utils/formateo';
import { FiFilter } from 'react-icons/fi';
import styles from '../../styles/TareasUser.module.css';

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

    const contentType = response.headers.get('content-type') || '';
    let payload = null;

    if (response.status !== 204) {
      if (contentType.includes('application/json')) {
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
      } else {
        const rawText = await response.text();
        payload = rawText ? { rawText } : null;
      }
    }

    if (!response.ok) {
      const detail =
        payload?.detail ||
        payload?.error ||
        payload?.message ||
        payload?.rawText ||
        response.statusText;
      throw new Error(detail);
    }

    return payload;
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
    {
      key: 'titulo',
      label: 'Titulo',
      ancho: '30%',
      render: (val) => val || '-',
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      ancho: '15%',
      render: (val) => (typeof val === 'object' ? val?.nombre : val) || '-',
    },
    {
      key: 'porcentaje_avance',
      label: 'Avance',
      ancho: '15%',
      render: (val) => {
        const porcentaje = val || 0;

        return (
          <div className={styles.barra}>
            <div style={{ position: 'relative', flex: 1, minWidth: '4rem' }}>
              <div
                className={styles.relleno}
                style={{
                  width: `${porcentaje}%`,
                  background:
                    porcentaje < 30
                      ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                      : porcentaje < 70
                        ? 'linear-gradient(90deg, #f97316, #ea580c)'
                        : 'linear-gradient(90deg, #22c55e, #16a34a)',
                }}
              ></div>
            </div>
            <span>{porcentaje}%</span>
          </div>
        );
      },
    },
    {
      key: 'fecha_limite',
      label: 'Fecha limite',
      ancho: '20%',
      render: (val) => formatearFecha(val),
    },
    {
      key: 'estado',
      label: 'Estado',
      ancho: '12%',
      render: (val) => (
        <span
          className={
            styles[
              `estado-${typeof val === 'object' ? val?.nombre : val || ''}`
            ]
          }
        >
          {(typeof val === 'object' ? val?.nombre : val) || '-'}
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
    <Layout titulo="Mis Tareas Asignadas" ocultarHeader>
      <section className={styles.hero}>
        <div className={styles.heroInfo}>
          <p className={styles.heroKicker}>Mis Tareas</p>
          <h1 className={styles.heroTitulo}>Tareas asignadas</h1>
          <p className={styles.heroSubtitulo}>
            Consulta tu listado de trabajo y filtra rapidamente por estado para
            enfocarte en lo pendiente.
          </p>
        </div>

        <div className={styles.heroFilterCard}>
          <label htmlFor="filtro-estado" className={styles.heroFilterLabel}>
            <FiFilter />
            <span>Estado</span>
          </label>
          <select
            id="filtro-estado"
            className={styles.heroSelect}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="en_proceso">En proceso</option>
            <option value="en_revision">En revision</option>
            <option value="completado">Completadas</option>
            <option value="detenido">Detenidas</option>
          </select>
        </div>
      </section>

      <div className={styles.contenedor}>
        <p className={styles.contador}>
          {tareasFiltradas.length} de {tareas.length} tareas
        </p>

        <TablaGenerica
          columnas={columnasTabla}
          datos={tareasFiltradas}
          acciones={acciones}
          cargando={cargando}
          vacio={tareasFiltradas.length === 0 ? 'No hay tareas' : ''}
        />
      </div>
    </Layout>
  );
}
