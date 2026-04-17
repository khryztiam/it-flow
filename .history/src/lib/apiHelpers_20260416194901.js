// Helpers reutilizables
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export async function verifyAdminToken(bearerToken) {
  try {
    if (!bearerToken?.startsWith('Bearer ')) {
      return { isValid: false, reason: 'No Bearer token' };
    }

    const token = bearerToken.slice(7);
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    const email = payload.email;

    if (!email) return { isValid: false, reason: 'Invalid token' };

    // Verificar que el usuario sea ADMIN
    const { data: userData, error } = await supabaseAdmin
      .from('usuarios')
      .select('rol_id')
      .eq('email', email)
      .single();

    if (error || !userData) return { isValid: false, reason: 'User not found' };
    if (userData.rol_id !== 'admin')
      return { isValid: false, reason: 'Not admin' };

    return { isValid: true, userEmail: email };
  } catch (err) {
    return { isValid: false, reason: err.message };
  }
}

export { supabaseAdmin };
