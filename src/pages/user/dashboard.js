import Layout from '@components/Layout';
import Modal from '@components/Modal';
import { useUser } from '@hooks/useProtegerRuta';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import {
  FiFilter,
  FiCalendar,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFlag,
  FiFileText,
} from 'react-icons/fi';
import styles from '@styles/DashboardUser.module.css';

export default function UserDashboard() {
  const { cargando: cargandoAuth } = useUser();
  const { usuarioDetalles } = useAuth();
  const router = useRouter();
  const montadoRef = useRef(true);
  const [todasLasTareas, setTodasLasTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('todos');

  useEffect(() => {
    montadoRef.current = true;
    if (!cargandoAuth && usuarioDetalles?.id) {
      cargarTareas();
    }
    return () => {
      montadoRef.current = false;
    };
  }, [cargandoAuth, usuarioDetalles?.id]);

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

      const ahora = new Date();
      const tareasProcesadas = (tareasData || []).map((tarea) => ({
        ...tarea,
        diasRestantes:
          (new Date(tarea.fecha_limite) - ahora) / (1000 * 60 * 60 * 24),
        estaVencida:
          new Date(tarea.fecha_limite) < ahora &&
          !esEstadoFinal(tarea.estado?.nombre),
      }));

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
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
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
    if (tarea.diasRestantes <= 1) return styles.tarjetaAmarilla;
    return '';
  };

  // Stats calculadas (excluyendo finalizadas del total visible)
  const tareasActivas = todasLasTareas.filter(
    (t) => !esEstadoFinal(t.estado?.nombre)
  );
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
        cumpleFecha = tarea.diasRestantes >= 0 && tarea.diasRestantes <= 7;
      } else if (filtroFecha === 'proximas') {
        cumpleFecha = tarea.diasRestantes > 7;
      }

      return cumplePrioridad && cumpleEstado && cumpleFecha;
    })
    .sort((a, b) => {
      if (a.estaVencida && !b.estaVencida) return -1;
      if (!a.estaVencida && b.estaVencida) return 1;
      return a.diasRestantes - b.diasRestantes;
    });

  const abrirModal = (tarea) => {
    setTareaSeleccionada(tarea);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTareaSeleccionada(null);
  };

  const irADetalle = (tareaId) => {
    router.push(`/user/tarea/${tareaId}`);
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
            <p>No hay tareas para mostrar</p>
          </div>
        ) : (
          <div className={styles.listaCards}>
            {tareasFiltradas.map((tarea) => (
              <div
                key={tarea.id}
                className={`${styles.tarjetaTarea} ${obtenerClaseTarjeta(tarea)}`}
                onClick={() => abrirModal(tarea)}
              >
                {/* Fila 1: Título */}
                <div className={styles.cardFila1}>
                  <h4 className={styles.tarjetaTitulo}>{tarea.titulo}</h4>
                  {tarea.estaVencida && (
                    <span className={styles.chipVencida}>
                      <FiAlertCircle /> Vencida
                    </span>
                  )}
                </div>

                {/* Cuerpo 3 columnas */}
                <div className={styles.cardCuerpo}>
                  <div className={styles.cardColDesc}>
                    <span className={styles.metaLabel}>
                      <FiFileText /> Descripción
                    </span>
                    <p className={styles.tareaResumen}>
                      {tarea.descripcion || 'Sin descripción'}
                    </p>
                  </div>

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
                          style={{ width: `${tarea.porcentaje_avance || 0}%` }}
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

      {/* Modal de Detalles */}
      <Modal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo="Detalles de la Tarea"
        modo="ver"
      >
        {tareaSeleccionada && (
          <div className={styles.modalDetalle}>
            <div className={styles.modalItem}>
              <label>Nombre de Tarea</label>
              <p>{tareaSeleccionada.titulo}</p>
            </div>

            <div className={styles.modalItem}>
              <label>Descripción</label>
              <p>{tareaSeleccionada.descripcion || 'Sin descripción'}</p>
            </div>

            <div className={styles.modalItem}>
              <label>Prioridad</label>
              <p>{normalizarEtiqueta(tareaSeleccionada.prioridad?.nombre)}</p>
            </div>

            <div className={styles.modalGrid2}>
              <div className={styles.modalItem}>
                <label>Fecha de Inicio</label>
                <p>{formatearFecha(tareaSeleccionada.fecha_inicio)}</p>
              </div>
              <div className={styles.modalItem}>
                <label>Fecha de Entrega</label>
                <p>{formatearFecha(tareaSeleccionada.fecha_limite)}</p>
              </div>
            </div>

            <div className={styles.modalItem}>
              <label>Estado</label>
              <p>{normalizarEtiqueta(tareaSeleccionada.estado?.nombre)}</p>
            </div>

            <div className={styles.modalItem}>
              <label>Avance (%)</label>
              <p>{tareaSeleccionada.porcentaje_avance || 0}%</p>
              <div className={styles.barraProgreso}>
                <div
                  className={styles.barraProgresoFill}
                  style={{
                    width: `${tareaSeleccionada.porcentaje_avance || 0}%`,
                  }}
                />
              </div>
            </div>

            <div className={styles.modalItem}>
              <label>Planta</label>
              <p>{tareaSeleccionada.planta?.nombre || 'N/A'}</p>
            </div>

            <div className={styles.modalItem}>
              <label>Creado por</label>
              <p>
                {tareaSeleccionada.creado_por_user?.nombre_completo || 'N/A'}
              </p>
            </div>

            <button
              className={styles.btnDetalle}
              onClick={() => irADetalle(tareaSeleccionada.id)}
            >
              Abrir Detalle Completo
            </button>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
