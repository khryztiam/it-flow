import Layout from '@components/Layout';
import { useSupervisor } from '@hooks/useProtegerRuta';
import { useState, useEffect } from 'react';
import TablaGenerica from '@components/TablaGenerica';
import Modal from '@components/Modal';
import FormularioMulti from '@components/FormularioMulti';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import { formatearFecha } from '@utils/formateo';
import styles from '@styles/TareasSupervisor.module.css';

export default function TareasSupervisor() {
  const { cargando: cargandoAuth } = useSupervisor();
  const { usuarioDetalles } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierta, setModalAbierta] = useState(false);
  const [modo, setModo] = useState('crear');
  const [cargandoFormulario, setCargandoFormulario] = useState(false);
  const [valores, setValores] = useState({
    titulo: '',
    descripcion: '',
    prioridad_id: '',
    asignado_a: '',
    estado_id: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_limite: '',
  });

  useEffect(() => {
    if (!cargandoAuth && usuarioDetalles?.planta_id) {
      cargarDatos();
    }
  }, [cargandoAuth, usuarioDetalles?.planta_id]);

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

    return response.json();
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      // Cargar datos desde APIs y Supabase
      const [prioridadesRes, estadosRes, tareasRes, usuariosRes] =
        await Promise.all([
          supabase.from('prioridades').select('id, nombre'),
          supabase.from('estados_tarea').select('id, nombre'),
          callAPI('/api/admin/tareas'),
          supabase
            .from('usuarios')
            .select('id, nombre_completo')
            .eq('planta_id', usuarioDetalles.planta_id)
            .eq('estado', 'activo'),
        ]);

      setPrioridades(prioridadesRes.data || []);
      setEstados(estadosRes.data || []);
      // Filtrar tareas de su planta
      setTareas(
        (tareasRes || []).filter(
          (t) => t.planta_id === usuarioDetalles.planta_id
        )
      );
      setUsuarios(usuariosRes.data || []);
    } catch (err) {
      setError(`Error cargando datos: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const handleNuevaTarea = () => {
    setModo('crear');
    setValores({
      titulo: '',
      descripcion: '',
      prioridad_id: '',
      asignado_a: '',
      estado_id: estados[0]?.id || '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_limite: '',
    });
    setModalAbierta(true);
  };

  const handleGuardar = async () => {
    setCargandoFormulario(true);
    setError('');

    try {
      if (
        !valores.titulo ||
        !valores.fecha_limite ||
        !valores.prioridad_id ||
        !valores.estado_id
      ) {
        throw new Error('Completa los campos requeridos');
      }

      const datosTarea = {
        titulo: valores.titulo,
        descripcion: valores.descripcion || '',
        prioridad_id: valores.prioridad_id,
        asignado_a: valores.asignado_a || null,
        estado_id: valores.estado_id,
        fecha_inicio: valores.fecha_inicio,
        fecha_limite: valores.fecha_limite,
        planta_id: usuarioDetalles.planta_id,
        porcentaje_avance: 0,
      };

      if (modo === 'crear') {
        const data = await callAPI('/api/admin/tareas', 'POST', datosTarea);
        setTareas([...tareas, data]);
      }

      setModalAbierta(false);
    } catch (err) {
      setError(err.message || 'Error guardando tarea');
    } finally {
      setCargandoFormulario(false);
    }
  };

  const columnasTabla = [
    { key: 'titulo', label: 'Título', ancho: '30%' },
    {
      key: 'prioridad',
      label: 'Prioridad',
      ancho: '15%',
      render: (val) => val?.nombre || '-',
    },
    {
      key: 'asignado_a_user',
      label: 'Asignado a',
      ancho: '20%',
      render: (val) => val?.nombre_completo || 'Sin asignar',
    },
    {
      key: 'fecha_limite',
      label: 'Fecha Límite',
      ancho: '15%',
      render: (val) => formatearFecha(val),
    },
    {
      key: 'estado',
      label: 'Estado',
      ancho: '12%',
      render: (val) => <span className={styles[`estado-${val}`]}>{val}</span>,
    },
  ];

  const acciones = [
    {
      label: 'Editar',
      color: 'info',
      onClick: () => alert('Editar tarea'),
    },
    {
      label: 'Eliminar',
      color: 'danger',
      onClick: () => alert('Eliminar tarea'),
    },
  ];

  if (cargandoAuth || cargando) {
    return <Layout titulo="Mis Tareas">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Gestión de Tareas">
      <div className={styles.contenedor}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.encabezado}>
          <h3>Tareas Asignadas</h3>
          <button className={styles.botonNuevo} onClick={handleNuevaTarea}>
            + Nueva Tarea
          </button>
        </div>

        <TablaGenerica
          columnas={columnasTabla}
          datos={tareas}
          acciones={acciones}
          cargando={cargando}
          vacio={tareas.length === 0 ? 'No hay tareas' : ''}
        />
      </div>

      <Modal
        abierto={modalAbierta}
        onCerrar={() => setModalAbierta(false)}
        titulo={`${modo === 'crear' ? 'Nueva' : 'Editar'} Tarea`}
        onAceptar={handleGuardar}
        cargando={cargandoFormulario}
      >
        <FormularioMulti
          modo={modo}
          campos={[
            {
              nombre: 'titulo',
              label: 'Título',
              tipo: 'text',
              requerido: true,
              mostrarEn: ['crear', 'editar'],
            },
            {
              nombre: 'descripcion',
              label: 'Descripción',
              tipo: 'textarea',
              mostrarEn: ['crear', 'editar'],
            },
            {
              nombre: 'prioridad_id',
              label: 'Prioridad',
              tipo: 'select',
              opciones: prioridades.map((p) => ({ id: p.id, label: p.nombre })),
              requerido: true,
              mostrarEn: ['crear', 'editar'],
            },
            {
              nombre: 'estado_id',
              label: 'Estado',
              tipo: 'select',
              opciones: estados.map((e) => ({ id: e.id, label: e.nombre })),
              requerido: true,
              mostrarEn: ['crear', 'editar'],
            },
            {
              nombre: 'asignado_a',
              label: 'Asignar a',
              tipo: 'select',
              opciones: usuarios.map((u) => ({
                id: u.id,
                label: u.nombre_completo,
              })),
              mostrarEn: ['crear', 'editar'],
            },
            {
              nombre: 'fecha_inicio',
              label: 'Fecha Inicio',
              tipo: 'text',
              requerido: true,
              mostrarEn: ['crear', 'editar'],
            },
            {
              nombre: 'fecha_limite',
              label: 'Fecha Límite',
              tipo: 'text',
              requerido: true,
              mostrarEn: ['crear', 'editar'],
            },
          ]}
          valores={valores}
          onCambio={(nombre, valor) =>
            setValores({ ...valores, [nombre]: valor })
          }
          cargando={cargandoFormulario}
        />
      </Modal>
    </Layout>
  );
}
