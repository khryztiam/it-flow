import { verifyAdminOrSupervisorToken, supabaseAdmin } from '@lib/apiHelpers';

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
    // Si es supervisor, verificar que la tarea pertenece a su planta
    if (verify.rol === 'supervisor') {
      const { data: tarea, error: tareaErr } = await supabaseAdmin
        .from('tareas')
        .select('planta_id')
        .eq('id', id)
        .single();

      if (tareaErr || !tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      if (tarea.planta_id !== verify.planta_id) {
        return res.status(403).json({ error: 'Sin acceso a esta tarea' });
      }
    }

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

    return res.status(200).json({ data: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
