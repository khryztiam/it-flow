import { verifyAdminToken, supabaseAdmin } from '../../../lib/apiHelpers';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const verify = await verifyAdminToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Plant ID required' });
  }

  try {
    if (req.method === 'PUT') {
      const { nombre, pais_id } = req.body;

      const { error, data } = await supabaseAdmin
        .from('plantas')
        .update({ nombre, pais_id })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabaseAdmin
        .from('plantas')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
