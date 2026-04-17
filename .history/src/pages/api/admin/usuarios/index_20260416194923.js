import { verifyAdminToken, supabaseAdmin } from '../../lib/apiHelpers';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const verify = await verifyAdminToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  try {
    if (req.method === 'POST') {
      const { nombre_completo, email, username, rol_id, planta_id, password } =
        req.body;

      if (!nombre_completo || !email || !rol_id) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // 1. Crear usuario en Auth
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: password || Math.random().toString(36).slice(-12),
          user_metadata: { nombre_completo },
        });

      if (authError) {
        return res.status(400).json({
          error: 'AUTH_ERROR',
          detail: authError.message,
        });
      }

      // 2. Insertar en tabla usuarios
      const { error: dbError } = await supabaseAdmin.from('usuarios').insert({
        id: authData.user.id,
        email,
        username,
        nombre_completo,
        rol_id,
        planta_id: planta_id || null,
      });

      if (dbError) {
        // Rollback: eliminar de Auth si falla la BD
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(400).json({
          error: 'DB_ERROR',
          detail: dbError.message,
        });
      }

      return res.status(201).json({
        success: true,
        data: authData.user,
      });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .order('nombre_completo', { ascending: true });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
