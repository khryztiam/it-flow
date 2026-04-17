/**
 * Script para crear usuarios de prueba en Supabase
 * Ejecutar: node scripts/crearUsuariosPrueba.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hmjxrtscfsgjqdfaqxiw.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtanhydHNjZnNnanFkZmFxeGl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIyMDUwNiwiZXhwIjoyMDYxNzk2NTA2fQ._1CWSoY4UAe2fyf-sfcGEvjcQgOi-7DbC8QAWfuNJIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function crearUsuariosPrueba() {
  try {
    console.log('🔄 Creando usuarios de prueba...\n');

    // Obtener plantas
    const { data: plantas, error: errPlantas } = await supabase
      .from('plantas')
      .select('id, nombre')
      .limit(3);

    if (errPlantas) throw errPlantas;

    // Obtener roles
    const { data: roles, error: errRoles } = await supabase
      .from('roles')
      .select('id, nombre');

    if (errRoles) throw errRoles;

    // Datos de usuarios a crear
    const usuariosPrueba = [
      {
        email: 'admin@itflowapp.com',
        nombre: 'Administrador General',
        rol: 'admin',
        planta: plantas[0]?.id,
        password: 'Admin@123456',
      },
      {
        email: 'supervisor@itflowapp.com',
        nombre: 'Supervisor Principal',
        rol: 'supervisor',
        planta: plantas[0]?.id,
        password: 'Supervisor@123456',
      },
      {
        email: 'usuario1@itflowapp.com',
        nombre: 'Usuario Uno',
        rol: 'user',
        planta: plantas[0]?.id,
        password: 'Usuario@123456',
      },
      {
        email: 'usuario2@itflowapp.com',
        nombre: 'Usuario Dos',
        rol: 'user',
        planta: plantas[1]?.id || plantas[0]?.id,
        password: 'Usuario@123456',
      },
    ];

    for (const usuario of usuariosPrueba) {
      console.log(`➕ Creando ${usuario.email}...`);

      // Crear en auth
      const { data: authData, error: authErr } =
        await supabase.auth.admin.createUser({
          email: usuario.email,
          password: usuario.password,
          email_confirm: true,
        });

      if (authErr) {
        console.error(`  ❌ Error en Auth: ${authErr.message}`);
        continue;
      }

      // Obtener rol_id
      const rolObj = roles.find((r) => r.nombre === usuario.rol);
      if (!rolObj) {
        console.error(`  ❌ Rol ${usuario.rol} no encontrado`);
        continue;
      }

      // Crear en tabla usuarios
      const { error: dbErr } = await supabase.from('usuarios').insert([
        {
          id: authData.user.id,
          email: usuario.email,
          nombre_completo: usuario.nombre,
          planta_id: usuario.planta,
          rol_id: rolObj.id,
          estado: 'activo',
        },
      ]);

      if (dbErr) {
        console.error(`  ❌ Error en BD: ${dbErr.message}`);
        continue;
      }

      console.log(`  ✅ ${usuario.email} creado correctamente`);
      console.log(`     Contraseña: ${usuario.password}`);
    }

    console.log('\n✅ ¡Usuarios de prueba creados!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

crearUsuariosPrueba();
