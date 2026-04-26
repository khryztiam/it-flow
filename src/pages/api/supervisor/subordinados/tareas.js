import { verifyAdminOrSupervisorToken, supabaseAdmin } from '@lib/apiHelpers';

/**
 * GET /api/supervisor/subordinados/tareas
 * Obtiene tareas de usuarios supervisados, agrupadas por usuario (para dashboard)
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

  // Solo supervisores pueden usar esta API
  if (verify.rol !== 'supervisor') {
    return res.status(403).json({
      error: 'Forbidden',
      detail: 'Solo supervisores pueden acceder a este endpoint',
    });
  }

  try {
    // Obtener usuarios supervisados
    const { data: supervisados, error: errSup } = await supabaseAdmin
      .from('usuarios')
      .select(
        `
        id,
        nombre_completo,
        rol:roles(id, nombre)
      `
      )
      .eq('supervisor_id', verify.userId)
      .eq('estado', 'activo');

    if (errSup) throw errSup;

    // Si no hay supervisados, retornar estructura vacía
    if (!supervisados || supervisados.length === 0) {
      return res.status(200).json([]);
    }

    const supervisadosIds = supervisados.map((u) => u.id);

    // Obtener tareas de esos usuarios
    const { data: tareas, error: errTareas } = await supabaseAdmin
      .from('tareas')
      .select(
        `
        id,
        titulo,
        descripcion,
        estado_id,
        estado:estados_tarea(id, nombre),
        prioridad_id,
        prioridad:prioridades(id, nombre),
        porcentaje_avance,
        fecha_inicio,
        fecha_limite,
        fecha_cierre,
        planta_id,
        planta:plantas(id, nombre),
        asignado_a,
        asignado_a_user:usuarios!asignado_a(id, nombre_completo),
        revisado,
        creado_por,
        creado_por_user:usuarios!creado_por(id, nombre_completo),
        created_at,
        updated_at
      `
      )
      .in('asignado_a', supervisadosIds)
      .order('asignado_a', { ascending: true })
      .order('fecha_limite', { ascending: true });

    if (errTareas) throw errTareas;

    // Agrupar tareas por usuario supervisado
    const agrupadas = {};
    supervisados.forEach((usuario) => {
      agrupadas[usuario.id] = {
        usuario_id: usuario.id,
        usuario_nombre: usuario.nombre_completo,
        tareas: [],
        total: 0,
      };
    });

    // Distribuir tareas en sus grupos
    (tareas || []).forEach((tarea) => {
      if (agrupadas[tarea.asignado_a]) {
        agrupadas[tarea.asignado_a].tareas.push(tarea);
        agrupadas[tarea.asignado_a].total += 1;
      }
    });

    // Convertir a array y filtrar usuarios sin tareas (opcional, aquí incluyo todos)
    const resultado = Object.values(agrupadas).sort((a, b) => {
      // Ordenar por nombre de usuario
      return a.usuario_nombre.localeCompare(b.usuario_nombre);
    });

    return res.status(200).json(resultado);
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: err.message,
    });
  }
}
