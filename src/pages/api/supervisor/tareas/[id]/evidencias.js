import { verifyAdminOrSupervisorToken, supabaseAdmin } from '@lib/apiHelpers';

/**
 * GET /api/supervisor/tareas/[id]/evidencias
 * Obtener evidencias de una tarea (solo supervisor puede acceder a tareas de sus subordinados)
 */
export default async function handler(req, res) {
  const { id } = req.query;
  const authHeader = req.headers.authorization;
  const verify = await verifyAdminOrSupervisorToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener tarea para validar acceso
    const { data: tarea, error: tareaErr } = await supabaseAdmin
      .from('tareas')
      .select('id, asignado_a, creado_por, planta_id')
      .eq('id', id)
      .single();

    if (tareaErr || !tarea) {
      return res.status(404).json({
        error: 'Tarea no encontrada',
        detail: 'La tarea solicitada no existe',
      });
    }

    // Validar que el supervisor tenga acceso a esta tarea
    // (creó la tarea O está asignada a uno de sus subordinados)
    if (verify.rol === 'supervisor') {
      // Verificar si es creador
      if (tarea.creado_por !== verify.userId) {
        // Verificar si el asignado es subordinado suyo
        const { data: asignado, error: asignadoErr } = await supabaseAdmin
          .from('usuarios')
          .select('id, supervisor_id')
          .eq('id', tarea.asignado_a)
          .single();

        if (!asignado || asignado.supervisor_id !== verify.userId) {
          return res.status(403).json({
            error: 'Forbidden',
            detail: 'No tienes acceso a esta tarea',
          });
        }
      }
    }

    // Obtener evidencias
    const { data, error } = await supabaseAdmin
      .from('evidencias_tareas')
      .select(
        `
        id,
        archivo_path,
        archivo_url,
        tipo_mime,
        tamanio_bytes,
        descripcion,
        fecha_subida,
        usuario:usuarios!usuario_id(id, nombre_completo, email)
      `
      )
      .eq('tarea_id', id)
      .order('fecha_subida', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Retornar array de evidencias (compatible con código existente)
    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: err.message,
    });
  }
}
