import { verifyAdminToken, supabaseAdmin } from '../../../lib/apiHelpers';

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
      const { nombre_completo, username, rol_id, planta_id } = req.body;

      const { error } = await supabaseAdmin
        .from('usuarios')
        .update({
          nombre_completo,
          username,
          rol_id,
          planta_id: planta_id || null,
        })
        .eq('id', id);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
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
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

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
