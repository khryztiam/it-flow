import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hmjxhydtscfsgnjqdfaqxiw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtanhydHNjZnNnanFkZmFxeGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMjA1MDYsImV4cCI6MjA2MTc5NjUwNn0.QYSNhqB7GfLRR5y7p_Av1E-LfwT9bEUKX0EqJ3vXHW8'
);

async function test() {
  console.log('🧪 Test de APIs\n');

  try {
    // Login
    console.log('1️⃣ Login como admin@itflowapp.com...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@itflowapp.com',
      password: 'Admin2026+',
    });

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    const token = data.session.access_token;
    console.log('✅ Token obtenido\n');

    // Test APIs
    const apis = [
      '/api/admin/paises',
      '/api/admin/plantas',
      '/api/admin/usuarios',
    ];

    for (const api of apis) {
      console.log(`⏳ ${api}...`);
      const res = await fetch(`http://localhost:3001${api}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok) {
        console.log(`   ✅ OK - ${json.data?.length || 0} registros\n`);
      } else {
        console.log(`   ❌ ${res.status} - ${json.error}\n`);
      }
    }

    console.log('✅ Test completado');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
