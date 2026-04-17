import { verifyUserToken, supabaseAdmin } from '@lib/apiHelpers';

/**
 * GET  /api/user/tareas/[id]/upload - Listar evidencias de la tarea (solo las del usuario)
 * POST /api/user/tareas/[id]/upload - Subir archivo como evidencia
 * DELETE /api/user/tareas/[id]/upload - Eliminar una evidencia propia
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
      sizeLimit: '14mb', // Margen para base64 (~33% overhead sobre 10MB)
    },
  },
};

export default async function handler(req, res) {
  const { id: tareaId } = req.query;
  const authHeader = req.headers.authorization;
  const verify = await verifyUserToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  try {
    // ─── GET ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('evidencias_tareas')
        .select(
          'id, archivo_url, archivo_path, tipo_mime, tamanio_bytes, descripcion, fecha_subida'
        )
        .eq('tarea_id', tareaId)
        .eq('usuario_id', verify.userId)
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

      // Validar que la tarea esté asignada al usuario
      const { data: tarea, error: tareaErr } = await supabaseAdmin
        .from('tareas')
        .select('id, asignado_a')
        .eq('id', tareaId)
        .eq('asignado_a', verify.userId)
        .single();

      if (tareaErr || !tarea) {
        return res.status(403).json({
          error: 'No autorizado: esta tarea no te está asignada',
        });
      }

      // Ruta única en Storage: tarea-{id}_user-{id}_{timestamp}.{ext}
      const timestamp = Date.now();
      const archivePath = `tarea-${tareaId}_user-${verify.userId}_${timestamp}.${ext}`;

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
          usuario_id: verify.userId,
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

      // Validar que la evidencia pertenezca al usuario
      const { data: evidencia, error: fetchErr } = await supabaseAdmin
        .from('evidencias_tareas')
        .select('id, archivo_path, usuario_id')
        .eq('id', evidenciaId)
        .eq('usuario_id', verify.userId)
        .single();

      if (fetchErr || !evidencia) {
        return res
          .status(403)
          .json({ error: 'No autorizado o evidencia no encontrada' });
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
        .eq('tarea_id', tareaId)
        .eq('usuario_id', verify.userId)
        .order('fecha_subida', { ascending: false })
        .limit(1)
        .maybeSingle();

      await supabaseAdmin
        .from('tareas')
        .update({ evidencia: siguiente?.archivo_url || null })
        .eq('id', tareaId);

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
