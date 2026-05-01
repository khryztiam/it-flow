import Layout from '@components/Layout';
import Modal from '@components/Modal';
import { useAdmin } from '@hooks/useProtegerRuta';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@lib/supabase';
import styles from '@styles/DashboardAdmin.module.css';
import {
  FiGlobe,
  FiFilter,
  FiChevronDown,
  FiAlertCircle,
  FiCheckCircle,
  FiExternalLink,
  FiImage,
  FiFile,
  FiMessageCircle,
  FiPaperclip,
  FiArrowRight,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';

export default function AdminDashboard() {
  const { cargando: cargandoAuth } = useAdmin();
  const montadoRef = useRef(true);
  const responsablesIdsRef = useRef([]);
  const cierreAlertaTimerRef = useRef(null);
  const drawerCierreTimerRef = useRef(null);
  const cargarAlertasActivasRef = useRef(null);
  const [todasLasTareas, setTodasLasTareas] = useState([]);
  const [estadosDisponibles, setEstadosDisponibles] = useState([]);
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalPlantas: 0,
    totalPaises: 0,
    totalTareas: 0,
  });
  const [tareas, setTareas] = useState([]);
  const [tareasAgrupadas, setTareasAgrupadas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState({});
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [drawerCerrando, setDrawerCerrando] = useState(false);
  const [modalAlertaAbierto, setModalAlertaAbierto] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [responsableSeleccionado, setResponsableSeleccionado] = useState(null);
  const [mensajeAlerta, setMensajeAlerta] = useState(
    'Por favor, revisa tus tareas asignadas.'
  );
  const [enviandoAlerta, setEnviandoAlerta] = useState(false);
  const [alertaEnviadaOk, setAlertaEnviadaOk] = useState(false);
  const [alertasActivas, setAlertasActivas] = useState({});

  // Cargar alertas activas por usuario
  const cargarAlertasActivas = async (usuariosIds = []) => {
    if (usuariosIds.length === 0) {
      setAlertasActivas({});
      return;
    }

    const { data, error } = await supabase
      .from('vw_alertas_usuario_estado')
      .select(
        'id, usuario_id, mensaje, activa, enviada_at, estado_visual_admin, admin_resuelta_visible_hasta, mostrar_en_admin'
      )
      .in('usuario_id', usuariosIds)
      .eq('mostrar_en_admin', true)
      .order('activa', { ascending: false })
      .order('enviada_at', { ascending: false });

    if (!error && data) {
      const map = {};
      data.forEach((a) => {
        // Respetar el primer registro por usuario (ya viene ordenado: activa primero, luego más reciente)
        if (!map[a.usuario_id]) {
          map[a.usuario_id] = a;
        }
      });
      setAlertasActivas(map);
    } else if (error) {
      console.error('Error cargando alertas activas:', error);
    }
  };

  useEffect(() => {
    cargarAlertasActivasRef.current = cargarAlertasActivas;
  });

  // Estado editable del modal
  const [modalEstadoId, setModalEstadoId] = useState('');
  const [modalProgreso, setModalProgreso] = useState(0);
  const [modalRevisado, setModalRevisado] = useState(false);
  const [modalObservaciones, setModalObservaciones] = useState('');
  const [modalEvidencias, setModalEvidencias] = useState([]);
  const [modalComentarios, setModalComentarios] = useState([]);
  const [modalCargandoEvidencias, setModalCargandoEvidencias] = useState(false);
  const [modalCargandoComentarios, setModalCargandoComentarios] =
    useState(false);
  const [modalNuevoComentario, setModalNuevoComentario] = useState('');
  const [modalAgreganComentario, setModalAgreganComentario] = useState(false);
  const [modalGuardando, setModalGuardando] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    montadoRef.current = true;
    if (!cargandoAuth) {
      cargarStats();
      cargarTareas();
    }

    // --- SUSCRIPCIÓN REALTIME ---
    let channel = null;
    if (!cargandoAuth) {
      channel = supabase
        .channel('realtime-tareas-admin')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tareas',
          },
          (payload) => {
            // Recargar tareas ante cualquier cambio
            cargarTareas();
          }
        )
        .subscribe();
    }

    return () => {
      montadoRef.current = false;
      if (cierreAlertaTimerRef.current) {
        clearTimeout(cierreAlertaTimerRef.current);
      }
      if (drawerCierreTimerRef.current) {
        clearTimeout(drawerCierreTimerRef.current);
      }
      if (channel) supabase.removeChannel(channel);
    };
  }, [cargandoAuth]);

  const cargarStats = async () => {
    try {
      const [usuarios, plantas, paises, tareas] = await Promise.all([
        supabase.from('usuarios').select('id', { count: 'exact' }),
        supabase.from('plantas').select('id', { count: 'exact' }),
        supabase.from('paises').select('id', { count: 'exact' }),
        supabase.from('tareas').select('id', { count: 'exact' }),
      ]);

      if (montadoRef.current) {
        setStats({
          totalUsuarios: usuarios.count || 0,
          totalPlantas: plantas.count || 0,
          totalPaises: paises.count || 0,
          totalTareas: tareas.count || 0,
        });
      }
    } catch (err) {
      console.error('Error cargando stats:', err);
    }
  };

  const cargarTareas = async () => {
    try {
      setCargando(true);
      // Cargar SOLO columnas específicas para evitar stack depth error
      const { data: tareasData, error } = await supabase
        .from('tareas')
        .select(
          'id,titulo,descripcion,created_at,fecha_inicio,fecha_limite,fecha_cierre,porcentaje_avance,observaciones,evidencia,revisado,estado_id,prioridad_id,asignado_a,planta_id,creado_por,supervisado_por'
        )
        .order('fecha_limite', { ascending: true });

      if (error) throw error;

      // Cargar datos relacionados en paralelo
      const [
        { data: plantas },
        { data: usuarios },
        { data: estados },
        { data: prioridades },
      ] = await Promise.all([
        supabase.from('plantas').select('id, nombre, pais_id'),
        supabase.from('usuarios').select('id, nombre_completo, email'),
        supabase.from('estados_tarea').select('id, nombre, color_hex'),
        supabase.from('prioridades').select('id, nombre'),
      ]);

      const tareasIds = (tareasData || []).map((tarea) => tarea.id);
      const [{ data: paises }, { data: comentarios }, { data: evidencias }] =
        await Promise.all([
          supabase.from('paises').select('id, nombre'),
          tareasIds.length
            ? supabase
                .from('comentarios_tarea')
                .select('id, tarea_id')
                .in('tarea_id', tareasIds)
            : Promise.resolve({ data: [] }),
          tareasIds.length
            ? supabase
                .from('evidencias_tareas')
                .select('id, tarea_id')
                .in('tarea_id', tareasIds)
            : Promise.resolve({ data: [] }),
        ]);

      // Crear mapas para búsqueda rápida
      const plantasMap = (plantas || []).reduce(
        (acc, p) => ({ ...acc, [p.id]: p }),
        {}
      );
      const usuariosMap = (usuarios || []).reduce(
        (acc, u) => ({ ...acc, [u.id]: u }),
        {}
      );
      const estadosMap = (estados || []).reduce(
        (acc, e) => ({ ...acc, [e.id]: e }),
        {}
      );
      const prioridadesMap = (prioridades || []).reduce(
        (acc, p) => ({ ...acc, [p.id]: p }),
        {}
      );
      const paisesMap = (paises || []).reduce(
        (acc, p) => ({ ...acc, [p.id]: p }),
        {}
      );
      const comentariosPorTarea = (comentarios || []).reduce((acc, item) => {
        acc[item.tarea_id] = (acc[item.tarea_id] || 0) + 1;
        return acc;
      }, {});
      const evidenciasPorTarea = (evidencias || []).reduce((acc, item) => {
        acc[item.tarea_id] = (acc[item.tarea_id] || 0) + 1;
        return acc;
      }, {});

      // Combinar datos
      const tareasConRelaciones = (tareasData || []).map((tarea) => ({
        ...tarea,
        usuarios: usuariosMap[tarea.asignado_a],
        estados: estadosMap[tarea.estado_id],
        prioridades: prioridadesMap[tarea.prioridad_id],
        totalComentarios: comentariosPorTarea[tarea.id] || 0,
        totalEvidencias: evidenciasPorTarea[tarea.id] || 0,
        plantas: {
          ...plantasMap[tarea.planta_id],
          paises: paisesMap[plantasMap[tarea.planta_id]?.pais_id],
        },
      }));

      // Filtrar y ordenar
      const tareasProcesadas = tareasConRelaciones.map((tarea) => {
        const diasRestantes = obtenerDiasRestantes(tarea.fecha_limite);
        const estadoFinal = esEstadoFinal(tarea.estados?.nombre);

        return {
          ...tarea,
          diasRestantes,
          estaVencida:
            diasRestantes !== null && diasRestantes < 0 && !estadoFinal,
        };
      });

      const tareasOrdenadas = [...tareasProcesadas]
        .sort((a, b) => {
          if (a.estaVencida && !b.estaVencida) return -1;
          if (!a.estaVencida && b.estaVencida) return 1;
          return (
            (a.diasRestantes ?? Number.MAX_SAFE_INTEGER) -
            (b.diasRestantes ?? Number.MAX_SAFE_INTEGER)
          );
        })
        .slice(0, 10);

      // Agrupar por país
      const agrupadas = {};
      tareasOrdenadas.forEach((tarea) => {
        const pais = tarea.plantas?.paises?.nombre || 'Sin país';
        if (!agrupadas[pais]) {
          agrupadas[pais] = [];
        }
        agrupadas[pais].push(tarea);
      });

      // Inicializar acordeón
      const paisesArray = Object.keys(agrupadas);
      const estadoInicial = {};
      paisesArray.forEach((pais, idx) => {
        estadoInicial[pais] = idx === 0;
      });

      if (montadoRef.current) {
        setTodasLasTareas(tareasProcesadas);
        setTareas(tareasOrdenadas);
        setTareasAgrupadas(agrupadas);
        setExpandido(estadoInicial);
        setEstadosDisponibles(estados || []);
      }
    } catch (err) {
      console.error('Error cargando tareas:', err);
    } finally {
      if (montadoRef.current) {
        setCargando(false);
      }
    }
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

  const obtenerPesoPrioridad = (nombrePrioridad) => {
    const prioridad = nombrePrioridad?.toLowerCase() || '';
    if (prioridad.includes('urgente')) return 0;
    if (prioridad.includes('alta')) return 1;
    if (prioridad.includes('media')) return 2;
    if (prioridad.includes('baja')) return 3;
    return 4;
  };

  const normalizarEtiqueta = (texto) => {
    if (!texto) return 'N/A';
    return texto.replaceAll('_', ' ').toUpperCase();
  };

  const esEstadoFinal = (nombreEstado) => {
    if (!nombreEstado) return false;
    const estado = nombreEstado.toLowerCase();
    return estado.includes('complet');
  };

  const obtenerFechaCalendario = (fecha) => {
    if (!fecha) return null;

    const fechaTexto = typeof fecha === 'string' ? fecha : '';
    const partesFecha = fechaTexto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (partesFecha) {
      const [, anio, mes, dia] = partesFecha;
      return new Date(Number(anio), Number(mes) - 1, Number(dia));
    }

    const fechaDate = new Date(fecha);
    if (Number.isNaN(fechaDate.getTime())) return null;
    return new Date(
      fechaDate.getFullYear(),
      fechaDate.getMonth(),
      fechaDate.getDate()
    );
  };

  const obtenerDiasRestantes = (fechaLimite) => {
    const limite = obtenerFechaCalendario(fechaLimite);
    if (!limite) return null;

    const ahora = new Date();
    const hoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate()
    );

    return Math.round((limite - hoy) / (1000 * 60 * 60 * 24));
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const fechaCalendario = obtenerFechaCalendario(fecha);
    if (!fechaCalendario) return 'N/A';
    return fechaCalendario.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const obtenerTextoDiasRestantes = (tarea) => {
    if (!tarea.fecha_limite) return 'Sin fecha limite';
    if (tarea.estaVencida) {
      return `Vencida hace ${Math.abs(Math.floor(tarea.diasRestantes))} dias`;
    }

    const dias = tarea.diasRestantes;
    if (dias === 0) return 'Ultimo dia';
    if (dias === 1) return 'Falta 1 dia';
    return `Faltan ${dias} dias`;
  };

  const obtenerRiesgoTarea = (tarea) => {
    if (esEstadoFinal(tarea.estados?.nombre)) return 'Completada';
    if (tarea.estaVencida) return 'Vencida';
    if (tarea.diasRestantes === 0) return 'Ultimo dia';
    if (tarea.diasRestantes !== null && tarea.diasRestantes <= 3)
      return 'Por vencer';
    return 'En tiempo';
  };

  const obtenerClaseTarjeta = (tarea) => {
    const estadoNombre = tarea.estados?.nombre?.toLowerCase() || '';
    if (esEstadoFinal(estadoNombre)) {
      const fechaLimite = obtenerFechaCalendario(tarea.fecha_limite);
      const fechaCierre = tarea.fecha_cierre
        ? obtenerFechaCalendario(tarea.fecha_cierre)
        : fechaLimite;
      return fechaCierre <= fechaLimite
        ? styles.tarjetaVerde
        : styles.tarjetaRoja;
    }
    if (tarea.estaVencida) return styles.tarjetaRoja;
    if (tarea.diasRestantes !== null && tarea.diasRestantes <= 1)
      return styles.tarjetaAmarilla;
    return '';
  };

  const resumenCritico = {
    vencidas: todasLasTareas.filter((t) => t.estaVencida).length,
    porVencer: todasLasTareas.filter(
      (t) =>
        !t.estaVencida &&
        !esEstadoFinal(t.estados?.nombre) &&
        t.diasRestantes !== null &&
        t.diasRestantes <= 3
    ).length,
  };

  const resumenResponsables = useMemo(
    () =>
      Object.values(
        todasLasTareas.reduce((acc, tarea) => {
          const id = tarea.usuarios?.id || 'sin-asignar';
          const nombre = tarea.usuarios?.nombre_completo || 'Sin asignar';

          if (!acc[id]) {
            acc[id] = {
              id,
              nombre,
              total: 0,
              vencidas: 0,
            };
          }

          acc[id].total += 1;
          if (tarea.estaVencida) {
            acc[id].vencidas += 1;
          }

          return acc;
        }, {})
      ).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        if (b.vencidas !== a.vencidas) return b.vencidas - a.vencidas;
        return a.nombre.localeCompare(b.nombre, 'es');
      }),
    [todasLasTareas]
  );

  useEffect(() => {
    const usuariosIds = resumenResponsables
      .map((r) => r.id)
      .filter((id) => id !== 'sin-asignar');
    responsablesIdsRef.current = usuariosIds;
    cargarAlertasActivas(usuariosIds);
  }, [resumenResponsables]);

  useEffect(() => {
    if (cargandoAuth) return;

    const channelAlertas = supabase
      .channel('realtime-alertas-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alertas_usuario',
        },
        () => {
          if (cargarAlertasActivasRef.current) {
            cargarAlertasActivasRef.current(responsablesIdsRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelAlertas);
    };
  }, [cargandoAuth]);

  const totalGeneralTareas = todasLasTareas.length;
  const totalCompletadas = todasLasTareas.filter((t) =>
    esEstadoFinal(t.estados?.nombre)
  ).length;
  const totalPendientes = todasLasTareas.filter((t) => {
    const estado = t.estados?.nombre?.toLowerCase() || '';
    return estado.includes('pendiente');
  }).length;
  const porcentajeCompletado = totalGeneralTareas
    ? Math.round((totalCompletadas / totalGeneralTareas) * 100)
    : 0;
  const porcentajePendiente = totalGeneralTareas
    ? Math.round((totalPendientes / totalGeneralTareas) * 100)
    : 0;
  const maxVencidasResponsable = Math.max(
    0,
    ...resumenResponsables.map((responsable) => responsable.vencidas)
  );
  const responsablesMasVencidas = resumenResponsables
    .filter(
      (responsable) =>
        maxVencidasResponsable > 0 &&
        responsable.vencidas === maxVencidasResponsable
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const opcionesUsuarios = [
    ...new Map(
      todasLasTareas
        .filter((t) => t.usuarios?.id)
        .map((t) => [t.usuarios.id, t.usuarios.nombre_completo])
    ).entries(),
  ];
  const opcionesPrioridades = [
    ...new Set(
      todasLasTareas.map((t) => t.prioridades?.nombre).filter(Boolean)
    ),
  ];
  const opcionesEstados = (estadosDisponibles || [])
    .map((e) => e.nombre)
    .filter(Boolean)
    .sort();

  const tareasFiltradas = todasLasTareas.filter((tarea) => {
    // Excluir tareas completadas Y revisadas
    if (
      tarea.estados?.nombre?.toLowerCase().includes('complet') &&
      tarea.revisado === true
    ) {
      return false;
    }
    const usuarioId = tarea.usuarios?.id || 'sin-asignar';
    const prioridad = tarea.prioridades?.nombre || 'N/A';
    const estado = tarea.estados?.nombre || 'N/A';

    const cumpleUsuario =
      filtroUsuario === 'todos' || usuarioId === filtroUsuario;
    const cumplePrioridad =
      filtroPrioridad === 'todos' || prioridad === filtroPrioridad;
    const cumpleEstado = filtroEstado === 'todos' || estado === filtroEstado;

    return cumpleUsuario && cumplePrioridad && cumpleEstado;
  });

  const tareasAgrupadasFiltradas = {};
  tareasFiltradas.forEach((tarea) => {
    const pais = tarea.plantas?.paises?.nombre || 'Sin país';
    if (!tareasAgrupadasFiltradas[pais]) {
      tareasAgrupadasFiltradas[pais] = [];
    }
    tareasAgrupadasFiltradas[pais].push(tarea);
  });
  Object.keys(tareasAgrupadasFiltradas).forEach((pais) => {
    tareasAgrupadasFiltradas[pais].sort((a, b) => {
      const prioridadA = obtenerPesoPrioridad(a.prioridades?.nombre);
      const prioridadB = obtenerPesoPrioridad(b.prioridades?.nombre);

      if (prioridadA !== prioridadB) return prioridadA - prioridadB;
      if (a.estaVencida && !b.estaVencida) return -1;
      if (!a.estaVencida && b.estaVencida) return 1;
      return (
        (a.diasRestantes ?? Number.MAX_SAFE_INTEGER) -
        (b.diasRestantes ?? Number.MAX_SAFE_INTEGER)
      );
    });
  });

  const iniciales = (nombre = '') => {
    if (!nombre) return 'SN';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  };

  const obtenerToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  };

  const AbrirModal = async (tarea) => {
    if (drawerCierreTimerRef.current) {
      clearTimeout(drawerCierreTimerRef.current);
      drawerCierreTimerRef.current = null;
    }
    setDrawerCerrando(false);
    setTareaSeleccionada(tarea);
    setModalEstadoId(tarea.estado_id || '');
    setModalProgreso(tarea.porcentaje_avance || 0);
    setModalRevisado(tarea.revisado || false);
    setModalObservaciones(tarea.observaciones || '');
    setModalEvidencias([]);
    setModalComentarios([]);
    setModalError('');
    setModalSuccess('');
    setModalDetalleAbierto(true);

    // Cargar evidencias + comentarios del detalle en paralelo
    setModalCargandoEvidencias(true);
    setModalCargandoComentarios(true);
    try {
      const token = await obtenerToken();
      const [resEvidencias, resDetalle] = await Promise.all([
        fetch(`/api/admin/tareas/${tarea.id}/evidencias`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/tareas/${tarea.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resEvidencias.ok) {
        const evidenciasJson = await resEvidencias.json();
        setModalEvidencias(evidenciasJson.data || []);
      }

      if (resDetalle.ok) {
        const detalleJson = await resDetalle.json();
        const comentariosOrdenados = [...(detalleJson.comentarios || [])].sort(
          (a, b) =>
            new Date(b.fecha_creacion || b.created_at) -
            new Date(a.fecha_creacion || a.created_at)
        );
        setModalComentarios(comentariosOrdenados);
      }
    } catch {
      // silencioso, datos no críticos para abrir el modal
    } finally {
      setModalCargandoEvidencias(false);
      setModalCargandoComentarios(false);
    }
  };

  const CerrarModal = useCallback(() => {
    setDrawerCerrando(false);
    setModalDetalleAbierto(false);
    setTareaSeleccionada(null);
    setModalNuevoComentario('');
  }, []);

  const CerrarDrawerAnimado = useCallback(() => {
    if (drawerCerrando) return;
    setDrawerCerrando(true);

    if (drawerCierreTimerRef.current) {
      clearTimeout(drawerCierreTimerRef.current);
    }

    drawerCierreTimerRef.current = setTimeout(() => {
      CerrarModal();
      drawerCierreTimerRef.current = null;
    }, 220);
  }, [CerrarModal, drawerCerrando]);

  useEffect(() => {
    if (!modalDetalleAbierto) return;

    const cerrarConEscape = (e) => {
      if (e.key === 'Escape') {
        CerrarDrawerAnimado();
      }
    };

    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [modalDetalleAbierto, CerrarDrawerAnimado]);

  const GuardarModal = async () => {
    if (!tareaSeleccionada) return;
    setModalGuardando(true);
    setModalError('');
    setModalSuccess('');
    try {
      const token = await obtenerToken();
      const res = await fetch(`/api/admin/tareas/${tareaSeleccionada.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado_id: modalEstadoId,
          porcentaje_avance: Number(modalProgreso),
          revisado: modalRevisado,
          observaciones: modalObservaciones,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      setModalSuccess('Cambios guardados');
      // Actualizar la tarea en el estado local
      const actualizar = (lista) =>
        lista.map((t) =>
          t.id === tareaSeleccionada.id
            ? {
                ...t,
                estado_id: modalEstadoId,
                porcentaje_avance: Number(modalProgreso),
                revisado: modalRevisado,
                observaciones: modalObservaciones,
                estados:
                  estadosDisponibles.find((e) => e.id === modalEstadoId) ||
                  t.estados,
              }
            : t
        );
      setTareas((prev) => actualizar(prev));
      setTodasLasTareas((prev) => actualizar(prev));
      setTimeout(() => setModalSuccess(''), 2500);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalGuardando(false);
    }
  };

  const agregarComentarioModal = async () => {
    if (!modalNuevoComentario.trim() || !tareaSeleccionada) return;

    try {
      setModalAgreganComentario(true);
      setModalError('');

      const token = await obtenerToken();
      const res = await fetch(`/api/admin/tareas/${tareaSeleccionada.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contenido: modalNuevoComentario,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al agregar comentario');
      }

      const { data: nuevoComentario } = await res.json();
      setModalComentarios((prev) => [nuevoComentario, ...prev]);
      setModalNuevoComentario('');
      setModalSuccess('Comentario agregado');
      setTimeout(() => setModalSuccess(''), 2500);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalAgreganComentario(false);
    }
  };

  const toggleAcordeon = (pais) => {
    setExpandido((prev) => ({
      ...prev,
      [pais]: !prev[pais],
    }));
  };

  const enviarAlertaResponsable = async () => {
    if (!responsableSeleccionado?.id) return;
    if (!mensajeAlerta.trim()) {
      alert('Escribe un mensaje de alerta antes de enviar.');
      return;
    }

    setEnviandoAlerta(true);
    try {
      const user = await supabase.auth.getUser();
      const { error } = await supabase.rpc('crear_alerta_usuario', {
        p_usuario_id: responsableSeleccionado.id,
        p_creado_por: user.data.user.id,
        p_mensaje: mensajeAlerta.trim(),
      });
      if (error) throw error;
      setAlertaEnviadaOk(true);
      cierreAlertaTimerRef.current = setTimeout(() => {
        setModalAlertaAbierto(false);
        setAlertaEnviadaOk(false);
        const usuariosIds = resumenResponsables
          .map((r) => r.id)
          .filter((id) => id !== 'sin-asignar');
        cargarAlertasActivas(usuariosIds);
      }, 800);
    } catch (err) {
      alert('Error al enviar alerta: ' + err.message);
    } finally {
      setEnviandoAlerta(false);
    }
  };

  if (cargandoAuth || cargando) {
    return <Layout titulo="Dashboard">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Panel de Control" ocultarHeader>
      <section className={styles.hero}>
        <div>
          <p className={styles.heroKicker}>Monitoreo Operativo</p>
          <h1 className={styles.heroTitulo}>Tablero de Tareas por Región</h1>
          <p className={styles.heroSubtitulo}>
            Vista priorizada por urgencia, ordenada por vencimiento y organizada
            por país para una revisión ejecutiva rápida.
          </p>
        </div>
      </section>

      <section className={styles.resumenSeccion}>
        <div
          className={`${styles.resumenCard} ${styles.resumenCardResponsables}`}
        >
          <div className={styles.resumenCardHeader}>
            <div>
              <p className={styles.resumenEyebrow}>Carga por responsable</p>
              <h3>¿Cuántas tareas tiene cada persona asignadas?</h3>
            </div>
            <span className={styles.resumenBadge}>
              {resumenResponsables.length} responsables
            </span>
          </div>

          <div className={styles.responsablesLista}>
            {resumenResponsables.map((responsable) => {
              const alerta = alertasActivas?.[responsable.id];
              let estadoAlerta = null;
              if (alerta) {
                if (alerta.activa) estadoAlerta = 'pendiente';
                else if (
                  alerta.estado_visual_admin === 'confirmada_visible_admin'
                )
                  estadoAlerta = 'confirmada';
              }
              return (
                <div
                  key={responsable.id}
                  className={
                    styles.responsableItem +
                    ' ' +
                    (estadoAlerta
                      ? `${styles.responsableConAlerta} ${styles[`alerta_${estadoAlerta}`]}`
                      : '')
                  }
                  tabIndex={responsable.id !== 'sin-asignar' ? 0 : -1}
                  role="button"
                  style={{
                    cursor:
                      responsable.id !== 'sin-asignar' ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (responsable.id !== 'sin-asignar') {
                      if (cierreAlertaTimerRef.current) {
                        clearTimeout(cierreAlertaTimerRef.current);
                      }
                      setResponsableSeleccionado(responsable);
                      setAlertaEnviadaOk(false);
                      setModalAlertaAbierto(true);
                      setMensajeAlerta(
                        'Por favor, revisa tus tareas asignadas.'
                      );
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && responsable.id !== 'sin-asignar') {
                      if (cierreAlertaTimerRef.current) {
                        clearTimeout(cierreAlertaTimerRef.current);
                      }
                      setResponsableSeleccionado(responsable);
                      setAlertaEnviadaOk(false);
                      setModalAlertaAbierto(true);
                      setMensajeAlerta(
                        'Por favor, revisa tus tareas asignadas.'
                      );
                    }
                  }}
                >
                  {estadoAlerta === 'pendiente' && (
                    <span
                      className={styles.alertaBadge}
                      title="Alerta pendiente"
                    >
                      <FiAlertCircle color="#eab308" />
                    </span>
                  )}
                  {estadoAlerta === 'confirmada' && (
                    <span
                      className={styles.alertaBadge}
                      title="Alerta confirmada"
                    >
                      <FiCheckCircle color="#22c55e" />
                    </span>
                  )}
                  <div className={styles.responsableInfo}>
                    <p
                      className={styles.responsableNombre}
                      title={responsable.nombre}
                    >
                      {responsable.nombre}
                    </p>
                    <span className={styles.responsableMeta}>
                      {responsable.vencidas > 0
                        ? `${responsable.vencidas} vencidas`
                        : 'Sin vencidas'}
                    </span>
                  </div>
                  <strong className={styles.responsableTotal}>
                    {responsable.total}
                  </strong>
                </div>
              );
            })}
            {/* Modal de confirmación de alerta */}
            <Modal
              abierto={modalAlertaAbierto}
              onCerrar={() => {
                setModalAlertaAbierto(false);
                setAlertaEnviadaOk(false);
              }}
              titulo="Enviar alerta a responsable"
              modo={alertaEnviadaOk ? 'ver' : 'editar'}
              onAceptar={enviarAlertaResponsable}
              cargando={enviandoAlerta}
              textoAceptar="Enviar alerta"
            >
              <div className={styles.modalDetalle}>
                {alertaEnviadaOk && (
                  <div className={styles.modalAlertaOk}>
                    Alerta enviada correctamente. Cerrando...
                  </div>
                )}
                <div className={styles.modalItem}>
                  <label>Usuario seleccionado</label>
                  <p>{responsableSeleccionado?.nombre || 'Sin usuario'}</p>
                </div>

                <div className={styles.modalCampo}>
                  <label className={styles.modalLabel}>Mensaje de alerta</label>
                  <textarea
                    className={styles.modalTextarea}
                    value={mensajeAlerta}
                    onChange={(e) => setMensajeAlerta(e.target.value)}
                    rows={3}
                    maxLength={500}
                    disabled={enviandoAlerta || alertaEnviadaOk}
                    placeholder="Escribe una alerta clara y accionable para el responsable..."
                  />
                  <span className={styles.modalContador}>
                    {mensajeAlerta.length}/500
                  </span>
                </div>

                <p className={styles.modalTextoSec}>
                  El usuario verá esta alerta como banner en su dashboard hasta
                  que confirme "OK / Enterado".
                </p>
              </div>
            </Modal>
          </div>
        </div>

        <div className={styles.resumenCard}>
          <div className={styles.resumenCardHeader}>
            <div>
              <p className={styles.resumenEyebrow}>Estado global</p>
              <h3>Avance general</h3>
            </div>
          </div>

          <div className={styles.resumenEstadosGrid}>
            <div className={styles.estadoResumenItem}>
              <span className={styles.metaLabel}>Completado</span>
              <strong className={styles.estadoResumenValor}>
                {porcentajeCompletado}%
              </strong>
              <span className={styles.estadoResumenMeta}>
                {totalCompletadas} de {totalGeneralTareas}
              </span>
            </div>

            <div className={styles.estadoResumenItem}>
              <span className={styles.metaLabel}>Pendiente</span>
              <strong className={styles.estadoResumenValor}>
                {porcentajePendiente}%
              </strong>
              <span className={styles.estadoResumenMeta}>
                {totalPendientes} de {totalGeneralTareas}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.resumenCard}>
          <div className={styles.resumenCardHeader}>
            <div>
              <p className={styles.resumenEyebrow}>Riesgo actual</p>
              <h3>Responsables con más vencidas</h3>
            </div>
          </div>

          {responsablesMasVencidas.length > 0 ? (
            <div className={styles.resumenDestacado}>
              <div className={styles.resumenDestacadoLista}>
                {responsablesMasVencidas.length > 1 && (
                  <span className={styles.resumenDestacadoMeta}>
                    Empate en riesgo
                  </span>
                )}
                {responsablesMasVencidas.map((responsable) => (
                  <div
                    key={responsable.id}
                    className={styles.resumenDestacadoItem}
                  >
                    <span className={styles.avatarResumen}>
                      {iniciales(responsable.nombre)}
                    </span>
                    <div>
                      <p
                        className={styles.resumenDestacadoNombre}
                        title={responsable.nombre}
                      >
                        {responsable.nombre}
                      </p>
                      <span className={styles.resumenDestacadoMeta}>
                        {responsable.vencidas} tareas vencidas activas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.resumenVacio}>
              <span className={styles.resumenVacioIcono}>
                <FiCheckCircle />
              </span>
              <div>
                <strong>Sin tareas vencidas</strong>
                <span>No hay responsables en riesgo actualmente</span>
              </div>
            </div>
          )}
        </div>
      </section>

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

      <div className={styles.tareasSeccion}>
        <div className={styles.tareasHeader}>
          <div>
            <h2>LISTA DE TAREAS ASIGNADAS</h2>
            <p>Tareas activas ordenadas por urgencia y vencimiento</p>
          </div>
          <div className={styles.badgeTop}>
            {tareasFiltradas.length} EN VISTA
          </div>
        </div>

        {Object.keys(tareasAgrupadasFiltradas).length === 0 ? (
          <div className={styles.vacio}>
            <p>No hay tareas para mostrar</p>
          </div>
        ) : (
          <div className={styles.acordeon}>
            {Object.entries(tareasAgrupadasFiltradas).map(
              ([pais, tareasDelPais]) => (
                <div key={pais} className={styles.acordeonItem}>
                  <button
                    className={`${styles.acordeonBoton} ${
                      expandido[pais] ? styles.activo : ''
                    }`}
                    onClick={() => toggleAcordeon(pais)}
                  >
                    <span className={styles.regionTitulo}>
                      <FiGlobe /> {pais}
                      <strong>{tareasDelPais.length}</strong>
                    </span>
                    <span className={styles.acordeonToggle}>
                      <FiChevronDown />
                    </span>
                  </button>

                  {expandido[pais] && (
                    <div className={styles.acordeonContenido}>
                      {tareasDelPais.map((tarea) => (
                        <div
                          key={tarea.id}
                          className={`${styles.tarjetaTarea} ${obtenerClaseTarjeta(tarea)}`}
                          onClick={() => AbrirModal(tarea)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') AbrirModal(tarea);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className={styles.cardTop}>
                            <div className={styles.cardBadges}>
                              <span
                                className={obtenerColorPrioridad(
                                  tarea.prioridades?.nombre
                                )}
                              >
                                {normalizarEtiqueta(tarea.prioridades?.nombre)}
                              </span>
                              <span
                                className={obtenerColorEstado(
                                  tarea.estados?.nombre
                                )}
                              >
                                {normalizarEtiqueta(tarea.estados?.nombre)}
                              </span>
                            </div>
                            <div className={styles.cardUsuario}>
                              <span className={styles.avatarMini}>
                                {iniciales(tarea.usuarios?.nombre_completo)}
                              </span>
                              <p
                                className={styles.cardUsuarioNombre}
                                title={
                                  tarea.usuarios?.nombre_completo ||
                                  'Sin asignar'
                                }
                              >
                                {tarea.usuarios?.nombre_completo ||
                                  'Sin asignar'}
                              </p>
                            </div>
                          </div>

                          <h4 className={styles.tarjetaTitulo}>
                            {tarea.titulo}
                          </h4>

                          <p className={styles.cardMetaLinea}>
                            {tarea.plantas?.nombre || 'Sin planta'} · Vence{' '}
                            {formatearFecha(tarea.fecha_limite)} ·{' '}
                            {obtenerTextoDiasRestantes(tarea)}
                          </p>

                          <div className={styles.cardProgresoFila}>
                            <div className={styles.cardProgresoBloque}>
                              <div className={styles.cardProgresoHeader}>
                                <span>
                                  Progreso {tarea.porcentaje_avance || 0}%
                                </span>
                              </div>
                              <div className={styles.barraProgreso}>
                                <div
                                  className={styles.barraProgresoFill}
                                  style={{
                                    width: `${tarea.porcentaje_avance || 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                            {!esEstadoFinal(tarea.estados?.nombre) && (
                              <span className={styles.cardRiesgo}>
                                <FiAlertCircle /> {obtenerRiesgoTarea(tarea)}
                              </span>
                            )}
                          </div>

                          <div className={styles.cardFooter}>
                            <span>
                              <FiMessageCircle /> {tarea.totalComentarios || 0}{' '}
                              comentarios
                            </span>
                            <span>
                              <FiPaperclip /> {tarea.totalEvidencias || 0}{' '}
                              evidencias
                            </span>
                            <strong>
                              Ver <FiArrowRight />
                            </strong>
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
      </div>

      {modalDetalleAbierto && tareaSeleccionada && (
        <div
          className={`${styles.drawerOverlay} ${
            drawerCerrando ? styles.drawerOverlaySaliendo : ''
          }`}
        >
          <aside
            className={`${styles.drawer} ${
              drawerCerrando ? styles.drawerSaliendo : ''
            }`}
            aria-label="Detalle operativo de tarea"
          >
            <header className={styles.drawerHeader}>
              <div>
                <p className={styles.drawerEyebrow}>Detalle operativo</p>
                <h2>{tareaSeleccionada.titulo}</h2>
              </div>
              <div className={styles.drawerAcciones}>
                <button
                  type="button"
                  className={styles.drawerBtnPrimario}
                  onClick={GuardarModal}
                  disabled={modalGuardando}
                >
                  <FiRefreshCw />
                  {modalGuardando ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button
                  type="button"
                  className={styles.drawerBtnSecundario}
                  onClick={CerrarDrawerAnimado}
                  aria-label="Cerrar detalle"
                >
                  <FiX />
                  Cerrar
                </button>
              </div>
            </header>

            <div className={styles.drawerBody}>
              {modalError && (
                <div className={styles.modalAlerta}>{modalError}</div>
              )}
              {modalSuccess && (
                <div className={styles.modalAlertaOk}>{modalSuccess}</div>
              )}

              <div className={styles.drawerGrid}>
                <div className={styles.drawerColumna}>
                  <section className={styles.drawerSeccion}>
                    <h3>Resumen</h3>
                    <div className={styles.drawerResumenGrid}>
                      <div>
                        <span>Asignado a</span>
                        <strong>
                          {tareaSeleccionada.usuarios?.nombre_completo ||
                            'Sin asignar'}
                        </strong>
                      </div>
                      <div>
                        <span>Planta</span>
                        <strong>
                          {tareaSeleccionada.plantas?.nombre || 'N/A'}
                        </strong>
                      </div>
                      <div>
                        <span>Prioridad</span>
                        <strong>
                          {normalizarEtiqueta(
                            tareaSeleccionada.prioridades?.nombre
                          )}
                        </strong>
                      </div>
                      <div>
                        <span>Estado</span>
                        <strong>
                          {normalizarEtiqueta(
                            tareaSeleccionada.estados?.nombre
                          )}
                        </strong>
                      </div>
                      <div>
                        <span>Fecha inicio</span>
                        <strong>
                          {formatearFecha(tareaSeleccionada.fecha_inicio)}
                        </strong>
                      </div>
                      <div>
                        <span>Fecha limite</span>
                        <strong>
                          {formatearFecha(tareaSeleccionada.fecha_limite)}
                        </strong>
                      </div>
                      <div>
                        <span>Progreso</span>
                        <strong>
                          {tareaSeleccionada.porcentaje_avance || 0}%
                        </strong>
                      </div>
                      <div>
                        <span>Riesgo</span>
                        <strong>{obtenerRiesgoTarea(tareaSeleccionada)}</strong>
                      </div>
                    </div>
                  </section>

                  <section className={styles.drawerSeccion}>
                    <h3>Descripción</h3>
                    <p className={styles.drawerDescripcion}>
                      {tareaSeleccionada.descripcion ||
                        'Sin descripción registrada.'}
                    </p>
                  </section>

                  <section className={styles.drawerSeccion}>
                    <h3>Update operativo</h3>
                    <div className={styles.modalCampo}>
                      <label className={styles.modalLabel}>Estado</label>
                      <select
                        className={styles.modalSelect}
                        value={modalEstadoId}
                        onChange={(e) => setModalEstadoId(e.target.value)}
                      >
                        {estadosDisponibles.map((est) => (
                          <option key={est.id} value={est.id}>
                            {normalizarEtiqueta(est.nombre)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.modalCampo}>
                      <label className={styles.modalLabel}>Progreso</label>
                      <div className={styles.drawerProgresoControl}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={modalProgreso}
                          onChange={(e) => setModalProgreso(e.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={modalProgreso}
                          onChange={(e) => setModalProgreso(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className={styles.modalCampo}>
                      <label className={styles.modalLabel}>Observaciones</label>
                      <textarea
                        className={styles.modalTextarea}
                        value={modalObservaciones}
                        onChange={(e) => setModalObservaciones(e.target.value)}
                        placeholder="Agrega notas o comentarios sobre esta tarea..."
                        rows={4}
                        maxLength={1000}
                      />
                      <span className={styles.modalContador}>
                        {modalObservaciones.length}/1000
                      </span>
                    </div>

                    <div className={styles.modalCampo}>
                      <label className={styles.modalLabel}>
                        Revisado por admin
                      </label>
                      <button
                        className={`${styles.toggleRevisado} ${modalRevisado ? styles.toggleOn : styles.toggleOff}`}
                        onClick={() => setModalRevisado((v) => !v)}
                        type="button"
                      >
                        <span className={styles.toggleCircle} />
                        <span>
                          {modalRevisado
                            ? 'Marcado como revisado'
                            : 'Pendiente de revisión'}
                        </span>
                      </button>
                    </div>
                  </section>
                </div>

                <div className={styles.drawerColumna}>
                  <section className={styles.drawerSeccion}>
                    <div className={styles.drawerSeccionHeader}>
                      <h3>Comentarios</h3>
                      <span>
                        {modalCargandoComentarios
                          ? '...'
                          : modalComentarios.length}
                      </span>
                    </div>

                    {modalCargandoComentarios ? (
                      <p className={styles.modalTextoSec}>
                        Cargando comentarios...
                      </p>
                    ) : modalComentarios.length === 0 ? (
                      <p className={styles.modalTextoSec}>
                        Sin comentarios registrados.
                      </p>
                    ) : (
                      <div className={styles.modalComentariosLista}>
                        {modalComentarios.map((com) => (
                          <div
                            key={com.id}
                            className={styles.modalComentarioItem}
                          >
                            <div className={styles.modalComentarioCabecera}>
                              <strong>
                                {com.usuario?.nombre_completo || 'Usuario'}
                              </strong>
                              <span>
                                {formatearFechaHora(
                                  com.fecha_creacion || com.created_at
                                )}
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
                        value={modalNuevoComentario}
                        onChange={(e) =>
                          setModalNuevoComentario(e.target.value)
                        }
                        className={styles.textareaModal}
                        maxLength={500}
                        disabled={modalAgreganComentario}
                      />
                      <div className={styles.pieFormularioModal}>
                        <span className={styles.contadorModal}>
                          {modalNuevoComentario.length}/500
                        </span>
                        <button
                          onClick={agregarComentarioModal}
                          disabled={
                            modalAgreganComentario ||
                            !modalNuevoComentario.trim()
                          }
                          className={styles.btnEnviarModal}
                        >
                          {modalAgreganComentario ? 'Enviando...' : 'Enviar'}
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className={styles.drawerSeccion}>
                    <div className={styles.drawerSeccionHeader}>
                      <h3>Evidencias</h3>
                      <span>
                        {modalCargandoEvidencias
                          ? '...'
                          : modalEvidencias.length}
                      </span>
                    </div>

                    {modalCargandoEvidencias ? (
                      <p className={styles.modalTextoSec}>Cargando...</p>
                    ) : modalEvidencias.length === 0 ? (
                      <p className={styles.modalTextoSec}>
                        Sin evidencias subidas aún.
                      </p>
                    ) : (
                      <div className={styles.modalEvidencias}>
                        {modalEvidencias.map((ev) => (
                          <div
                            key={ev.id}
                            className={styles.modalEvidenciaItem}
                          >
                            <span className={styles.modalEvidenciaIcono}>
                              {ev.tipo_mime?.startsWith('image/') ? (
                                <FiImage size={16} />
                              ) : (
                                <FiFile size={16} />
                              )}
                            </span>
                            <div className={styles.modalEvidenciaDatos}>
                              <span className={styles.modalEvidenciaNombre}>
                                {ev.descripcion ||
                                  ev.archivo_path?.split('_').pop()}
                              </span>
                              <span className={styles.modalEvidenciaMeta}>
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
                              className={styles.modalBtnVer}
                              title="Ver archivo"
                            >
                              <FiExternalLink size={14} /> Ver
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </Layout>
  );
}
