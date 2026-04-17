import { verifyUserToken, supabaseAdmin } from '@lib/apiHelpers';

/**
 * GET /api/user/tareas
 * Obtiene tareas asignadas al usuario autenticado
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  const verify = await verifyUserToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  try {
    // Obtener tareas asignadas al usuario
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
