import Layout from '@components/Layout';
import { useAdmin } from '@hooks/useProtegerRuta';
import { useState, useEffect, useRef } from 'react';
import TablaGenerica from '@components/TablaGenerica';
import Modal from '@components/Modal';
import FormularioMulti from '@components/FormularioMulti';
import { supabase } from '@lib/supabase';
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
import styles from '@styles/TareasAdmin.module.css';

export default function TareasAdmin() {
  const { cargando: cargandoAuth } = useAdmin();
  const montadoRef = useRef(true);
  const [tareas, setTareas] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroPlanta, setFiltroPlanta] = useState('todas');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas');
  const [modalAbierta, setModalAbierta] = useState(false);
  const [modo, setModo] = useState('crear');
  const [tareaEditando, setTareaEditando] = useState(null);

  const [cargandoFormulario, setCargandoFormulario] = useState(false);
  // Estado para eliminar tarea
  const [cargandoEliminar, setCargandoEliminar] = useState(false);
  const [tareaEliminando, setTareaEliminando] = useState(null);

  // Estado modal evidencias
  const [modalEvidencias, setModalEvidencias] = useState(false);
  const [evidenciasTarea, setEvidenciasTarea] = useState([]);
  const [cargandoEvidencias, setCargandoEvidencias] = useState(false);
  const [tituloTareaEvidencias, setTituloTareaEvidencias] = useState('');
  const [modalComentarios, setModalComentarios] = useState(false);
  const [comentariosTarea, setComentariosTarea] = useState([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [tituloTareaComentarios, setTituloTareaComentarios] = useState('');
  const [valores, setValores] = useState({
    titulo: '',
    descripcion: '',
    prioridad_id: '',
    planta_id: '',
    asignado_a: '',
    estado_id: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_limite: '',
  });

  useEffect(() => {
    montadoRef.current = true;
    if (!cargandoAuth) {
      cargarDatos();
    }
    return () => {
      montadoRef.current = false;
    };
  }, [cargandoAuth]);

  const resumirResponsable = (nombre) => {
    if (!nombre) return 'Sin asignar';

    const partes = nombre.split(' ').filter(Boolean);
    if (partes.length <= 2) return partes.join(' ');

    return `${partes[0]} ${partes[1]}`;
  };

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
      if (montadoRef.current) setCargando(true);
      setError('');

      // Cargar datos desde APIs
      const [plantasRes, prioridadesRes, estadosRes, tareasRes, usuariosRes] =
        await Promise.all([
          supabase.from('plantas').select('id, nombre'),
          supabase.from('prioridades').select('id, nombre'),
          supabase.from('estados_tarea').select('id, nombre'),
          callAPI('/api/admin/tareas'),
          supabase
            .from('usuarios')
            .select('id, nombre_completo, rol:roles(nombre), planta:plantas(nombre)')
            .eq('estado', 'activo'),
        ]);

      if (montadoRef.current) {
        setPlantas(plantasRes.data || []);
        setPrioridades(prioridadesRes.data || []);
        setEstados(estadosRes.data || []);
        setTareas(tareasRes || []);
        setUsuarios(usuariosRes.data || []);
      }
    } catch (err) {
      if (montadoRef.current) setError(`Error cargando datos: ${err.message}`);
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  };

  const tareasFiltradas = tareas.filter((tarea) => {
    const cumplePlanta =
      filtroPlanta === 'todas' || tarea.planta_id === filtroPlanta;
    const cumpleResponsable =
      filtroResponsable === 'todos' || tarea.asignado_a === filtroResponsable;
    const cumpleEstado =
      filtroEstado === 'todos' || tarea.estado_id === filtroEstado;
    const cumplePrioridad =
      filtroPrioridad === 'todas' || tarea.prioridad_id === filtroPrioridad;

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
      tarea.titulo?.toLowerCase().includes(terminoBusqueda) ||
      tarea.descripcion?.toLowerCase().includes(terminoBusqueda);

    return (
      cumplePlanta &&
      cumpleResponsable &&
      cumpleEstado &&
      cumplePrioridad &&
      cumpleFechaDesde &&
      cumpleFechaHasta &&
      cumpleBusqueda
    );
  });

  const opcionesResponsables = usuarios
    .filter((usuario) => usuario.rol?.nombre !== 'admin')
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

  const limpiarFiltros = () => {
    setFiltroPlanta('todas');
    setFechaDesde('');
    setFechaHasta('');
    setBusqueda('');
    setFiltroResponsable('todos');
    setFiltroEstado('todos');
    setFiltroPrioridad('todas');
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
      'Planta',
      'Prioridad',
      'Asignado a',
      'Estado',
      'Fecha inicio',
      'Fecha limite',
      'Avance',
    ];

    const filas = tareasFiltradas.map((tarea) => [
      tarea.titulo,
      tarea.descripcion || '',
      tarea.planta?.nombre || '',
      tarea.prioridad?.nombre || '',
      tarea.asignado_a_user?.nombre_completo || 'Sin asignar',
      tarea.estado?.nombre || '',
      tarea.fecha_inicio ? formatearFecha(tarea.fecha_inicio) : '',
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
    link.download = `tareas-admin-${fecha}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNuevaTarea = () => {
    setModo('crear');
    setTareaEditando(null);
    setValores({
      titulo: '',
      descripcion: '',
      prioridad_id: '',
      planta_id: '',
      asignado_a: '',
      estado_id: estados[0]?.id || '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_limite: '',
    });
    setModalAbierta(true);
  };

  const handleVerEvidencias = async (tarea) => {
    setTituloTareaEvidencias(tarea.titulo);
    setEvidenciasTarea([]);
    setModalEvidencias(true);
    setCargandoEvidencias(true);
    try {
      const data = await callAPI(`/api/admin/tareas/${tarea.id}/evidencias`);
      setEvidenciasTarea(data.data || []);
    } catch (err) {
      setError(`Error al cargar evidencias: ${err.message}`);
    } finally {
      setCargandoEvidencias(false);
    }
  };

  const handleVerComentarios = async (tarea) => {
    setTituloTareaComentarios(tarea.titulo);
    setComentariosTarea([]);
    setModalComentarios(true);
    setCargandoComentarios(true);
    try {
      const data = await callAPI(`/api/admin/tareas/${tarea.id}`);
      const comentariosOrdenados = [...(data.comentarios || [])].sort(
        (a, b) =>
          new Date(b.fecha_creacion || b.created_at) -
          new Date(a.fecha_creacion || a.created_at)
      );
      setComentariosTarea(comentariosOrdenados);
    } catch (err) {
      setError(`Error al cargar comentarios: ${err.message}`);
    } finally {
      setCargandoComentarios(false);
    }
  };

  const handleEditar = (tarea) => {
    setModo('editar');
    setTareaEditando(tarea);
    setValores({
      titulo: tarea.titulo || '',
      descripcion: tarea.descripcion || '',
      prioridad_id: tarea.prioridad_id || '',
      planta_id: tarea.planta_id || '',
      asignado_a: tarea.asignado_a || '',
      estado_id: tarea.estado_id || '',
      fecha_inicio: tarea.fecha_inicio ? tarea.fecha_inicio.split('T')[0] : '',
      fecha_limite: tarea.fecha_limite ? tarea.fecha_limite.split('T')[0] : '',
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
        !valores.planta_id ||
        !valores.estado_id
      ) {
        throw new Error('Completa los campos requeridos');
      }

      const datosTarea = {
        titulo: valores.titulo,
        descripcion: valores.descripcion || '',
        prioridad_id: valores.prioridad_id,
        planta_id: valores.planta_id,
        asignado_a: valores.asignado_a || null,
        estado_id: valores.estado_id,
        fecha_inicio: valores.fecha_inicio,
        fecha_limite: valores.fecha_limite,
        porcentaje_avance: modo === 'crear' ? 0 : undefined,
      };

      if (modo === 'crear') {
        const data = await callAPI('/api/admin/tareas', 'POST', datosTarea);
        setTareas([...tareas, data]);
      } else if (modo === 'editar' && tareaEditando) {
        const data = await callAPI(
          `/api/admin/tareas/${tareaEditando.id}`,
          'PUT',
          datosTarea
        );
        setTareas(tareas.map((t) => (t.id === tareaEditando.id ? data : t)));
      }

      setModalAbierta(false);
    } catch (err) {
      setError(err.message || 'Error guardando tarea');
    } finally {
      setCargandoFormulario(false);
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
      key: 'planta',
      label: 'Planta',
      ancho: '15%',
      render: (val) => val?.nombre || '-',
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

  // Acción eliminar robusta
  const handleEliminar = async (tarea) => {
    if (cargandoEliminar) return;
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar la tarea "${tarea.titulo}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;
    setCargandoEliminar(true);
    setTareaEliminando(tarea.id);
    setError('');
    try {
      await callAPI(`/api/admin/tareas/${tarea.id}`, 'DELETE');
      setTareas(tareas.filter((t) => t.id !== tarea.id));
    } catch (err) {
      setError(err.message || 'Error eliminando tarea');
    } finally {
      setCargandoEliminar(false);
      setTareaEliminando(null);
    }
  };

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
      label: 'Editar',
      color: 'info',
      onClick: (tarea) => handleEditar(tarea),
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
    <Layout titulo="Todas las Tareas (Admin)" ocultarHeader>
      <section className={styles.hero}>
        <div>
          <p className={styles.heroKicker}>OPERACION GLOBAL</p>
          <h1 className={styles.heroTitulo}>Gestion de tareas</h1>
          <p className={styles.heroSubtitulo}>
            Administra, filtra y exporta el portafolio operativo desde una vista
            central con foco en seguimiento y control.
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
          <select
            className={styles.select}
            value={filtroPlanta}
            onChange={(e) => setFiltroPlanta(e.target.value)}
          >
            <option value="todas">TODAS LAS PLANTAS</option>
            {plantas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre.toUpperCase()}
              </option>
            ))}
          </select>

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

      <Modal
        abierto={modalAbierta}
        onCerrar={() => setModalAbierta(false)}
        titulo={`${modo === 'crear' ? 'Nueva' : 'Editar'} Tarea`}
        onAceptar={handleGuardar}
        cargando={cargandoFormulario}
        modo={modo}
      >
        <FormularioMulti
          modo={modo}
          campos={[
            {
              name: 'titulo',
              label: 'Título',
              type: 'text',
              required: true,
              mostrarEn: ['crear', 'editar'],
            },
            {
              name: 'descripcion',
              label: 'Descripción',
              type: 'textarea',
              mostrarEn: ['crear', 'editar'],
            },
            {
              name: 'planta_id',
              label: 'Planta',
              type: 'select',
              options: plantas.map((p) => ({ id: p.id, label: p.nombre })),
              required: true,
              mostrarEn: ['crear', 'editar'],
            },
            {
              name: 'prioridad_id',
              label: 'Prioridad',
              type: 'select',
              options: prioridades.map((p) => ({ id: p.id, label: p.nombre })),
              required: true,
              mostrarEn: ['crear', 'editar'],
            },
            {
              name: 'estado_id',
              label: 'Estado',
              type: 'select',
              options: estados.map((e) => ({ id: e.id, label: e.nombre })),
              required: true,
              mostrarEn: ['crear', 'editar'],
            },
            {
              name: 'asignado_a',
              label: 'Asignar a',
              type: 'select',
              options: usuarios.map((u) => ({
                id: u.id,
                label: `${u.nombre_completo} (${u.planta?.nombre})`,
              })),
              mostrarEn: ['crear', 'editar'],
            },
            {
              name: 'fecha_inicio',
              label: 'Fecha Inicio',
              type: 'date',
              required: true,
              mostrarEn: ['crear', 'editar'],
            },
            {
              name: 'fecha_limite',
              label: 'Fecha Límite',
              type: 'date',
              required: true,
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

      {/* Modal Evidencias */}
      <Modal
        abierto={modalEvidencias}
        onCerrar={() => setModalEvidencias(false)}
        titulo={`📎 Evidencias — ${tituloTareaEvidencias}`}
        modo="ver"
      >
        {cargandoEvidencias ? (
          <p className={styles.textoSecundario}>Cargando evidencias...</p>
        ) : evidenciasTarea.length === 0 ? (
          <p className={styles.textoSecundario}>
            Este usuario aún no ha subido evidencias para esta tarea.
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
        {cargandoComentarios ? (
          <p className={styles.textoSecundario}>Cargando comentarios...</p>
        ) : comentariosTarea.length === 0 ? (
          <p className={styles.textoSecundario}>
            Esta tarea no tiene comentarios todavía.
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
    </Layout>
  );
}
