import { verifyAdminOrSupervisorToken, supabaseAdmin } from '@lib/apiHelpers';

/**
 * POST /api/supervisor/tareas/crear
 * Crea una tarea como supervisor (solo en su planta, asignable a subordinados)
 *
 * Body: { titulo, descripcion?, prioridad_id, estado_id, asignado_a?, fecha_inicio, fecha_limite }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  const verify = await verifyAdminOrSupervisorToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  // Solo supervisores pueden crear tareas (admin usa /api/admin/tareas)
  if (verify.rol !== 'supervisor') {
    return res.status(403).json({
      error: 'Forbidden',
      detail: 'Solo supervisores pueden usar este endpoint',
    });
  }

  try {
    const {
      titulo,
      descripcion = '',
      prioridad_id,
      estado_id,
      asignado_a,
      fecha_inicio,
      fecha_limite,
    } = req.body;

    // Validaciones requeridas
    if (
      !titulo ||
      !prioridad_id ||
      !estado_id ||
      !fecha_inicio ||
      !fecha_limite
    ) {
      return res.status(400).json({
        error: 'Missing required fields',
        detail:
          'titulo, prioridad_id, estado_id, fecha_inicio, fecha_limite son requeridos',
      });
    }

    // Si asignado_a se especifica, validar que sea un usuario bajo la supervisión del supervisor
    if (asignado_a) {
      const { data: usuario, error: fetchUsuarioErr } = await supabaseAdmin
        .from('usuarios')
        .select('id, supervisor_id, planta_id, estado, rol:roles(nombre)')
        .eq('id', asignado_a)
        .single();

      if (fetchUsuarioErr || !usuario) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (usuario.estado !== 'activo') {
        return res.status(400).json({
          error: 'Invalid user',
          detail: 'El usuario no está activo',
        });
      }

      // Validar que el usuario está bajo la supervisión del supervisor actual
      if (usuario.supervisor_id !== verify.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          detail: 'El usuario no está bajo tu supervisión',
        });
      }

      // Validar que el usuario está en la misma planta
      if (usuario.planta_id !== verify.planta_id) {
        return res.status(400).json({
          error: 'Invalid assignment',
          detail: 'El usuario debe ser de la misma planta',
        });
      }
    }

    // Crear tarea
    const { data: nuevaTarea, error: createErr } = await supabaseAdmin
      .from('tareas')
      .insert([
        {
          titulo,
          descripcion,
          prioridad_id,
          estado_id,
          asignado_a: asignado_a || null,
          creado_por: verify.userId,
          supervisado_por: asignado_a ? verify.userId : null, // Si se asigna a un user, el supervisor lo supervisa
          planta_id: verify.planta_id,
          fecha_inicio,
          fecha_limite,
          porcentaje_avance: 0,
        },
      ])
      .select(
        `
        *,
        prioridad:prioridades(id, nombre),
        estado:estados_tarea(id, nombre),
        asignado_a_user:usuarios!asignado_a(id, nombre_completo),
        creador:usuarios!creado_por(id, nombre_completo),
        planta:plantas(id, nombre)
      `
      );

    if (createErr) {
      console.error('Error creating task:', createErr);
      return res.status(500).json({
        error: 'Error creating task',
        detail: createErr.message,
      });
    }

    return res.status(201).json(nuevaTarea[0]);
  } catch (err) {
    console.error('Error:', err);
    return res
      .status(500)
      .json({ error: 'Internal Server Error', detail: err.message });
  }
}
