import Layout from '@components/Layout';
import { useSupervisor } from '@hooks/useProtegerRuta';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TablaGenerica from '@components/TablaGenerica';
import Modal from '@components/Modal';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import { formatearFecha } from '@utils/formateo';
import { FiFilter } from 'react-icons/fi';
import styles from '../../styles/TareasSupervisor.module.css';

export default function TareasSupervisor() {
  const { cargando: cargandoAuth } = useSupervisor();
  const { usuarioDetalles } = useAuth();
  const router = useRouter();
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas');

  // Modal reasignación
  const [modalReasignarAbierta, setModalReasignarAbierta] = useState(false);
  const [tareaReasignando, setTareaReasignando] = useState(null);
  const [nuevoAsignado, setNuevoAsignado] = useState('');
  const [cargandoReasignar, setCargandoReasignar] = useState(false);
  const [errorReasignar, setErrorReasignar] = useState('');

  useEffect(() => {
    if (!cargandoAuth && usuarioDetalles?.id) {
      cargarTareas();
      cargarUsuarios();
    }

    // --- SUSCRIPCIÓN REALTIME ---
    let channel = null;
    if (!cargandoAuth && usuarioDetalles?.id) {
      channel = supabase
        .channel('realtime-tareas-supervisor')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tareas',
          },
          (payload) => {
            // Recargar tareas ante cambios
            cargarTareas();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
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
      const tareasData = await callAPI('/api/supervisor/tareas');
      setTareas(tareasData || []);
    } catch (err) {
      console.error('Error cargando tareas:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre_completo')
        .eq('supervisor_id', usuarioDetalles?.id)
        .order('nombre_completo');
      setUsuarios(data || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const handleReasignar = (tarea) => {
    setTareaReasignando(tarea);
    setNuevoAsignado(tarea.asignado_a || '');
    setErrorReasignar('');
    setModalReasignarAbierta(true);
  };

  const handleGuardarReasignacion = async () => {
    if (!nuevoAsignado) {
      setErrorReasignar('Selecciona un usuario para reasignar');
      return;
    }

    if (nuevoAsignado === tareaReasignando.asignado_a) {
      setErrorReasignar('El usuario es el mismo. Selecciona otro');
      return;
    }

    try {
      setCargandoReasignar(true);
      setErrorReasignar('');

      await callAPI('/api/admin/asignar', 'POST', {
        tarea_id: tareaReasignando.id,
        usuario_id: nuevoAsignado,
      });

      // Actualizar tabla local
      setTareas(
        tareas.map((t) =>
          t.id === tareaReasignando.id ? { ...t, asignado_a: nuevoAsignado } : t
        )
      );

      setModalReasignarAbierta(false);
    } catch (err) {
      setErrorReasignar(err.message || 'Error reasignando tarea');
    } finally {
      setCargandoReasignar(false);
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
      onClick: (tarea) => router.push(`/supervisor/tarea/${tarea.id}`),
    },
    {
      label: 'Reasignar',
      color: 'warning',
      onClick: handleReasignar,
    },
  ];

  if (cargandoAuth || cargando) {
    return <Layout titulo="Mis Tareas">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Tareas de mis Usuarios" ocultarHeader>
      <section className={styles.hero}>
        <div className={styles.heroInfo}>
          <p className={styles.heroKicker}>Mis Tareas</p>
          <h1 className={styles.heroTitulo}>Gestiona tu trabajo</h1>
          <p className={styles.heroSubtitulo}>
            Consulta tus tareas asignadas. Reasigna a otro usuario bajo tu
            supervisión si es necesario.
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

      {/* Modal Reasignación */}
      <Modal
        abierto={modalReasignarAbierta}
        onCerrar={() => setModalReasignarAbierta(false)}
        titulo={`Reasignar — ${tareaReasignando?.titulo || ''}`}
        onAceptar={handleGuardarReasignacion}
        cargando={cargandoReasignar}
        modo="editar"
        textoAceptar="Reasignar"
      >
        {errorReasignar && (
          <div
            style={{
              color: '#991b1b',
              fontSize: '14px',
              marginBottom: '12px',
              padding: '8px 12px',
              background: '#fee2e2',
              borderRadius: '6px',
            }}
          >
            {errorReasignar}
          </div>
        )}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#0f172a',
            }}
          >
            Nuevo responsable
          </label>
          <select
            value={nuevoAsignado}
            onChange={(e) => setNuevoAsignado(e.target.value)}
            disabled={cargandoReasignar}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#0f172a',
              background: '#ffffff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">-- Seleccionar --</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre_completo}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </Layout>
  );
}
