import Layout from '@components/Layout';
import { useSupervisor } from '@hooks/useProtegerRuta';
import { useState, useEffect, useRef } from 'react';
import TablaGenerica from '@components/TablaGenerica';
import Modal from '@components/Modal';
import FormularioMulti from '@components/FormularioMulti';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import {
  formatearFecha,
  obtenerTextoEstado,
  obtenerTextoPrioridad,
} from '@utils/formateo';
import {
  FiCalendar,
  FiDownload,
  FiExternalLink,
  FiFile,
  FiFilter,
  FiImage,
  FiMessageSquare,
  FiPlus,
} from 'react-icons/fi';
import styles from '@styles/Asignaciones.module.css';

export default function AsignacionesSupervisor() {
  const { cargando: cargandoAuth } = useSupervisor();
  const { usuarioDetalles } = useAuth();
  const montadoRef = useRef(true);
  const [tareas, setTareas] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas');
  const [filtroPlanta, setFiltroPlanta] = useState('todas');

  // Modales
  const [modalEvidencias, setModalEvidencias] = useState(false);
  const [evidenciasTarea, setEvidenciasTarea] = useState([]);
  const [cargandoEvidencias, setCargandoEvidencias] = useState(false);
  const [tituloTareaEvidencias, setTituloTareaEvidencias] = useState('');
  const [modalComentarios, setModalComentarios] = useState(false);
  const [comentariosTarea, setComentariosTarea] = useState([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [tituloTareaComentarios, setTituloTareaComentarios] = useState('');
  const [cargandoEliminar, setCargandoEliminar] = useState(false);
  const [tareaEliminando, setTareaEliminando] = useState(null);

  // Modal creación tarea
  const [modalAbierta, setModalAbierta] = useState(false);
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

  // Modal detalles/actualización de tarea
  useEffect(() => {
    montadoRef.current = true;
    if (!cargandoAuth && usuarioDetalles?.id) {
      cargarDatos();
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
            // Recargar datos ante cambios
            cargarDatos();
          }
        )
        .subscribe();
    }

    return () => {
      montadoRef.current = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [cargandoAuth, usuarioDetalles?.id]);

  const resumirResponsable = (nombre) => {
    if (!nombre) return 'Sin asignar';
    const partes = nombre.split(' ').filter(Boolean);
    if (partes.length <= 2) return partes.join(' ');
    return `${partes[0]} ${partes[1]}`;
  };

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
      const data = await response.json();
      throw new Error(data.detail || data.error || response.statusText);
    }

    return response.json();
  };

  const cargarDatos = async () => {
    try {
      if (montadoRef.current) setCargando(true);
      setError('');

      const [prioridadesRes, estadosRes, tareasRes, usuariosRes, plantasRes] =
        await Promise.all([
          supabase.from('prioridades').select('id, nombre'),
          supabase.from('estados_tarea').select('id, nombre'),
          callAPI('/api/supervisor/tareas/todas'),
          supabase
            .from('usuarios')
            .select('id, nombre_completo')
            .eq('supervisor_id', usuarioDetalles?.id),
          supabase.from('plantas').select('id, nombre').order('nombre'),
        ]);

      if (montadoRef.current) {
        console.log('✅ Datos cargados:', {
          prioridades: prioridadesRes.data?.length,
          estados: estadosRes.data?.length,
          tareas: Array.isArray(tareasRes) ? tareasRes.length : 'NO ES ARRAY',
          usuarioDetalles: usuarioDetalles?.id,
          tareasData: tareasRes,
        });

        // Debug: Llamar endpoint de debug
        try {
          const debugRes = await callAPI('/api/supervisor/tareas/debug');
          console.log('🔍 DEBUG INFO:', debugRes.debug);
        } catch (debugErr) {
          console.log('Debug endpoint no disponible:', debugErr.message);
        }

        setPrioridades(prioridadesRes.data || []);
        setEstados(estadosRes.data || []);
        setTareas(Array.isArray(tareasRes) ? tareasRes : []);
        setUsuarios(usuariosRes.data || []);
        setPlantas(plantasRes.data || []);
      }
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      if (montadoRef.current) setError(`Error cargando datos: ${err.message}`);
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  };

  const tareasFiltradas = tareas.filter((tarea) => {
    const cumpleResponsable =
      filtroResponsable === 'todos' ||
      tarea.asignado_a_user?.id === filtroResponsable;
    const cumpleEstado =
      filtroEstado === 'todos' || tarea.estado?.id === filtroEstado;
    const cumplePrioridad =
      filtroPrioridad === 'todas' || tarea.prioridad?.id === filtroPrioridad;
    const cumplePlanta =
      filtroPlanta === 'todas' || tarea.planta_id === filtroPlanta;

    const fechaTarea = tarea.fecha_limite
      ? tarea.fecha_limite.split('T')[0]
      : null;
    const cumpleFechaDesde =
      !fechaDesde || !fechaTarea || fechaTarea >= fechaDesde;
    const cumpleFechaHasta =
      !fechaHasta || !fechaTarea || fechaTarea <= fechaHasta;

    const terminoBusqueda = busqueda.trim().toLowerCase();
    const cumpleBusqueda =
      !terminoBusqueda ||
      (tarea.titulo && tarea.titulo.toLowerCase().includes(terminoBusqueda)) ||
      (tarea.descripcion &&
        tarea.descripcion.toLowerCase().includes(terminoBusqueda));

    return (
      cumpleResponsable &&
      cumpleEstado &&
      cumplePrioridad &&
      cumplePlanta &&
      cumpleFechaDesde &&
      cumpleFechaHasta &&
      cumpleBusqueda
    );
  });

  const opcionesResponsables = usuarios
    .map((usuario) => ({
      id: usuario.id,
      label: resumirResponsable(usuario.nombre_completo).toUpperCase(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));

  const opcionesEstados = estados
    .map((estado) => ({
      id: estado.id,
      label: obtenerTextoEstado(estado.nombre).toUpperCase(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));

  const opcionesPrioridades = prioridades
    .map((prioridad) => ({
      id: prioridad.id,
      label: obtenerTextoPrioridad(prioridad.nombre).toUpperCase(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));

  const opcionesPlantas = plantas
    .map((planta) => ({
      id: planta.id,
      label: planta.nombre.toUpperCase(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));

  const limpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
    setBusqueda('');
    setFiltroResponsable('todos');
    setFiltroEstado('todos');
    setFiltroPrioridad('todas');
    setFiltroPlanta('todas');
  };

  const escaparCSV = (valor) => {
    if (valor === null || valor === undefined) return '';
    const texto = String(valor).replace(/"/g, '""');
    return `"${texto}"`;
  };

  const exportarTareas = () => {
    if (!tareasFiltradas.length) return;

    const encabezados = [
      'Titulo',
      'Descripcion',
      'Prioridad',
      'Asignado a',
      'Estado',
      'Fecha limite',
      'Avance',
    ];

    const filas = tareasFiltradas.map((tarea) => [
      tarea.titulo,
      tarea.descripcion || '',
      tarea.prioridad?.nombre || '',
      tarea.asignado_a_user?.nombre_completo || 'Sin asignar',
      tarea.estado?.nombre || '',
      tarea.fecha_limite ? formatearFecha(tarea.fecha_limite) : '',
      `${tarea.porcentaje_avance || 0}%`,
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map(escaparCSV).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${contenido}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `tareas-supervisor-${fecha}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNuevaTarea = () => {
    setValores({
      titulo: '',
      descripcion: '',
      planta_id: usuarioDetalles?.planta_id || '',
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
        planta_id: valores.planta_id,
        prioridad_id: valores.prioridad_id,
        asignado_a: valores.asignado_a || null,
        estado_id: valores.estado_id,
        fecha_inicio: valores.fecha_inicio,
        fecha_limite: valores.fecha_limite,
      };

      const data = await callAPI(
        '/api/supervisor/tareas/crear',
        'POST',
        datosTarea
      );
      setTareas([...tareas, data]);
      setModalAbierta(false);
    } catch (err) {
      setError(err.message || 'Error guardando tarea');
    } finally {
      setCargandoFormulario(false);
    }
  };

  // Modal detalles/actualización de tarea
  const handleVerEvidencias = async (tarea) => {
    setTituloTareaEvidencias(tarea.titulo);
    setModalEvidencias(true);
    setCargandoEvidencias(true);
    setError('');

    try {
      const res = await callAPI(
        `/api/supervisor/tareas/${tarea.id}/evidencias`
      );
      // res es un array de evidencias directamente
      const evidencias = Array.isArray(res) ? res : res?.data || [];
      setEvidenciasTarea(evidencias);
    } catch (err) {
      console.error('Error cargando evidencias:', err);
      setEvidenciasTarea([]);
      if (err.message.includes('404')) {
        setError('Tarea no encontrada o no tienes acceso');
      } else if (err.message.includes('403')) {
        setError('No tienes permiso para ver esta tarea');
      } else {
        setError(`Error cargando evidencias: ${err.message}`);
      }
    } finally {
      setCargandoEvidencias(false);
    }
  };

  const handleVerComentarios = async (tarea) => {
    setTituloTareaComentarios(tarea.titulo);
    setModalComentarios(true);
    setCargandoComentarios(true);
    setError('');

    try {
      const { data: comentarios, error: fetchErr } = await supabase
        .from('comentarios_tarea')
        .select('*, usuario:usuarios(id, nombre_completo)')
        .eq('tarea_id', tarea.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setComentariosTarea(comentarios || []);
    } catch (err) {
      console.error('Error cargando comentarios:', err);
      setComentariosTarea([]);
      setError(`Error cargando comentarios: ${err.message}`);
    } finally {
      setCargandoComentarios(false);
    }
  };

  const handleEliminar = async (tarea) => {
    if (
      !window.confirm(
        `¿Eliminar tarea "${tarea.titulo}"?\n\nEsta acción es irreversible.`
      )
    ) {
      return;
    }

    setCargandoEliminar(true);
    setTareaEliminando(tarea.id);

    try {
      await callAPI(`/api/supervisor/tareas/${tarea.id}`, 'DELETE');
      setTareas(tareas.filter((t) => t.id !== tarea.id));
    } catch (err) {
      setError(err.message || 'Error eliminando tarea');
    } finally {
      setCargandoEliminar(false);
      setTareaEliminando(null);
    }
  };

  const columnasTabla = [
    {
      key: 'titulo',
      label: 'Título',
      ancho: '25%',
      sortable: true,
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      ancho: '12%',
      sortable: true,
      render: (val) => obtenerTextoPrioridad(val?.nombre) || '-',
      sortValue: (val) => obtenerTextoPrioridad(val?.nombre) || '',
    },
    {
      key: 'asignado_a_user',
      label: 'Asignado a',
      ancho: '18%',
      sortable: true,
      render: (val) => resumirResponsable(val?.nombre_completo),
      sortValue: (val) => resumirResponsable(val?.nombre_completo),
    },
    {
      key: 'fecha_limite',
      label: 'Fecha Límite',
      ancho: '14%',
      sortable: true,
      render: (val) => formatearFecha(val),
    },
    {
      key: 'estado',
      label: 'Estado',
      ancho: '12%',
      sortable: true,
      render: (val) => (
        <span className={styles[`estado-${val?.nombre}`]}>
          {obtenerTextoEstado(val?.nombre)}
        </span>
      ),
      sortValue: (val) => obtenerTextoEstado(val?.nombre) || '',
    },
  ];

  const acciones = [
    {
      label: 'Comentarios',
      color: 'info',
      onClick: (tarea) => handleVerComentarios(tarea),
    },
    {
      label: 'Evidencias',
      color: 'info',
      onClick: (tarea) => handleVerEvidencias(tarea),
    },
    {
      label: cargandoEliminar && tareaEliminando ? 'Eliminando...' : 'Eliminar',
      color: 'danger',
      onClick: (tarea) => handleEliminar(tarea),
      disabled: (tarea) => cargandoEliminar && tareaEliminando === tarea.id,
    },
  ];

  if (cargandoAuth || cargando) {
    return <Layout titulo="Todas las Tareas">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Todas las Tareas (Supervisor)" ocultarHeader>
      <section className={styles.hero}>
        <div>
          <p className={styles.heroKicker}>OPERACION GLOBAL</p>
          <h1 className={styles.heroTitulo}>Gestion de tareas</h1>
          <p className={styles.heroSubtitulo}>
            Revisa el trabajo de los usuarios bajo tu supervisión. Filtra por
            estado para enfocarte en lo pendiente..
          </p>
        </div>

        <div className={styles.heroActions}>
          <div className={styles.heroStat}>
            <div className={styles.heroStatInline}>
              <span className={styles.heroStatLabel}>TAREAS EN VISTA</span>
              <strong>{tareasFiltradas.length}</strong>
            </div>
          </div>

          <div className={styles.actionGroup}>
            <button
              className={styles.botonSecundario}
              onClick={exportarTareas}
              disabled={!tareasFiltradas.length}
            >
              <FiDownload />
              Exportar
            </button>
            <button className={styles.botonNuevo} onClick={handleNuevaTarea}>
              <FiPlus />
              Nueva tarea
            </button>
          </div>
        </div>
      </section>

      <div className={styles.filtrosPanel}>
        <div className={styles.filtrosHeader}>
          <FiFilter />
          <span>FILTROS DE TRABAJO</span>
        </div>

        <div className={styles.filtrosFilaPrincipal}>
          <label className={styles.campoFecha}>
            <span>
              <FiCalendar />
              DESDE
            </span>
            <input
              className={styles.inputFecha}
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </label>

          <label className={styles.campoFecha}>
            <span>
              <FiCalendar />
              HASTA
            </span>
            <input
              className={styles.inputFecha}
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </label>

          <button className={styles.botonFiltro} onClick={limpiarFiltros}>
            LIMPIAR FILTROS
          </button>
        </div>

        <div className={styles.filtrosFilaSecundaria}>
          <label className={styles.campoTexto}>
            <span>BUSCAR TAREA</span>
            <input
              className={styles.inputTexto}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="TITULO O DESCRIPCION"
            />
          </label>

          <label className={styles.campoSelect}>
            <span>RESPONSABLE</span>
            <select
              className={styles.select}
              value={filtroResponsable}
              onChange={(e) => setFiltroResponsable(e.target.value)}
            >
              <option value="todos">TODOS</option>
              {opcionesResponsables.map((responsable) => (
                <option key={responsable.id} value={responsable.id}>
                  {responsable.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.campoSelect}>
            <span>ESTADO</span>
            <select
              className={styles.select}
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">TODOS</option>
              {opcionesEstados.map((estado) => (
                <option key={estado.id} value={estado.id}>
                  {estado.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.campoSelect}>
            <span>PRIORIDAD</span>
            <select
              className={styles.select}
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
            >
              <option value="todas">TODAS</option>
              {opcionesPrioridades.map((prioridad) => (
                <option key={prioridad.id} value={prioridad.id}>
                  {prioridad.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.campoSelect}>
            <span>PLANTA</span>
            <select
              className={styles.select}
              value={filtroPlanta}
              onChange={(e) => setFiltroPlanta(e.target.value)}
            >
              <option value="todas">TODAS</option>
              {opcionesPlantas.map((planta) => (
                <option key={planta.id} value={planta.id}>
                  {planta.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={styles.contenedor}>
        {error && <div className={styles.error}>{error}</div>}

        <TablaGenerica
          columnas={columnasTabla}
          datos={tareasFiltradas}
          acciones={acciones}
          cargando={cargando}
          vacio={tareasFiltradas.length === 0 ? 'No hay tareas' : ''}
        />
      </div>

      {/* Modal Evidencias */}
      <Modal
        abierto={modalEvidencias}
        onCerrar={() => setModalEvidencias(false)}
        titulo={`📎 Evidencias — ${tituloTareaEvidencias}`}
        modo="ver"
      >
        {error && <div className={styles.error}>{error}</div>}
        {cargandoEvidencias ? (
          <p className={styles.textoSecundario}>Cargando evidencias...</p>
        ) : evidenciasTarea.length === 0 ? (
          <p className={styles.textoSecundario}>
            No hay evidencias subidas para esta tarea.
          </p>
        ) : (
          <div className={styles.listaEvidencias}>
            {evidenciasTarea.map((ev) => (
              <div key={ev.id} className={styles.evidenciaItem}>
                <div className={styles.evidenciaIcono}>
                  {ev.tipo_mime?.startsWith('image/') ? (
                    <FiImage size={20} />
                  ) : (
                    <FiFile size={20} />
                  )}
                </div>
                <div className={styles.evidenciaDatos}>
                  <span className={styles.evidenciaNombre}>
                    {ev.descripcion || ev.archivo_path.split('_').pop()}
                  </span>
                  <span className={styles.evidenciaFecha}>
                    {ev.usuario?.nombre_completo} ·{' '}
                    {formatearFecha(ev.fecha_subida)}
                    {ev.tamanio_bytes &&
                      ` · ${(ev.tamanio_bytes / 1024).toFixed(0)} KB`}
                  </span>
                </div>
                <a
                  href={ev.archivo_url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.btnVerEvidencia}
                  title="Ver archivo"
                >
                  <FiExternalLink size={15} />
                </a>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal Comentarios */}
      <Modal
        abierto={modalComentarios}
        onCerrar={() => setModalComentarios(false)}
        titulo={`💬 Comentarios — ${tituloTareaComentarios}`}
        modo="ver"
      >
        {error && <div className={styles.error}>{error}</div>}
        {cargandoComentarios ? (
          <p className={styles.textoSecundario}>Cargando comentarios...</p>
        ) : comentariosTarea.length === 0 ? (
          <p className={styles.textoSecundario}>
            Esta tarea no tiene comentarios registrados.
          </p>
        ) : (
          <div className={styles.listaComentarios}>
            {comentariosTarea.map((com) => (
              <div key={com.id} className={styles.comentarioItem}>
                <div className={styles.comentarioCabecera}>
                  <span className={styles.comentarioAutor}>
                    <FiMessageSquare size={14} />
                    {com.usuario?.nombre_completo || 'Usuario'}
                  </span>
                  <span className={styles.comentarioFecha}>
                    {formatearFecha(com.fecha_creacion || com.created_at)}
                  </span>
                </div>
                <p>{com.contenido || '-'}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal Crear Tarea */}
      <Modal
        abierto={modalAbierta}
        onCerrar={() => setModalAbierta(false)}
        titulo="Nueva tarea"
        onAceptar={handleGuardar}
        cargando={cargandoFormulario}
        modo="crear"
        textoAceptar="Crear"
      >
        <FormularioMulti
          modo="crear"
          campos={[
            {
              name: 'titulo',
              type: 'text',
              label: 'Título',
              placeholder: 'Ej. Revisar inventario',
              required: true,
            },
            {
              name: 'descripcion',
              type: 'textarea',
              label: 'Descripción',
              placeholder: 'Detalles de la tarea',
            },
            {
              name: 'prioridad_id',
              type: 'select',
              label: 'Prioridad',
              options: prioridades.map((p) => ({
                id: p.id,
                label: p.nombre,
              })),
              required: true,
            },
            {
              name: 'asignado_a',
              type: 'select',
              label: 'Asignar a',
              options: usuarios.map((u) => ({
                id: u.id,
                label: u.nombre_completo,
              })),
            },
            {
              name: 'estado_id',
              type: 'select',
              label: 'Estado inicial',
              options: estados.map((e) => ({ id: e.id, label: e.nombre })),
              required: true,
            },
            {
              name: 'fecha_inicio',
              type: 'date',
              label: 'Fecha de inicio',
            },
            {
              name: 'fecha_limite',
              type: 'date',
              label: 'Fecha límite',
              required: true,
            },
          ]}
          valores={valores}
          onCambio={(field, value) =>
            setValores({ ...valores, [field]: value })
          }
        />
      </Modal>
    </Layout>
  );
}
