import Layout from '@components/Layout';
import UserTaskDetailDrawer from '@components/user/UserTaskDetailDrawer';
import { useUser } from '@hooks/useProtegerRuta';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import { FiFilter, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import styles from '@styles/DashboardUser.module.css';

export default function UserDashboard() {
  const { cargando: cargandoAuth } = useUser();
  const { usuarioDetalles } = useAuth();
  const montadoRef = useRef(true);
  const cargarAlertaRef = useRef(null);
  const [todasLasTareas, setTodasLasTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('todos');
  const [alertaUsuario, setAlertaUsuario] = useState(null);
  const [confirmandoAlerta, setConfirmandoAlerta] = useState(false);
  const [tareaDetalle, setTareaDetalle] = useState(null);

  const cargarAlertaUsuario = async () => {
    if (!usuarioDetalles?.id) return;
    const { data, error } = await supabase
      .from('alertas_usuario')
      .select('id, mensaje, activa, enviada_at')
      .eq('usuario_id', usuarioDetalles.id)
      .eq('activa', true)
      .order('enviada_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!montadoRef.current) return;

    if (error) {
      console.error('Error cargando alerta usuario:', error);
      setAlertaUsuario(null);
      return;
    }

    if (data?.activa) {
      setAlertaUsuario(data);
    } else {
      setAlertaUsuario(null);
    }
  };

  useEffect(() => {
    cargarAlertaRef.current = cargarAlertaUsuario;
  });

  useEffect(() => {
    montadoRef.current = true;
    if (!cargandoAuth && usuarioDetalles?.id) {
      cargarTareas();
    }

    // --- SUSCRIPCIÓN REALTIME ---
    let channel = null;
    if (!cargandoAuth && usuarioDetalles?.id) {
      channel = supabase
        .channel('realtime-tareas-user')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tareas',
          },
          (payload) => {
            cargarTareas();
          }
        )
        .subscribe();
    }

    return () => {
      montadoRef.current = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [cargandoAuth, usuarioDetalles?.id]);

  // Cargar alerta activa para el usuario
  useEffect(() => {
    if (cargandoAuth || !usuarioDetalles?.id) return;
    cargarAlertaUsuario();
  }, [cargandoAuth, usuarioDetalles?.id]);

  useEffect(() => {
    if (cargandoAuth || !usuarioDetalles?.id) return;

    const channelAlertas = supabase
      .channel(`realtime-alertas-user-${usuarioDetalles.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alertas_usuario',
          filter: `usuario_id=eq.${usuarioDetalles.id}`,
        },
        () => {
          if (cargarAlertaRef.current) {
            cargarAlertaRef.current();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelAlertas);
    };
  }, [cargandoAuth, usuarioDetalles?.id]);

  const confirmarAlerta = async () => {
    if (!alertaUsuario?.id || !usuarioDetalles?.id) return;
    setConfirmandoAlerta(true);
    try {
      const { error } = await supabase.rpc('confirmar_alerta_usuario', {
        p_alerta_id: alertaUsuario.id,
        p_usuario_id: usuarioDetalles.id,
      });
      if (error) throw error;
      setAlertaUsuario(null);
    } catch (err) {
      alert('Error al confirmar alerta: ' + err.message);
    } finally {
      setConfirmandoAlerta(false);
    }
  };

  const obtenerToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.access_token) {
      throw new Error('No autenticado');
    }
    return data.session.access_token;
  };

  const cargarTareas = async () => {
    try {
      setCargando(true);
      const token = await obtenerToken();
      const response = await fetch('/api/user/tareas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error cargando tareas');
      const tareasData = await response.json();

      const tareasProcesadas = (tareasData || []).map((tarea) => {
        const diasRestantes = obtenerDiasRestantes(tarea.fecha_limite);

        return {
          ...tarea,
          diasRestantes,
          estaVencida:
            diasRestantes !== null &&
            diasRestantes < 0 &&
            !esEstadoFinal(tarea.estado?.nombre),
        };
      });

      if (montadoRef.current) {
        setTodasLasTareas(tareasProcesadas);
      }
    } catch (err) {
      console.error('Error cargando tareas:', err);
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  };

  const esEstadoFinal = (nombreEstado) => {
    if (!nombreEstado) return false;
    return nombreEstado.toLowerCase().includes('complet');
  };

  const normalizarEtiqueta = (texto) => {
    if (!texto) return 'N/A';
    return texto.replaceAll('_', ' ').toUpperCase();
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

  const obtenerColorEstado = (nombreEstado) => {
    if (!nombreEstado) return styles.badgeEstado;
    const estado = nombreEstado.toLowerCase();
    if (estado.includes('pendiente'))
      return `${styles.badgeEstado} ${styles.estadoPendiente}`;
    if (estado.includes('proceso'))
      return `${styles.badgeEstado} ${styles.estadoEnProceso}`;
    if (estado.includes('revision'))
      return `${styles.badgeEstado} ${styles.estadoEnRevision}`;
    if (estado.includes('complet'))
      return `${styles.badgeEstado} ${styles.estadoCompletado}`;
    if (estado.includes('detenido'))
      return `${styles.badgeEstado} ${styles.estadoDetenido}`;
    return styles.badgeEstado;
  };

  const obtenerColorPrioridad = (nombrePrioridad) => {
    if (!nombrePrioridad) return styles.badgePrioridad;
    const prioridad = nombrePrioridad.toLowerCase();
    if (prioridad.includes('urgente'))
      return `${styles.badgePrioridad} ${styles.prioridadUrgente}`;
    if (prioridad.includes('alta'))
      return `${styles.badgePrioridad} ${styles.prioridadAlta}`;
    if (prioridad.includes('media'))
      return `${styles.badgePrioridad} ${styles.prioridadMedia}`;
    if (prioridad.includes('baja'))
      return `${styles.badgePrioridad} ${styles.prioridadBaja}`;
    return styles.badgePrioridad;
  };

  const obtenerClaseTarjeta = (tarea) => {
    if (tarea.estaVencida) return styles.tarjetaRoja;
    if (tarea.diasRestantes !== null && tarea.diasRestantes <= 1)
      return styles.tarjetaAmarilla;
    return '';
  };

  const obtenerTextoDiasRestantes = (tarea) => {
    if (!tarea.fecha_limite) return 'Sin fecha limite';
    if (tarea.estaVencida) {
      return `Vencida hace ${Math.abs(tarea.diasRestantes)} dias`;
    }

    if (tarea.diasRestantes === 0) return 'Ultimo dia';
    if (tarea.diasRestantes === 1) return 'Falta 1 dia';
    return `Faltan ${tarea.diasRestantes} dias`;
  };

  const obtenerRiesgoTarea = (tarea) => {
    if (esEstadoFinal(tarea.estado?.nombre)) return 'Completada';
    if (tarea.estaVencida) return 'Vencida';
    if (tarea.diasRestantes === 0) return 'Ultimo dia';
    if (tarea.diasRestantes !== null && tarea.diasRestantes <= 3)
      return 'Por vencer';
    return 'En tiempo';
  };

  const obtenerClaseRiesgo = (tarea) => {
    if (tarea.estaVencida)
      return `${styles.cardRiesgo} ${styles.riesgoVencido}`;
    if (tarea.diasRestantes === 0)
      return `${styles.cardRiesgo} ${styles.riesgoUltimoDia}`;
    if (tarea.diasRestantes !== null && tarea.diasRestantes <= 3)
      return `${styles.cardRiesgo} ${styles.riesgoPorVencer}`;
    return `${styles.cardRiesgo} ${styles.riesgoEnTiempo}`;
  };

  // Stats calculadas (excluyendo finalizadas + revisadas)
  const tareasActivas = todasLasTareas.filter((tarea) => {
    // Excluir solo si: completado AND revisado=true
    if (
      tarea.estado?.nombre?.toLowerCase().includes('complet') &&
      tarea.revisado === true
    ) {
      return false;
    }
    return true;
  });
  const stats = {
    total: tareasActivas.length,
    enProceso: tareasActivas.filter((t) =>
      t.estado?.nombre?.toLowerCase().includes('proceso')
    ).length,
    vencidas: tareasActivas.filter((t) => t.estaVencida).length,
    avancePromedio:
      tareasActivas.length > 0
        ? Math.round(
            tareasActivas.reduce(
              (sum, t) => sum + (t.porcentaje_avance || 0),
              0
            ) / tareasActivas.length
          )
        : 0,
  };

  // Opciones de filtros
  const opcionesPrioridades = [
    ...new Set(tareasActivas.map((t) => t.prioridad?.nombre).filter(Boolean)),
  ];
  const opcionesEstados = [
    ...new Set(tareasActivas.map((t) => t.estado?.nombre).filter(Boolean)),
  ];

  // Filtrado
  const tareasFiltradas = tareasActivas
    .filter((tarea) => {
      const prioridad = tarea.prioridad?.nombre || 'N/A';
      const estado = tarea.estado?.nombre || 'N/A';

      const cumplePrioridad =
        filtroPrioridad === 'todos' || prioridad === filtroPrioridad;
      const cumpleEstado = filtroEstado === 'todos' || estado === filtroEstado;

      let cumpleFecha = true;
      if (filtroFecha === 'vencidas') {
        cumpleFecha = tarea.estaVencida;
      } else if (filtroFecha === 'esta_semana') {
        cumpleFecha =
          tarea.diasRestantes !== null &&
          tarea.diasRestantes >= 0 &&
          tarea.diasRestantes <= 7;
      } else if (filtroFecha === 'proximas') {
        cumpleFecha = tarea.diasRestantes !== null && tarea.diasRestantes > 7;
      }

      return cumplePrioridad && cumpleEstado && cumpleFecha;
    })
    .sort((a, b) => {
      if (a.estaVencida && !b.estaVencida) return -1;
      if (!a.estaVencida && b.estaVencida) return 1;
      return (
        (a.diasRestantes ?? Number.MAX_SAFE_INTEGER) -
        (b.diasRestantes ?? Number.MAX_SAFE_INTEGER)
      );
    });

  const abrirDetalle = (tarea) => {
    setTareaDetalle(tarea);
  };

  const cerrarDetalle = () => {
    setTareaDetalle(null);
  };

  if (cargandoAuth || cargando) {
    return <Layout titulo="Dashboard">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Mi Dashboard" ocultarHeader>
      {/* Header con stats compactas */}
      <section className={styles.hero}>
        <div className={styles.heroInfo}>
          <p className={styles.heroKicker}>Mis Tareas</p>
          <h1 className={styles.heroTitulo}>
            Hola, {usuarioDetalles?.nombre_completo?.split(' ')[0] || 'Usuario'}
          </h1>
          <p className={styles.heroSubtitulo}>
            Resumen de tus tareas activas y pendientes
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statChip}>
            <span className={styles.statNumero}>{stats.total}</span>
            <span className={styles.statLabel}>Activas</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statNumero}>{stats.enProceso}</span>
            <span className={styles.statLabel}>En Proceso</span>
          </div>
          <div
            className={`${styles.statChip} ${stats.vencidas > 0 ? styles.statAlerta : ''}`}
          >
            <span className={styles.statNumero}>{stats.vencidas}</span>
            <span className={styles.statLabel}>Vencidas</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statNumero}>{stats.avancePromedio}%</span>
            <span className={styles.statLabel}>Avance</span>
          </div>
        </div>
      </section>

      {/* Banner de alerta individual */}
      {alertaUsuario && (
        <div className={styles.bannerAlertaUsuario}>
          <FiAlertCircle
            style={{ marginRight: 8, fontSize: 22, color: '#eab308' }}
          />
          <div className={styles.bannerAlertaMensaje}>
            {alertaUsuario.mensaje}
          </div>
          <button
            className={styles.bannerAlertaBtn}
            onClick={confirmarAlerta}
            disabled={confirmandoAlerta}
          >
            OK / Enterado
          </button>
        </div>
      )}

      {/* Filtros operativos */}
      <section className={styles.filtrosSeccion}>
        <div className={styles.filtroTitulo}>
          <FiFilter />
          <span>FILTROS</span>
        </div>
        <div className={styles.filtrosGrid}>
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
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          >
            <option value="todos">TODAS LAS FECHAS</option>
            <option value="vencidas">VENCIDAS</option>
            <option value="esta_semana">PRÓXIMOS 7 DÍAS</option>
            <option value="proximas">MÁS DE 7 DÍAS</option>
          </select>
        </div>
      </section>

      {/* Lista de tareas */}
      <div className={styles.tareasSeccion}>
        <div className={styles.tareasHeader}>
          <div>
            <h2>MIS TAREAS ACTIVAS</h2>
            <p>Ordenadas por urgencia y vencimiento</p>
          </div>
          <div className={styles.badgeTop}>{tareasFiltradas.length} TAREAS</div>
        </div>

        {tareasFiltradas.length === 0 ? (
          <div className={styles.vacio}>
            <span className={styles.vacioIcono}>
              <FiCheckCircle />
            </span>
            <div>
              <strong>Sin tareas para mostrar</strong>
              <p>Ajusta los filtros o espera nuevas asignaciones.</p>
            </div>
          </div>
        ) : (
          <div className={styles.listaCards}>
            {tareasFiltradas.map((tarea) => (
              <div
                key={tarea.id}
                className={`${styles.tarjetaTarea} ${obtenerClaseTarjeta(tarea)}`}
                onClick={() => abrirDetalle(tarea)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') abrirDetalle(tarea);
                }}
                role="button"
                tabIndex={0}
              >
                <div className={styles.cardTop}>
                  <h4 className={styles.tarjetaTitulo}>{tarea.titulo}</h4>
                  <div className={styles.cardBadges}>
                    <span
                      className={obtenerColorPrioridad(tarea.prioridad?.nombre)}
                    >
                      {normalizarEtiqueta(tarea.prioridad?.nombre)}
                    </span>
                    <span className={obtenerColorEstado(tarea.estado?.nombre)}>
                      {normalizarEtiqueta(tarea.estado?.nombre)}
                    </span>
                  </div>
                </div>

                <p className={styles.tareaResumen}>
                  {tarea.descripcion || 'Sin descripción'}
                </p>

                <p className={styles.cardMetaLinea}>
                  {tarea.planta?.nombre || 'Sin planta'} · Vence{' '}
                  {formatearFecha(tarea.fecha_limite)} ·{' '}
                  {obtenerTextoDiasRestantes(tarea)}
                </p>

                <div className={styles.cardProgresoFila}>
                  <div className={styles.cardProgresoBloque}>
                    <div className={styles.cardProgresoHeader}>
                      <span>Progreso {tarea.porcentaje_avance || 0}%</span>
                    </div>
                    <div className={styles.barraProgreso}>
                      <div
                        className={styles.barraProgresoFill}
                        style={{ width: `${tarea.porcentaje_avance || 0}%` }}
                      />
                    </div>
                  </div>
                  {!esEstadoFinal(tarea.estado?.nombre) && (
                    <span className={obtenerClaseRiesgo(tarea)}>
                      <FiAlertCircle /> {obtenerRiesgoTarea(tarea)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UserTaskDetailDrawer
        abierto={Boolean(tareaDetalle)}
        tareaId={tareaDetalle?.id}
        tareaInicial={tareaDetalle}
        onClose={cerrarDetalle}
        onTaskUpdated={cargarTareas}
      />
    </Layout>
  );
}
