import Layout from '@components/Layout';
import { useAdmin } from '@hooks/useProtegerRuta';
import { useState, useEffect } from 'react';
import TablaGenerica from '@components/TablaGenerica';
import Modal from '@components/Modal';
import FormularioMulti from '@components/FormularioMulti';
import { supabase } from '@lib/supabaseClient';
import { formatearFecha } from '@utils/formateo';
import styles from '@styles/TareasAdmin.module.css';

export default function TareasAdmin() {
  const { cargando: cargandoAuth } = useAdmin();
  const [tareas, setTareas] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroPlanta, setFiltroPlanta] = useState('todas');
  const [modalAbierta, setModalAbierta] = useState(false);
  const [modo, setModo] = useState('crear');
  const [cargandoFormulario, setCargandoFormulario] = useState(false);
  const [valores, setValores] = useState({
    titulo: '',
    descripcion: '',
    prioridad_id: '',
    planta_id: '',
    asignado_a: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_limite: '',
  });

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

      // Cargar tareas de todas las plantas
      const { data: tareasData, error: tareasErr } = await supabase
        .from('tareas')
        .select(
          '*, asignado_a_user:usuarios!asignado_a(nombre_completo), planta:plantas(nombre), prioridad:prioridades(nombre)'
        )
        .order('fecha_limite', { ascending: true });

      if (tareasErr) throw tareasErr;
      setTareas(tareasData || []);

      // Cargar todos los usuarios para asignar
      const { data: usuariosData, error: usuariosErr } = await supabase
        .from('usuarios')
        .select('id, nombre_completo, planta:plantas(nombre)')
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

  const handleNuevaTarea = () => {
    setModo('crear');
    setValores({
      titulo: '',
      descripcion: '',
      prioridad_id: '',
      planta_id: '',
      asignado_a: '',
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
        !valores.planta_id
      ) {
        throw new Error('Completa los campos requeridos');
      }

      const datosTarea = {
        titulo: valores.titulo,
        descripcion: valores.descripcion || '',
        prioridad_id: valores.prioridad_id,
        planta_id: valores.planta_id,
        asignado_a: valores.asignado_a || null,
        fecha_inicio: valores.fecha_inicio,
        fecha_limite: valores.fecha_limite,
        estado: 'pending',
        porcentaje_avance: 0,
      };

      if (modo === 'crear') {
        const { data, error: err } = await supabase
          .from('tareas')
          .insert([datosTarea])
          .select();

        if (err) throw err;
        setTareas([...tareas, data[0]]);
      }

      setModalAbierta(false);
      cargarDatos();
    } catch (err) {
      setError(err.message || 'Error guardando tarea');
    } finally {
      setCargandoFormulario(false);
    }
  };

  const columnasTabla = [
    { key: 'titulo', label: 'Título', ancho: '25%' },
    {
      key: 'planta',
      label: 'Planta',
      ancho: '15%',
      render: (val) => val?.nombre || '-',
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      ancho: '12%',
      render: (val) => val?.nombre || '-',
    },
    {
      key: 'asignado_a_user',
      label: 'Asignado a',
      ancho: '18%',
      render: (val) => val?.nombre_completo || 'Sin asignar',
    },
    {
      key: 'fecha_limite',
      label: 'Fecha Límite',
      ancho: '14%',
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
    return <Layout titulo="Todas las Tareas">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Todas las Tareas (Admin)">
      <div className={styles.contenedor}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.encabezado}>
          <div className={styles.titulo}>
            <h3>Gestión Global de Tareas</h3>
            <p className={styles.subtitulo}>
              {tareasFiltradas.length} de {tareas.length} tareas
            </p>
          </div>
          <button className={styles.botonNuevo} onClick={handleNuevaTarea}>
            + Nueva Tarea
          </button>
        </div>

        <div className={styles.filtros}>
          <select
            className={styles.select}
            value={filtroPlanta}
            onChange={(e) => setFiltroPlanta(e.target.value)}
          >
            <option value="todas">📋 Todas las Plantas</option>
            {plantas.map((p) => (
              <option key={p.id} value={p.id}>
                🏭 {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <TablaGenerica
          columnas={columnasTabla}
          datos={tareasFiltradas}
          acciones={acciones}
          cargando={cargando}
          vacio={tareasFiltradas.length === 0 ? 'No hay tareas' : ''}
        />
      </div>

      <Modal
        abierta={modalAbierta}
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
              nombre: 'planta_id',
              label: 'Planta',
              tipo: 'select',
              opciones: plantas.map((p) => ({ id: p.id, label: p.nombre })),
              requerido: true,
              mostrarEn: ['crear', 'editar'],
            },
            {
              nombre: 'prioridad_id',
              label: 'Prioridad',
              tipo: 'select',
              opciones: [
                { id: 'urgente', label: 'Urgente' },
                { id: 'alta', label: 'Alta' },
                { id: 'media', label: 'Media' },
                { id: 'baja', label: 'Baja' },
              ],
              requerido: true,
              mostrarEn: ['crear', 'editar'],
            },
            {
              nombre: 'asignado_a',
              label: 'Asignar a',
              tipo: 'select',
              opciones: usuarios.map((u) => ({
                id: u.id,
                label: `${u.nombre_completo} (${u.planta?.nombre})`,
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
