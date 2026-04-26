import {
  verifyAdminOrSupervisorToken,
  verifyAdminToken,
  supabaseAdmin,
} from '@lib/apiHelpers';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const verify =
    req.method === 'GET'
      ? await verifyAdminOrSupervisorToken(authHeader)
      : await verifyAdminToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  try {
    if (req.method === 'POST') {
      const { nombre, pais_id } = req.body;

      if (!nombre || !pais_id) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { error, data } = await supabaseAdmin
        .from('plantas')
        .insert({ nombre, pais_id })
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json({ success: true, data });
    }

    if (req.method === 'GET') {
      let query = supabaseAdmin
        .from('plantas')
        .select('*, pais:paises(id, nombre)')
        .order('nombre', { ascending: true });

      if (verify.rol === 'supervisor') {
        const { data: plantaSupervisor, error: plantaErr } = await supabaseAdmin
          .from('plantas')
          .select('pais_id')
          .eq('id', verify.planta_id)
          .single();

        if (plantaErr || !plantaSupervisor) {
          return res.status(403).json({
            error: 'Forbidden',
            detail: 'Supervisor sin planta válida',
          });
        }

        query = query.eq('pais_id', plantaSupervisor.pais_id);
      }

      const { data, error } = await query;

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
