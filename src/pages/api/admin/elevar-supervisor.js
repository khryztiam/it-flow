import { verifyAdminToken, supabaseAdmin } from '@lib/apiHelpers';

/**
 * POST /api/admin/elevar-supervisor
 * Eleva un usuario (role=user) a supervisor
 *
 * Validaciones:
 * - Usuario debe tener rol = 'user'
 * - Usuario debe tener supervisor_id = null (no debe estar bajo otro supervisor)
 * - Usuario debe estar activo
 * - Solo admin puede hacer esto
 *
 * Body:
 * {
 *   usuario_id: string (uuid),
 *   planta_id: string (uuid) - qué planta va a supervisar
 * }
 */
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const verify = await verifyAdminToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { usuario_id, planta_id } = req.body;

    if (!usuario_id || !planta_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        detail: 'usuario_id y planta_id son requeridos',
      });
    }

    // Paso 1: Obtener usuario a elevar
    const { data: usuario, error: usuarioErr } = await supabaseAdmin
      .from('usuarios')
      .select('id, rol:roles(nombre), supervisor_id, estado')
      .eq('id', usuario_id)
      .single();

    if (usuarioErr || !usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Paso 2: Validar que sea un usuario operativo (role = 'user')
    if (usuario.rol?.nombre !== 'user') {
      return res.status(400).json({
        error: 'Invalid operation',
        detail: `Solo usuarios con role 'user' pueden ser elevados. Este tiene role '${usuario.rol?.nombre}'`,
      });
    }

    // Paso 3: Validar que esté activo
    if (usuario.estado !== 'activo') {
      return res.status(400).json({
        error: 'Invalid user state',
        detail: 'El usuario debe estar activo para ser elevado a supervisor',
      });
    }

    // Paso 4: Validar que NO tenga supervisor asignado
    if (usuario.supervisor_id !== null) {
      return res.status(400).json({
        error: 'User already supervised',
        detail: `Este usuario ya está asignado a un supervisor. Debe ser desasignado primero.`,
      });
    }

    // Paso 5: Obtener rol de supervisor
    const { data: rolSupervisor, error: rolErr } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('nombre', 'supervisor')
      .single();

    if (rolErr || !rolSupervisor) {
      return res.status(500).json({
        error: 'Configuration error',
        detail: 'Rol supervisor no encontrado en BD',
      });
    }

    // Paso 6: Validar que planta_id exista
    const { data: planta, error: plantaErr } = await supabaseAdmin
      .from('plantas')
      .select('id')
      .eq('id', planta_id)
      .single();

    if (plantaErr || !planta) {
      return res.status(404).json({ error: 'Planta no encontrada' });
    }

    // Paso 7: Actualizar usuario en BD
    // - Cambiar rol_id a supervisor
    // - Asignar planta_id
    // - Limpiar supervisor_id (garantizar que sea NULL)
    const { data: updatedUser, error: updateErr } = await supabaseAdmin
      .from('usuarios')
      .update({
        rol_id: rolSupervisor.id,
        planta_id: planta_id,
        supervisor_id: null, // Explícitamente NULL
        estado: 'activo',
      })
      .eq('id', usuario_id)
      .select(
        `
        *,
        rol:roles(id, nombre),
        planta:plantas(id, nombre, pais:paises(id, nombre))
      `
      );

    if (updateErr) {
      return res.status(400).json({
        error: 'DB_ERROR',
        detail: updateErr.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `${usuario.nombre_completo || 'Usuario'} ha sido elevado a supervisor exitosamente`,
      data: updatedUser[0],
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: err.message,
    });
  }
}
