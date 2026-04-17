import { verifyAdminOrSupervisorToken, supabaseAdmin } from '@lib/apiHelpers';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const verify = await verifyAdminOrSupervisorToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  try {
    if (req.method === 'GET') {
      // GET /api/admin/tareas — Listar tareas
      const { planta_id } = req.query;

      let query = supabaseAdmin.from('tareas').select(
        `
          *,
          asignado_a_user:usuarios!asignado_a(id, nombre_completo, email),
          creado_por_user:usuarios!creado_por(id, nombre_completo, email),
          supervisado_por_user:usuarios!supervisado_por(id, nombre_completo, email),
          planta:plantas(id, nombre),
          estado:estados_tarea(id, nombre),
          prioridad:prioridades(id, nombre)
        `
      );

      // Si supervisor, filtrar por su planta
      if (verify.rol === 'supervisor') {
        query = query.eq('planta_id', verify.planta_id);
      } else if (planta_id) {
        // Si admin y especifica planta, filtrar
        query = query.eq('planta_id', planta_id);
      }

      // Ordenar por fecha límite
      query = query.order('fecha_limite', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      // POST /api/admin/tareas — Crear tarea
      const {
        titulo,
        descripcion,
        planta_id,
        asignado_a,
        supervisado_por,
        estado_id,
        prioridad_id,
        fecha_inicio,
        fecha_limite,
        porcentaje_avance,
      } = req.body;

      // Validar campos requeridos
      if (
        !titulo ||
        !planta_id ||
        !estado_id ||
        !prioridad_id ||
        !fecha_limite
      ) {
        return res.status(400).json({
          error: 'Missing required fields',
          detail:
            'titulo, planta_id, estado_id, prioridad_id, fecha_limite son requeridos',
        });
      }

      // Si supervisor, validar que la planta sea la suya
      if (verify.rol === 'supervisor' && planta_id !== verify.planta_id) {
        return res.status(403).json({
          error: 'Forbidden',
          detail: 'Supervisores solo pueden crear tareas en su planta asignada',
        });
      }

      // Crear tarea
      const { data, error: err } = await supabaseAdmin
        .from('tareas')
        .insert({
          titulo,
          descripcion: descripcion || null,
          planta_id,
          creado_por: verify.userId,
          asignado_a: asignado_a || null,
          supervisado_por: supervisado_por || null,
          estado_id,
          prioridad_id,
          fecha_inicio: fecha_inicio
            ? new Date(fecha_inicio).toISOString()
            : null,
          fecha_limite: new Date(fecha_limite).toISOString(),
          porcentaje_avance: porcentaje_avance || 0,
        })
        .select(
          `
          *,
          asignado_a_user:usuarios!asignado_a(id, nombre_completo),
          creado_por_user:usuarios!creado_por(id, nombre_completo),
          planta:plantas(nombre),
          estado:estados_tarea(nombre),
          prioridad:prioridades(nombre)
        `
        );

      if (err) {
        return res.status(400).json({
          error: 'DB_ERROR',
          detail: err.message,
        });
      }

      return res.status(201).json(data[0]);
    }

    // Método no permitido
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: err.message,
    });
  }
}
