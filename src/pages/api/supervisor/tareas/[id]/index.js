import { verifyAdminOrSupervisorToken, supabaseAdmin } from '@lib/apiHelpers';

/**
 * GET /api/supervisor/tareas/[id] - Obtener tarea de usuario supervisado con comentarios
 * POST /api/supervisor/tareas/[id] - Agregar comentario a tarea de usuario supervisado
 * PUT /api/supervisor/tareas/[id] - Actualizar estado, progreso o asignado de tarea supervisada
 *
 * Supervisor solo ve tareas asignadas a usuarios bajo su supervisión (supervisor_id)
 */
export default async function handler(req, res) {
  const { id } = req.query;
  const authHeader = req.headers.authorization;
  const verify = await verifyAdminOrSupervisorToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  // Solo supervisores pueden usar esta API (admin usa la de admin)
  if (verify.rol !== 'supervisor') {
    return res.status(403).json({
      error: 'Forbidden',
      detail: 'Solo supervisores pueden acceder a este endpoint',
    });
  }

  try {
    if (req.method === 'GET') {
      // GET: Obtener tarea de usuario supervisado con comentarios
      const { data: tarea, error: tareaErr } = await supabaseAdmin
        .from('tareas')
        .select(
          `
          *,
          asignado_a_user:usuarios!asignado_a(id, nombre_completo, email, supervisor_id),
          creado_por_user:usuarios!creado_por(id, nombre_completo),
          supervisado_por_user:usuarios!supervisado_por(id, nombre_completo),
          estado:estados_tarea(id, nombre),
          prioridad:prioridades(id, nombre),
          planta:plantas(id, nombre, pais:paises(id, nombre)),
          comentarios:comentarios_tarea(*, usuario:usuarios(id, nombre_completo))
        `
        )
        .eq('id', id)
        .single();

      if (tareaErr || !tarea) {
        return res.status(404).json({
          error: 'Task not found',
          detail: 'No se encontró la tarea',
        });
      }

      // Validar que la tarea esté asignada a un usuario supervisado por el supervisor autenticado
      if (tarea.asignado_a_user?.supervisor_id !== verify.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          detail:
            'No tienes acceso a esta tarea. Solo puedes ver tareas asignadas a tus subordinados.',
        });
      }

      return res.status(200).json(tarea);
    }

    if (req.method === 'POST') {
      // POST: Agregar comentario a tarea de usuario supervisado
      const { contenido } = req.body;

      if (!contenido?.trim()) {
        return res.status(400).json({
          error: 'Missing required field',
          detail: 'contenido es requerido',
        });
      }

      // Verificar que la tarea existe y está asignada a usuario supervisado
      const { data: tarea, error: checkErr } = await supabaseAdmin
        .from('tareas')
        .select(
          `
          id,
          asignado_a,
          asignado_a_user:usuarios!asignado_a(id, nombre_completo, supervisor_id)
        `
        )
        .eq('id', id)
        .single();

      if (checkErr || !tarea) {
        return res.status(404).json({
          error: 'Task not found',
          detail: 'No se encontró la tarea',
        });
      }

      // Validar que la tarea esté asignada a un usuario supervisado por el supervisor autenticado
      if (tarea.asignado_a_user?.supervisor_id !== verify.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          detail:
            'No tienes permiso para comentar en esta tarea. Solo puedes comentar en tareas de tus subordinados.',
        });
      }

      // Insertar comentario
      const { data: comentario, error: insertErr } = await supabaseAdmin
        .from('comentarios_tarea')
        .insert({
          tarea_id: id,
          usuario_id: verify.userId,
          contenido,
        })
        .select('*, usuario:usuarios(id, nombre_completo)');

      if (insertErr) {
        return res.status(400).json({
          error: 'DB_ERROR',
          detail: insertErr.message,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Comentario agregado exitosamente',
        data: comentario[0],
      });
    }

    if (req.method === 'PUT') {
      // PUT: Actualizar estado, progreso o asignado_a de tarea supervisada
      const { estado_id, porcentaje_avance, asignado_a } = req.body;

      // Verificar que la tarea existe y está asignada a usuario supervisado
      const { data: tarea, error: checkErr } = await supabaseAdmin
        .from('tareas')
        .select(
          `
          id,
          asignado_a,
          asignado_a_user:usuarios!asignado_a(id, nombre_completo, supervisor_id)
        `
        )
        .eq('id', id)
        .single();

      if (checkErr || !tarea) {
        return res.status(404).json({
          error: 'Task not found',
          detail: 'No se encontró la tarea',
        });
      }

      // Validar que la tarea esté asignada a un usuario supervisado por el supervisor autenticado
      if (tarea.asignado_a_user?.supervisor_id !== verify.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          detail:
            'No tienes permiso para actualizar esta tarea. Solo puedes actualizar tareas de tus subordinados.',
        });
      }

      // El supervisor NO puede reasignar tareas a usuarios que no son sus subordinados
      if (asignado_a) {
        const { data: nuevoAsignado } = await supabaseAdmin
          .from('usuarios')
          .select('id, supervisor_id')
          .eq('id', asignado_a)
          .single();

        if (!nuevoAsignado || nuevoAsignado.supervisor_id !== verify.userId) {
          return res.status(400).json({
            error: 'Bad Request',
            detail: 'Solo puedes reasignar tareas a tus propios subordinados.',
          });
        }
      }

      // Construir objeto de actualización
      const updateObj = {};
      if (estado_id !== undefined) updateObj.estado_id = estado_id;
      if (porcentaje_avance !== undefined)
        updateObj.porcentaje_avance = porcentaje_avance;
      if (asignado_a && asignado_a !== tarea.asignado_a)
        updateObj.asignado_a = asignado_a;
      if (Object.keys(updateObj).length === 0) {
        updateObj.updated_at = new Date().toISOString();
      }

      // Actualizar tarea
      const { data: tareaActualizada, error: updateErr } = await supabaseAdmin
        .from('tareas')
        .update(updateObj)
        .eq('id', id)
        .select('*');

      if (updateErr) {
        return res.status(400).json({
          error: 'DB_ERROR',
          detail: updateErr.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tarea actualizada exitosamente',
        data: tareaActualizada[0],
      });
    }

    if (req.method === 'DELETE') {
      // DELETE: Eliminar tarea creada por el supervisor (creado_por = supervisor)
      const { data: tarea, error: checkErr } = await supabaseAdmin
        .from('tareas')
        .select('id, creado_por')
        .eq('id', id)
        .single();

      if (checkErr || !tarea) {
        return res.status(404).json({
          error: 'Task not found',
          detail: 'No se encontró la tarea',
        });
      }

      // Validar que la tarea fue creada por el supervisor autenticado
      if (tarea.creado_por !== verify.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          detail: 'Solo puedes eliminar tareas que creaste.',
        });
      }

      // Eliminar tarea
      const { error: deleteErr } = await supabaseAdmin
        .from('tareas')
        .delete()
        .eq('id', id);

      if (deleteErr) {
        return res.status(400).json({
          error: 'DB_ERROR',
          detail: deleteErr.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tarea eliminada exitosamente',
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: err.message,
    });
  }
}
