import Layout from '@components/Layout';
import { useAdmin } from '@hooks/useProtegerRuta';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@lib/supabase';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FiActivity,
  FiBarChart2,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiUsers,
} from 'react-icons/fi';
import styles from '@styles/EstadisticasAdmin.module.css';

const CHART_COLORS = [
  '#0f766e',
  '#0284c7',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#8b5cf6',
  '#84cc16',
];

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  month: 'short',
  day: '2-digit',
});

const BUCKET_ORDER = [
  'Vencidas',
  '0-7 días',
  '8-15 días',
  '16-30 días',
  '30+ días',
  'Sin fecha',
];

const SHORT_BUCKET_LABELS = {
  Vencidas: 'Vencidas',
  '0-7 días': '0-7d',
  '8-15 días': '8-15d',
  '16-30 días': '16-30d',
  '30+ días': '30+d',
  'Sin fecha': 'Sin fecha',
};

function normalizarEtiqueta(texto) {
  if (!texto) return 'Sin dato';
  return texto.replaceAll('_', ' ').replace(/\s+/g, ' ').trim();
}

function esEstadoFinal(nombreEstado) {
  if (!nombreEstado) return false;
  return nombreEstado.toLowerCase().includes('complet');
}

function obtenerDiasRestantes(fechaLimite) {
  if (!fechaLimite) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaLimite);
  limite.setHours(0, 0, 0, 0);
  return Math.round((limite - hoy) / (1000 * 60 * 60 * 24));
}

function obtenerBucketVencimiento(dias) {
  if (dias === null) return 'Sin fecha';
  if (dias < 0) return 'Vencidas';
  if (dias <= 7) return '0-7 días';
  if (dias <= 15) return '8-15 días';
  if (dias <= 30) return '16-30 días';
  return '30+ días';
}

