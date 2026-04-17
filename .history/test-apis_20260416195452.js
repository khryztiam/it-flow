// Test script para APIs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hmjxhydtscfsgnjqdfaqxiw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtanhydHNjZnNnanFkZmFxeGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMjA1MDYsImV4cCI6MjA2MTc5NjUwNn0.QYSNhqB7GfLRR5y7p_Av1E-LfwT9bEUKX0EqJ3vXHW8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAPIs() {
  console.log('🧪 Iniciando tests de APIs...\n');

  try {
    // Login como admin
    console.log('1️⃣ Intentando login como admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@itflowapp.com',
      password: 'Admin123!',
    });

    if (authError) {
      console.error('❌ Error de login:', authError.message);
      return;
    }

    const token = authData.session.access_token;
    console.log('✅ Login exitoso, token obtenido\n');

    // Test GET Países
    console.log('2️⃣ Test GET /api/admin/paises...');
    const paisesRes = await fetch('http://localhost:3001/api/admin/paises', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const paisesData = await paisesRes.json();
    console.log(`${paisesRes.ok ? '✅' : '❌'} Status: ${paisesRes.status}`);
    if (!paisesRes.ok) console.error('Error:', paisesData);
    else console.log(`Países encontrados: ${paisesData.data?.length || 0}\n`);

    // Test GET Plantas
    console.log('3️⃣ Test GET /api/admin/plantas...');
    const plantasRes = await fetch('http://localhost:3001/api/admin/plantas', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const plantasData = await plantasRes.json();
    console.log(`${plantasRes.ok ? '✅' : '❌'} Status: ${plantasRes.status}`);
    if (!plantasRes.ok) console.error('Error:', plantasData);
    else console.log(`Plantas encontradas: ${plantasData.data?.length || 0}\n`);

    // Test GET Usuarios
    console.log('4️⃣ Test GET /api/admin/usuarios...');
    const usuariosRes = await fetch('http://localhost:3001/api/admin/usuarios', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const usuariosData = await usuariosRes.json();
    console.log(`${usuariosRes.ok ? '✅' : '❌'} Status: ${usuariosRes.status}`);
    if (!usuariosRes.ok) console.error('Error:', usuariosData);
    else console.log(`Usuarios encontrados: ${usuariosData.data?.length || 0}\n`);

    console.log('✅ Todos los tests completados');
  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
}

testAPIs();
