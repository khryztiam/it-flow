import { verifyAdminToken, supabaseAdmin } from '@lib/apiHelpers';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const verify = await verifyAdminToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    if (req.method === 'PUT') {
      const { nombre_completo, rol_id, planta_id, estado, password } = req.body;

      // Si se envía password, actualizar en Auth
      if (password) {
        const { error: authError } =
          await supabaseAdmin.auth.admin.updateUserById(id, { password });

        if (authError) {
          return res.status(400).json({
            error: 'AUTH_ERROR',
            detail: authError.message,
          });
        }
      }

      // Actualizar en tabla usuarios
      const updateData = {};
      if (nombre_completo !== undefined)
        updateData.nombre_completo = nombre_completo;
      if (rol_id !== undefined) updateData.rol_id = rol_id;
      if (planta_id !== undefined) updateData.planta_id = planta_id || null;
      if (estado !== undefined) updateData.estado = estado;

      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          *,
          rol:roles(id, nombre),
          planta:plantas(id, nombre)
        `
        );

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      return res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: data[0],
      });
    }

    if (req.method === 'DELETE') {
      // Primero eliminar de BD
      const { error: dbError } = await supabaseAdmin
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (dbError) {
        return res.status(400).json({ error: dbError.message });
      }

      // Luego eliminar de Auth
      const { error: authError } =
        await supabaseAdmin.auth.admin.deleteUser(id);

      if (authError) {
        // Log pero no fallar (usuario ya está en BD)
        console.warn('Auth delete failed:', authError);
      }

      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
