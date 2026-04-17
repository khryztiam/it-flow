import { verifyUserToken, supabaseAdmin } from '@lib/apiHelpers';

/**
 * GET /api/user/tareas/[id] - Obtener detalle de tarea con comentarios
 * PUT /api/user/tareas/[id] - Actualizar estado y avance de tarea
 * POST /api/user/tareas/[id] - Agregar comentario a tarea
 */
export default async function handler(req, res) {
  const { id } = req.query;
  const authHeader = req.headers.authorization;
  const verify = await verifyUserToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  try {
    if (req.method === 'GET') {
      // Obtener detalle de tarea con comentarios
      const { data: tarea, error: tareaErr } = await supabaseAdmin
        .from('tareas')
        .select(
          `
          *,
          estado:estados_tarea(id, nombre),
          prioridad:prioridades(id, nombre),
          planta:plantas(id, nombre, pais:paises(id, nombre)),
          creado_por_user:usuarios!creado_por(id, nombre_completo),
          supervisado_por_user:usuarios!supervisado_por(id, nombre_completo),
          comentarios:comentarios_tarea(*, usuario:usuarios(id, nombre_completo))
        `
        )
        .eq('id', id)
        .eq('asignado_a', verify.userId)
        .single();

      if (tareaErr || !tarea) {
        return res
          .status(404)
          .json({ error: 'Task not found or not assigned to you' });
      }

      return res.status(200).json(tarea);
    }

    if (req.method === 'PUT') {
      // Actualizar estado y/o avance de tarea
      const { estado_id, porcentaje_avance, observaciones } = req.body;

      // Validar que la tarea sea del usuario
      const { data: tarea, error: checkErr } = await supabaseAdmin
        .from('tareas')
        .select('id, asignado_a')
        .eq('id', id)
        .single();

      if (checkErr || !tarea || tarea.asignado_a !== verify.userId) {
        return res
          .status(403)
          .json({ error: 'Not authorized to update this task' });
      }

      // Construir data de actualización
      const updateData = {};
      if (estado_id !== undefined) updateData.estado_id = estado_id;
      if (porcentaje_avance !== undefined)
        updateData.porcentaje_avance = porcentaje_avance;
      if (observaciones !== undefined) updateData.observaciones = observaciones;

      // Si estado es completado, agregar fecha_cierre
      if (estado_id) {
        const { data: stateName } = await supabaseAdmin
          .from('estados_tarea')
          .select('nombre')
          .eq('id', estado_id)
          .single();

        if (stateName?.nombre === 'completado') {
          updateData.fecha_cierre = new Date().toISOString();
        }
      }

      const { data: updatedTarea, error: updateErr } = await supabaseAdmin
        .from('tareas')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          *,
          estado:estados_tarea(id, nombre),
          prioridad:prioridades(id, nombre)
        `
        );

      if (updateErr) {
        return res.status(400).json({
          error: 'DB_ERROR',
          detail: updateErr.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tarea actualizada exitosamente',
        data: updatedTarea[0],
      });
    }

    if (req.method === 'POST') {
      // Agregar comentario a la tarea
      const { contenido } = req.body;

      if (!contenido?.trim()) {
        return res.status(400).json({
          error: 'Missing required field',
          detail: 'contenido es requerido',
        });
      }

      // Validar que la tarea sea del usuario
      const { data: tarea, error: checkErr } = await supabaseAdmin
        .from('tareas')
        .select('id, asignado_a')
        .eq('id', id)
        .single();

      if (checkErr || !tarea || tarea.asignado_a !== verify.userId) {
        return res
          .status(403)
          .json({ error: 'Not authorized to comment on this task' });
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

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: err.message,
    });
  }
}