function resumirNombre(nombre) {
  if (!nombre) return 'Sin asignar';

  const partes = nombre.split(' ').filter(Boolean);

  if (partes.length === 1) return partes[0];
  if (partes.length === 2) return `${partes[0]} ${partes[1][0]}.`;

  return `${partes[0]} ${partes[1][0]}. ${partes[2][0]}.`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      {label ? <p className={styles.tooltipTitle}>{label}</p> : null}
      {payload.map((item) => (
        <div key={item.dataKey} className={styles.tooltipRow}>
          <span
            className={styles.tooltipDot}
            style={{ backgroundColor: item.color }}
          />
          <span>{item.name || item.dataKey}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0];

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{item.name}</p>
      <div className={styles.tooltipRow}>
        <span
          className={styles.tooltipDot}
          style={{ backgroundColor: item.payload.fill || item.color }}
        />
        <span>Total</span>
        <strong>{item.value}</strong>
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return <div className={styles.emptyChart}>{message}</div>;
}

export default function EstadisticasAdmin() {
  const { cargando: cargandoAuth } = useAdmin();
  const montadoRef = useRef(true);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tareas, setTareas] = useState([]);
  const [filtroPlanta, setFiltroPlanta] = useState('todas');
  const [filtroResponsable, setFiltroResponsable] = useState('todos');

  useEffect(() => {
    montadoRef.current = true;

    if (!cargandoAuth) {
      cargarDatos();
    }

    let channel = null;
    if (!cargandoAuth) {
      channel = supabase
        .channel('realtime-estadisticas-admin')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tareas',
          },
          () => cargarDatos()
        )
        .subscribe();
    }

    return () => {
      montadoRef.current = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [cargandoAuth]);

  const cargarDatos = async () => {
    try {
      if (montadoRef.current) setCargando(true);
      setError('');

      const [
        { data: tareasData, error: tareasError },
        { data: plantas },
        { data: usuarios },
        { data: estados },
        { data: prioridades },
        { data: paises },
      ] = await Promise.all([
        supabase
          .from('tareas')
          .select(
            'id,titulo,planta_id,asignado_a,supervisado_por,estado_id,prioridad_id,fecha_inicio,fecha_limite,fecha_cierre,dias_retraso,porcentaje_avance,evidencia,observaciones,revisado,revisado_en,created_at,updated_at'
          )
          .order('fecha_limite', { ascending: true }),
        supabase.from('plantas').select('id, nombre, pais_id'),
        supabase.from('usuarios').select('id, nombre_completo'),
        supabase.from('estados_tarea').select('id, nombre, color_hex'),
        supabase.from('prioridades').select('id, nombre'),
        supabase.from('paises').select('id, nombre'),
      ]);

      if (tareasError) throw tareasError;

      const plantasMap = (plantas || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item }),
        {}
      );
      const usuariosMap = (usuarios || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item }),
        {}
      );
      const estadosMap = (estados || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item }),
        {}
      );
      const prioridadesMap = (prioridades || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item }),
        {}
      );
      const paisesMap = (paises || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item }),
        {}
      );

      const tareasConRelaciones = (tareasData || []).map((tarea) => {
        const planta = plantasMap[tarea.planta_id];
        const estado = estadosMap[tarea.estado_id];
        const prioridad = prioridadesMap[tarea.prioridad_id];
        const responsable = usuariosMap[tarea.asignado_a];
        const diasRestantes = obtenerDiasRestantes(tarea.fecha_limite);
        const estadoFinal = esEstadoFinal(estado?.nombre);

        return {
          ...tarea,
          planta: planta
            ? {
                ...planta,
                pais: paisesMap[planta.pais_id] || null,
              }
            : null,
          estado,
          prioridad,
          responsable,
          diasRestantes,
          estaVencida:
            diasRestantes !== null && diasRestantes < 0 && !estadoFinal,
          estadoFinal,
          tieneEvidencia: Boolean(tarea.evidencia),
          tieneObservaciones: Boolean(tarea.observaciones),
        };
      });

      if (montadoRef.current) {
        setTareas(tareasConRelaciones);
      }
    } catch (err) {
      if (montadoRef.current) {
        setError(err.message || 'No fue posible cargar las estadísticas');
      }
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  };

  const opcionesPlanta = [
    ...new Map(
      tareas
        .filter((tarea) => tarea.planta?.id)
        .map((tarea) => [tarea.planta.id, tarea.planta.nombre.toUpperCase()])
    ).entries(),
  ];

  const opcionesResponsable = [
    ...new Map(
      tareas
        .filter((tarea) => tarea.responsable?.id)
        .map((tarea) => [
          tarea.responsable.id,
          tarea.responsable.nombre_completo.toUpperCase(),
        ])
    ).entries(),
  ];

  const tareasFiltradas = tareas.filter((tarea) => {
    const cumplePlanta =
      filtroPlanta === 'todas' || tarea.planta?.id === filtroPlanta;
    const cumpleResponsable =
      filtroResponsable === 'todos' ||
      tarea.responsable?.id === filtroResponsable;

    return cumplePlanta && cumpleResponsable;
  });

  const totalTareas = tareasFiltradas.length;
  const totalCompletadas = tareasFiltradas.filter((t) => t.estadoFinal).length;
  const totalVencidas = tareasFiltradas.filter((t) => t.estaVencida).length;
  const totalProximas = tareasFiltradas.filter(
    (t) =>
      !t.estaVencida &&
      !t.estadoFinal &&
      t.diasRestantes !== null &&
      t.diasRestantes <= 7
  ).length;
  const promedioAvance = totalTareas
    ? Math.round(
        tareasFiltradas.reduce(
          (acc, tarea) => acc + Number(tarea.porcentaje_avance || 0),
          0
        ) / totalTareas
      )
    : 0;
  const coberturaEvidencia = totalTareas
    ? Math.round(
        (tareasFiltradas.filter((t) => t.tieneEvidencia).length / totalTareas) *
          100
      )
    : 0;
  const coberturaRevision = totalTareas
    ? Math.round(
        (tareasFiltradas.filter((t) => t.revisado).length / totalTareas) * 100
      )
    : 0;
  const totalNoRevisadas = tareasFiltradas.filter((t) => !t.revisado).length;

  const resumenCalidad = [
    {
      label: 'Sin evidencia',
      valor: tareasFiltradas.filter((t) => !t.tieneEvidencia).length,
      helper: 'Tareas sin respaldo cargado',
    },
    {
      label: 'No revisadas',
      valor: totalNoRevisadas,
      helper: 'Pendientes de validación',
    },
    {
      label: 'Con observaciones',
      valor: tareasFiltradas.filter((t) => t.tieneObservaciones).length,
      helper: 'Registro complementario disponible',
    },
  ];

  const chartEstado = Object.values(
    tareasFiltradas.reduce((acc, tarea) => {
      const nombre = normalizarEtiqueta(tarea.estado?.nombre);
      if (!acc[nombre]) {
        acc[nombre] = { name: nombre, value: 0 };
      }
      acc[nombre].value += 1;
      return acc;
    }, {})
  );

  const chartPrioridad = Object.values(
    tareasFiltradas.reduce((acc, tarea) => {
      const nombre = normalizarEtiqueta(tarea.prioridad?.nombre);
      if (!acc[nombre]) {
        acc[nombre] = { name: nombre, value: 0 };
      }
      acc[nombre].value += 1;
      return acc;
    }, {})
  );

  const chartResponsables = Object.values(
    tareasFiltradas.reduce((acc, tarea) => {
      const key = tarea.responsable?.id || 'sin-asignar';
      const nombre = tarea.responsable?.nombre_completo || 'Sin asignar';

      if (!acc[key]) {
        acc[key] = {
          name: nombre,
          shortName: resumirNombre(nombre),
          tareas: 0,
          vencidas: 0,
          avanceAcumulado: 0,
        };
      }

      acc[key].tareas += 1;
      acc[key].avanceAcumulado += Number(tarea.porcentaje_avance || 0);
      if (tarea.estaVencida) acc[key].vencidas += 1;

      return acc;
    }, {})
  )
    .map((item) => ({
      name: item.name,
      shortName: item.shortName,
      tareas: item.tareas,
      vencidas: item.vencidas,
      avance: Math.round(item.avanceAcumulado / item.tareas),
    }))
    .sort((a, b) => b.tareas - a.tareas)
    .slice(0, 8);

  const chartPlantas = Object.values(
    tareasFiltradas.reduce((acc, tarea) => {
      const key = tarea.planta?.id || 'sin-planta';
      const nombre = tarea.planta?.nombre || 'Sin planta';

      if (!acc[key]) {
        acc[key] = {
          name: nombre,
          tareas: 0,
          avanceAcumulado: 0,
          porVencer: 0,
        };
      }

      acc[key].tareas += 1;
      acc[key].avanceAcumulado += Number(tarea.porcentaje_avance || 0);
      if (
        !tarea.estaVencida &&
        !tarea.estadoFinal &&
        tarea.diasRestantes !== null &&
        tarea.diasRestantes <= 7
      ) {
        acc[key].porVencer += 1;
      }

      return acc;
    }, {})
  )
    .map((item) => ({
      name: item.name,
      tareas: item.tareas,
      avance: Math.round(item.avanceAcumulado / item.tareas),
      porVencer: item.porVencer,
    }))
    .sort((a, b) => b.tareas - a.tareas)
    .slice(0, 8);

  const chartVencimientos = Object.values(
    tareasFiltradas.reduce((acc, tarea) => {
      const key = obtenerBucketVencimiento(tarea.diasRestantes);
      if (!acc[key]) {
        acc[key] = {
          name: key,
          shortName: SHORT_BUCKET_LABELS[key] || key,
          total: 0,
        };
      }
      acc[key].total += 1;
      return acc;
    }, {})
  ).sort((a, b) => BUCKET_ORDER.indexOf(a.name) - BUCKET_ORDER.indexOf(b.name));

  const chartCalendario = Object.values(
    tareasFiltradas.reduce((acc, tarea) => {
      if (!tarea.fecha_limite) return acc;
      const fecha = new Date(tarea.fecha_limite);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[key]) {
        acc[key] = {
          name: MONTH_FORMATTER.format(fecha),
          sortKey: key,
          total: 0,
        };
      }

      acc[key].total += 1;
      return acc;
    }, {})
  ).sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'es'));

  const responsableRiesgo = chartResponsables
    .filter((item) => item.vencidas > 0)
    .sort((a, b) => b.vencidas - a.vencidas)[0];

  if (cargandoAuth || cargando) {
    return <Layout titulo="Estadísticas">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Estadísticas" ocultarHeader>
      <section className={styles.hero}>
        <div>
          <p className={styles.heroKicker}>Analítica Operativa</p>
          <h1 className={styles.heroTitulo}>Estadísticas del tablero</h1>
          <p className={styles.heroSubtitulo}>
            Panorama de carga, avance, vencimientos y calidad del seguimiento
            para detectar focos de riesgo sin salir del flujo operativo.
          </p>
        </div>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.filters}>
        <div className={styles.filtersHeader}>
          <FiBarChart2 />
          <span>FILTROS DE LECTURA</span>
        </div>

        <div className={styles.filtersGrid}>
          <select
            className={styles.select}
            value={filtroPlanta}
            onChange={(event) => setFiltroPlanta(event.target.value)}
          >
            <option value="todas">TODAS LAS PLANTAS</option>
            {opcionesPlanta.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={filtroResponsable}
            onChange={(event) => setFiltroResponsable(event.target.value)}
          >
            <option value="todos">TODOS LOS RESPONSABLES</option>
            {opcionesResponsable.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <span className={`${styles.kpiIcon} ${styles.iconSlate}`}>
            <FiClipboard />
          </span>
          <div>
            <p className={styles.kpiLabel}>Tareas en vista</p>
            <strong className={styles.kpiValue}>{totalTareas}</strong>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <span className={`${styles.kpiIcon} ${styles.iconBlue}`}>
            <FiActivity />
          </span>
          <div>
            <p className={styles.kpiLabel}>Avance promedio</p>
            <strong className={styles.kpiValue}>{promedioAvance}%</strong>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <span className={`${styles.kpiIcon} ${styles.iconAmber}`}>
            <FiClock />
          </span>
          <div>
            <p className={styles.kpiLabel}>Por vencer en 7 días</p>
            <strong className={styles.kpiValue}>{totalProximas}</strong>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <span className={`${styles.kpiIcon} ${styles.iconGreen}`}>
            <FiCheckCircle />
          </span>
          <div>
            <p className={styles.kpiLabel}>Cobertura de revisión</p>
            <strong className={styles.kpiValue}>{coberturaRevision}%</strong>
          </div>
        </article>
      </section>

      <section className={styles.overviewGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Resumen ejecutivo</p>
              <h3>Estado actual del portafolio</h3>
            </div>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span>Completadas</span>
              <strong>{totalCompletadas}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Vencidas</span>
              <strong>{totalVencidas}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Con evidencia</span>
              <strong>{coberturaEvidencia}%</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>No revisadas</span>
              <strong>{totalNoRevisadas}</strong>
            </div>
          </div>

          <div className={styles.callout}>
            <FiUsers />
            <div>
              <strong>
                {responsableRiesgo
                  ? `${responsableRiesgo.name} concentra más vencidas`
                  : 'Sin responsables con vencidas'}
              </strong>
              <span>
                {responsableRiesgo
                  ? `${responsableRiesgo.vencidas} tareas vencidas dentro del filtro actual`
                  : 'Buen momento para medir cumplimiento apenas empiecen los cierres'}
              </span>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Calidad de seguimiento</p>
              <h3>Indicadores documentales</h3>
            </div>
          </div>

          <div className={styles.qualityList}>
            {resumenCalidad.map((item) => (
              <div key={item.label} className={styles.qualityItem}>
                <div>
                  <p>{item.label}</p>
                  <span>{item.helper}</span>
                </div>
                <strong>{item.valor}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Distribución general</p>
          <h2 className={styles.sectionTitle}>Cómo se reparte el portafolio</h2>
        </div>

        <div className={styles.distributionGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Distribución</p>
                <h3>Por prioridad</h3>
              </div>
            </div>

            {chartPrioridad.length ? (
              <div className={styles.pieWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartPrioridad}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {chartPrioridad.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="No hay prioridades disponibles en el filtro actual." />
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Distribución</p>
                <h3>Por estado</h3>
              </div>
            </div>

            {chartEstado.length ? (
              <div className={styles.pieWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartEstado}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {chartEstado.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="No hay estados disponibles en el filtro actual." />
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Vencimiento</p>
                <h3>Mapa de riesgo temporal</h3>
              </div>
            </div>

            {chartVencimientos.length ? (
              <div className={styles.chartWrapSmall}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartVencimientos}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="total"
                      name="Tareas"
                      fill="#f59e0b"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="No hay fechas suficientes para analizar vencimientos." />
            )}
          </article>
        </div>
      </section>

      <section className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Carga operativa</p>
          <h2 className={styles.sectionTitle}>
            Responsables y cobertura territorial
          </h2>
        </div>

        <div className={styles.operationsGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Carga por responsable</p>
                <h3>Asignación, vencidas y avance</h3>
              </div>
            </div>

            {chartResponsables.length ? (
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartResponsables}
                    layout="vertical"
                    margin={{ left: 16, right: 8 }}
                    barGap={8}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      width={108}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="tareas"
                      name="Tareas"
                      fill="#0284c7"
                      radius={[0, 8, 8, 0]}
                    />
                    <Bar
                      dataKey="vencidas"
                      name="Vencidas"
                      fill="#ef4444"
                      radius={[0, 8, 8, 0]}
                    />
                    <Bar
                      dataKey="avance"
                      name="Avance %"
                      fill="#14b8a6"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="No hay responsables para graficar en el filtro actual." />
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Cobertura territorial</p>
                <h3>Volumen por planta</h3>
              </div>
            </div>

            {chartPlantas.length ? (
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartPlantas}
                    layout="vertical"
                    margin={{ left: 30 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="tareas"
                      name="Tareas"
                      fill="#0f766e"
                      radius={[0, 8, 8, 0]}
                    />
                    <Bar
                      dataKey="porVencer"
                      name="Por vencer"
                      fill="#ef4444"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="No hay plantas para graficar en el filtro actual." />
            )}
          </article>
        </div>
      </section>

      <section className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Calendario</p>
          <h2 className={styles.sectionTitle}>Lectura por fechas objetivo</h2>
        </div>

        <div className={styles.calendarGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Calendario</p>
                <h3>Tareas por mes de vencimiento</h3>
              </div>
            </div>

            {chartCalendario.length ? (
              <div className={styles.chartWrapSmall}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartCalendario}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="total"
                      name="Tareas"
                      fill="#0ea5e9"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="No hay vencimientos para construir un calendario." />
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Cobertura documental</p>
                <h3>Indicadores de calidad</h3>
              </div>
            </div>

            <div className={styles.qualityList}>
              {resumenCalidad.map((item) => (
                <div key={item.label} className={styles.qualityItem}>
                  <div>
                    <p>{item.label}</p>
                    <span>{item.helper}</span>
                  </div>
                  <strong>{item.valor}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </Layout>
  );
}
