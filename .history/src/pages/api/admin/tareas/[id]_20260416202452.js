import { verifyAdminOrSupervisorToken, supabaseAdmin } from '@lib/apiHelpers';

export default async function handler(req, res) {
  const { id } = req.query;
  const authHeader = req.headers.authorization;
  const verify = await verifyAdminOrSupervisorToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  try {
    if (req.method === 'GET') {
      // GET /api/admin/tareas/[id] — Obtener tarea específica
      let query = supabaseAdmin
        .from('tareas')
        .select(
          `
          *,
          asignado_a_user:usuarios!asignado_a(id, nombre_completo, email),
          creado_por_user:usuarios!creado_por(id, nombre_completo, email),
          supervisado_por_user:usuarios!supervisado_por(id, nombre_completo, email),
          planta:plantas(id, nombre),
          estado:estados_tarea(id, nombre),
          prioridad:prioridades(id, nombre),
          comentarios:comentarios_tarea(*)
        `
        )
        .eq('id', id)
        .single();

      const { data, error } = await query;

      if (error) {
        return res
          .status(404)
          .json({ error: 'Not found', detail: error.message });
      }

      // Si supervisor, validar que sea de su planta
      if (verify.rol === 'supervisor' && data.planta_id !== verify.planta_id) {
        return res.status(403).json({
          error: 'Forbidden',
          detail: 'No tienes acceso a esta tarea',
        });
      }

      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      // PUT /api/admin/tareas/[id] — Actualizar tarea
      const {
        titulo,
        descripcion,
        asignado_a,
        supervisado_por,
        estado_id,
        prioridad_id,
        fecha_inicio,
        fecha_limite,
        porcentaje_avance,
        observaciones,
        revisado,
      } = req.body;

      // Obtener tarea actual para validar
      const { data: currentTask, error: fetchErr } = await supabaseAdmin
        .from('tareas')
        .select('planta_id')
        .eq('id', id)
        .single();

      if (fetchErr || !currentTask) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Si supervisor, validar que sea de su planta
      if (
        verify.rol === 'supervisor' &&
        currentTask.planta_id !== verify.planta_id
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          detail: 'No tienes acceso a esta tarea',
        });
      }

      // Construir objeto de actualización
      const updateData = {};
      if (titulo !== undefined) updateData.titulo = titulo;
      if (descripcion !== undefined) updateData.descripcion = descripcion;
      if (asignado_a !== undefined) updateData.asignado_a = asignado_a;
      if (supervisado_por !== undefined)
        updateData.supervisado_por = supervisado_por;
      if (estado_id !== undefined) updateData.estado_id = estado_id;
      if (prioridad_id !== undefined) updateData.prioridad_id = prioridad_id;
      if (fecha_inicio !== undefined)
        updateData.fecha_inicio = fecha_inicio
          ? new Date(fecha_inicio).toISOString()
          : null;
      if (fecha_limite !== undefined)
        updateData.fecha_limite = new Date(fecha_limite).toISOString();
      if (porcentaje_avance !== undefined)
        updateData.porcentaje_avance = porcentaje_avance;
      if (observaciones !== undefined) updateData.observaciones = observaciones;
      if (revisado !== undefined) {
        updateData.revisado = revisado;
        if (revisado) updateData.revisado_en = new Date().toISOString();
      }

      // Actualizar tarea
      const { data, error: err } = await supabaseAdmin
        .from('tareas')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          *,
          asignado_a_user:usuarios!asignado_a(id, nombre_completo),
          creado_por_user:usuarios!creado_por(id, nombre_completo),
          planta:plantas(nombre),
          estado:estados_tarea(nombre),
          prioridad:prioridades(nombre)
        `
        );

      if (err) {
        return res.status(400).json({
          error: 'DB_ERROR',
          detail: err.message,
        });
      }

      return res.status(200).json(data[0]);
    }

    if (req.method === 'DELETE') {
      // DELETE /api/admin/tareas/[id] — Eliminar tarea
      // Obtener tarea actual para validar
      const { data: currentTask, error: fetchErr } = await supabaseAdmin
        .from('tareas')
        .select('planta_id')
        .eq('id', id)
        .single();

      if (fetchErr || !currentTask) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Si supervisor, validar que sea de su planta
      if (
        verify.rol === 'supervisor' &&
        currentTask.planta_id !== verify.planta_id
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          detail: 'No tienes acceso a esta tarea',
        });
      }

      // Eliminar tarea
      const { error: err } = await supabaseAdmin
        .from('tareas')
        .delete()
        .eq('id', id);

      if (err) {
        return res.status(400).json({
          error: 'DB_ERROR',
          detail: err.message,
        });
      }

      return res.status(204).send();
    }

    // Método no permitido
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: err.message,
    });
  }
}
