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

    // Verificar que el usuario sea ADMIN - con JOIN a tabla roles
    const { data: userData, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, rol:roles(nombre)')
      .eq('email', email)
      .single();

    if (error || !userData) return { isValid: false, reason: 'User not found' };

    // Verificar que el rol sea 'admin'
    const rolNombre = userData.rol?.nombre;
    if (rolNombre !== 'admin') return { isValid: false, reason: 'Not admin' };

    return { isValid: true, userEmail: email };
  } catch (err) {
    return { isValid: false, reason: err.message };
  }
}

/**
 * Verificar y validar token JWT Bearer para Admin O Supervisor
 * Devuelve { isValid, reason } o { isValid, rol, userId, planta_id }
 */
export async function verifyAdminOrSupervisorToken(bearerToken) {
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

    // Obtener usuario con rol
    const { data: userData, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, planta_id, rol:roles(nombre)')
      .eq('email', email)
      .single();

    if (error || !userData) return { isValid: false, reason: 'User not found' };

    // Verificar que sea admin o supervisor
    const rolNombre = userData.rol?.nombre;
    if (rolNombre !== 'admin' && rolNombre !== 'supervisor') {
      return { isValid: false, reason: 'Not admin or supervisor' };
    }

    return {
      isValid: true,
      rol: rolNombre,
      userId: userData.id,
      userEmail: email,
      planta_id: userData.planta_id,
    };
  } catch (err) {
    return { isValid: false, reason: err.message };
  }
}
