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
          comentarios:comentarios_tarea(*, usuario:usuarios(id, nombre_completo))
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

      // Obtener tarea actual para validar y capturar asignación anterior
      const { data: currentTask, error: fetchErr } = await supabaseAdmin
        .from('tareas')
        .select('planta_id, asignado_a')
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

      if (asignado_a) {
        const { data: usuarioAsignado, error: usuarioErr } = await supabaseAdmin
          .from('usuarios')
          .select('id, planta_id, estado')
          .eq('id', asignado_a)
          .single();

        if (usuarioErr || !usuarioAsignado) {
          return res.status(404).json({ error: 'User not found' });
        }

        if (usuarioAsignado.estado !== 'activo') {
          return res.status(400).json({
            error: 'Invalid user',
            detail: 'El usuario asignado no está activo',
          });
        }

        if (
          verify.rol === 'supervisor' &&
          usuarioAsignado.planta_id !== currentTask.planta_id
        ) {
          return res.status(403).json({
            error: 'Forbidden',
            detail: 'Supervisores solo pueden asignar usuarios de su planta',
          });
        }
      }

      // Construir objeto de actualización
      const updateData = {};
      if (titulo !== undefined) updateData.titulo = titulo;
      if (descripcion !== undefined) updateData.descripcion = descripcion;

      // ─── AUDITORÍA DE DELEGACIÓN ───────────────────────────────────
      // Si se está reasignando la tarea a otro usuario, registrar auditoría
      if (asignado_a !== undefined && asignado_a !== currentTask.asignado_a) {
        updateData.asignado_a = asignado_a;
        updateData.delegado_por = verify.userId;
        updateData.delegado_de_usuario_id = currentTask.asignado_a;
        updateData.delegado_en = new Date().toISOString();
      } else if (asignado_a !== undefined) {
        updateData.asignado_a = asignado_a;
      }

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
          asignado_a_user:usuarios!asignado_a(id, nombre_completo, email),
          creado_por_user:usuarios!creado_por(id, nombre_completo, email),
          supervisado_por_user:usuarios!supervisado_por(id, nombre_completo, email),
          planta:plantas(id, nombre),
          estado:estados_tarea(id, nombre),
          prioridad:prioridades(id, nombre)
        `
        );

      if (err) {
        return res.status(400).json({
          error: 'DB_ERROR',
          detail: err.message,
        });
      }

      // ─── CREAR COMENTARIO DE AUDITORÍA SI HUBO DELEGACIÓN ───────────
      if (
        asignado_a !== undefined &&
        asignado_a !== currentTask.asignado_a &&
        data &&
        data.length > 0
      ) {
        const usuarioAnterior = currentTask.asignado_a
          ? `Usuario anterior: ${currentTask.asignado_a}`
          : 'Sin asignación previa';
        const nuevoUsuario =
          data[0].asignado_a_user?.nombre_completo || 'Sin asignar';

        const comentarioAuditoria = `[DELEGACIÓN] Reasignada de ${usuarioAnterior} → ${nuevoUsuario}`;

        await supabaseAdmin.from('comentarios_tarea').insert({
          tarea_id: id,
          usuario_id: verify.userId,
          contenido: comentarioAuditoria,
        });
      }

      return res.status(200).json(data[0]);
    }

    if (req.method === 'POST') {
      // POST /api/admin/tareas/[id] — Agregar comentario a tarea
      const { contenido } = req.body;

      if (!contenido?.trim()) {
        return res.status(400).json({
          error: 'Missing required field',
          detail: 'contenido es requerido',
        });
      }

      // Verificar que la tarea existe
      const { data: tarea, error: checkErr } = await supabaseAdmin
        .from('tareas')
        .select('id, planta_id')
        .eq('id', id)
        .single();

      if (checkErr || !tarea) {
        return res.status(404).json({
          error: 'Task not found',
          detail: 'No se encontró la tarea',
        });
      }

      // Si supervisor, validar que sea de su planta
      if (verify.rol === 'supervisor' && tarea.planta_id !== verify.planta_id) {
        return res.status(403).json({
          error: 'Forbidden',
          detail: 'No tienes acceso a esta tarea',
        });
      }

      // Insertar comentario
      const { data: nuevoComentario, error: insertErr } = await supabaseAdmin
        .from('comentarios_tarea')
        .insert({
          tarea_id: id,
          usuario_id: verify.userId,
          contenido: contenido.trim(),
        })
        .select('*, usuario:usuarios(id, nombre_completo)')
        .single();

      if (insertErr) {
        return res.status(400).json({
          error: 'DB_ERROR',
          detail: insertErr.message,
        });
      }

      return res.status(201).json({ data: nuevoComentario });
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
