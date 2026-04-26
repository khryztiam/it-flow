import Layout from '@components/Layout';
import Modal from '@components/Modal';
import { useSupervisor } from '@hooks/useProtegerRuta';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import {
  FiFilter,
  FiChevronDown,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiFlag,
  FiFileText,
  FiCalendar,
  FiTrendingUp,
  FiGlobe,
  FiExternalLink,
  FiImage,
  FiFile,
  FiSend,
} from 'react-icons/fi';
import styles from '@styles/DashboardSupervisor.module.css';

export default function SupervisorDashboard() {
  const { cargando: cargandoAuth } = useSupervisor();
  const { usuarioDetalles } = useAuth();
  const plantaId = usuarioDetalles?.planta?.id;
  const montadoRef = useRef(true);

  const [misTareas, setMisTareas] = useState([]);
  const [subordinados, setSubordinados] = useState([]);
  const [expandido, setExpandido] = useState({});
  const [filtroUsuario, setFiltroUsuario] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Modal detalles/actualización de tarea
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [modalEstadoId, setModalEstadoId] = useState('');
  const [modalObservaciones, setModalObservaciones] = useState('');
  const [detalleModalEvidencias, setDetalleModalEvidencias] = useState([]);
  const [detalleModalComentarios, setDetalleModalComentarios] = useState([]);
  const [detalleModalCargandoEvidencias, setDetalleModalCargandoEvidencias] =
    useState(false);
  const [detalleModalCargandoComentarios, setDetalleModalCargandoComentarios] =
    useState(false);
  const [detalleModalNuevoComentario, setDetalleModalNuevoComentario] =
    useState('');
  const [detalleModalAgreganComentario, setDetalleModalAgreganComentario] =
    useState(false);
  const [modalGuardando, setModalGuardando] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  useEffect(() => {
    montadoRef.current = true;
    if (!cargandoAuth) {
      if (plantaId) {
        cargarDatos();
      } else {
        setCargando(false);
      }
    }

    // --- SUSCRIPCIÓN REALTIME ---
    let channel = null;
    if (!cargandoAuth && plantaId) {
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
            // Recargar datos ante cambios (la API filtrará por planta automáticamente)
            cargarDatos();
          }
        )
        .subscribe();
    }

    return () => {
      montadoRef.current = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [cargandoAuth, plantaId]);

  const obtenerToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.access_token) {
      throw new Error('No autenticado');
    }
    return data.session.access_token;
  };

  const callAPI = async (url) => {
    const token = await obtenerToken();
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || response.statusText);
    }

    return response.json();
  };

  const cargarDatos = async () => {
    try {
      setError('');

      const [misTareasData, subordinadosData] = await Promise.all([
        callAPI('/api/supervisor/tareas'),
        callAPI('/api/supervisor/subordinados/tareas'),
      ]);

      if (montadoRef.current) {
        setMisTareas(misTareasData || []);
        setSubordinados(subordinadosData || []);

        // Inicializar acordeón (expandir el primero)
        const estadoInicial = {};
        subordinadosData?.forEach((sub, idx) => {
          estadoInicial[sub.usuario_id] = idx === 0;
        });
        setExpandido(estadoInicial);
      }
    } catch (err) {
      if (montadoRef.current) {
        setError(`Error cargando dashboard: ${err.message}`);
      }
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  };

  // Modal detalles/actualización de tarea
  const abrirDetalleModal = async (tarea) => {
    setTareaSeleccionada(tarea);
    setModalEstadoId(tarea.estado_id || '');
    setModalObservaciones(tarea.observaciones || '');
    setDetalleModalEvidencias([]);
    setDetalleModalComentarios([]);
    setModalError('');
    setModalSuccess('');
    setModalDetalleAbierto(true);

    // Cargar evidencias + comentarios en paralelo
    setDetalleModalCargandoEvidencias(true);
    setDetalleModalCargandoComentarios(true);
    try {
      const token = await obtenerToken();
      const [resEvidencias, resDetalle] = await Promise.all([
        fetch(`/api/supervisor/tareas/${tarea.id}/evidencias`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/supervisor/tareas/${tarea.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resEvidencias.ok) {
        const evidenciasJson = await resEvidencias.json();
        setDetalleModalEvidencias(evidenciasJson.data || []);
      }

      if (resDetalle.ok) {
        const detalleJson = await resDetalle.json();
        const comentariosOrdenados = [...(detalleJson.comentarios || [])].sort(
          (a, b) =>
            new Date(b.fecha_creacion || b.created_at) -
            new Date(a.fecha_creacion || a.created_at)
        );
        setDetalleModalComentarios(comentariosOrdenados);
      }
    } catch (err) {
      console.error('Error cargando detalles:', err);
    } finally {
      setDetalleModalCargandoEvidencias(false);
      setDetalleModalCargandoComentarios(false);
    }
  };

  const cerrarDetalleModal = () => {
    setModalDetalleAbierto(false);
    setTareaSeleccionada(null);
    setDetalleModalNuevoComentario('');
  };

  const guardarDetalleModal = async () => {
    if (!tareaSeleccionada) return;
    setModalGuardando(true);
    setModalError('');
    setModalSuccess('');

    try {
      const token = await obtenerToken();
      const res = await fetch(
        `/api/supervisor/tareas/${tareaSeleccionada.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            estado_id: modalEstadoId,
            observaciones: modalObservaciones,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }

      setModalSuccess('Cambios guardados');
      // Actualizar en el estado local
      const actualizar = (tarea) =>
        tarea.id === tareaSeleccionada.id
          ? {
              ...tarea,
              estado_id: modalEstadoId,
              observaciones: modalObservaciones,
            }
          : tarea;

      setMisTareas((prev) => prev.map(actualizar));
      setSubordinados((prev) =>
        prev.map((sub) => ({
          ...sub,
          tareas: sub.tareas.map(actualizar),
        }))
      );

      setTimeout(() => setModalSuccess(''), 2500);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalGuardando(false);
    }
  };

  const agregarComentarioDetalle = async () => {
    if (!detalleModalNuevoComentario.trim() || !tareaSeleccionada) return;

    try {
      setDetalleModalAgreganComentario(true);
      setModalError('');

      const token = await obtenerToken();
      const res = await fetch(
        `/api/supervisor/tareas/${tareaSeleccionada.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contenido: detalleModalNuevoComentario,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al agregar comentario');
      }

      const { data: nuevoComentario } = await res.json();
      setDetalleModalComentarios((prev) => [nuevoComentario, ...prev]);
      setDetalleModalNuevoComentario('');
      setModalSuccess('Comentario agregado');
      setTimeout(() => setModalSuccess(''), 2500);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setDetalleModalAgreganComentario(false);
    }
  };

  const toggleAcordeon = (usuarioId) => {
    setExpandido((prev) => ({
      ...prev,
      [usuarioId]: !prev[usuarioId],
    }));
  };

  const obtenerColorEstado = (nombreEstado) => {
    if (!nombreEstado) return styles.badgeEstado;
    const estado = nombreEstado.toLowerCase();
    if (estado.includes('pendiente')) {
      return `${styles.badgeEstado} ${styles.estadoPendiente}`;
    }
    if (estado.includes('proceso')) {
      return `${styles.badgeEstado} ${styles.estadoEnProceso}`;
    }
    if (estado.includes('revision')) {
      return `${styles.badgeEstado} ${styles.estadoEnRevision}`;
    }
    if (estado.includes('complet')) {
      return `${styles.badgeEstado} ${styles.estadoCompletado}`;
    }
    if (estado.includes('detenido')) {
      return `${styles.badgeEstado} ${styles.estadoDetenido}`;
    }
    return styles.badgeEstado;
  };

  const obtenerColorPrioridad = (nombrePrioridad) => {
    if (!nombrePrioridad) return styles.badgePrioridad;
    const prioridad = nombrePrioridad.toLowerCase();
    if (prioridad.includes('urgente')) {
      return `${styles.badgePrioridad} ${styles.prioridadUrgente}`;
    }
    if (prioridad.includes('alta')) {
      return `${styles.badgePrioridad} ${styles.prioridadAlta}`;
    }
    if (prioridad.includes('media')) {
      return `${styles.badgePrioridad} ${styles.prioridadMedia}`;
    }
    if (prioridad.includes('baja')) {
      return `${styles.badgePrioridad} ${styles.prioridadBaja}`;
    }
    return styles.badgePrioridad;
  };

  const normalizarEtiqueta = (texto) => {
    if (!texto) return 'N/A';
    return texto.replaceAll('_', ' ').toUpperCase();
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  };

  const esEstadoFinal = (nombreEstado) => {
    if (!nombreEstado) return false;
    const estado = nombreEstado.toLowerCase();
    return estado.includes('complet');
  };

  const obtenerClaseTarjeta = (tarea) => {
    const ahora = new Date();
    const estaVencida =
      new Date(tarea.fecha_limite) < ahora &&
      !esEstadoFinal(tarea.estado?.nombre);

    if (esEstadoFinal(tarea.estado?.nombre)) {
      const fechaLimite = new Date(tarea.fecha_limite);
      const fechaCierre = tarea.fecha_cierre
        ? new Date(tarea.fecha_cierre)
        : fechaLimite;
      return fechaCierre <= fechaLimite
        ? styles.tarjetaVerde
        : styles.tarjetaRoja;
    }
    if (estaVencida) return styles.tarjetaRoja;
    const diasRestantes =
      (new Date(tarea.fecha_limite) - ahora) / (1000 * 60 * 60 * 24);
    if (diasRestantes <= 1) return styles.tarjetaAmarilla;
    return '';
  };

  const iniciales = (nombre) => {
    if (!nombre) return '?';
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ---- CÁLCULOS DE RESUMEN ----

  // Resumen por usuario supervisado
  const resumenSubordinados = useMemo(() => {
    return (subordinados || []).map((sub) => ({
      id: sub.usuario_id,
      nombre: sub.usuario_nombre,
      total: sub.total || 0,
      vencidas: (sub.tareas || []).filter((t) => {
        const ahora = new Date();
        const fechaLimite = new Date(t.fecha_limite);
        return fechaLimite < ahora && !esEstadoFinal(t.estado?.nombre);
      }).length,
    }));
  }, [subordinados]);

  // Todas las tareas de subordinados
  const todasLasTareasSubordinados = useMemo(() => {
    return (subordinados || []).reduce((acc, sub) => {
      return acc.concat(sub.tareas || []);
    }, []);
  }, [subordinados]);

  // Estado global subordinados
  const totalTareasSubordinados = todasLasTareasSubordinados.length;
  const totalCompletadasSubordinados = todasLasTareasSubordinados.filter((t) =>
    esEstadoFinal(t.estado?.nombre)
  ).length;
  const totalPendientesSubordinados = todasLasTareasSubordinados.filter((t) => {
    const estado = t.estado?.nombre?.toLowerCase() || '';
    return estado.includes('pendiente');
  }).length;

  const porcentajeCompletado = totalTareasSubordinados
    ? Math.round((totalCompletadasSubordinados / totalTareasSubordinados) * 100)
    : 0;
  const porcentajePendiente = totalTareasSubordinados
    ? Math.round((totalPendientesSubordinados / totalTareasSubordinados) * 100)
    : 0;

  // Usuario con más vencidas
  const subordinadoMasVencidas = useMemo(() => {
    if (!resumenSubordinados.length) return null;
    return resumenSubordinados.reduce((max, current) =>
      current.vencidas > max.vencidas ? current : max
    );
  }, [resumenSubordinados]);

  // ---- OPCIONES DE FILTROS ----

  const opcionesUsuarios = useMemo(() => {
    return resumenSubordinados.map((sub) => [sub.id, sub.nombre]);
  }, [resumenSubordinados]);

  const opcionesEstados = useMemo(() => {
    const estados = new Set();
    todasLasTareasSubordinados.forEach((t) => {
      if (t.estado?.nombre) {
        estados.add(t.estado.nombre);
      }
    });
    return Array.from(estados);
  }, [todasLasTareasSubordinados]);

  const opcionesPrioridades = useMemo(() => {
    const prioridades = new Set();
    todasLasTareasSubordinados.forEach((t) => {
      if (t.prioridad?.nombre) {
        prioridades.add(t.prioridad.nombre);
      }
    });
    return Array.from(prioridades);
  }, [todasLasTareasSubordinados]);

  // ---- FILTRADO DE TAREAS SUBORDINADOS ----

  const tareasSubordinadosFiltradas = useMemo(() => {
    let resultado = todasLasTareasSubordinados;

    if (filtroUsuario !== 'todos') {
      resultado = resultado.filter((t) => t.asignado_a === filtroUsuario);
    }
    if (filtroPrioridad !== 'todos') {
      resultado = resultado.filter(
        (t) => t.prioridad?.nombre === filtroPrioridad
      );
    }
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter((t) => t.estado?.nombre === filtroEstado);
    }

    return resultado;
  }, [
    todasLasTareasSubordinados,
    filtroUsuario,
    filtroPrioridad,
    filtroEstado,
  ]);

  // Agrupar por usuario
  const tareasSubordinadosAgrupadas = useMemo(() => {
    const agrupadas = {};
    tareasSubordinadosFiltradas.forEach((tarea) => {
      const usuarioId = tarea.asignado_a;
      if (!agrupadas[usuarioId]) {
        const usuario = subordinados.find((s) => s.usuario_id === usuarioId);
        agrupadas[usuarioId] = {
          id: usuarioId,
          nombre: usuario?.usuario_nombre || 'Sin nombre',
          tareas: [],
        };
      }
      agrupadas[usuarioId].tareas.push(tarea);
    });
    return agrupadas;
  }, [tareasSubordinadosFiltradas, subordinados]);

  if (cargandoAuth || cargando) {
    return <Layout titulo="Dashboard">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Dashboard - Supervisor" ocultarHeader>
      <section className={styles.hero}>
        <div>
          <p className={styles.heroKicker}>OPERACION LOCAL</p>
          <h1 className={styles.heroTitulo}>Tablero de supervisor</h1>
          <p className={styles.heroSubtitulo}>
            Monitorea tu trabajo y el de tus usuarios supervisados en tiempo
            real.
          </p>
        </div>
      </section>

      {error && <div className={styles.error}>{error}</div>}

      {/* ---- RESUMEN SECTION (Cards) ---- */}
      <section className={styles.resumenSeccion}>
        {/* Usuarios Supervisados */}
        <div className={styles.resumenCard}>
          <div className={styles.resumenCardHeader}>
            <div>
              <p className={styles.resumenEyebrow}>Carga por usuario</p>
              <h3>¿Cuántas tareas tiene cada persona supervisada?</h3>
            </div>
          </div>

          <div className={styles.usuariosLista}>
            {resumenSubordinados.map((sub) => (
              <div
                key={sub.id}
                className={styles.usuarioItem}
                role="button"
                onClick={() => toggleAcordeon(sub.id)}
              >
                <div>
                  <p className={styles.usuarioNombre}>{sub.nombre}</p>
                  <span className={styles.usuarioMeta}>
                    {sub.vencidas > 0
                      ? `${sub.vencidas} vencidas`
                      : 'Sin vencidas'}
                  </span>
                </div>
                <span className={styles.usuarioTotal}>{sub.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Estado Global */}
        <div className={styles.resumenCard}>
          <div className={styles.resumenCardHeader}>
            <div>
              <p className={styles.resumenEyebrow}>Estado global</p>
              <h3>¿Qué % está completado vs pendiente?</h3>
            </div>
          </div>

          <div className={styles.resumenEstadosGrid}>
            <div className={styles.estadoResumenItem}>
              <span className={styles.metaLabel}>Completado</span>
              <strong className={styles.estadoResumenValor}>
                {porcentajeCompletado}%
              </strong>
              <span className={styles.estadoResumenMeta}>
                {totalCompletadasSubordinados} de {totalTareasSubordinados}
              </span>
            </div>

            <div className={styles.estadoResumenItem}>
              <span className={styles.metaLabel}>Pendiente</span>
              <strong className={styles.estadoResumenValor}>
                {porcentajePendiente}%
              </strong>
              <span className={styles.estadoResumenMeta}>
                {totalPendientesSubordinados} de {totalTareasSubordinados}
              </span>
            </div>
          </div>
        </div>

        {/* Riesgo Actual */}
        <div className={styles.resumenCard}>
          <div className={styles.resumenCardHeader}>
            <div>
              <p className={styles.resumenEyebrow}>Riesgo actual</p>
              <h3>¿Quién tiene más tareas vencidas actualmente?</h3>
            </div>
          </div>

          {subordinadoMasVencidas && subordinadoMasVencidas.vencidas > 0 ? (
            <div className={styles.resumenDestacado}>
              <span className={styles.avatarResumen}>
                {iniciales(subordinadoMasVencidas.nombre)}
              </span>
              <div>
                <p className={styles.resumenDestacadoNombre}>
                  {subordinadoMasVencidas.nombre}
                </p>
                <span className={styles.resumenDestacadoMeta}>
                  {subordinadoMasVencidas.vencidas} tareas vencidas activas
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.resumenVacio}>
              No hay tareas vencidas en tus subordinados
            </div>
          )}
        </div>
      </section>

      {/* ---- MIS TAREAS ---- */}
      {misTareas.length > 0 && (
        <section
          className={styles.listaTareasSeccion}
          style={{ marginBottom: '24px' }}
        >
          <div className={styles.listaTareasHeader}>
            <div>
              <h2>MIS TAREAS</h2>
              <p>Tus tareas asignadas como supervisor</p>
            </div>
            <div className={styles.badgeTop}>{misTareas.length} ASIGNADAS</div>
          </div>

          <div className={styles.acordeon2}>
            {misTareas.map((tarea) => (
              <div
                key={tarea.id}
                className={`${styles.tarjetaTarea} ${obtenerClaseTarjeta(tarea)}`}
              >
                {/* Fila 1: Título */}
                <div className={styles.cardFila1}>
                  <h4 className={styles.tarjetaTitulo}>{tarea.titulo}</h4>
                </div>

                {/* Cuerpo 3 columnas */}
                <div className={styles.cardCuerpo}>
                  {/* Descripción */}
                  <div className={styles.cardColDesc}>
                    <span className={styles.metaLabel}>
                      <FiFileText /> Descripción
                    </span>
                    <p className={styles.tareaResumen}>
                      {tarea.descripcion || 'Sin descripción'}
                    </p>
                  </div>

                  {/* Prioridad + Estado */}
                  <div className={styles.cardColStatus}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>
                        <FiFlag /> Prioridad
                      </span>
                      <span
                        className={obtenerColorPrioridad(
                          tarea.prioridad?.nombre
                        )}
                      >
                        {normalizarEtiqueta(tarea.prioridad?.nombre)}
                      </span>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>
                        <FiCheckCircle /> Estado
                      </span>
                      <span
                        className={obtenerColorEstado(tarea.estado?.nombre)}
                      >
                        {normalizarEtiqueta(tarea.estado?.nombre)}
                      </span>
                    </div>
                  </div>

                  {/* Fechas + Progreso */}
                  <div className={styles.cardColFechas}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>
                        <FiCalendar /> F. Inicio / F. Fin
                      </span>
                      <span className={styles.tarjetaValor}>
                        {formatearFecha(tarea.fecha_inicio)} →{' '}
                        {formatearFecha(tarea.fecha_limite)}
                      </span>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>
                        <FiTrendingUp /> Progreso
                      </span>
                      <div className={styles.barraProgreso}>
                        <div
                          className={styles.barraProgresoFill}
                          style={{
                            width: `${tarea.porcentaje_avance || 0}%`,
                          }}
                        />
                      </div>
                      <span className={styles.barraProgresoTexto}>
                        {tarea.porcentaje_avance || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- FILTROS SECTION ---- */}
      <section className={styles.filtrosSeccion}>
        <div className={styles.filtroTitulo}>
          <FiFilter />
          <span>FILTROS OPERATIVOS</span>
        </div>
        <div className={styles.filtrosGrid}>
          <select
            className={styles.filtroControl}
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
          >
            <option value="todos">TODOS LOS USUARIOS</option>
            {opcionesUsuarios.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>

          <select
            className={styles.filtroControl}
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
          >
            <option value="todos">TODAS LAS PRIORIDADES</option>
            {opcionesPrioridades.map((prioridad) => (
              <option key={prioridad} value={prioridad}>
                {normalizarEtiqueta(prioridad)}
              </option>
            ))}
          </select>

          <select
            className={styles.filtroControl}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">TODOS LOS ESTADOS</option>
            {opcionesEstados.map((estado) => (
              <option key={estado} value={estado}>
                {normalizarEtiqueta(estado)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* ---- LISTA DE TAREAS SUBORDINADOS ---- */}
      {subordinados.length > 0 && (
        <section className={styles.listaTareasSeccion}>
          <div className={styles.listaTareasHeader}>
            <div>
              <h2>TAREAS DE USUARIOS SUPERVISADOS</h2>
              <p>Detalle de todas las tareas asignadas a tus subordinados</p>
            </div>
            <div className={styles.badgeTop}>
              {tareasSubordinadosFiltradas.length} EN VISTA
            </div>
          </div>

          {tareasSubordinadosFiltradas.length === 0 ? (
            <div className={styles.vacio}>
              <p>No hay tareas para mostrar</p>
            </div>
          ) : (
            <div className={styles.acordeon}>
              {Object.entries(tareasSubordinadosAgrupadas).map(
                ([usuarioId, grupo]) => (
                  <div key={usuarioId} className={styles.acordeonItem}>
                    <button
                      className={`${styles.acordeonBoton} ${
                        expandido[usuarioId] ? styles.activo : ''
                      }`}
                      onClick={() => toggleAcordeon(usuarioId)}
                    >
                      <span className={styles.usuarioTitulo}>
                        <FiUser /> {grupo.nombre}
                        <strong>{grupo.tareas.length}</strong>
                      </span>
                      <span className={styles.acordeonToggle}>
                        <FiChevronDown />
                      </span>
                    </button>

                    {expandido[usuarioId] && (
                      <div className={styles.acordeonContenido}>
                        {grupo.tareas.map((tarea) => (
                          <div
                            key={tarea.id}
                            className={`${styles.tarjetaTarea} ${obtenerClaseTarjeta(tarea)}`}
                            onClick={() => abrirDetalleModal(tarea)}
                            role="button"
                            style={{ cursor: 'pointer' }}
                          >
                            {/* Fila 1: Título */}
                            <div className={styles.cardFila1}>
                              <h4 className={styles.tarjetaTitulo}>
                                {tarea.titulo}
                              </h4>
                            </div>

                            {/* Cuerpo 3 columnas */}
                            <div className={styles.cardCuerpo}>
                              {/* Descripción */}
                              <div className={styles.cardColDesc}>
                                <span className={styles.metaLabel}>
                                  <FiFileText /> Descripción
                                </span>
                                <p className={styles.tareaResumen}>
                                  {tarea.descripcion || 'Sin descripción'}
                                </p>
                              </div>

                              {/* Prioridad + Estado */}
                              <div className={styles.cardColStatus}>
                                <div className={styles.metaItem}>
                                  <span className={styles.metaLabel}>
                                    <FiFlag /> Prioridad
                                  </span>
                                  <span
                                    className={obtenerColorPrioridad(
                                      tarea.prioridad?.nombre
                                    )}
                                  >
                                    {normalizarEtiqueta(
                                      tarea.prioridad?.nombre
                                    )}
                                  </span>
                                </div>

                                <div className={styles.metaItem}>
                                  <span className={styles.metaLabel}>
                                    <FiCheckCircle /> Estado
                                  </span>
                                  <span
                                    className={obtenerColorEstado(
                                      tarea.estado?.nombre
                                    )}
                                  >
                                    {normalizarEtiqueta(tarea.estado?.nombre)}
                                  </span>
                                </div>
                              </div>

                              {/* Fechas + Progreso */}
                              <div className={styles.cardColFechas}>
                                <div className={styles.metaItem}>
                                  <span className={styles.metaLabel}>
                                    <FiCalendar /> F. Inicio / F. Fin
                                  </span>
                                  <span className={styles.tarjetaValor}>
                                    {formatearFecha(tarea.fecha_inicio)} →{' '}
                                    {formatearFecha(tarea.fecha_limite)}
                                  </span>
                                </div>

                                <div className={styles.metaItem}>
                                  <span className={styles.metaLabel}>
                                    <FiTrendingUp /> Progreso
                                  </span>
                                  <div className={styles.barraProgreso}>
                                    <div
                                      className={styles.barraProgresoFill}
                                      style={{
                                        width: `${tarea.porcentaje_avance || 0}%`,
                                      }}
                                    />
                                  </div>
                                  <span className={styles.barraProgresoTexto}>
                                    {tarea.porcentaje_avance || 0}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </section>
      )}

      {/* Modal Detalles/Actualización de Tarea */}
      <Modal
        abierto={modalDetalleAbierto}
        onCerrar={cerrarDetalleModal}
        titulo="Detalles de la Tarea"
        modo="editar"
        onAceptar={guardarDetalleModal}
        cargando={modalGuardando}
        tamano="lg"
      >
        {tareaSeleccionada && (
          <div className={styles.modalDetalle}>
            {modalError && <div className={styles.error}>{modalError}</div>}
            {modalSuccess && (
              <div className={styles.modalExito}>{modalSuccess}</div>
            )}

            <div className={styles.modalSplit}>
              <div className={styles.modalPrincipal}>
                {/* Info contextual (solo lectura) */}
                <div className={styles.modalGrid2}>
                  <div className={styles.modalItem}>
                    <label>Asignado a</label>
                    <p>
                      {tareaSeleccionada.asignado_a_user?.nombre_completo ||
                        'Sin asignar'}
                    </p>
                  </div>
                  <div className={styles.modalItem}>
                    <label>Planta</label>
                    <p>{tareaSeleccionada.planta?.nombre || 'N/A'}</p>
                  </div>
                </div>

                {/* Estado */}
                <div className={styles.modalCampo}>
                  <label className={styles.modalLabel}>Estado</label>
                  <select
                    className={styles.modalSelect}
                    value={modalEstadoId}
                    onChange={(e) => setModalEstadoId(e.target.value)}
                  >
                    <option value="">-- Seleccionar --</option>
                    {tareaSeleccionada?.estado && (
                      <option value={tareaSeleccionada.estado.id}>
                        {tareaSeleccionada.estado.nombre}
                      </option>
                    )}
                  </select>
                </div>

                {/* Observaciones */}
                <div className={styles.modalCampo}>
                  <label className={styles.modalLabel}>Observaciones</label>
                  <textarea
                    className={styles.modalTextarea}
                    value={modalObservaciones}
                    onChange={(e) => setModalObservaciones(e.target.value)}
                    placeholder="Agrega notas o comentarios sobre esta tarea..."
                    rows={3}
                    maxLength={1000}
                  />
                  <span className={styles.modalContador}>
                    {modalObservaciones.length}/1000
                  </span>
                </div>

                {/* Evidencias */}
                <div className={styles.modalCampo}>
                  <label className={styles.modalLabel}>
                    Evidencias (
                    {detalleModalCargandoEvidencias
                      ? '...'
                      : detalleModalEvidencias.length}
                    )
                  </label>
                  {detalleModalCargandoEvidencias ? (
                    <p className={styles.modalTextoSec}>Cargando...</p>
                  ) : detalleModalEvidencias.length === 0 ? (
                    <p className={styles.modalTextoSec}>
                      Sin evidencias subidas aún.
                    </p>
                  ) : (
                    <div className={styles.listaEvidencias}>
                      {detalleModalEvidencias.map((ev) => (
                        <div key={ev.id} className={styles.evidenciaItem}>
                          <span className={styles.evidenciaIcono}>
                            {ev.tipo_mime?.startsWith('image/') ? (
                              <FiImage size={16} />
                            ) : (
                              <FiFile size={16} />
                            )}
                          </span>
                          <div className={styles.evidenciaDatos}>
                            <span className={styles.evidenciaNombre}>
                              {ev.descripcion ||
                                ev.archivo_path?.split('_').pop()}
                            </span>
                            <span className={styles.evidenciaMeta}>
                              {ev.usuario?.nombre_completo} ·{' '}
                              {new Date(ev.fecha_subida).toLocaleDateString(
                                'es-ES',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                              {ev.tamanio_bytes
                                ? ` · ${(ev.tamanio_bytes / 1024).toFixed(0)} KB`
                                : ''}
                            </span>
                          </div>
                          <a
                            href={ev.archivo_url}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.btnVerEvidencia}
                            title="Ver archivo"
                          >
                            <FiExternalLink size={14} /> Ver
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className={styles.modalAsideComentarios}>
                <div className={styles.modalAsideHeader}>
                  <h4>Comentarios de la tarea</h4>
                  <span>
                    {detalleModalCargandoComentarios
                      ? '...'
                      : detalleModalComentarios.length}
                  </span>
                </div>

                {detalleModalCargandoComentarios ? (
                  <p className={styles.modalTextoSec}>
                    Cargando comentarios...
                  </p>
                ) : detalleModalComentarios.length === 0 ? (
                  <p className={styles.modalTextoSec}>
                    Sin comentarios registrados.
                  </p>
                ) : (
                  <div className={styles.modalComentariosLista}>
                    {detalleModalComentarios.map((com) => (
                      <div key={com.id} className={styles.comentarioItem}>
                        <div className={styles.comentarioCabecera}>
                          <strong>
                            {com.usuario?.nombre_completo || 'Usuario'}
                          </strong>
                          <span>
                            {new Date(
                              com.fecha_creacion || com.created_at
                            ).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p>{com.contenido || '-'}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.formComentarioModal}>
                  <textarea
                    placeholder="Agregar comentario..."
                    value={detalleModalNuevoComentario}
                    onChange={(e) =>
                      setDetalleModalNuevoComentario(e.target.value)
                    }
                    className={styles.textareaModal}
                    maxLength={500}
                    disabled={detalleModalAgreganComentario}
                  />
                  <div className={styles.pieFormularioModal}>
                    <span className={styles.contadorModal}>
                      {detalleModalNuevoComentario.length}/500
                    </span>
                    <button
                      onClick={agregarComentarioDetalle}
                      disabled={
                        detalleModalAgreganComentario ||
                        !detalleModalNuevoComentario.trim()
                      }
                      className={styles.btnEnviarModal}
                    >
                      {detalleModalAgreganComentario ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
