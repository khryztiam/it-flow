import { supabaseAdmin } from './supabaseAdmin';

/**
 * Verificar y validar token JWT Bearer
 * Devuelve { isValid, reason } o { isValid, userEmail }
 */
export async function verifyAdminToken(bearerToken) {
  try {
    if (!bearerToken?.startsWith('Bearer ')) {
      return { isValid: false, reason: 'No Bearer token' };
    }

    const token = bearerToken.slice(7);
    const parts = token.split('.');

    if (parts.length !== 3) {
      return { isValid: false, reason: 'Invalid token format' };
    }

    let payload;
    try {
      payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    } catch {
      return { isValid: false, reason: 'Invalid token encoding' };
    }

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
