import { verifyAdminOrSupervisorToken, supabaseAdmin } from '@lib/apiHelpers';

/**
 * GET  /api/supervisor/tareas/[id]/upload - Listar evidencias de la tarea supervisada
 * POST /api/supervisor/tareas/[id]/upload - Subir archivo como evidencia en tarea supervisada
 * DELETE /api/supervisor/tareas/[id]/upload - Eliminar una evidencia de tarea supervisada
 */

const BUCKET = 'evidencias-tareas';
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];
const EXTENSIONES_PERMITIDAS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export default async function handler(req, res) {
  const { id: tareaId } = req.query;
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
    // ─── GET ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      // Verificar que la tarea esté asignada a usuario supervisado
      const { data: tarea, error: tareaErr } = await supabaseAdmin
        .from('tareas')
        .select(
          'id, asignado_a, asignado_a_user:usuarios!asignado_a(supervisor_id)'
        )
        .eq('id', tareaId)
        .single();

      if (tareaErr || !tarea) {
        return res.status(404).json({
          error: 'Task not found',
          detail: 'No se encontró la tarea',
        });
      }

      // Validar acceso: tarea del supervisor
      if (tarea.asignado_a !== verify.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          detail:
            'No tienes acceso a esta tarea. Solo puedes ver evidencias de tareas asignadas a ti.',
        });
      }

      // Obtener evidencias de la tarea
      const { data, error } = await supabaseAdmin
        .from('evidencias_tareas')
        .select(
          'id, archivo_url, archivo_path, tipo_mime, tamanio_bytes, descripcion, fecha_subida'
        )
        .eq('tarea_id', tareaId)
        .order('fecha_subida', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // ─── POST ─────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { archivoBase64, tipoMime, nombreOriginal, descripcion } = req.body;

      if (!archivoBase64 || !tipoMime || !nombreOriginal) {
        return res.status(400).json({
          error: 'Campos requeridos: archivoBase64, tipoMime, nombreOriginal',
        });
      }

      // Validar tipo MIME en whitelist
      if (!TIPOS_PERMITIDOS.includes(tipoMime)) {
        return res.status(400).json({
          error: 'Tipo de archivo no permitido',
          permitidos: TIPOS_PERMITIDOS,
        });
      }

      // Validar extensión del nombre original
      const ext = nombreOriginal.split('.').pop().toLowerCase();
      if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
        return res
          .status(400)
          .json({ error: 'Extensión de archivo no permitida' });
      }

      // Convertir base64 a Buffer
      const base64Data = archivoBase64.includes(',')
        ? archivoBase64.split(',')[1]
        : archivoBase64;
      const buffer = Buffer.from(base64Data, 'base64');

      // Validar tamaño del archivo
      if (buffer.length > MAX_SIZE_BYTES) {
        return res.status(400).json({
          error: `Archivo demasiado grande. Máximo permitido: 10 MB`,
        });
      }

      // Validar que la tarea esté asignada a usuario supervisado
      const { data: tarea, error: tareaErr } = await supabaseAdmin
        .from('tareas')
        .select(
          'id, asignado_a, asignado_a_user:usuarios!asignado_a(supervisor_id)'
        )
        .eq('id', tareaId)
        .single();

      if (tareaErr || !tarea) {
        return res.status(404).json({
          error: 'Task not found',
          detail: 'No se encontró la tarea',
        });
      }

      // Validar acceso: tarea del supervisor
      if (tarea.asignado_a !== verify.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          detail:
            'No tienes acceso a esta tarea. Solo puedes subir evidencias en tareas asignadas a ti.',
        });
      }

      // Ruta única en Storage: tarea-{id}_supervisor-{id}_{timestamp}.{ext}
      const timestamp = Date.now();
      const archivePath = `tarea-${tareaId}_supervisor-${verify.userId}_${timestamp}.${ext}`;

      // Subir archivo al bucket
      const { error: uploadErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(archivePath, buffer, {
          contentType: tipoMime,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      // Obtener URL pública
      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(archivePath);

      const archivoUrl = urlData.publicUrl;

      // Guardar metadata en evidencias_tareas
      const { data: evidencia, error: insertErr } = await supabaseAdmin
        .from('evidencias_tareas')
        .insert({
          tarea_id: tareaId,
          usuario_id: verify.userId, // Supervisor que sube
          subido_por: verify.userId,
          archivo_path: archivePath,
          archivo_url: archivoUrl,
          tipo_mime: tipoMime,
          tamanio_bytes: buffer.length,
          descripcion: descripcion?.trim() || null,
        })
        .select('*')
        .single();

      if (insertErr) {
        // Rollback: eliminar archivo del storage si falla la BD
        await supabaseAdmin.storage.from(BUCKET).remove([archivePath]);
        throw insertErr;
      }

      // Actualizar tareas.evidencia con la URL más reciente
      await supabaseAdmin
        .from('tareas')
        .update({ evidencia: archivoUrl })
        .eq('id', tareaId);

      return res.status(201).json({
        success: true,
        message: 'Evidencia subida exitosamente',
        data: evidencia,
      });
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { evidenciaId } = req.body;

      if (!evidenciaId) {
        return res.status(400).json({ error: 'evidenciaId es requerido' });
      }

      // Obtener evidencia
      const { data: evidencia, error: fetchErr } = await supabaseAdmin
        .from('evidencias_tareas')
        .select(
          'id, archivo_path, tarea_id, tarea:tareas(asignado_a, asignado_a_user:usuarios!asignado_a(supervisor_id))'
        )
        .eq('id', evidenciaId)
        .single();

      if (fetchErr || !evidencia) {
        return res.status(404).json({ error: 'Evidencia no encontrada' });
      }

      // Validar acceso: tarea del supervisor
      if (evidencia.tarea.asignado_a !== verify.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          detail:
            'No tienes permiso para eliminar esta evidencia. Solo puedes eliminar evidencias de tareas asignadas a ti.',
        });
      }

      // Eliminar archivo del Storage
      await supabaseAdmin.storage.from(BUCKET).remove([evidencia.archivo_path]);

      // Eliminar registro de la BD
      await supabaseAdmin
        .from('evidencias_tareas')
        .delete()
        .eq('id', evidenciaId);

      // Actualizar tareas.evidencia con la siguiente más reciente (si existe)
      const { data: siguiente } = await supabaseAdmin
        .from('evidencias_tareas')
        .select('archivo_url')
        .eq('tarea_id', evidencia.tarea_id)
        .order('fecha_subida', { ascending: false })
        .limit(1)
        .maybeSingle();

      await supabaseAdmin
        .from('tareas')
        .update({ evidencia: siguiente?.archivo_url || null })
        .eq('id', evidencia.tarea_id);

      return res
        .status(200)
        .json({ success: true, message: 'Evidencia eliminada' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: err.message,
    });
  }
}
