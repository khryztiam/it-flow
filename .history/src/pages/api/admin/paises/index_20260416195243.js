import { verifyAdminToken, supabaseAdmin } from '../../../../lib/apiHelpers';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const verify = await verifyAdminToken(authHeader);

  if (!verify.isValid) {
    return res.status(403).json({ error: 'Forbidden', detail: verify.reason });
  }

  try {
    if (req.method === 'POST') {
      const { nombre, codigo, bandera } = req.body;

      if (!nombre || !codigo) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { error, data } = await supabaseAdmin
        .from('paises')
        .insert({ nombre, codigo, bandera: bandera || null })
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json({ success: true, data });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('paises')
        .select('*')
        .order('nombre', { ascending: true });

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
