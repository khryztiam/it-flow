import { verifyAdminOrSupervisorToken, supabaseAdmin } from '@lib/apiHelpers';

/**
 * GET /api/supervisor/tareas
 * Obtiene tareas de usuarios supervisados por el supervisor autenticado
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
    // Obtener SOLO tareas asignadas al supervisor autenticado
    const { data, error } = await supabaseAdmin
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
      .eq('asignado_a', verify.userId)
      .order('fecha_limite', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: err.message,
    });
  }
}
