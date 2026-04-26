import { verifyAdminOrSupervisorToken, supabaseAdmin } from '@lib/apiHelpers';

/**
 * GET /api/supervisor/tareas/todas
 * Devuelve tareas en formato FLAT:
 * - Creadas por el supervisor (creado_por)
 * - Asignadas a usuarios bajo su supervisión (supervisado_por)
 *
 * Estructura igual a admin para reutilizar vista
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  const verify = await verifyAdminOrSupervisorToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  if (verify.rol !== 'supervisor') {
    return res.status(403).json({
      error: 'Forbidden',
      detail: 'Solo supervisores pueden acceder a este endpoint',
    });
  }

  try {
    // Obtener tareas:
    // 1. Creadas por el supervisor
    // 2. Asignadas a usuarios supervisados por el supervisor (supervisor_id = supervisor_id)
    const supervisorId = verify.userId;
    const plantaId = verify.planta_id;

    console.log(
      `[API] Buscando tareas para supervisor: ${supervisorId}, planta: ${plantaId}`
    );

    if (!plantaId) {
      console.error('[API] ❌ Supervisor sin planta asignada');
      return res.status(400).json({
        error: 'Bad Request',
        detail: 'Supervisor sin planta asignada',
      });
    }

    // Query 1: Tareas creadas por el supervisor (en cualquier planta)
    const { data: tareasCreadas, error: err1 } = await supabaseAdmin
      .from('tareas')
      .select(
        `id,
        titulo,
        descripcion,
        prioridad_id,
        estado_id,
        asignado_a,
        fecha_limite,
        fecha_inicio,
        porcentaje_avance,
        creado_por,
        supervisado_por,
        planta_id,
        asignado_a_user:usuarios!asignado_a(id, nombre_completo, email),
        creado_por_user:usuarios!creado_por(id, nombre_completo),
        estado:estados_tarea(id, nombre),
        prioridad:prioridades(id, nombre),
        planta:plantas(id, nombre)`
      )
      .eq('creado_por', supervisorId)
      .order('fecha_limite', { ascending: true });

    console.log(
      `[API] Query 1 (creado_por=${supervisorId}): error=${err1?.message || 'none'}, tareas=${tareasCreadas?.length || 0}`
    );
    if (err1) console.error('[API] Error query 1 detail:', err1);

    // Query 2: Tareas asignadas a usuarios supervisados (en CUALQUIER planta)
    // Primero obtenemos los usuarios supervisados por el supervisor (sin filtro de planta)
    const { data: usuariosSupervisados, error: errUsuarios } =
      await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('supervisor_id', supervisorId);

    console.log(
      `[API] Usuarios supervisados: ${usuariosSupervisados?.length || 0}`
    );

    let tareasSupervisadas = [];
    let err2 = null;

    if (usuariosSupervisados && usuariosSupervisados.length > 0) {
      const usuariosIds = usuariosSupervisados.map((u) => u.id);

      // Obtener tareas asignadas a esos usuarios (en CUALQUIER planta)
      const { data, error } = await supabaseAdmin
        .from('tareas')
        .select(
          `id,
          titulo,
          descripcion,
          prioridad_id,
          estado_id,
          asignado_a,
          fecha_limite,
          fecha_inicio,
          porcentaje_avance,
          creado_por,
          supervisado_por,
          planta_id,
          asignado_a_user:usuarios!asignado_a(id, nombre_completo, email),
          creado_por_user:usuarios!creado_por(id, nombre_completo),
          estado:estados_tarea(id, nombre),
          prioridad:prioridades(id, nombre),
          planta:plantas(id, nombre)`
        )
        .in('asignado_a', usuariosIds)
        .order('fecha_limite', { ascending: true });

      tareasSupervisadas = data || [];
      err2 = error;

      console.log(
        `[API] Query 2 (asignadas a usuarios supervisados): error=${err2?.message || 'none'}, tareas=${tareasSupervisadas.length}`
      );
      if (err2) console.error('[API] Error query 2 detail:', err2);
    }

    if (err1 && err2) {
      console.error('[API] ❌ Ambas queries fallaron:', {
        err1: err1?.message,
        err2: err2?.message,
      });
      return res.status(500).json({
        error: 'Database error',
        detail: err1?.message || err2?.message || 'Unknown error',
      });
    }

    // Combinar y deduplicar por ID
    const tareasCombinadas = [
      ...(tareasCreadas || []),
      ...(tareasSupervisadas || []),
    ];
    const tareasUnicas = Array.from(
      new Map(tareasCombinadas.map((t) => [t.id, t])).values()
    );
    tareasUnicas.sort(
      (a, b) => new Date(a.fecha_limite || 0) - new Date(b.fecha_limite || 0)
    );

    console.log(
      `[API] ✅ Tareas encontradas: ${tareasUnicas.length} (creadas: ${tareasCreadas?.length || 0}, asignadas a subordinados: ${tareasSupervisadas.length}), planta: ${plantaId}`
    );

    return res.status(200).json(tareasUnicas);
  } catch (err) {
    console.error('[API] ❌ Exception:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: err.message,
    });
  }
}
