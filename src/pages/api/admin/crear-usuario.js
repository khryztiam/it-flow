import { createClient } from '@supabase/supabase-js';

// Cliente con SERVICE ROLE KEY (solo en servidor)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email, nombre_completo, planta_id, rol_id } = req.body;

    // 1. Crear usuario en Auth
    const { data: authData, error: authErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: Math.random().toString(36).slice(-12),
        email_confirm: true,
      });

    if (authErr) {
      console.error('Error Auth:', authErr);
      throw new Error(`Error creando usuario en Auth: ${authErr.message}`);
    }

    // 2. Crear registro en tabla usuarios
    const { error: dbErr } = await supabaseAdmin.from('usuarios').insert([
      {
        id: authData.user.id,
        email,
        nombre_completo,
        planta_id,
        rol_id,
        estado: 'activo',
      },
    ]);

    if (dbErr) {
      // Si falló la BD, intentar eliminar el usuario de Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Error creando usuario en BD: ${dbErr.message}`);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        nombre_completo,
      },
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(400).json({
      error: err.message || 'Error creando usuario',
    });
  }
}
