import { verifyAdminOrSupervisorToken, supabaseAdmin } from '@lib/apiHelpers';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const verify = await verifyAdminOrSupervisorToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    if (req.method === 'PUT') {
      const {
        nombre_completo,
        rol_id,
        planta_id,
        estado,
        password,
        supervisor_id,
      } = req.body;

      if (verify.rol === 'supervisor') {
        const camposPermitidos = ['planta_id', 'supervisor_id'];
        const camposRecibidos = Object.keys(req.body || {});
        const tieneCampoNoPermitido = camposRecibidos.some(
          (campo) => !camposPermitidos.includes(campo)
        );

        if (tieneCampoNoPermitido) {
          return res.status(403).json({
            error: 'Forbidden',
            detail: 'Supervisor solo puede cambiar planta_id o supervisor_id',
          });
        }

        if (id === verify.userId) {
          return res.status(403).json({
            error: 'Forbidden',
            detail: 'Supervisor no puede modificarse a sí mismo',
          });
        }

        const { data: plantaSupervisor, error: plantaSupervisorErr } =
          await supabaseAdmin
            .from('plantas')
            .select('pais_id')
            .eq('id', verify.planta_id)
            .single();

        if (plantaSupervisorErr || !plantaSupervisor) {
          return res.status(403).json({
            error: 'Forbidden',
            detail: 'Supervisor sin planta válida',
          });
        }

        const { data: usuarioDestino, error: usuarioErr } = await supabaseAdmin
          .from('usuarios')
          .select('id, rol:roles(nombre), planta:plantas!inner(pais_id)')
          .eq('id', id)
          .single();

        if (usuarioErr || !usuarioDestino) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (usuarioDestino.rol?.nombre !== 'user') {
          return res.status(403).json({
            error: 'Forbidden',
            detail: 'Supervisor solo puede modificar usuarios operativos',
          });
        }

        if (usuarioDestino.planta?.pais_id !== plantaSupervisor.pais_id) {
          return res.status(403).json({
            error: 'Forbidden',
            detail: 'Supervisor solo puede gestionar usuarios de su país',
          });
        }

        // Construir objeto de actualización
        const updateData = {};

        // Si actualiza planta_id
        if (planta_id !== undefined) {
          const { data: nuevaPlanta, error: plantaErr } = await supabaseAdmin
            .from('plantas')
            .select('id, pais_id')
            .eq('id', planta_id)
            .single();

          if (plantaErr || !nuevaPlanta) {
            return res.status(404).json({ error: 'Planta no encontrada' });
          }

          if (nuevaPlanta.pais_id !== plantaSupervisor.pais_id) {
            return res.status(403).json({
              error: 'Forbidden',
              detail: 'Supervisor solo puede asignar plantas de su país',
            });
          }

          updateData.planta_id = planta_id;
        }

        // Si actualiza supervisor_id
        if (supervisor_id !== undefined) {
          // Solo puede asignarse a sí mismo o dejar NULL
          if (supervisor_id !== null && supervisor_id !== verify.userId) {
            return res.status(403).json({
              error: 'Forbidden',
              detail: 'Solo puedes asignarte a ti mismo como supervisor',
            });
          }
          updateData.supervisor_id = supervisor_id;
        }

        const { data, error } = await supabaseAdmin
          .from('usuarios')
          .update(updateData)
          .eq('id', id)
          .select(
            `
            *,
            rol:roles(id, nombre),
            planta:plantas(id, nombre, pais_id, pais:paises(id, nombre))
          `
          );

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({
          success: true,
          message: 'Usuario actualizado exitosamente',
          data: data[0],
        });
      }

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
      if (supervisor_id !== undefined) updateData.supervisor_id = supervisor_id;

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
      if (verify.rol !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          detail: 'Solo admin puede eliminar usuarios',
        });
      }

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
